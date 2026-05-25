# CIA Project

A full-stack web application with React frontend and Node.js/Express backend, deployed on a single AWS EC2 instance.

## Project Structure

```
cia-project/
├── front_student/           React frontend (TypeScript)
├── back_student/            Express backend (TypeORM)
├── docs/                    Documentation
│   └── deployment.md        Single EC2 deployment guide
├── docker-compose.yml       Single-server deployment stack
├── .env.example             Environment configuration template
├── .gitignore              Git ignore rules
└── README.md               This file
```

## Quick Start

### Prerequisites
- Node.js 16+
- Docker & Docker Compose
- Git

### Local Development

1. **Install Dependencies**
   ```bash
   # Backend
   cd back_student && npm install && cd ..
   
   # Frontend
   cd front_student && npm install && cd ..
   ```

2. **Start with Docker Compose**
   ```bash
   docker-compose up -d
   ```

3. **Access the Application**
   - Frontend: http://localhost:80
   - Backend API: http://localhost:3000
   - Login: admin / admin

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

### Frontend (React)
```bash
cd front_student
npm install
npm start      # Development server
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
- **One EC2 Instance**: Frontend, API, and MySQL in a single Docker network
- **Frontend**: Static React build served by Nginx on port 80
- **API**: Express app compiled and started in production mode on port 3000
- **Database**: MySQL 8.0 with a persistent Docker volume (internal only)

## Security Features

- Containers run with `no-new-privileges` security option
- All Linux capabilities dropped
- Database not exposed to external network
- Environment-based configuration for secrets
- Health checks for all services
- Automatic log rotation
- Auto-restart on failure

## Contributing

1. Create a new branch for your feature
2. Commit using Conventional Commits format
3. Submit a merge request
