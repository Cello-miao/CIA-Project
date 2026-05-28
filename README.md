# CIA Project - Consolidate, Investigate & Administrate

**Version:** 1.0.0  
**Status:** Development  
**Last Updated:** May 28, 2026

---

## Overview

CIA is a full-stack web application designed for inventory and user management. It combines a React TypeScript frontend with an Express API backend and MySQL database, all containerized using Docker Compose. The project implements enterprise-grade security with JWT authentication, role-based access control (RBAC), and secure password hashing.

## Key Features

- **User Management**: Comprehensive user registration, authentication, and role-based authorization
- **JWT Authentication**: Secure token-based authentication with configurable expiry
- **Role-Based Access Control**: Support for ADMIN and NORMAL user roles with middleware-enforced permissions
- **Secure Password Hashing**: bcryptjs with 12 salt rounds for strong password security
- **Docker Containerization**: Multi-stage builds for optimized production images
- **API Documentation**: Swagger UI integration for interactive API exploration
- **Performance Monitoring**: Morgan HTTP logging and Swagger Stats metrics dashboard

---

## Project Structure

```
CIA-Project/
├── back_student/           # Express API backend
│   ├── src/
│   │   ├── index.ts        # Application entry point
│   │   ├── config/         # Configuration management
│   │   ├── controller/     # Route controllers
│   │   ├── entity/         # TypeORM entities
│   │   ├── middlewares/    # Custom middleware
│   │   ├── migration/      # Database migrations
│   │   └── routes/         # API route definitions
│   ├── Dockerfile          # Production Docker image
│   ├── docker-compose.yml  # Backend container orchestration
│   ├── ormconfig.js        # TypeORM database config
│   ├── package.json        # Node.js dependencies
│   ├── tsconfig.json       # TypeScript configuration
│   └── jest.config.js      # Jest test configuration
│
├── front_student/          # React TypeScript frontend
│   ├── src/
│   │   ├── App.tsx         # Main app component
│   │   ├── index.tsx       # React entry point
│   │   ├── common/         # Reusable components & types
│   │   │   ├── components/ # UI components
│   │   │   └── types/      # TypeScript interfaces
│   │   ├── components/     # Feature components
│   │   │   ├── Account/    # Login/Register
│   │   │   ├── Admin/      # Admin dashboard
│   │   │   ├── Home/       # Home page
│   │   │   ├── Orders/     # Orders management
│   │   │   ├── Products/   # Products management
│   │   │   ├── Users/      # Users management
│   │   │   └── Menu/       # Navigation menus
│   │   ├── store/          # Redux store
│   │   │   ├── actions/    # Redux actions
│   │   │   ├── reducers/   # Redux reducers
│   │   │   └── models/     # TypeScript interfaces
│   │   ├── assets/         # Static assets
│   │   └── styles/         # Global stylesheets
│   ├── public/             # Public assets
│   │   ├── index.html      # HTML template
│   │   └── manifest.json   # PWA manifest
│   ├── Dockerfile          # Production Docker image
│   ├── package.json        # Node.js dependencies
│   ├── tsconfig.json       # TypeScript configuration
│   └── _config.yml         # Jekyll config
│
├── docs/                   # Documentation & resources
│   ├── CIA_Technical_Documentation.pdf
│   └── DEPLOY.md           # Deployment guide
│
├── .gitignore              # Git ignore rules
├── .env.example            # Environment variables template
├── docker-compose.yml      # Root docker-compose orchestration
├── render.yaml             # Render deployment config
├── run_smoke_tests.sh      # Smoke tests script
├── password.txt            # (Sensitive - see .gitignore)
└── README.md               # This file
```

---

## Technology Stack

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Frontend Framework** | React + TypeScript | 16.10.2 | UI development |
| **State Management** | Redux + Redux Thunk | - | Application state |
| **Frontend Server** | Nginx | 1.27-alpine | Static asset serving |
| **Backend Framework** | Express + TypeScript | 4.15.4 | REST API |
| **ORM** | TypeORM | - | Database abstraction |
| **Database** | MySQL | 5.7 | Data persistence |
| **Authentication** | JWT + bcryptjs | - | Security |
| **Validation** | class-validator | - | Input validation |
| **Security** | Helmet | - | HTTP headers |
| **Logging** | Morgan | combined | HTTP logging |
| **Metrics** | Swagger Stats | - | API monitoring |
| **Containerization** | Docker | Latest | Container runtime |
| **Orchestration** | Docker Compose | - | Service orchestration |
| **CI/CD** | GitHub Actions | - | Automation |

