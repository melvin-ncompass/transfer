from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import threading
import tkinter as tk
from tkinter import filedialog
import os
import json

# Import the logic
import disk_cleanup_tool

app = FastAPI()

# Enable CORS for React Client
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, specify localhost:5173
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Global State ---
class ScanState:
    def __init__(self):
        self.scanning = False
        self.progress = 0.0
        self.message = "Ready"
        self.scan_thread = None
        self.results = None # { duplicates: [], usage: ... }
        self.logs = []

    def reset(self):
        self.scanning = True
        self.progress = 0.0
        self.message = "Initializing..."
        self.results = None
        self.logs = []

    def add_log(self, type, message):
        self.logs.append({"type": type, "message": message, "time": "now"})

state = ScanState()

# --- Helpers ---
def run_scan_process(target_dir: str):
    global state
    try:
        def callback(pct, msg):
            state.progress = pct * 100 if pct >= 0 else state.progress # maintain last if indeterminate?
            state.message = msg
            # state.add_log('info', msg) # detailed logging might be too much traffic

        state.add_log('info', f"Starting scan on {target_dir}")
        scanner = disk_cleanup_tool.DiskScanner(target_dir, progress_callback=callback)
        scanner.scan()
        
        callback(0.5, "Analyzing Duplicates & Usage...")
        
        # We need to capture the data, not just write to file.
        # Ideally, we refactor DiskScanner to return data structure OR we read the generated files.
        # Reading generated files is easier given current structure.
        scanner.generate_reports()
        
        # Read the files to populate 'results'
        # Parse duplicates_report.txt / usage_report.txt? 
        # Actually, for the UI, we want structured data (JSON).
        # Let's Modify DiskScanner slightly or just parse what we can in a hacky way?
        # Better: extending DiskScanner here to expose data directly is cleaner but risky to modify imports.
        # Let's read the object state directly! 'scanner' object has .find_duplicates() returns list!
        
        # 1. Duplicates
        dup_folders, dup_folder_paths = scanner.find_duplicate_folders()
        dup_files = scanner.find_file_duplicates(dup_folder_paths)
        
        # Format for UI
        # UI expects: { id: ..., hash: ..., instances: [{name, path, size}] }
        
        formatted_dupes = []
        
        # File Dupes
        for i, (size, files) in enumerate(dup_files):
            group = {
                "id": f"file_dup_{i}",
                "hash": "mixed", # logic didn't give us hash easily here, but that's fine
                "instances": []
            }
            for j, fpath in enumerate(files):
                group["instances"].append({
                    "id": f"f_{i}_{j}",
                    "name": os.path.basename(fpath),
                    "path": fpath,
                    "size": size
                })
            formatted_dupes.append(group)

        # Folder Dupes (Optional: Add as special items? UI tab structure might not support folders well yet)
        # For now, let's mix them in or ignore? 
        # Let's add them to formatted_dupes but mark type? UI expects instances.
        # The Current UI implementation handles "duplicates" as a list of groups.
        
        # 2. Large Files
        # UI Expects: { id, name, path, size, type }
        top_files = sorted(scanner.all_files, key=lambda x: x[1], reverse=True)[:50]
        formatted_large = []
        for i, (path, size) in enumerate(top_files):
            formatted_large.append({
                "id": f"large_{i}",
                "name": os.path.basename(path),
                "path": path,
                "size": size,
                "type": "file"
            })

        state.results = {
            "largeFiles": formatted_large,
            "duplicates": formatted_dupes,
            "stats": {
                "total_scanned": len(scanner.all_files),
                # ...
            }
        }
        
        state.progress = 100
        state.message = "Scan Complete"
        state.add_log('success', "Scan completed successfully.")
        
    except Exception as e:
        state.message = f"Error: {str(e)}"
        state.add_log('error', str(e))
    finally:
        state.scanning = False


# --- Endpoints ---

class ScanRequest(BaseModel):
    path: str

@app.get("/api/browse")
def browse_folder():
    """Opens a native folder picker dialog on the server (host)."""
    # Tkinter requires main thread usually, but in a thread for just a dialog it might work 
    # if we create root, hide it, ask, destroy.
    # Note: This opens on the HOST machine.
    try:
        root = tk.Tk()
        root.withdraw() # Hide main window
        root.attributes('-topmost', True) # Bring to front
        folder_selected = filedialog.askdirectory()
        root.destroy()
        return {"path": folder_selected}
    except Exception as e:
        return {"path": "", "error": str(e)}

@app.post("/api/scan/start")
def start_scan(request: ScanRequest):
    if state.scanning:
        raise HTTPException(status_code=400, detail="Scan already in progress")
    
    if not os.path.exists(request.path):
        raise HTTPException(status_code=404, detail="Directory not found")

    state.reset()
    state.scan_thread = threading.Thread(target=run_scan_process, args=(request.path,), daemon=True)
    state.scan_thread.start()
    return {"status": "started"}

@app.get("/api/scan/progress")
def get_progress():
    return {
        "scanning": state.scanning,
        "progress": state.progress,
        "message": state.message,
        "logs": state.logs,
        "results": state.results if not state.scanning else None
    }

class DeleteRequest(BaseModel):
    items: list[str] # List of paths

@app.post("/api/delete")
def delete_items(request: DeleteRequest):
    # DANGEROUS: Actually delete files
    deleted_count = 0
    errors = []
    
    for path in request.items:
        try:
            if os.path.isfile(path):
                os.remove(path)
                deleted_count += 1
            elif os.path.isdir(path):
                 # shutil.rmtree(path) ? The tool seems to focus on file duplicates mainly for deletion.
                 # Safety: Let's restrict to files for now unless confirmed.
                 errors.append(f"Skipped folder: {path}")
            else:
                errors.append(f"Not found: {path}")
        except Exception as e:
            errors.append(f"Error deleting {path}: {str(e)}")
            
    return {"deleted": deleted_count, "errors": errors}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
