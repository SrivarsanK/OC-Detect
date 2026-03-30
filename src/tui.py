import os
import sys
import uuid
import cv2
import numpy as np
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.progress import Progress, SpinnerColumn, TextColumn
from sqlalchemy.orm import Session
import click

# Add src to sys.path for internal imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.core.config import settings
from src.services.image_processor import ImageProcessor
from src.services.inference_service import inference_service
from src.services.storage_service import storage_service
from src.services.reporting_service import reporting_service
from src.db.database import SessionLocal
from src.models.cases import Case, CaseStatus

console = Console()
processor = ImageProcessor()

def get_db():
    db = SessionLocal()
    try:
        return db
    finally:
        db.close()

@click.group()
def cli():
    """OralGuard - Clinical Triage CLI/TUI"""
    pass

@cli.command()
def list_cases():
    """List all triage cases in the local database."""
    db = SessionLocal()
    cases = db.query(Case).all()
    db.close()

    table = Table(title="OralGuard Case Triage Stream")
    table.add_column("ID", style="cyan", no_wrap=True)
    table.add_column("Status", style="magenta")
    table.add_column("Verdict", style="green")
    table.add_column("Confidence", style="yellow")
    table.add_column("Uncertainty", style="red")
    table.add_column("Timestamp", style="blue")

    for c in cases:
        table.add_row(
            c.id[:8],
            str(c.status.value),
            str(c.prediction_class),
            f"{(c.confidence or 0.0)*100:.1f}%",
            f"{(c.uncertainty or 0.0):.3f}",
            c.timestamp.strftime("%Y-%m-%d %H:%M")
        )

    console.print(table)

@cli.command()
@click.argument('image_path', type=click.Path(exists=True))
def ingest(image_path):
    """
    Ingest a new oral cavity image for triage.
    """
    console.print(Panel(f"Starting Ingestion for: [bold cyan]{image_path}[/bold cyan]", title="Ingestion Engine"))

    # 1. Read image
    img = cv2.imread(image_path)
    if img is None:
        console.print("[red]Error: Could not read image file.[/red]")
        return

    db = SessionLocal()
    try:
        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            transient=True,
        ) as progress:
            
            # 2. Quality Check
            progress.add_task(description="Checking image quality...", total=None)
            blur_score = processor.detect_blur(img)
            if processor.is_blurry(blur_score):
                console.print(f"[bold red]Quality Fail:[/bold red] Image too blurry (score: {blur_score:.2f})")
                return

            # 3. Enhancement
            progress.add_task(description="Applying CLAHE enhancement...", total=None)
            enhanced = processor.apply_clahe(img)

            # 4. Inference
            progress.add_task(description="Running MobileNetV2 (Edge Impulse) inference...", total=None)
            inference_result = inference_service.predict(enhanced)

            # 5. XAI Heatmap
            progress.add_task(description="Generating Grad-CAM heatmap...", total=None)
            heatmap_path = None
            if inference_result["prediction"] != "Normal":
                pred_idx = settings.CLASSES.index(inference_result["prediction"])
                heatmap_raw = inference_service.generate_heatmap(None, pred_idx)
                heatmap_overlay = processor.overlay_heatmap(enhanced, heatmap_raw)
                heatmap_path = storage_service.save_image(heatmap_overlay, category="heatmaps")

            # 6. Save Images
            raw_rel_path = storage_service.save_image(img, category="raw")
            enhanced_rel_path = storage_service.save_image(enhanced, category="enhanced")

            # 7. Reports
            progress.add_task(description="Compiling clinical reports (PDF/JSON)...", total=None)
            real_case_id = str(uuid.uuid4())
            case_data = {
                "id": real_case_id,
                "prediction_class": inference_result["prediction"],
                "confidence": inference_result["confidence"],
                "uncertainty": inference_result["uncertainty"],
                "referral": inference_result["referral"]
            }
            report_json_path = reporting_service.generate_json(case_data)
            report_pdf_path = reporting_service.generate_pdf(
                case_data,
                {
                    "enhanced": storage_service.get_full_path(enhanced_rel_path),
                    "heatmap": storage_service.get_full_path(heatmap_path) if heatmap_path else None
                }
            )

            # 8. Database
            new_case = Case(
                id=real_case_id,
                raw_path=raw_rel_path,
                enhanced_path=enhanced_rel_path,
                heatmap_path=heatmap_path,
                report_pdf_path=report_pdf_path,
                report_json_path=report_json_path,
                blur_score=round(blur_score, 2),
                prediction_class=inference_result["prediction"],
                confidence=inference_result["confidence"],
                uncertainty=inference_result["uncertainty"],
                status=CaseStatus.PROCESSED
            )
            db.add(new_case)
            db.commit()

        console.print(f"[bold green]Ingestion Complete![/bold green] Case ID: [cyan]{real_case_id}[/cyan]")
        console.print(f"  Verdict: [yellow]{inference_result['prediction']}[/yellow]")
        console.print(f"  Confidence: [blue]{inference_result['confidence']*100:.1f}%[/blue]")
        if inference_result['referral']:
            console.print("[bold red]URGENT REFERRAL FLAG TRIGGERED[/bold red]")
            
    except Exception as e:
        console.print(f"[red]Error during ingestion: {str(e)}[/red]")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    cli()
