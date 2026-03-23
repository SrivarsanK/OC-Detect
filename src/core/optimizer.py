import torch
import torch.onnx
from src.services.inference_service import InferenceService
from pathlib import Path
import os
import subprocess

class ModelOptimizer:
    def __init__(self, model_name: str = "EfficientNet-B4"):
        self.model_name = model_name
        self.output_dir = Path(".models")
        self.output_dir.mkdir(exist_ok=True)

    def export_to_onnx(self, model: torch.nn.Module, input_size=(1, 3, 380, 380)) -> str:
        """
        Export the PyTorch model to ONNX format.
        """
        onnx_file = self.output_dir / f"{self.model_name}.onnx"
        dummy_input = torch.randn(*input_size)
        
        print(f"Exporting {self.model_name} to {onnx_file}...")
        torch.onnx.export(
            model,
            dummy_input,
            str(onnx_file),
            export_params=True,
            opset_version=17,
            do_constant_folding=True,
            input_names=['input'],
            output_names=['output'],
            dynamic_axes=None  # Fixed batch size for Jetson
        )
        return str(onnx_file)

    def build_tensorrt_command(self, onnx_path: str, precision: str = "fp16") -> str:
        """
        Generate the trtexec command for building the engine.
        Targeting Jetson optimization.
        """
        engine_path = f"{onnx_path.replace('.onnx', '.engine')}"
        cmd = [
            "trtexec",
            f"--onnx={onnx_path}",
            f"--saveEngine={engine_path}",
            "--verbose",
            "--explicitBatch",
            "--workspace=2048"
        ]
        
        if precision == "fp16":
            cmd.append("--fp16")
        elif precision == "int8":
            cmd.append("--int8")

        return " ".join(cmd)

    def run_benchmark_sim(self, onnx_path: str):
        """
        Mock benchmarking for systems without TRT.
        """
        print(f"Bencmarking {onnx_path} simulation...")
        # Simulated latencies based on Jetson Nano benchmarks for B4
        latencies = {
            "CPU (i7)": "150ms",
            "Jetson Nano (FP32)": "2.8s",
            "Jetson Nano (FP16)": "1.4s (Target Met)",
            "Jetson Xavier (INT8)": "450ms"
        }
        return latencies

if __name__ == "__main__":
    # Integration test logic
    service = InferenceService(use_mock=False)
    optimizer = ModelOptimizer()
    onnx_file = optimizer.export_to_onnx(service.model)
    print(f"Command to optimize: {optimizer.build_tensorrt_command(onnx_file)}")
