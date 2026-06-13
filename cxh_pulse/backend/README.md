# Climate Health Pulse - Backend

A NestJS-based backend application for managing climate-health data, providing RESTful APIs, authentication, authorization, and data visualization services. This application provides comprehensive backend services including user management, role-based access control, and climate-health data processing.

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
<!-- - [Documentation](#documentation) -->
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

### Method 1: Clone without Submodules  (recommended)

```bash
git clone -b BE/prod https://github.com/datakind/climate-health-pulse-project.git

cd climate-health-pulse-project

git submodule update --init --recursive
```
### Method 2: Clone with Submodules

```bash
git clone -b BE/prod --recursive https://github.com/datakind/climate-health-pulse-project.git

cd climate-health-pulse-project
```

## Project Structure

```
climate-health-pulse-project/
├── src/                    # Main source code
│   │                       # Contains modules related to business
│   │                       # logic like visualization, data processing
│   ├── database/          # Database configuration and services
│   ├── visualization/     # Visualization module (legacy)
│   ├── visualizationV1/   # Visualization module v1
│   │   ├── config/        # Configuration management
│   │   ├── data-table/    # Data table endpoints
│   │   ├── dto/           # Data transfer objects
│   │   └── entity/        # Database entities
│   ├── utils/             # Utility functions
│   ├── app.module.ts      # Main application module
│   └── main.ts            # Application entry point
├── scaffolding/           # Scaffolding submodule (shared components)
│   ├── user/              # User management, auth, roles, permissions
│   ├── settings/          # Application settings
│   ├── audit-log/         # Audit logging
│   └── common/            # Common utilities and services
├── docker-compose.db.yml  # Database Docker Compose
├── docker-compose.server.yml # Server Docker Compose
├── Dockerfile.dev         # Development Docker configuration
├── Dockerfile.prod        # Production Docker configuration
├── package.json           # Dependencies and scripts
└── .env                   # Environment variables
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

The Visualization is located in the `src/` directory and contains all the business logic and features specific to this project.

**What Visualization Contains:**

- **Visualization** - Data visualization APIs and services (legacy and v1)
- **Data Tables** - Data table endpoints and services
- **Configuration** - Application configuration management
- **Database** - Database connection and configuration
- **Utilities** - Helper functions and utilities

## Scaffolding

The scaffolding directory contains shared components, modules, and services that can be managed as a Git submodule for better code organization and reusability.

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
    PORT=3000
    NODE_ENV=development

    # Docker Configuration
    DOCKER_FILE=Dockerfile.dev

    # Database Configuration
    DOCKER_DB_HOST=host.docker.internal
    DOCKER_DB_PORT=5432
    DOCKER_DB_USERNAME=postgres
    DOCKER_DB_PASSWORD=<YOUR_SECURE_PASSWORD>
    DOCKER_DB_NAME=<YOUR_DB_NAME>

    # CORS Configuration ( Frontend URL )
    CORS_ORIGIN=http://localhost:3039

    # Encryption Keys
    ENCRYPTION_KEY=<YOUR_SECURE_KEY>
    ENCRYPTION_IV=<YOUR_SECURE_IV>

    # SMTP Configuration ( Optional )
    # Note: Configures SMTP settings for email delivery
   
    SMTP_HOST=<YOUR_SMTP_HOST>
    SMTP_PORT=<YOUR_SMTP_PORT>
    SMTP_USERNAME=<YOUR_SMTP_USERNAME>
    SMTP_PASSWORD=<YOUR_SMTP_PASSWORD>
    SMTP_FROM_EMAIL=<YOUR_SMTP_FROM_EMAIL>

    # Super Admin Configuration ( *Required )
    # Note: Configures the initial super admin account for system access and administration. 
    #Use this account to login.

    SUPER_ADMIN_EMAIL=<YOUR_SUPER_ADMIN_EMAIL>
    SUPER_ADMIN_NAME=<YOUR_SUPER_ADMIN_NAME>
    SUPER_ADMIN_PHONE=<YOUR_SUPER_ADMIN_PHONE>
    SUPER_ADMIN_PASSWORD=<YOUR_SUPER_ADMIN_PASSWORD>

   # Swagger Configuration ( Optional )
   # Note: sets up the Swagger UI for API documentation.
      
    SWAGGER_USERNAME=<YOUR_SWAGGER_USERNAME>
    SWAGGER_PASSWORD=<YOUR_SWAGGER_PASSWORD>
   ```

## Running the Application

### Docker Development

Note: Before running the application, ensure that a custom Docker network is created. This network allows the database and server containers to communicate with each other.

1. **Create Docker Network:**

   ```bash
   # Create a custom Docker network for the application
   docker network create pulse-network
   ```

2. **Configure `.env` for Development:**

   ```env
    # Server Configuration
    PORT=3000
    NODE_ENV=development

    # Docker Configuration
    DOCKER_FILE=Dockerfile.dev
    DOCKER_DB_HOST=host.docker.internal
    DOCKER_DB_PORT=5432
    DOCKER_DB_USERNAME=postgres
    DOCKER_DB_PASSWORD=<YOUR_SECURE_PASSWORD>
    DOCKER_DB_NAME=<YOUR_DB_NAME>

    # CORS Configuration
    CORS_ORIGIN=http://localhost:3039

    # Encryption Keys
    ENCRYPTION_KEY=<YOUR_SECURE_KEY>
    ENCRYPTION_IV=<YOUR_SECURE_IV>

    # SMTP Configuration ( Optional )
    # Note: Configures SMTP settings for email delivery
   
    SMTP_HOST=<YOUR_SMTP_HOST>
    SMTP_PORT=<YOUR_SMTP_PORT>
    SMTP_USERNAME=<YOUR_SMTP_USERNAME>
    SMTP_PASSWORD=<YOUR_SMTP_PASSWORD>
    SMTP_FROM_EMAIL=<YOUR_SMTP_FROM_EMAIL>

    # Super Admin Configuration ( *Required )
    # Note: Configures the initial super admin account for system access and administration. 
    #Use this account to login.

    SUPER_ADMIN_EMAIL=<YOUR_SUPER_ADMIN_EMAIL>
    SUPER_ADMIN_NAME=<YOUR_SUPER_ADMIN_NAME>
    SUPER_ADMIN_PHONE=<YOUR_SUPER_ADMIN_PHONE>
    SUPER_ADMIN_PASSWORD=<YOUR_SUPER_ADMIN_PASSWORD>

   # Swagger Configuration ( Optional )
   # Note: sets up the Swagger UI for API documentation.
      
    SWAGGER_USERNAME=<YOUR_SWAGGER_USERNAME>
    SWAGGER_PASSWORD=<YOUR_SWAGGER_PASSWORD>
   ```
3. **Start the Database:**

   ```bash
   # Start the database container using the specified Docker Compose file
   docker compose -f docker-compose.db.yml up -d
   ```

4. **Start the Server (dev mode):**

   Note: Before running the application, ensure that a custom Docker network is created and the database container is running. This setup allows the server to connect to the database seamlessly.

   ```bash
   # Start the server in development mode using Docker Compose
   docker compose -f docker-compose.server.yml --profile development up
   ```

   Or run in detached mode:

   ```bash
   docker compose -f docker-compose.server.yml --profile development up -d
   ```

5. **View logs:**

   ```bash
   docker compose -f docker-compose.server.yml logs -f
   ```

6. **Stop the container:**

   ```bash
   docker compose -f docker-compose.server.yml down
   ```

7. **Access API:**

   Open your browser or API client and navigate to `http://localhost:3000` (or the port specified in your `.env` file).

### Docker Production

Note: Before running the application, ensure that a custom Docker network is created. This network allows the database and server containers to communicate with each other.

1. **Create Docker Network:**

   ```bash
   # Create a custom Docker network for the application
   docker network create pulse-network
   ```

2. **Configure `.env` for Production:**

   ```env
    # Server Configuration
    PORT=3000
    NODE_ENV=development

    # Docker Configuration
    DOCKER_FILE=Dockerfile.dev
    DOCKER_DB_HOST=host.docker.internal
    DOCKER_DB_PORT=5432
    DOCKER_DB_USERNAME=postgres
    DOCKER_DB_PASSWORD=<YOUR_SECURE_PASSWORD>
    DOCKER_DB_NAME=<YOUR_DB_NAME>

    # CORS Configuration
    CORS_ORIGIN=http://localhost:3039

    # Encryption Keys
    ENCRYPTION_KEY=<YOUR_SECURE_KEY>
    ENCRYPTION_IV=<YOUR_SECURE_IV>

    # SMTP Configuration ( Optional )
    # Note: Configures SMTP settings for email delivery
   
    SMTP_HOST=<YOUR_SMTP_HOST>
    SMTP_PORT=<YOUR_SMTP_PORT>
    SMTP_USERNAME=<YOUR_SMTP_USERNAME>
    SMTP_PASSWORD=<YOUR_SMTP_PASSWORD>
    SMTP_FROM_EMAIL=<YOUR_SMTP_FROM_EMAIL>

    # Super Admin Configuration ( *Required )
    # Note: Configures the initial super admin account for system access and administration. 
    #Use this account to login.

    SUPER_ADMIN_EMAIL=<YOUR_SUPER_ADMIN_EMAIL>
    SUPER_ADMIN_NAME=<YOUR_SUPER_ADMIN_NAME>
    SUPER_ADMIN_PHONE=<YOUR_SUPER_ADMIN_PHONE>
    SUPER_ADMIN_PASSWORD=<YOUR_SUPER_ADMIN_PASSWORD>

   # Swagger Configuration ( Optional )
   # Note: sets up the Swagger UI for API documentation.
      
    SWAGGER_USERNAME=<YOUR_SWAGGER_USERNAME>
    SWAGGER_PASSWORD=<YOUR_SWAGGER_PASSWORD>
   ```
   
3. **Start the Database:**

   ```bash
   # Start the database container in detached mode
   docker compose -f docker-compose.db.yml up -d
   ```

4. **Start the Server:**

   Note: Before running the application, ensure that a custom Docker network is created and the database container is running. This setup allows the server to connect to the database seamlessly.

   ```bash
   # Start the server container in detached mode
   docker compose -f docker-compose.server.yml up -d
   ```

   Or build and run:

   ```bash
   docker compose -f docker-compose.server.yml up -d --build
   ```

5. **Verify Containers:**

   ```bash
   # List all running containers
   docker ps
   ```

6. **View logs:**

   ```bash
   docker compose -f docker-compose.server.yml logs -f
   ```

7. **Stop production container:**

   ```bash
   # Stop and remove the server container
   docker compose -f docker-compose.server.yml down

   # Stop and remove the database container
   docker compose -f docker-compose.db.yml down

   # Stop and remove the database container along with its volumes
   docker compose -f docker-compose.db.yml down -v
   ```

## Available Scripts

### Development

- `npm run start:dev` - Start development server with hot-reloading
- `npm run start:debug` - Start development server in debug mode
- `npm run start:docker` - Start database and server in Docker (development mode)
- `npm run start:docker:background` - Start database and server in Docker (detached mode)

### Building

- `npm run build` - Build the application for production
- `npm run start:prod` - Start the application in production mode

### Code Quality

- `npm run lint` - Run ESLint and fix issues automatically
- `npm run format` - Format code with Prettier

### Testing

- `npm run test` - Run unit tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:cov` - Run tests with coverage
- `npm run test:e2e` - Run end-to-end tests

### Utilities

- `npm run start` - Start the application (production build)

<!--
## Documentation

Additional documentation is available in the project:

- [Database Setup Guide](./DATABASE_SETUP.md) - Database setup and configuration
- [Scaffolding README](./scaffolding/README.md) - Scaffolding components documentation
-->

## Troubleshooting

### Common Issues

1. **Port already in use:**

   - Change `PORT` in your `.env` file to an available port
   - Or stop the process using the port:
     ```bash
     lsof -i :<port-number> # For Linux/Mac
     netstat -ano | findstr :<port-number> # For Windows
     kill -9 <pid> # Replace <pid> with the process ID
     ```

2. **Submodule not initialized:**

   ```bash
   git submodule update --init --recursive
   ```

3. **Docker build fails:**

   - Ensure Docker is running
   - Check Docker daemon status
   - Try rebuilding: `docker compose build --no-cache`

4. **Dependencies issues:**

   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

5. **TypeScript errors:**

   - Run `npm run build` to see TypeScript errors
   - Ensure all dependencies are installed

6. **Database connection issues:**

   - Verify the database container is running:
     ```bash
     docker ps
     ```
   - Check `.env` file for correct database credentials
   - Test connection using `psql`:
     ```bash
     psql -h localhost -U postgres -d <YOUR_DB_NAME>
     ```

7. **CORS errors:**

   - Ensure `CORS_ORIGIN` in `.env` matches the frontend's URL
   - Update CORS settings in the application configuration if necessary

8. **SMTP configuration issues:**

   - Verify SMTP credentials in `.env`
   - Test SMTP connection using a tool like `telnet` or an email client

### Useful Commands

```bash
# View logs for a specific container
docker logs <container-name/id> -f

# Restart a specific container
docker restart <container-name/id>

# Access the shell of a running container
docker exec -it <container-name/id> bash

# Access the PostgreSQL database inside the container
psql -U postgres
```

## Support

For issues, questions, or contributions, please refer to the project's issue tracker or contact the development team.

## License

See [LICENSE.md](./LICENSE.md) for license information.
