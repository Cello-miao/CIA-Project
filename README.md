# CIA Project

A modern full-stack web application with React 18 frontend and Node.js/Express backend, featuring enterprise-grade security and Docker-based deployment.

##  Tech Stack

### Frontend
- **React 18** with TypeScript 5.7
- **Redux Toolkit 2** for state management
- **React Router 6** for routing
- **Bootstrap 5** for UI components
- **Axios 1.7** for HTTP requests

### Backend
- **Node.js 20** (Alpine)
- **Express 4.21** with TypeScript 5.7
- **TypeORM 0.3** for database ORM
- **MySQL 8.0** database
- **JWT 9.0** for authentication
- **bcryptjs** for password hashing (12 rounds)
- **Helmet 8.0** for HTTP security headers

### DevOps
- **Docker & Docker Compose** for containerization
- **Docker Secrets** for secure credential management
- **Health checks** for all services
- **Log rotation** to prevent disk issues

##  Project Structure

```
cia-project/
├── front_student/           # React 18 frontend (TypeScript)
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── store/           # Redux Toolkit store
│   │   └── common/          # Shared utilities
│   ├── Dockerfile
│   └── package.json
├── back_student/            # Express backend (TypeORM)
│   ├── src/
│   │   ├── controller/      # API controllers
│   │   ├── entity/          # Database entities
│   │   ├── middlewares/     # Auth & validation
│   │   ├── routes/          # API routes
│   │   ├── config/          # Configuration
│   │   └── migration/       # Database migrations
│   ├── Dockerfile
│   └── package.json
├── secrets/                 # Docker secrets (not in git)
│   ├── db_root_password.txt
│   ├── db_password.txt
│   └── jwt_secret.txt
├── docker-compose.yml       # Production deployment
├── .env.example             # Environment template
└── README.md                # This file
```

##  Quick Start

### Prerequisites
- **Docker 20+** and **Docker Compose 2+**
- **Git**
- At least **2GB RAM** and **10GB disk space**

### 1. Clone Repository
```bash
git clone <repository-url>
cd CIA-Project
```

### 2. Configure Secrets
Create the `secrets` directory and add your credentials:

```bash
mkdir secrets

# Use strong passwords (16+ characters recommended)
echo "YourSecureRootPassword" > secrets/db_root_password.txt
echo "YourSecureAppPassword" > secrets/db_password.txt
echo "YourSuperSecureJWTSecret" > secrets/jwt_secret.txt

# Set proper permissions (Linux/Mac)
chmod 600 secrets/*.txt
```

** Important:**
- Never commit the `secrets/` directory to version control
- Use strong, unique passwords for production
- Rotate secrets regularly

### 3. Start Services
```bash
docker-compose up --build -d
```

Wait ~30 seconds for all services to initialize.

### 4. Access Application
- **Frontend**: http://localhost
- **Backend API**: http://localhost:3000
- **API Docs**: http://localhost:3000/api-docs
- **Health Check**: http://localhost:3000/health

### 5. Default Credentials
- **Username**: admin
- **Password**: admin

** Change the default admin password immediately after first login!**

### Single EC2 Deployment

The production deployment runs the frontend, API, and MySQL database on one AWS EC2 instance through the root `docker-compose.yml` file. See [docs/deployment.md](docs/deployment.md) for the complete deployment guide and security checklist.

## Features

- **Frontend**: React 16 with Redux state management
- **Backend**: Express.js with TypeORM
- **Database**: MySQL 8.0 with auto-migrations
- **API**: RESTful API with JWT authentication
- **Monitoring**: Health checks and log rotation
- **Deployment**: Single EC2 Docker Compose stack

## Development

### Frontend Development
```bash
cd front_student
yarn install
yarn start          # Development server (hot reload)
yarn test           # Run tests
yarn build          # Production build
```

### Backend Development
```bash
cd back_student
yarn install
yarn start          # Development with hot reload
yarn test           # Run tests
yarn prod           # Production mode
```

