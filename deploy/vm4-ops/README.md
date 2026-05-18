# VM4 - Operations & Monitoring Infrastructure

Centralized operations, monitoring, logging, and CI/CD infrastructure for the CIA Project.

## Components

### GitLab CE
- **Port**: 80, 443, 22
- **Purpose**: Repository management and source control
- **URL**: http://gitlab.example.com
- **Default Credentials**: root (set on first login)

### GitLab Runner
- **Purpose**: CI/CD pipeline executor
- **Configuration**: `/etc/gitlab-runner/config.toml`
- **Executor**: Docker

### Portainer
- **Port**: 8000 (agent), 9000 (web UI)
- **Purpose**: Docker container and image management
- **URL**: http://localhost:9000
- **Default Credentials**: admin / admin

### Docker Registry
- **Port**: 5000
- **Purpose**: Private Docker image registry
- **URL**: localhost:5000
- **Configuration**: Self-hosted, no authentication by default

## Quick Start

```bash
# Start all services
docker-compose up -d

# View service status
docker-compose ps

# Check logs
docker-compose logs -f [service-name]

# Stop all services
docker-compose down
```

## Configuration

### GitLab Runner Setup

1. Get the runner registration token from GitLab
2. Register runner:
   ```bash
   docker exec cia_runner gitlab-runner register \
     --url http://gitlab.example.com/ \
     --registration-token [TOKEN] \
     --executor docker \
     --docker-image alpine:latest
   ```

### Docker Registry

Push images to registry:
```bash
docker tag myimage:latest localhost:5000/myimage:latest
docker push localhost:5000/myimage:latest
```

## Backup & Recovery

### GitLab Backup
```bash
docker exec cia_gitlab gitlab-rake gitlab:backup:create
```

### Registry Cleanup
```bash
docker exec cia_registry registry garbage-collect /etc/docker/registry/config.yml
```

## Troubleshooting

### Services won't start
```bash
# Check Docker daemon
docker ps

# View detailed logs
docker-compose logs [service-name]

# Rebuild images
docker-compose build --no-cache
```

### Registry connection issues
```bash
# Test registry connectivity
curl http://localhost:5000/v2/
```

## References

- [GitLab Documentation](https://docs.gitlab.com)
- [Portainer Documentation](https://docs.portainer.io)
- [Prometheus Documentation](https://prometheus.io/docs)
- [Grafana Documentation](https://grafana.com/docs)
