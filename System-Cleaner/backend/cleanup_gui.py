import customtkinter as ctk
import tkinter as tk
from tkinter import filedialog
import threading
import os
import sys
import subprocess

# Import the backend logic
import disk_cleanup_tool

import time

class DiskCleanupApp(ctk.CTk):
    def __init__(self):
        super().__init__()

        # THEME SETUP
        ctk.set_appearance_mode("Dark")
        ctk.set_default_color_theme("dark-blue") # Base theme, we'll override specific colors
        
        self.title("DISK // CLEANUP // TOOL")
        self.geometry("900x650")

        # Futuristic Colors
        self.col_bg = "#0B0B0C"        # Deep Black
        self.col_panel = "#141416"     # Dark Gray
        self.col_accent = "#00F0FF"    # Cyber Cyan
        self.col_text = "#E0E0E0"      # White-ish
        self.col_text_dim = "#666666"  # Dim Gray
        
        self.configure(fg_color=self.col_bg)

        # Configure Grid
        self.grid_columnconfigure(0, weight=1)
        self.grid_rowconfigure(3, weight=1) # Log area expands

        # =====================================================
        # 1. HEADER AREA
        # =====================================================
        self.header_frame = ctk.CTkFrame(self, fg_color=self.col_panel, corner_radius=0)
        self.header_frame.grid(row=0, column=0, sticky="ew", padx=0, pady=0)
        self.header_frame.grid_columnconfigure(1, weight=1)

        self.lbl_title = ctk.CTkLabel(self.header_frame, text="SYSTEM_CLEANER_V1.0", 
                                      font=("Consolas", 20, "bold"), text_color=self.col_accent)
        self.lbl_title.grid(row=0, column=0, padx=20, pady=20)

        # Time/Status Widget in Header
        self.lbl_sys_status = ctk.CTkLabel(self.header_frame, text="STATUS: IDLE", 
                                           font=("Consolas", 12), text_color=self.col_text_dim)
        self.lbl_sys_status.grid(row=0, column=2, padx=20)

        # =====================================================
        # 2. INPUT AREA (Card Style)
        # =====================================================
        self.input_card = ctk.CTkFrame(self, fg_color=self.col_panel, corner_radius=10, border_width=1, border_color="#333")
        self.input_card.grid(row=1, column=0, padx=20, pady=20, sticky="ew")
        self.input_card.grid_columnconfigure(1, weight=1)

        self.lbl_target = ctk.CTkLabel(self.input_card, text="TARGET_VECTOR:", font=("Consolas", 12, "bold"), text_color=self.col_accent)
        self.lbl_target.grid(row=0, column=0, padx=15, pady=15)

        self.entry_dir = ctk.CTkEntry(self.input_card, placeholder_text="SELECT_DIRECTORY...", 
                                      font=("Consolas", 12), height=35, border_color="#333", fg_color="#1A1A1D")
        self.entry_dir.grid(row=0, column=1, padx=10, pady=15, sticky="ew")

        self.btn_browse = ctk.CTkButton(self.input_card, text="BROWSE", command=self.browse_folder, 
                                        font=("Consolas", 12, "bold"), fg_color="transparent", border_width=1, border_color=self.col_accent, text_color=self.col_accent, hover_color="#003333")
        self.btn_browse.grid(row=0, column=2, padx=15, pady=15)

        # =====================================================
        # 3. DASHBOARD / METRICS
        # =====================================================
        self.dash_frame = ctk.CTkFrame(self, fg_color="transparent")
        self.dash_frame.grid(row=2, column=0, padx=20, pady=(0, 10), sticky="ew")
        self.dash_frame.grid_columnconfigure((0,1), weight=1)

        # Progress Section
        self.prog_frame = ctk.CTkFrame(self.dash_frame, fg_color=self.col_panel, corner_radius=10, border_width=1, border_color="#333")
        self.prog_frame.grid(row=0, column=0, columnspan=2, sticky="ew", pady=5)
        self.prog_frame.grid_columnconfigure(0, weight=1)

        self.progress_bar = ctk.CTkProgressBar(self.prog_frame, height=15, corner_radius=2, progress_color=self.col_accent, fg_color="#111")
        self.progress_bar.grid(row=0, column=0, padx=20, pady=(20, 5), sticky="ew")
        self.progress_bar.set(0)

        self.lbl_task = ctk.CTkLabel(self.prog_frame, text="READY_TO_SCAN", font=("Consolas", 12), text_color="#FFF")
        self.lbl_task.grid(row=1, column=0, padx=20, pady=(0, 20), sticky="w")
        
        self.lbl_pct = ctk.CTkLabel(self.prog_frame, text="0%", font=("Consolas", 24, "bold"), text_color=self.col_accent)
        self.lbl_pct.grid(row=0, column=1, rowspan=2, padx=20, pady=10)

        # Timer & ETA
        self.metrics_frame = ctk.CTkFrame(self.dash_frame, fg_color="transparent")
        self.metrics_frame.grid(row=1, column=0, columnspan=2, sticky="ew", pady=5)
        self.metrics_frame.grid_columnconfigure((0,1), weight=1)

        # Timer Box
        self.timer_box = ctk.CTkFrame(self.metrics_frame, fg_color=self.col_panel, corner_radius=6, border_width=1, border_color="#333")
        self.timer_box.grid(row=0, column=0, sticky="ew", padx=(0, 5))
        self.lbl_elapsed_title = ctk.CTkLabel(self.timer_box, text="ELAPSED TIME", font=("Consolas", 10), text_color="gray")
        self.lbl_elapsed_title.pack(pady=(5,0))
        self.lbl_elapsed = ctk.CTkLabel(self.timer_box, text="00:00:00", font=("Consolas", 16, "bold"), text_color="#FFF")
        self.lbl_elapsed.pack(pady=(0,5))

        # ETA Box
        self.eta_box = ctk.CTkFrame(self.metrics_frame, fg_color=self.col_panel, corner_radius=6, border_width=1, border_color="#333")
        self.eta_box.grid(row=0, column=1, sticky="ew", padx=(5, 0))
        self.lbl_eta_title = ctk.CTkLabel(self.eta_box, text="EST. REMAINING", font=("Consolas", 10), text_color="gray")
        self.lbl_eta_title.pack(pady=(5,0))
        self.lbl_eta = ctk.CTkLabel(self.eta_box, text="--:--:--", font=("Consolas", 16, "bold"), text_color=self.col_accent)
        self.lbl_eta.pack(pady=(0,5))

        # =====================================================
        # 4. START BUTTON (Big)
        # =====================================================
        self.btn_scan = ctk.CTkButton(self, text="INITIALIZE_SCAN", command=self.start_scan_thread, 
                                      height=45, font=("Consolas", 16, "bold"), 
                                      fg_color=self.col_accent, text_color="black", hover_color="#00AACC", corner_radius=5)
        self.btn_scan.grid(row=3, column=0, padx=20, pady=10, sticky="ew")

        # =====================================================
        # 5. LOG AREA (Terminal Style)
        # =====================================================
        self.log_frame = ctk.CTkFrame(self, fg_color=self.col_panel, corner_radius=10, border_width=1, border_color="#333")
        self.log_frame.grid(row=4, column=0, padx=20, pady=20, sticky="nsew")
        self.log_frame.grid_rowconfigure(0, weight=1)
        self.log_frame.grid_columnconfigure(0, weight=1)

        # Only Show "View Report" button when done
        self.btn_open_report = ctk.CTkButton(self.log_frame, text="OPEN_REPORT_DIRECTORY", command=self.open_report_location, 
                                             state="disabled", fg_color="#333", text_color="gray", font=("Consolas", 12))
        self.btn_open_report.grid(row=1, column=0, padx=10, pady=10, sticky="ew")

        self.log_box = ctk.CTkTextbox(self.log_frame, font=("Consolas", 11), text_color="#00FF00", fg_color="#000", corner_radius=5)
        self.log_box.grid(row=0, column=0, padx=10, pady=10, sticky="nsew")
        self.log_box.configure(state="disabled")

        # LOGIC VARIABLES
        self.start_time = 0
        self.scanning = False

    def log(self, message):
        self.log_box.configure(state="normal")
        self.log_box.insert("end", f"> {message}\n")
        self.log_box.see("end")
        self.log_box.configure(state="disabled")

    def browse_folder(self):
        folder = filedialog.askdirectory()
        if folder:
            self.entry_dir.delete(0, "end")
            self.entry_dir.insert(0, folder)

    def update_progress(self, percentage, message):
        self.after(0, lambda: self._update_progress_gui(percentage, message))

    def _update_progress_gui(self, percentage, message):
        if percentage < 0:
            # Indeterminate
            # Just pulse UI or keep progressBar where it is?
            # We'll use a small trick: cycling visual
             pass
        else:
            self.progress_bar.set(percentage)
            self.lbl_pct.configure(text=f"{int(percentage*100)}%")
        
        self.lbl_task.configure(text=message.upper())

        # Auto-Log major steps
        if "Analyzing" in message or "Scanning" in message:
            if percentage == 0: self.log(message)

    def update_timer(self):
        if not self.scanning:
            return
        
        elapsed = time.time() - self.start_time
        # Format HH:MM:SS
        m, s = divmod(elapsed, 60)
        h, m = divmod(m, 60)
        self.lbl_elapsed.configure(text=f"{int(h):02}:{int(m):02}:{int(s):02}")

        # Calculate ETA
        # We can only calc ETA if we have percentage > 0
        pct = self.progress_bar.get()
        if pct > 0.01 and pct < 1.0:
            total_estimated_time = elapsed / pct
            remaining = total_estimated_time - elapsed
            
            rm, rs = divmod(remaining, 60)
            rh, rm = divmod(rm, 60)
            self.lbl_eta.configure(text=f"{int(rh):02}:{int(rm):02}:{int(rs):02}")
        else:
            self.lbl_eta.configure(text="CALCULATING...")

        # Schedule next update
        self.after(1000, self.update_timer)

    def start_scan_thread(self):
        target = self.entry_dir.get().strip()
        if not target or not os.path.exists(target):
            self.log("ERROR: INVALID_TARGET_DIRECTORY")
            return

        self.btn_scan.configure(state="disabled", fg_color="#333")
        self.btn_browse.configure(state="disabled")
        self.entry_dir.configure(state="disabled")
        self.progress_bar.set(0)
        self.lbl_pct.configure(text="0%")
        self.log(f"INIT_SEQUENCE: {target}")

        self.scanning = True
        self.start_time = time.time()
        self.update_timer()

        self.lbl_sys_status.configure(text="STATUS: ACTIVE", text_color=self.col_accent)

        # Start thread
        thread = threading.Thread(target=self.run_scan, args=(target,), daemon=True)
        thread.start()

    def run_scan(self, target_dir):
        try:
            scanner = disk_cleanup_tool.DiskScanner(target_dir, progress_callback=self.update_progress)
            scanner.scan()
            
            self.update_progress(0.4, "Analyzing Duplicates...")
            scanner.generate_reports()
            
            self.after(0, self.on_scan_complete)
        except Exception as e:
            err = str(e)
            self.after(0, lambda: self.log(f"CRITICAL ERROR: {err}"))
            self.after(0, lambda: self.btn_scan.configure(state="normal", fg_color=self.col_accent))

    def on_scan_complete(self):
        self.scanning = False
        self.progress_bar.set(1)
        self.lbl_pct.configure(text="100%")
        
        self.lbl_task.configure(text="PROCESS_COMPLETE")
        self.lbl_sys_status.configure(text="STATUS: COMPLETE", text_color="#00FF00")
        self.lbl_eta.configure(text="00:00:00")
        
        self.log("OPERATIONS SUCCESSFUL.")
        self.log("REPORTS GENERATED LOCALLY.")
        
        self.btn_scan.configure(state="normal", fg_color=self.col_accent, text="RESTART_SEQUENCE")
        self.btn_browse.configure(state="normal")
        self.entry_dir.configure(state="normal")
        
        self.btn_open_report.configure(state="normal", fg_color=self.col_accent, text_color="black")

    def open_report_location(self):
        cwd = os.getcwd()
        os.startfile(cwd)

if __name__ == "__main__":
    app = DiskCleanupApp()
    app.mainloop()
