# Database Setup Guide

## Environment Variables

Create a `.env` file in the server root directory with the following variables:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_NAME=cxhpulse

# Application Configuration
NODE_ENV=development
PORT=3000
```

## Installation

Install the required dependencies:

```bash
npm install
```

## Database Setup

1. **PostgreSQL** (recommended):
   ```bash
   # Install PostgreSQL locally or use Docker
   docker run --name cxhpulse-db -e POSTGRES_PASSWORD=password -e POSTGRES_DB=cxhpulse -p 5432:5432 -d postgres:15
   ```

2. **Alternative databases**:
   - Change the `type` in `database.module.ts` to: `mysql`, `sqlite`, `mongodb`, etc.
   - Update the corresponding driver in `package.json`

## Features

- ✅ TypeORM integration
- ✅ Environment-based configuration
- ✅ Connection health checks
- ✅ Automatic connection management
- ✅ Development/Production environment handling
- ✅ Global module (available throughout the app)

## Usage

The database connection is automatically available in any service by injecting `DatabaseService`:

```typescript
import { DatabaseService } from './database/database.service';

@Injectable()
export class YourService {
  constructor(private readonly databaseService: DatabaseService) {}
  
  async someMethod() {
    const connection = this.databaseService.getConnection();
    // Use connection for queries
  }
}
```
