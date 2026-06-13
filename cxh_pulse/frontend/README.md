# Climate Health Pulse - Frontend

A React-based frontend application for visualizing and analyzing climate-health data correlations. This application provides comprehensive dashboards, interactive maps, and predictive analytics for climate-health insights.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Cloning the Repository](#cloning-the-repository)
- [Project Structure](#project-structure)
- [Scaffolding](#scaffolding)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
  - [Docker Development](#docker-development)
  - [Docker Production](#docker-production)
- [Available Scripts](#available-scripts)
- [Troubleshooting](#troubleshooting)
- [Support](#support)
- [License](#license)

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** >= 20.0.0
- **npm** (package manager)
- **Docker** and **Docker Compose** (for Docker setup)
- **Git** (for cloning and submodule management)

## Cloning the Repository

Clone the repository using one of the following methods:

### Method 1: Clone without Submodules (recommended)

```bash
git clone -b FE/prod https://github.com/datakind/climate-health-pulse-project.git
cd  climate-health-pulse-project
git submodule update --init --recursive
```

### Method 2: Clone with Submodules

```bash
git clone -b FE/prod --recursive https://<username>@github.com/datakind/climate-health-pulse-project.git
cd  climate-health-pulse-project
```
## Project Structure

```
 climate-health-pulse-project/
├── src/                    # Main source code
│   │                       # Contains pages, components related to business
│   │                       # logic like visualizing indicators, forecasting, prompts
│   ├── api/               # API configuration and endpoints
│   ├── components/        # Reusable UI components
│   ├── contexts/          # React contexts
│   ├── hooks/             # Custom React hooks
│   ├── layouts/           # Layout components
│   ├── pages/             # Page components
│   ├── routes/             # Routing configuration
│   ├── sections/           # Feature sections
│   ├── store/              # Redux store configuration
│   ├── styles/             # Styling files
│   ├── theme/               # Theme configuration
│   ├── types/              # TypeScript type definitions
│   └── utils/              # Utility functions
├── scaffolding/            # Scaffolding submodule (shared components)
├── public/                 # Static assets
├── Dockerfile              # Development Docker configuration
├── Dockerfile.prod         # Production Docker configuration
├── docker-compose.yml      # Development Docker Compose
├── docker-compose.prod.yml # Production Docker Compose
├── vite.config.ts          # Vite configuration
└── package.json            # Dependencies and scripts
```

## Scaffolding vs Visualization

This project is divided into two main parts: **Scaffolding** and **Visualization**.

### Scaffolding

**What Scaffolding Contains:**
- **User Management** - User authentication, profiles, and user-related operations
- **Role Management** - Role creation, assignment, and role-based access control
- **Logs** - System logs and audit trails
- **Settings** - Application configuration and settings management

These are administrative and system-level features that are common across different applications and can be reused.

### Visualization

The visualization components are located in the `src/sections/` directory and contain all the data visualization features.

**What Visualization Contains:**
- **Dashboard** - Interactive dashboards with charts, maps, and analytics
- **Climate Data** - Climate indicators, temperature, precipitation visualizations
- **Health Indicators** - Health data visualization and analysis
- **Maps** - Interactive choropleth maps, geographic data visualization
- **Charts & Graphs** - Various chart types for data analysis
- **Forecasting** - Predictive analytics and forecasting visualizations
- **Data Tables** - Tabular data views with filtering and sorting
- **Prompts** - Conversational data visualization


## Scaffolding

The scaffolding directory contains shared components, pages, and sections that can be managed as a Git submodule for better code organization and reusability.

### Adding Scaffolding as a New Submodule

If scaffolding doesn't exist yet and you want to add it as a submodule:

```bash
# Remove existing scaffolding directory if it exists (backup first if needed)
rm -rf scaffolding

# Add scaffolding as a submodule
# Replace <scaffolding-repo-url> with the actual repository URL
git submodule add <scaffolding-repo-url> scaffolding

# Initialize and update submodules
git submodule update --init --recursive
```

### Pulling Changes for Submodules

When pulling changes in the main repository, you need to update submodules separately:

**Option 1: Manual update after pull (recommended)**
```bash
# Pull changes in main repository
git pull

# Update submodules to match the committed references
git submodule update --init --recursive
```

**Option 2: Automatic submodule update on pull**
```bash
# Configure Git to automatically update submodules when pulling
git config submodule.recurse true

# Now regular git pull will also update submodules
git pull
```

**Option 3: Update submodules to latest remote changes**
```bash
# Update all submodules to their latest remote branch
git submodule update --remote
```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
VITE_PORT=3039
VITE_ALLOWED_HOSTS=localhost,127.0.0.1

# API Configuration
VITE_API_BASE_URL=http://localhost:3000

# Other environment variables as needed
```
## Running the Application

### Docker Development

1. **Build and run with Docker Compose:**

   ```bash
   docker-compose up --build
   ```

   Or run in detached mode:

   ```bash
   docker-compose up -d --build
   ```

2. **View logs:**

   ```bash
   docker-compose logs -f
   ```

3. **Stop the container:**

   ```bash
   docker-compose down
   ```

4. **Rebuild after changes:**

   ```bash
   docker-compose up --build
   ```

### Docker Production

1. **Build and run production build:**

   ```bash
   docker-compose -f docker-compose.prod.yml up --build
   ```

   Or run in detached mode:

   ```bash
   docker-compose -f docker-compose.prod.yml up -d --build
   ```

2. **Production environment variables:**

   Ensure your `.env` file includes production-specific variables:

   ```env
   NODE_ENV=production
   VITE_PORT=4173
   VITE_API_BASE_URL=https://api.yourdomain.com
   VITE_ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
   ```

3. **Stop production container:**

   ```bash
   docker-compose -f docker-compose.prod.yml down
   ```

## Available Scripts

### Development

- `npm run dev` - Start development server with Vite
- `npm run start` - Start preview server (production build preview)
- `npm run tsc:watch` - Run TypeScript compiler in watch mode
- `npm run tsc:dev` - Run dev server and TypeScript watch concurrently

### Building

- `npm run build` - Build the application for production
- `npm run re:build` - Clean, install, and build
- `npm run re:build-npm` - Clean, install, and build (npm)

### Code Quality

- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors automatically
- `npm run fm:check` - Check code formatting with Prettier
- `npm run fm:fix` - Fix code formatting with Prettier
- `npm run fix:all` - Run both lint and format fixes

### Utilities

- `npm run clean` - Remove build artifacts and node_modules
- `npm run re:dev` - Clean, install, and start dev server

<!-- ## Documentation

Additional documentation is available in the project:

- [Sections Documentation](./src/sections/README.md) - Overview of feature sections
- [Navigation System Guide](./NAVIGATION_SYSTEM_GUIDE.md) - Navigation and routing
- [Permissions Guide](./PERMISSIONS_GUIDE.md) - Permission system documentation
- [Scaffolding README](./scaffolding/README.md) - Scaffolding components documentation -->

## Troubleshooting

### Common Issues

1. **Port already in use:**
   - Change `VITE_PORT` in your `.env` file
   - Or stop the process using the port

2. **Submodule not initialized:**
   ```bash
   git submodule update --init --recursive
   ```

3. **Docker build fails:**
   - Ensure Docker is running
   - Check Docker daemon status
   - Try rebuilding: `docker-compose build --no-cache`

4. **Dependencies issues:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

5. **TypeScript errors:**
   - Run `npm run tsc:watch` to see real-time TypeScript errors
   - Ensure all dependencies are installed

## Support

For issues, questions, or contributions, please refer to the project's issue tracker or contact the development team.

## License

See [LICENSE.md](./LICENSE.md) for license information.
