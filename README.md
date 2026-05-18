# CIA Project

A full-stack web application with React frontend and Node.js/Express backend.

## Project Structure

```
cia-project/
├── front_student/           React frontend (TypeScript)
├── back_student/            Express backend (TypeORM)
├── deploy/                  Production deployment configs
│   ├── vm1-web/            Nginx frontend server
│   ├── vm2-api/            Node.js API server
│   ├── vm3-db/             MySQL database server
│   └── vm4-ops/            Monitoring & operations
├── scripts/                 Build and deployment scripts
├── docs/                    Documentation
│   ├── deployment.md       Deployment guide
│   ├── development.md      Development guide
│   └── api.md              API documentation
├── .gitlab-ci.yml          CI/CD pipeline
├── .gitignore              Git ignore rules
└── README.md               This file
```

## Quick Start

### Prerequisites
- Node.js 16+
- Docker & Docker Compose
- Git

### Local Development

1. **Setup**
   ```bash
   chmod +x scripts/setup.sh
   ./scripts/setup.sh
   ```

2. **Start Development**
   ```bash
   chmod +x scripts/dev.sh
   ./scripts/dev.sh
   ```

3. **Access the Application**
   - Frontend: http://localhost:3001
   - Backend API: http://localhost:3000
   - Login: admin / admin

## Features

- **Frontend**: React 16 with Redux state management
- **Backend**: Express.js with TypeORM
- **Database**: MySQL with auto-migrations
- **API**: RESTful API with JWT authentication
- **Monitoring**: Prometheus & ELK stack ready
- **CI/CD**: GitLab CI pipeline configured

## Development

### Frontend (React)
```bash
cd front_student
npm install
npm start      # Development server at :3001
npm test       # Run tests
npm build      # Production build
```

### Backend (Node.js)
```bash
cd back_student
npm install
npm run dev    # Development with hot reload
npm test       # Run tests
npm run build  # TypeScript compilation
```

### Architecture
- **VM1**: Frontend (Nginx)
- **VM2**: API (Node.js + PM2)
- **VM3**: Database (MySQL)
- **VM4**: Operations (Monitoring, Logs)

## Contributing

1. Create a new branch for your feature
2. Commit using Conventional Commits format
3. Submit a merge request

## CI/CD Pipeline

The project uses GitLab CI with automated:
- Code testing
- Build verification
- Deployment to staging/production
