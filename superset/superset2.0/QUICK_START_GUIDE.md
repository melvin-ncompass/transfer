# Quick Start Guide for Superset with CRUD Feature

## Prerequisites
- Docker Desktop installed and **RUNNING** ✅
- Node.js (for frontend development)

## Starting Superset with Docker

### Step 1: Start Docker Desktop
Make sure Docker Desktop is running on your system.

### Step 2: Build and Start Services
```powershell
# From the superset directory
docker compose up -d --build
```

This command will:
- Build the Superset frontend (including our new CRUD feature)
- Start PostgreSQL database
- Start Redis cache
- Start Superset web server
- Start Celery workers

**Note**: First time build takes 10-20 minutes.

### Step 3: Access Superset
Once all containers are running, access Superset at:
**http://localhost:8088**

**Default Login Credentials:**
- Username: `admin`
- Password: `admin`

### Step 4: Access the CRUD Feature
1. Log in to Superset
2. Look for the **CRUD** menu in the top navbar
3. Click **CRUD** → **Table Operations**
4. Start performing CRUD operations!

## Docker Commands

### Check Running Containers
```powershell
docker compose ps
```

### View Logs
```powershell
# All services
docker compose logs -f

# Specific service (e.g., superset-app)
docker compose logs -f superset-app
```

### Stop Services
```powershell
docker compose down
```

### Stop and Remove Volumes (Fresh Start)
```powershell
docker compose down -v
```

### Rebuild After Code Changes
```powershell
# If you modify the frontend code
docker compose up -d --build
```

## Accessing the CRUD Feature

### Step-by-Step:
1. Navigate to http://localhost:8088
2. Login with admin/admin
3. Click on **CRUD** in the navbar
4. Select **Table Operations**
5. Choose:
   - Database (e.g., "examples" - comes preloaded)
   - Schema (e.g., "public")
   - Table (e.g., any example table)
6. View and edit data using the CRUD interface!

## Troubleshooting

### Docker Desktop Not Running
**Error**: `The system cannot find the file specified`
**Solution**: Start Docker Desktop application

### Port Already in Use
**Error**: `Port 8088 is already allocated`
**Solution**: 
```powershell
# Find and stop the process using port 8088
netstat -ano | findstr :8088
# Kill the process using the PID from above
taskkill /PID <PID> /F

# Or change the port in docker-compose.yml
```

### Frontend Not Building
**Error**: Frontend build fails
**Solution**:
```powershell
# Manually build frontend first
cd superset-frontend
npm install
npm run build
cd ..
docker compose up -d --build
```

### Can't See CRUD Menu
**Solution**:
1. Clear browser cache (Ctrl+Shift+Delete)
2. Hard refresh (Ctrl+F5)
3. Check browser console for errors
4. Verify the build completed successfully:
   ```powershell
   docker compose logs superset-app | Select-String -Pattern "CRUD"
   ```

### Database Connection Issues
**Error**: Can't connect to database
**Solution**:
```powershell
# Restart all services
docker compose down
docker compose up -d
```

## Alternative: Development Mode (Without Docker)

### Requirements
- Python 3.9, 3.10, or 3.11 (NOT 3.13!)
- Node.js ^20.16.0
- npm ^10.8.1

### Steps:
1. **Create Python Virtual Environment**:
   ```powershell
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   ```

2. **Install Python Dependencies**:
   ```powershell
   pip install -r requirements/development.txt
   pip install -e .
   ```

3. **Initialize Database**:
   ```powershell
   # Export config
   $env:SUPERSET_CONFIG_PATH = "$PWD\superset_config.py"
   $env:FLASK_APP = "superset"
   
   # Initialize db
   superset db upgrade
   superset fab create-admin
   superset load_examples
   superset init
   ```

4. **Build Frontend**:
   ```powershell
   cd superset-frontend
   npm install
   npm run build
   cd ..
   ```

5. **Run Superset**:
   ```powershell
   # Terminal 1: Web server
   superset run -p 8088 --with-threads --reload --debugger
   
   # Terminal 2 (optional): Celery worker
   celery --app=superset.tasks.celery_app:app worker
   ```

## Verifying the CRUD Feature

### Check Files Exist:
```powershell
# Verify our new files exist
Get-ChildItem -Path "superset-frontend\src\pages\TableCRUD"
Get-Content "superset-frontend\src\views\routes.tsx" | Select-String -Pattern "TableCRUD"
Get-Content "superset-frontend\src\features\home\Menu.tsx" | Select-String -Pattern "CRUD"
```

### Test the Feature:
1. Go to http://localhost:8088
2. Login
3. Navigate to **CRUD** → **Table Operations**
4. Select the "examples" database
5. Select "public" schema
6. Select any table (e.g., "birth_names")
7. Try:
   - ✅ Viewing data
   - ✅ Creating a new row
   - ✅ Editing a row
   - ✅ Deleting a row
   - ✅ Inserting after a row

## Useful Docker Commands

```powershell
# See all containers
docker ps -a

# Enter a running container
docker exec -it superset_app bash

# Check database
docker exec -it superset_db psql -U superset

# Restart specific service
docker compose restart superset-app

# View resource usage
docker stats

# Clean up everything
docker compose down -v --remove-orphans
docker system prune -a
```

## Next Steps

1. **Explore Superset Features**: Learn about dashboards, charts, and SQL Lab
2. **Add Database Connections**: Connect to your own databases
3. **Customize the CRUD Feature**: Modify `superset-frontend/src/pages/TableCRUD/index.tsx`
4. **Add Security**: Configure row-level security for CRUD operations
5. **Extend Functionality**: Add more features like bulk operations, CSV export, etc.

## Need Help?

- Check logs: `docker compose logs -f`
- Superset Documentation: https://superset.apache.org/docs/intro
- Community: https://github.com/apache/superset/discussions

---

## Summary

**Easiest Way to Run:**
```powershell
# 1. Start Docker Desktop
# 2. Run this command:
docker compose up -d --build

# 3. Wait 10-15 minutes for first build
# 4. Access: http://localhost:8088 (admin/admin)
# 5. Use CRUD menu!
```

Happy CRUD-ing! 🎉

