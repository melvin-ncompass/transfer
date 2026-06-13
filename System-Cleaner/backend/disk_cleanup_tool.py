import os
import hashlib
from collections import defaultdict
import sys

def get_readable_size(size_message):
    """Converts bytes to a human-readable string."""
    for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
        if size_message < 1024.0:
            return f"{size_message:.2f} {unit}"
        size_message /= 1024.0
    return f"{size_message:.2f} PB"

def chunk_reader(fobj, chunk_size=1024):
    """Generator that reads a file in chunks."""
    while True:
        chunk = fobj.read(chunk_size)
        if not chunk:
            return
        yield chunk

def get_hash(filename, first_chunk_only=False):
    """Calculates the SHA-256 hash of a file or just the first chunk."""
    hash_obj = hashlib.sha256()
    try:
        with open(filename, 'rb') as f:
            if first_chunk_only:
                hash_obj.update(f.read(4096))
            else:
                for chunk in chunk_reader(f, chunk_size=65536):
                    hash_obj.update(chunk)
    except OSError:
        return None
    return hash_obj.hexdigest()

class DiskScanner:
    CODE_EXTENSIONS = {
        '.py', '.js', '.ts', '.java', '.c', '.cpp', '.cs', '.h', '.hpp', 
        '.html', '.css', '.scss', '.json', '.xml', '.yaml', '.yml', '.md',
        '.sh', '.bat', '.ps1', '.go', '.rs', '.php', '.rb', '.lua'
    }

    def __init__(self, root_dir, progress_callback=None):
        self.root_dir = os.path.abspath(root_dir)
        self.progress_callback = progress_callback
        self.files_by_size = defaultdict(list)
        self.all_files = [] # List of (path, size)
        self.folder_sizes = {} # Path -> size (non-recursive initially)
        self.folder_structure = {} # Path -> list of (filename, size)
        self.file_hashes = {} # Path -> full_hash (cache)

    def report_progress(self, current, total, message):
        if self.progress_callback:
            # Avoid divide by zero
            pct = 0.0
            if total > 0:
                pct = current / total
            self.progress_callback(pct, message)

    def get_file_hash(self, filepath):
        """Cached hash retrieval."""
        if filepath in self.file_hashes:
            return self.file_hashes[filepath]
        h = get_hash(filepath)
        if h:
            self.file_hashes[filepath] = h
        return h

    def scan(self):
        print(f"Scanning directory: {self.root_dir} ...")
        if self.progress_callback:
            self.progress_callback(0, "Starting scan...")
            
        # Top-down walk
        # We don't know total yet, so just indeterminate logging
        count = 0
        for dirpath, dirnames, filenames in os.walk(self.root_dir):
            if count % 10 == 0 and self.progress_callback:
                self.progress_callback(-1, f"Scanning: {os.path.basename(dirpath)}")
            count += 1

            # Ignore node_modules
            if 'node_modules' in dirnames:
                dirnames.remove('node_modules')
            
            # Use a safe copy for iteration or just simple list logic
            # Explicitly ignore .git directories too as they are huge and not "user" duplicate data usually
            if '.git' in dirnames:
                dirnames.remove('.git')

            folder_size = 0
            file_list = []
            
            for filename in filenames:
                filepath = os.path.join(dirpath, filename)
                try:
                    # Resolve symlinks to avoid loops or confusing sizes? 
                    # For now, treat simple.
                    size = os.path.getsize(filepath)
                    self.files_by_size[size].append(filepath)
                    self.all_files.append((filepath, size))
                    folder_size += size
                    file_list.append((filename, size))
                except OSError:
                    continue 

            self.folder_sizes[dirpath] = folder_size
            self.folder_structure[dirpath] = file_list

        if self.progress_callback:
            self.progress_callback(-1, "Scan complete. Calculating stats...")
        print("Scan complete.")

    def calculate_recursive_folder_sizes(self):
        """Calculates total size including subdirectories."""
        # Sort by depth descending so we process children before parents
        sorted_dirs = sorted(self.folder_sizes.keys(), key=lambda p: p.count(os.sep), reverse=True)
        recursive_sizes = {} 
        
        # We need to rebuild the tree structure temporarily or just sum up
        # Since we have full paths, we can just iterate.
        # But simple iteration over sorted_dirs and adding to parent is efficient.
        
        # Initialize with local sizes
        for p, s in self.folder_sizes.items():
            recursive_sizes[p] = s

        # Bubble up sizes
        for dirpath in sorted_dirs:
            parent = os.path.dirname(dirpath)
            if parent in recursive_sizes and parent != dirpath:
                # We can't strictly trust string processing if outside root, but self.folder_sizes only has visited paths.
                # However, if 'parent' is outside self.root_dir, it won't be in keys.
                 recursive_sizes[parent] += recursive_sizes[dirpath]

        return recursive_sizes

    def get_folder_signature(self, dirpath):
        """
        Generates a signature for a folder based on its structure and content.
        Signature = Hash of (sorted list of (filename, filesize, filehash)).
        """
        # We only need signatures for folders that are candidates for duplication (same size).
        # But to be robust, we'll check structure first.
        # Computing hash for EVERY file in a huge folder is expensive.
        # Strategy: 
        # 1. Structure + Size Signature (fast): Hash of (filename, filesize) strings.
        # 2. If collide, Content Signature (slow): Hash of file contents.
        
        files = self.folder_structure.get(dirpath, [])
        files.sort(key=lambda x: x[0]) # properties are (name, size)
        
        # Fast signature
        struct_sig_obj = hashlib.sha256()
        for name, size in files:
            struct_sig_obj.update(f"{name}:{size}".encode('utf-8'))
        
        return struct_sig_obj.hexdigest()

    def find_duplicate_folders(self):
        print("Analyzing folder structure...")
        self.report_progress(0, 100, "Analyzing folder structure...")
        
        rec_sizes = self.calculate_recursive_folder_sizes()
        
        # Group by recursive size
        by_size = defaultdict(list)
        for path, size in rec_sizes.items():
            if size > 0: # minimal size to care about
                by_size[size].append(path)
        
        duplicate_folders = [] # List of tuples: (size, [paths])
        duplicate_folder_paths = set() # For fast lookup later
        
        total_items = len(by_size)
        processed = 0
        
        for size, paths in by_size.items():
            processed += 1
            if processed % 100 == 0:
                 self.report_progress(processed, total_items, "Checking folder duplicates...")
                 
            if len(paths) < 2:
                continue
            
            # Refine by direct structure (filenames + local sizes)
            # NOTE: "Folder Duplication" usually implies recursive identity. 
            # Doing full recursive comparison is complex (Merkle tree).
            # Simplified approach: A folder is a duplicate if its IMMEDIATE content is identical 
            # AND its total recursive size is identical. 
            # This is a strong heuristic. 
            
            # Improved heuristic: Group by "structure signature"
            by_sig = defaultdict(list)
            for p in paths:
                sig = self.get_folder_signature(p)
                by_sig[sig].append(p)
                
            for sig, sub_group in by_sig.items():
                if len(sub_group) < 2:
                    continue

                # Verify content of files in this folder (non-recursive content check)
                # If immediate files match AND recursive size matches, it's 99.9% a duplicate tree.
                # To be 100%, we'd need to check subfolders too.
                # Let's verify immediate files.
                
                confirmed_group = []
                # map first folder's files to hashes
                # We pick the first one as reference
                ref_path = sub_group[0]
                ref_files = self.folder_structure[ref_path] #(name, size)
                
                # Check hashes for reference
                ref_hashes = []
                valid_ref = True
                for fname, _ in ref_files:
                    fpath = os.path.join(ref_path, fname)
                    h = self.get_file_hash(fpath)
                    if h is None: 
                        valid_ref = False
                        break
                    ref_hashes.append(h)
                
                if not valid_ref:
                    continue
                    
                # Now check others against reference
                final_group = [ref_path]
                
                for cand_path in sub_group[1:]:
                    cand_files = self.folder_structure[cand_path]
                    # structure is already same (sig matched), just check content
                    match = True
                    for i, (fname, _) in enumerate(cand_files):
                        fpath = os.path.join(cand_path, fname)
                        h = self.get_file_hash(fpath)
                        if h != ref_hashes[i]:
                            match = False
                            break
                    if match:
                        final_group.append(cand_path)
                
                if len(final_group) > 1:
                    duplicate_folders.append((size, final_group))
                    for p in final_group:
                        duplicate_folder_paths.add(p)

        return duplicate_folders, duplicate_folder_paths

    def find_file_duplicates(self, duplicate_folder_paths):
        print("Analyzing file duplicates...")
        self.report_progress(0, 100, "Analyzing file duplicates...")
        
        duplicates = []
        
        # Filter groups that have more than 1 file
        potential_groups = [files for size, files in self.files_by_size.items() if len(files) > 1 and size > 0]
        total_groups = len(potential_groups)
        
        for i, group in enumerate(potential_groups):
            if i % 50 == 0:
                 self.report_progress(i, total_groups, f"Hashing files ({i}/{total_groups})...")
            
            # 1. Check extension for code filtering optimization
            # If all files are code, and NOT in duplicate folders, skip expensive hashing?
            # No, we need to hash to know if they are dupes first.
            
            # Optimization: 1. Hash first 4kb
            by_small_hash = defaultdict(list)
            for filepath in group:
                sh = get_hash(filepath, first_chunk_only=True)
                if sh:
                    by_small_hash[sh].append(filepath)
            
            # 2. Full hash
            for sh, files in by_small_hash.items():
                if len(files) < 2:
                    continue
                
                by_full_hash = defaultdict(list)
                for filepath in files:
                    fh = self.get_file_hash(filepath) # Use cached method
                    if fh:
                        by_full_hash[fh].append(filepath)
                
                # 3. Filtering Logic
                for fh, final_group in by_full_hash.items():
                    if len(final_group) < 2:
                        continue
                        
                    # Apply User Rules:
                    # - If Code File: Only list if parent folder is in 'duplicate_folder_paths'
                    # - Else: List always
                    
                    filtered_group = []
                    ext = os.path.splitext(final_group[0])[1].lower()
                    is_code = ext in self.CODE_EXTENSIONS
                    
                    if is_code:
                        # Check recursively if any parent is a duplicate folder? 
                        # User said: "look at the root folder... if it has duplicate alone it should be listed"
                        # Interpretation: Keep if this file lives inside a detected duplicate folder structure.
                        # We have 'duplicate_folder_paths'.
                        
                        for fpath in final_group:
                            parent = os.path.dirname(fpath)
                            # Check if parent is a known duplicate folder
                            if parent in duplicate_folder_paths:
                                filtered_group.append(fpath)
                            else:
                                # What if the file ITSELF is in root and duplicated in another root?
                                # 'duplicate_folders' detects folders.
                                # If two project roots are duplicated, 'duplicate_folder_paths' will contain matched subfolders?
                                # No, my heuristic only checks immediate content.
                                # But if root A == root B, then A is in duplicate_folder_paths.
                                pass
                        
                        # Special Case: User said "if its not duplicate skip it".
                        # If I filtered and have < 2 items, it means we don't have a pair of "Project Duplicates".
                        # So we drop it.
                        pass
                    else:
                        filtered_group = final_group

                    if len(filtered_group) > 1:
                        duplicates.append((os.path.getsize(filtered_group[0]), filtered_group))

        return duplicates

    def generate_reports(self):
        # 1. Detect Duplicate Folders First
        dup_folders, dup_folder_paths = self.find_duplicate_folders()
        dup_folders.sort(key=lambda x: x[0], reverse=True)

        # 2. Detect File Duplicates (with filtering)
        dup_files = self.find_file_duplicates(dup_folder_paths)
        dup_files.sort(key=lambda x: x[0] * (len(x[1]) - 1), reverse=True)
        
        with open("duplicates_report.txt", "w", encoding="utf-8") as f:
            f.write(f"Duplicate Report\nScanned Directory: {self.root_dir}\n")
            f.write("="*60 + "\n")
            
            # Section 1: Duplicate Folders
            f.write(f"\n[ DUPLICATE FOLDERS ]\nFound {len(dup_folders)} groups.\n")
            f.write("These folders have identical immediate content and same recursive size.\n")
            f.write("-" * 60 + "\n")
            
            for size, paths in dup_folders:
                f.write(f"Size: {get_readable_size(size)}\n")
                for p in paths:
                    f.write(f"  [D] {p}\n")
                f.write("\n")

            # Section 2: Duplicate Files
            f.write(f"\n[ DUPLICATE FILES ]\nFound {len(dup_files)} groups.\n")
            f.write("Code files are only listed if they belong to duplicate folders.\n")
            f.write("-" * 60 + "\n")
            
            total_wasted = 0
            for size, files in dup_files:
                wasted = size * (len(files) - 1)
                total_wasted += wasted
                f.write(f"Size: {get_readable_size(size)} | Wasted: {get_readable_size(wasted)}\n")
                for filepath in files:
                    f.write(f"  - {filepath}\n")
                f.write("-" * 30 + "\n")
            
            f.write(f"\nTotal Wasted Space (Files): {get_readable_size(total_wasted)}\n")

        print(f"Report generated: duplicates_report.txt")

        # 2. Usage Report
        print("Analyzing space usage...")
        
        top_files = sorted(self.all_files, key=lambda x: x[1], reverse=True)[:50]
        
        folder_sizes = self.calculate_recursive_folder_sizes()
        top_folders = sorted(folder_sizes.items(), key=lambda x: x[1], reverse=True)[:50]

        with open("usage_report.txt", "w", encoding="utf-8") as f:
            f.write(f"Space Usage Detailed Report\nScanned Directory: {self.root_dir}\n")
            f.write("="*50 + "\n\n")
            
            f.write("TOP 50 LARGEST FILES:\n")
            for path, size in top_files:
                f.write(f"{get_readable_size(size):>10} | {path}\n")
            
            f.write("\n" + "="*50 + "\n\n")
            
            f.write("TOP 50 LARGEST FOLDERS (Recursive Size):\n")
            for path, size in top_folders:
                f.write(f"{get_readable_size(size):>10} | {path}\n")

        print("Report generated: usage_report.txt")

    def find_duplicates(self): 
        # Legacy stub if called, but we use find_file_duplicates now
        pass

if __name__ == "__main__":
    target_dir = input("Enter directory path to scan (press Enter for current directory): ").strip()
    if not target_dir:
        target_dir = os.getcwd()
    
    if not os.path.exists(target_dir):
        print(f"Error: Directory '{target_dir}' does not exist.")
    else:
        scanner = DiskScanner(target_dir)
        scanner.scan()
        scanner.generate_reports()
        print("\nAll Done! Please check 'duplicates_report.txt' and 'usage_report.txt'.")
