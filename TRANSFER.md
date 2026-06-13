# Transfer Guide — Move this workspace to your personal PC

This repo bundles many projects from one PC so you can pull them onto your own machine.
To keep the push small and fast, **all `.png` images and the large map‑tile folders are
excluded from git** (see `.gitignore`). They are regenerable and not required for the code
to work. Everything else (source code, configs, small assets) is pushed.

- Remote: `https://github.com/melvin-ncompass/transfer.git`
- Default branch: `main`

---

## What is NOT in the push (and why)

| Excluded | Reason | How to get it back |
|----------|--------|--------------------|
| `*.png` (all PNGs, incl. map tiles) | 72k+ tile files made the push huge/slow | Regenerate from the raster scripts, or copy the folder manually (see below) |
| `leaflet/raster/weather_tiles/`, `leaflet/raster/new_tiles/` | Map tile pyramids (tens of thousands of files) | Regenerate with `leaflet/raster/raster.py` / `riotiler.py` |
| `node_modules/`, `.venv/`, build outputs | Reinstallable dependencies | `npm install` / `pip install -r requirements.txt` per project |
| `.env`, keys, secrets | Should never be committed | Recreate locally from each project's `.env.example` |

> If you actually want the PNGs tracked in git, delete the `*.png` line in `.gitignore`,
> then `git add` and commit again. (Be aware GitHub blocks any single file > 100 MB.)

---

## Step 1 — On your personal PC: clone the repo

```bash
git clone https://github.com/melvin-ncompass/transfer.git
cd transfer
```

If the repo is private, sign in first (browser flow):

```bash
# Option A: GitHub CLI
gh auth login

# Option B: clone over HTTPS and paste a Personal Access Token as the password
git clone https://github.com/melvin-ncompass/transfer.git
```

## Step 2 — Restore dependencies (per project)

Node projects:

```bash
cd <project>          # e.g. cd Leaflet-D3-GL-Ploty/client
npm install
```

Python projects:

```bash
cd <project>
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # macOS/Linux
pip install -r requirements.txt
```

## Step 3 — Recreate environment files

Each project that needs secrets has a `.env`. These are NOT in git. Recreate them from the
matching `.env.example` (or ask for the values) and place them in the same folder.

## Step 4 — Restore the map tiles / PNGs (only if you need them)

The PNG tiles were excluded. Two options:

1. **Regenerate** — run the raster pipeline:
   ```bash
   cd leaflet/raster
   python raster.py
   # or
   python riotiler.py
   ```
2. **Copy manually** — zip `leaflet/raster/weather_tiles` (and any PNGs) on the source PC
   and transfer via USB / cloud drive, since they are intentionally not in git.

---

## Quick reference — commands used to create this push (source PC)

```bash
git init
git branch -M main
git remote add origin https://github.com/melvin-ncompass/transfer.git
git add .
git commit -m "Initial transfer: all projects (PNGs/tiles excluded)"
git push -u origin main
```

To pull future updates on your PC:

```bash
git pull origin main
```
