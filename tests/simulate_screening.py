import requests
import time
import os

BASE_URL = "http://localhost:8000/api/v1"

def simulate_full_pipeline():
    print("--- OralGuard Phase 1-5 End-to-End Simulation ---")
    
    # 1. Ingestion (Phase 1-3)
    print("\n[Step 1] Ingesting Clinical Image...")
    # Using a dummy image file if it doesn't exist, create it
    if not os.path.exists("test_image.jpg"):
        import numpy as np
        import cv2
        dummy_img = np.zeros((512, 512, 3), dtype=np.uint8)
        cv2.putText(dummy_img, "Test Lesion", (100, 250), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
        cv2.imwrite("test_image.jpg", dummy_img)
    
    with open("test_image.jpg", "rb") as f:
        resp = requests.post(f"{BASE_URL}/ingest/upload", files={"file": f})
    
    if resp.status_code != 200:
        print(f"FAILED: {resp.text}")
        return
    
    data = resp.json()
    case_id = data["id"]
    print(f"SUCCESS: Case Created ID={case_id}")
    print(f"Findings: {data['prediction']} (Conf: {data['confidence']:.2f})")
    print(f"XAI: Heatmap generated at {data['heatmap_path']}")
    print(f"Report: Clinical PDF at {data['report_pdf_path']}")

    # 2. History Retrieval (Phase 4)
    print("\n[Step 2] Verifying Case History...")
    resp = requests.get(f"{BASE_URL}/cases/{case_id}")
    if resp.status_code == 200:
        print(f"SUCCESS: Case {case_id} found in database.")

    # 3. Cloud Sync (Phase 5)
    print("\n[Step 3] Triggering 'Referral Up' Synchronization...")
    sync_resp = requests.post(f"{BASE_URL}/cases/{case_id}/sync")
    if sync_resp.status_code == 200:
        print(f"SUCCESS: Sync process started for Case {case_id}")
        
    # Poll for sync status (simulated)
    print("Waiting for sync to complete (tenacity retry simulation)...")
    time.sleep(3) 
    
    final_case_resp = requests.get(f"{BASE_URL}/cases/{case_id}")
    final_data = final_case_resp.json()
    if final_data.get("remote_sync_id"):
        print(f"\nFINISH: Case {case_id} is now SYNCED with Cloud ID: {final_data['remote_sync_id']}")
    else:
        print("\nPENDING: Sync still in progress or failed. Check logs.")

if __name__ == "__main__":
    # Ensure server is running before executing this
    try:
        simulate_full_pipeline()
    except Exception as e:
        print(f"ERROR: Could not run simulation. Is the FastAPI server running at {BASE_URL}? {e}")
