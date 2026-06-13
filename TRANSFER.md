# Transfer Guide — Pull & Set Up on Your Personal PC

This repository bundles many projects from another PC so you can pull them onto your own
machine and keep working. Follow the steps below in order.

- **Repo:** `https://github.com/melvin-ncompass/transfer.git`
- **Branch:** `main`

> Note: PNGs/map tiles, `node_modules`, `.venv`, build caches, `.env` files, secrets, `*.zip`
> backups, and one 185 MB CSV were **excluded** to keep the push valid and light. See
> [What's not included](#whats-not-included-and-how-to-restore-it) to restore them.

---

## 0. Prerequisites

Install what you need (only the stacks you plan to run):

| Tool | Used by | Get it |
|------|---------|--------|
| **Git** | everything | <https://git-scm.com/downloads> |
| **Node.js** (18+ LTS) + npm | most projects (React/Nest/Vite/etc.) | <https://nodejs.org> |
| **Python** (3.10+) + pip | `superset`, `Bsuit-usecase/data-generator`, `leaflet/raster` | <https://python.org> |
| **Docker Desktop** | projects with `docker-compose.yml` (Bsuit, cxh_pulse, superset, nifi) | <https://docker.com/products/docker-desktop> |

Check they work:

```bash
git --version
node -v && npm -v
python --version
docker --version
```

---

## 1. Clone the repository

Pick a folder on your PC, then:

```bash
git clone https://github.com/melvin-ncompass/transfer.git
cd transfer
```

If the repo is **private**, authenticate first using one of these:

```bash
# Option A — GitHub CLI (easiest)
gh auth login          # then re-run the clone above

# Option B — HTTPS + Personal Access Token
# When git asks for a password, paste a token from
# https://github.com/settings/tokens  (scope: repo)
```

> The clone is large (it includes the `swark hurry-burry/linux` kernel tree and `superset`),
> so it may take several minutes. To grab only the latest snapshot faster:
>
> ```bash
> git clone --depth 1 https://github.com/melvin-ncompass/transfer.git
> ```

---

## 2. Set up a project (general pattern)

Each top-level folder is an independent project (some contain `backend/` + `frontend/`
sub-projects). Set up only the ones you need.

### Node / JavaScript projects

Run `npm install` in **each folder that has a `package.json`**:

```bash
cd <project>            # e.g. cd Leaflet-D3-GL-Ploty/client
npm install
npm run dev             # or: npm start / npm run build  (check the project's package.json "scripts")
```

For full-stack projects, install backend and frontend separately, e.g.:

```bash
cd Agent/backend && npm install && cd ../..
cd Agent/frontend && npm install && cd ../..
```

### Python projects

Create a virtual environment and install requirements:

```bash
cd <project>
python -m venv .venv
# Windows PowerShell:
.venv\Scripts\Activate.ps1
# macOS/Linux:
# source .venv/bin/activate
pip install -r requirements.txt
```

### Docker-based projects

If a project has a `docker-compose.yml`, you can usually start it with:

```bash
cd <project>
docker compose up -d        # add --build the first time
docker compose down         # to stop
```

---

## 3. Project-specific notes

| Project | Stack | Setup |
|---------|-------|-------|
| `Agent` | Node (backend + frontend) | `npm install` in `Agent/backend` and `Agent/frontend`; create `.env` in each |
| `Bsuit/bsuite-frontend`, `Bsuit/bsuite-backend` | Node + Docker | `npm install`; backend has multiple `docker-compose-*.yml` (postgres/vault/backend) |
| `Bsuit-usecase` | Node + Python + Docker | `npm install` in `analytics-*`; `pip install -r data-generator/requirements.txt`; `docker compose up` |
| `cxh_pulse`, `Cxh_pulse_chirstmas_edition` | Node + Docker | `npm install` in `backend` & `frontend`; `docker compose up` for the DB/server |
| `leaflet`, `leaflet-postgress`, `leaflet-postgress-2`, `Leaflet-D3-GL-Ploty` | Node (client + server) | `npm install` in `client` and `server`; needs PostgreSQL for the `*-postgress` ones |
| `leaflet/raster` | Python | `pip install` the raster libs, then run `raster.py` to regenerate map tiles |
| `MCP_trial/MCP` | Node | `npm install` in `mcp-server` and `react-client`; copy each `.env.example` to `.env` |
| `Nestjs-react/trail01` | Node (NestJS) | `npm install`; `npm run start:dev` |
| `superset/superset2.0` | Python + Docker | easiest via `docker compose -f docker-compose-non-dev.yml up`; or `pip install -r requirements/development.txt` |
| `nifi_docker_build` | Docker | `docker compose up -d` |
| `System-Cleaner` | Node (NestJS + frontend) | `npm install` in `backend-nest` and `frontend` |
| `Swark*`, `swark-og`, `in_search_of_lost_swark`, `neo4j ahhh swark` | Node | `npm install` per sub-folder with a `package.json` |
| `swark hurry-burry/linux` | Linux kernel source | reference only — build per kernel docs if needed |
| `werfrew getwg etr` | Python | needs `OPENAI_API_KEY` env var (see security note) |

---

## 4. Create environment / secret files

`.env` files were **not** pushed. For each project that needs them:

1. Copy the template if one exists:
   ```bash
   cp .env.example .env        # e.g. in MCP_trial/MCP/mcp-server, MCP_trial/MCP/react-client,
                               #      Bsuit-usecase/analytics-benchmark
   ```
2. Fill in the real values (DB URLs, API keys, etc.).
3. For projects **without** a template, create a `.env` based on how the code reads
   `process.env.*` / `os.environ[...]`.

---

## 5. Restore excluded data (only if you need it)

### Map tiles / PNGs
```bash
cd leaflet/raster
python raster.py        # regenerates the tile pyramid
# or copy leaflet/raster/weather_tiles from the source PC via USB/cloud
```

### The 185 MB CSV
`data_csv/prompts_populated.csv` is over GitHub's 100 MB limit — copy it manually from the
source PC (USB / Google Drive / etc.) into `data_csv/`.

### Secrets that were removed
- `Bsuit/bsuite-backend/static/storage_read_sa.json` — recreate from your own Google Cloud
  service-account credentials.

---

## ⚠️ Security action required

`werfrew getwg etr/day2.py`, `day2o.py`, and `new1.py` previously contained a hardcoded
**OpenAI API key** (`sk-proj-...`). It was scrubbed from the pushed code, but it lived in
plaintext on disk — **treat it as compromised**:

1. Revoke/rotate it: <https://platform.openai.com/api-keys>
2. Set the new key via an environment variable instead of hardcoding:
   ```powershell
   $env:OPENAI_API_KEY="<your-new-key>"      # Windows PowerShell
   # export OPENAI_API_KEY="<your-new-key>"  # macOS/Linux
   ```

---

## 6. Pulling future updates

When the source PC pushes more changes:

```bash
git pull origin main
```

---

## What's not included (and how to restore it)

| Excluded | Reason | Restore |
|----------|--------|---------|
| `*.png` (incl. 70k+ map tiles) | huge file count | regenerate (`leaflet/raster/raster.py`) or copy manually |
| `leaflet/raster/weather_tiles/`, `new_tiles/` | tens of thousands of tiles | regenerate / copy |
| `node_modules/`, `.venv/`, build outputs, `.temp_cache/`, `.vscode-test/` | reinstallable | `npm install` / `pip install` |
| `*.zip` root backups | large, redundant | copy manually if wanted |
| `data_csv/prompts_populated.csv` (185 MB) | exceeds GitHub 100 MB limit | copy manually |
| `Bsuit/.../storage_read_sa.json` | real GCP secret | recreate from your own credentials |
| Superset deckgl/map-box demo files, `db_engine_specs/README.md` | example Mapbox tokens blocked by GitHub | restore from upstream Apache Superset |
| `.env` / secrets | must never be committed | recreate from `.env.example` |

> Want PNGs tracked in git anyway? Remove the `*.png` line from `.gitignore`, then
> `git add` + commit (remember: no single file may exceed 100 MB).