---

## Getting Started

### Prerequisites

- Docker & Docker Compose
- Node.js 18+ (for local development)
- Git

### Installation & Running

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Cello-miao/CIA-Project.git
   cd CIA-Project
   ```

2. **Configure environment variables (optional):**
   ```bash
   cp .env.example .env
   # Edit .env with your settings (backend uses docker-compose for config)
   ```

3. **Start all services with Docker Compose:**
   ```bash
   docker-compose up -d
   ```

   This will start three containers:
   - **Frontend**: Nginx serving React app on `http://localhost:8080`
   - **Backend**: Express API on `http://localhost:3001`
   - **Database**: MySQL on `localhost:3306`

4. **Verify services are running:**
   ```bash
   docker ps
   ```

5. **Access the application:**
   - Frontend: `http://localhost:8080`
   - API Health: `http://localhost:3001/api/health`
   - Swagger Stats: `http://localhost:3001/swagger-stats/ui`

### Default Credentials

```
Username: admin
Password: admin
Role: ADMIN
```

⚠️ **Change default credentials in production!**

---

## API Endpoints

### Authentication (`/auth`)
- `POST /login` - Authenticate user
- `POST /register` - Create new user account
- `GET /me` - Get current user profile (requires JWT)

### User Management (`/user`)
- `GET /user` - List all users (admin only)
- `POST /user` - Create user (admin only)
- `PUT /user/:id` - Update user profile
- `DELETE /user/:id` - Delete user (admin only)

### Health Checks
- `GET /health` - API health status
- `GET /api/health` - Application health status

### Monitoring
- `GET /swagger-stats/ui` - API metrics dashboard

### API Documentation
- Swagger/OpenAPI documentation available at API endpoints

---

## Authentication & Authorization

### JWT Flow
1. User submits credentials to `POST /login`
2. API validates password using bcryptjs
3. If valid, JWT token generated with 1-hour expiry
4. Client stores token in localStorage
5. Subsequent requests include token in `Authorization: Bearer <token>` header
6. API validates token with `checkJwt` middleware
7. User role checked with `checkRole` middleware

### Role-Based Access Control
- **ADMIN**: Full system access, user management
- **NORMAL**: Limited access, self-profile management only

---

## Security Features

### Password Security
- **Algorithm**: bcryptjs with PBKDF2-equivalent strength
- **Salt Rounds**: 12 (configurable via BCRYPT_SALT_ROUNDS)
- **Per-User Salt**: Unique salt generated for each user
- **High Iteration Count**: Resistant to brute-force attacks

### Secret Management
- Database credentials: Environment variable injection
- JWT secret: Runtime-injected via `JWT_SECRET` env var
- **No credentials committed** to version control
- `.gitignore` excludes `password.txt` and sensitive files

### Database Security
- **Isolation**: MySQL restricted to internal Docker network
- **Access Control**: Only API service can connect
- **Network**: Internal bridge network (`backend`) for inter-service communication
- **Credentials**: Service-specific credentials injected at deployment

### API Security
- Helmet middleware for HTTP security headers
- CORS configuration with whitelisted origins
- Input validation via `checkBody` middleware
- Request body validation with class-validator
- TypeScript type safety

---

## Environment Variables

### Backend (.env or docker-compose.yml)
```env
DB_HOST=db                    # Database hostname
DB_USER=                      # Database username
DB_PASSWORD=                  # Database password
DB_NAME=                      # Database name
DB_PORT=                      # Database port
JWT_SECRET=                   # JWT signing secret
BCRYPT_SALT_ROUNDS=           # Password hash salt rounds
API_INTERNAL_PORT=            # Express server port
NODE_ENV=production           # Node.js environment
```

### Frontend
```env
REACT_APP_API_URL=http://localhost:3001  # Backend API URL
```

---

## Development

### Local Development Setup

**Backend:**
```bash
cd back_student
npm install
npm run dev           # Start with ts-node-dev
npm run build         # Compile TypeScript
npm test              # Run tests with Jest
```

**Frontend:**
```bash
cd front_student
npm install
npm start             # Start React dev server
npm run build         # Build for production
npm test              # Run tests
```

### Database Migrations

```bash
cd back_student
npm run migration:generate -- -n MigrationName
npm run migration:run
```

### Docker Development

**Rebuild images:**
```bash
docker-compose up -d --build
```

**View logs:**
```bash
docker logs -f dev_api     # Backend
docker logs -f dev_db      # Database
docker logs -f dev_front   # Frontend
```