### Database Migrations
```bash
cd back_student
yarn migration:run    # Run pending migrations
yarn schema:sync      # Sync schema (dev only)
yarn migration:start  # Full initialization
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api
docker-compose logs -f frontend
docker-compose logs -f db
```

### Stop Services
```bash
docker-compose down

# Remove volumes (deletes database)
docker-compose down -v
```

## Architecture

### Deployment Model
All services run on a single Docker network:

```
┌─────────────┐
│   Nginx     │  Port 80 (Frontend)
│  (React)    │
└──────┬──────┘
       │
┌──────▼──────┐
│   Express   │  Port 3000 (API)
│  (Node.js)  │
└──────┬──────┘
       │
┌──────▼──────┐
│   MySQL     │  Internal only
│  (Database) │
└─────────────┘
```

### Service Details
- **Frontend**: React 18 SPA served by Nginx
- **Backend**: Express API with JWT authentication
- **Database**: MySQL 8.0 with persistent volume
- **Network**: Isolated Docker bridge network
- **Security**: No external database access

## Security Features

### Credential Management
- Docker Secrets for sensitive data (passwords, JWT keys)
- Support for file-based and environment variable secrets
- Secrets never committed to version control

### Authentication & Authorization
- JWT tokens with 1-hour expiration
- Role-based access control (ADMIN/NORMAL)
- Password hashing with bcrypt (12 rounds)
- Minimum password length: 8 characters
- Passwords excluded from API responses

### Container Security
- no-new-privileges security option enabled
- All Linux capabilities dropped (cap_drop: ALL)
- Read-only filesystem where possible
- Non-root user execution

### Network Security
- Database not exposed to external network
- CORS configured for cross-origin requests
- Helmet middleware for HTTP security headers
- Input validation with class-validator

### Operational Security
- Health checks for all services
- Automatic log rotation (10MB max, 3 files)
- Auto-restart on failure
- Graceful shutdown handling

## Environment Variables

### Backend (.env)
```env
NODE_ENV=production
DB_HOST=db
DB_PORT=3306
DB_NAME=cia_db
DB_USER=cia_app
DB_PASSWORD_FILE=/run/secrets/db_password
JWT_SECRET_FILE=/run/secrets/jwt_secret
LOG_LEVEL=info
```

### Frontend (.env)
```env
REACT_APP_API_URL=localhost:3000
```

## Troubleshooting

### Services won't start
```bash
# Check logs
docker-compose logs

# Rebuild containers
docker-compose down
docker-compose up --build
```

### Database connection errors
```bash
# Wait for MySQL to be ready (can take 30-60s)
docker-compose logs db

# Restart API service
docker-compose restart api
```

### Permission denied on secrets
```bash
# Fix permissions (Linux/Mac)
chmod 600 secrets/*.txt
```

### Reset everything
```bash
# WARNING: This deletes all data!
docker-compose down -v
rm -rf secrets/
mkdir secrets
# Recreate secrets and restart
```

## Recent Updates (May 2026)

### Major Upgrades
- **Node.js**: 11 → 20 (LTS)
- **React**: 16 → 18 (Concurrent features)
- **TypeScript**: 3.x → 5.7 (Enhanced type safety)
- **TypeORM**: 0.2 → 0.3 (Modern DataSource API)
- **React Router**: 5 → 6 (New routing syntax)
- **Redux**: Classic → Toolkit v2 (Simplified state management)
- **Bootstrap**: 4 → 5 (Modern UI components)

### Security Enhancements
- Docker Secrets integration for credential management
- Increased bcrypt rounds from 8 to 12
- Minimum password length increased from 4 to 8
- Enhanced error messages (no sensitive data leakage)
- Improved TypeScript strict mode

### Code Modernization
- Migrated to TypeORM DataSource API
- Updated to React 18 createRoot API
- Implemented Redux Toolkit for state management
- Modernized all dependencies to latest stable versions

## License

This project is for educational purposes.

---

Last Updated: May 25, 2026
