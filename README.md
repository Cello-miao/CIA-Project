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
- **GitHub Actions CI/CD**: Automated repository mirroring to organization repositories

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
│   ├── docker-compose.yml  # Container orchestration
│   ├── ormconfig.js        # TypeORM database config
│   └── package.json        # Node.js dependencies
│
├── front_student/          # React TypeScript frontend
│   ├── src/
│   │   ├── App.tsx         # Main app component
│   │   ├── index.tsx       # React entry point
│   │   ├── common/         # Reusable components
│   │   ├── components/     # Feature components
│   │   ├── store/          # Redux store configuration
│   │   │   ├── actions/    # Redux actions
│   │   │   ├── reducers/   # Redux reducers
│   │   │   └── models/     # TypeScript interfaces
│   │   └── styles/         # Global stylesheets
│   ├── Dockerfile          # Production Docker image
│   ├── docker-compose.yml  # Frontend service config
│   └── package.json        # Node.js dependencies
│
├── docs/                   # Documentation
├── .github/workflows/      # GitHub Actions workflows
│   └── mirror.yml          # Repository synchronization
├── ARCHITECTURE.md         # System architecture & design
├── API_LOGGING.md          # Logging & monitoring guide
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

2. **Start all services with Docker Compose:**
   ```bash
   cd back_student
   docker-compose up -d
   ```

   This will start three containers:
   - **Frontend**: Nginx serving React app on `http://localhost:8080`
   - **Backend**: Express API on `http://localhost:3001`
   - **Database**: MySQL on `localhost:3306`

3. **Verify services are running:**
   ```bash
   docker ps
   ```

4. **Access the application:**
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
DB_USER=root                  # Database username
DB_PASSWORD=root              # Database password
DB_NAME=dev_db                # Database name
DB_PORT=3306                  # Database port
JWT_SECRET=your-secret-key    # JWT signing secret
BCRYPT_SALT_ROUNDS=12         # Password hash salt rounds
API_INTERNAL_PORT=3001        # Express server port
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

### GitHub Actions Workflow

The project includes automated GitHub Actions workflows for:

1. **Repository Mirroring** (`.github/workflows/mirror.yml`)
   - Trigger: Every push to any branch/tag
   - Action: Sync to organization repository
   - Target: `EpitechMscInternationalPromo2027/I-NSA-801-INT-8-1-cia-2`

### Future CI/CD Enhancements
- [ ] Unit test execution on PR
- [ ] Docker image building and pushing
- [ ] Automated deployment to staging
- [ ] Security scanning (SAST/DAST)
- [ ] Performance benchmarking
- [ ] Artifact management system

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

### Port Already in Use
```bash
# Change port mapping in docker-compose.yml
ports:
  - "8081:8080"  # Frontend
  - "3002:3001"  # Backend
```

### CORS Issues
Check frontend API URL configuration in `docker-compose.yml`:
```yaml
environment:
  REACT_APP_API_URL: http://localhost:3001
```

---

## File Descriptions

### [ARCHITECTURE.md](ARCHITECTURE.md)
Comprehensive system design documentation including:
- System architecture diagram (Mermaid)
- Technology stack table
- Authentication flow sequence diagram
- API endpoints reference
- Docker build pipelines
- Network configuration
- Security implementation details
- Environment variables
- Future enhancements

### [API_LOGGING.md](API_LOGGING.md)
Logging and monitoring system guide covering:
- Morgan HTTP logging setup
- Swagger Stats metrics dashboard
- NewRelic APM integration
- Log viewing commands
- Security considerations
- Monitoring best practices

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

### Not Yet Implemented
- ❌ SSL/TLS encryption
- ❌ Rate limiting
- ❌ Request signing
- ❌ Audit logging
- ❌ API versioning

---

## License

This project is part of EPITECH's MSc International Program.

---

## Support & Contact

For issues, questions, or contributions, please:
1. Check [ARCHITECTURE.md](ARCHITECTURE.md) for system design details
2. Review [API_LOGGING.md](API_LOGGING.md) for monitoring information
3. Check GitHub Issues for existing solutions
4. Contact the project maintainers

---

## Changelog

### Version 1.0.0 (May 28, 2026)
- Initial project setup with React frontend
- Express API with JWT authentication
- MySQL database integration
- Docker Compose containerization
- GitHub Actions mirror workflow
- Comprehensive documentation
- Security implementation with bcryptjs password hashing