**Access container shell:**
```bash
docker exec -it dev_api sh
docker exec -it dev_db bash
```

---

## Monitoring & Logging

### HTTP Logging
- **Middleware**: Morgan in `combined` format
- **Location**: Docker container logs
- **View**: `docker logs dev_api | grep "POST\|GET"`

### API Metrics Dashboard
- **URL**: `http://localhost:3001/swagger-stats/ui`
- **Metrics**: Request count, response times, status codes
- **Real-time**: Live metrics updates

### Application Performance Monitoring
- **Tool**: NewRelic integration available
- **Features**: Error tracking, performance analysis, distributed tracing

---

## Deployment

### Production Checklist

- [ ] Change default admin credentials
- [ ] Update `JWT_SECRET` to secure random value
- [ ] Configure CORS for production origin
- [ ] Enable HTTPS/TLS
- [ ] Set `NODE_ENV=production`
- [ ] Use strong database passwords
- [ ] Configure secrets via secrets management (K8s, AWS Secrets Manager, etc.)
- [ ] Set up database backups
- [ ] Enable rate limiting
- [ ] Configure health check endpoints

### Docker Deployment

1. **Build production images:**
   ```bash
   docker build -t cia-api:1.0.0 ./back_student
   docker build -t cia-frontend:1.0.0 ./front_student
   ```

2. **Push to registry:**
   ```bash
   docker tag cia-api:1.0.0 your-registry/cia-api:1.0.0
   docker push your-registry/cia-api:1.0.0
   ```

3. **Deploy with docker-compose:**
   ```bash
   docker-compose -f docker-compose.yml up -d
   ```

### Kubernetes Deployment

Use provided Helm charts or kubectl manifests (to be added):
```bash
kubectl apply -f k8s/
```

---

## CI/CD Pipeline

### Future CI/CD Implementation

The project is prepared for GitHub Actions CI/CD workflows. Planned implementations include:

---

## Troubleshooting

### API Connection Error
```
Network Error during login
```
**Solution**: Verify backend is running: `docker ps` and check logs: `docker logs dev_api`

### Database Connection Failed
```
ormconfig.js: readRequiredEnv() error
```
**Solution**: Ensure environment variables are set in `docker-compose.yml`:
```yaml
environment:
  DB_HOST: db
  DB_USER: root
  DB_PASSWORD: root
  DB_NAME: dev_db
  JWT_SECRET: test-secret-key
```

## File Descriptions

### Key Project Files

- **docker-compose.yml** - Root orchestration file for all services (frontend, backend, database)
- **.env.example** - Template for environment variables configuration
- **render.yaml** - Deployment configuration for Render platform
- **run_smoke_tests.sh** - Basic health check script for deployed services
- **docs/** - Documentation and technical resources:
  - `CIA_Technical_Documentation.pdf` - Official project specifications
  - `DEPLOY.md` - Deployment and infrastructure guide

### Configuration Files (per service)

**Backend (back_student/):**
- `Dockerfile` - Multi-stage Express API production image
- `docker-compose.yml` - Backend service-specific orchestration
- `ormconfig.js` - TypeORM database connection configuration
- `tsconfig.json` - TypeScript compiler options
- `jest.config.js` - Jest testing framework configuration
- `package.json` - Dependencies and npm scripts

**Frontend (front_student/):**
- `Dockerfile` - Multi-stage React Nginx production image
- `package.json` - Dependencies and npm scripts
- `tsconfig.json` - TypeScript compiler options
- `_config.yml` - Jekyll/GitHub Pages configuration
- `public/manifest.json` - PWA manifest file

### GitHub Configuration

- `.gitignore` - Version control exclusions (excludes `password.txt` and sensitive data)

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -m "feat: add your feature"`
4. Push to branch: `git push origin feature/your-feature`
5. Open Pull Request

### Commit Convention

Follow Conventional Commits:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `style:` Code style
- `refactor:` Code refactoring
- `test:` Tests
- `chore:` Build/maintenance
- `ci:` CI/CD changes

---

## Security & Compliance

### Security Measures
- ✅ Secure password hashing (bcryptjs)
- ✅ JWT authentication
- ✅ Role-based access control
- ✅ Input validation
- ✅ SQL injection prevention (TypeORM)
- ✅ XSS protection (React)
- ✅ CSRF protection (stateless JWT)
- ✅ Helmet security headers
- ✅ Environment-based secrets
- ✅ Database isolation

---

## License

This project is part of EPITECH's MSc International Program.

---
