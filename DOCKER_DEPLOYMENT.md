# TRINETRA Docker Deployment Guide

## Overview

This guide explains how to deploy TRINETRA using Docker and Docker Compose for enterprise-level containerization. The setup includes:

- **Backend**: FastAPI application with Redis integration
- **Frontend**: React (Vite) application served by Nginx
- **Redis**: Caching and session storage
- **Networking**: Docker Compose bridged network for service communication
- **Data Persistence**: Named volumes for Redis data

## Prerequisites

- **Docker**: v20.10+ ([Install Docker](https://docs.docker.com/get-docker/))
- **Docker Compose**: v1.29+ ([Install Docker Compose](https://docs.docker.com/compose/install/))
- **Git**: For cloning the repository

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Sentinel-Cyber_Defence
```

### 2. Prepare Environment Variables

```bash
# Copy the example env file (already comes with .env file)
# Or customize for your environment:
cp .env.example .env.prod
```

### 3. Start All Services

```bash
# Start services in the foreground (see logs in real-time)
docker-compose up

# OR start in the background (daemon mode)
docker-compose up -d
```

### 4. Access the Application

Once services are running:

- **Frontend**: http://localhost:80
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs (Swagger UI)
- **API ReDoc**: http://localhost:8000/redoc

### 5. Stop Services

```bash
# Stop services (containers persist)
docker-compose stop

# Stop and remove containers
docker-compose down

# Stop, remove containers, and delete volumes (clean slate)
docker-compose down -v
```

## Configuration

### Environment Variables

All configuration is managed through environment variables in the `.env` file. Key variables:

#### API Configuration
```env
TRINETRA_API_KEY=TRINETRA-demo-key       # API key for authentication
ALLOWED_ORIGINS=*                        # CORS allowed origins
```

#### Redis Configuration
```env
REDIS_HOST=redis                         # Redis hostname
REDIS_PORT=6379                          # Redis port
REDIS_PASSWORD=redis-password            # Redis password
REDIS_DB=0                               # Redis database number
```

#### Backend Configuration
```env
BACKEND_HOST=backend                     # Backend service name
BACKEND_PORT=8000                        # Backend service port
ENVIRONMENT=development                  # development/production
DEBUG=true                               # Debug mode
LOG_LEVEL=INFO                           # Logging level
```

#### Frontend Configuration
```env
FRONTEND_PORT=80                         # Frontend port
VITE_API_BASE_URL=http://localhost:8000 # Backend API URL
VITE_API_TIMEOUT=30000                   # API timeout in ms
```

#### Model Thresholds
All ML model thresholds are configurable:
```env
LEVENSHTEIN_THRESHOLD=65                 # Drishti similarity threshold
COMPOSITE_CONFIRMED=75                   # Kavach confirmation threshold
ZSCORE_RED=3.0                           # Kavach red alert threshold
# ... more thresholds
```

### Using Custom Environment Files

For different environments, create separate env files:

```bash
# Development
docker-compose --env-file .env.dev up

# Production
docker-compose --env-file .env.prod -f docker-compose.prod.yml up -d

# Staging
docker-compose --env-file .env.staging up
```

## Building Images

### Rebuild All Images

```bash
docker-compose build
```

### Rebuild Specific Service

```bash
# Rebuild backend only
docker-compose build backend

# Rebuild frontend only
docker-compose build frontend
```

### Build for Production (Optimized)

```bash
# Build without cache for production
docker-compose build --no-cache

# Build with specific architecture
docker-compose build --build-arg PYTHON_VERSION=3.13
```

## Networking

Services communicate via Docker's internal network `trinetra-network`:

```
Frontend (Nginx) → Backend (FastAPI) → Redis
   :80                   :8000           :6379
```

### Network Details
- **Network Name**: `trinetra-network`
- **Type**: Bridge network
- **Service DNS**: Services communicate using service names (e.g., `redis:6379`)

### External Access
- Frontend is accessible on port 80 (host machine)
- Backend is accessible on port 8000 (host machine)
- Redis is accessible on port 6379 (host machine, for debugging only)

## Data Persistence

### Volumes

```yaml
redis-data:  # Named volume for Redis persistence
```

### Directory Mounts

```yaml
volumes:
  - ./backend/data:/app/data                          # Data files
  - ./backend/reference_screenshots:/app/reference_screenshots
  - ./backend/screenshots:/app/screenshots
  - ./backend/logs:/app/logs                          # Application logs
```

### Backup Data

```bash
# Backup Redis data
docker-compose exec redis redis-cli --rdb /data/dump.rdb

# Backup application logs
cp -r ./backend/logs ./backups/logs-$(date +%Y%m%d)
```

## Monitoring & Logging

### View Logs

```bash
# View all service logs
docker-compose logs

# View specific service logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs redis

# Follow logs in real-time
docker-compose logs -f

# View last 100 lines of backend logs
docker-compose logs --tail=100 backend
```

### Health Checks

```bash
# Check service health
docker-compose ps

# Manual health check
curl http://localhost:8000/health
curl http://localhost/health

# Check Redis health
docker-compose exec redis redis-cli ping
```

### Performance Monitoring

```bash
# View container resource usage
docker stats

# View specific container
docker stats trinetra-backend
```

## Production Deployment

### Security Considerations

1. **Change default secrets**:
```bash
# Generate strong API key
openssl rand -hex 32

# Generate strong Redis password
openssl rand -base64 32

# Update .env.prod with these values
```

2. **Update CORS settings**:
```env
# Production - only allow specific origins
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

3. **Enable production mode**:
```env
ENVIRONMENT=production
DEBUG=false
LOG_LEVEL=WARNING
```

### Deploy with Docker Compose

Create `docker-compose.prod.yml`:

```yaml
version: '3.9'

services:
  redis:
    restart: always
    # ... other config
  
  backend:
    restart: always
    # ... other config
  
  frontend:
    restart: always
    # ... other config
```

Start production deployment:

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml \
  --env-file .env.prod up -d
```

### Reverse Proxy Setup (Nginx)

For production, place Nginx reverse proxy in front:

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    location / {
        proxy_pass http://trinetra-frontend:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /api/ {
        proxy_pass http://trinetra-backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Troubleshooting

### Container Won't Start

```bash
# Check container logs
docker-compose logs backend

# Inspect container
docker inspect trinetra-backend

# Restart container with verbose output
docker-compose up backend
```

### Redis Connection Issues

```bash
# Test Redis connection from backend container
docker-compose exec backend redis-cli -h redis -p 6379 ping

# If using password
docker-compose exec backend redis-cli -h redis -p 6379 -a <password> ping
```

### Port Already in Use

```bash
# Check what's using the port (e.g., 8000)
sudo lsof -i :8000

# Change port in .env
BACKEND_PORT=8001  # or any available port

# Or kill the process
sudo kill -9 <PID>
```

### Frontend Not Connecting to Backend

```bash
# Check VITE_API_BASE_URL in .env
VITE_API_BASE_URL=http://localhost:8000

# For production, update to your domain
VITE_API_BASE_URL=https://yourdomain.com/api
```

### Memory Issues

```bash
# Limit container memory in docker-compose.yml
backend:
  deploy:
    resources:
      limits:
        memory: 2G
      reservations:
        memory: 1G
```

## Advanced Topics

### Multi-Stage Builds

Both Dockerfiles use multi-stage builds to minimize image size:

- **Backend**: Uses Python slim base, copies only necessary packages
- **Frontend**: Uses Node.js for build, serves from lightweight Nginx

### Custom Models

To add custom models or ML components:

1. Update requirements.txt with new dependencies
2. Rebuild the backend image: `docker-compose build backend`
3. Restart services: `docker-compose up -d`

### Database Integration

To add a PostgreSQL database:

```yaml
# Add to docker-compose.yml
db:
  image: postgres:15-alpine
  environment:
    POSTGRES_DB: trinetra
    POSTGRES_PASSWORD: ${DB_PASSWORD}
  volumes:
    - db-data:/var/lib/postgresql/data

# Update DATABASE_URL environment variable
DATABASE_URL=postgresql://user:password@db:5432/trinetra
```

## Kubernetes Deployment

For Kubernetes, convert docker-compose to Helm charts or use Kompose:

```bash
# Install Kompose
curl -L https://github.com/kubernetes/kompose/releases/download/v1.28.0/kompose-linux-amd64 -o kompose
chmod +x kompose

# Convert to Kubernetes manifests
./kompose convert -o k8s-manifests/
```

## Support & Documentation

- **API Documentation**: http://localhost:8000/docs
- **Project README**: See README.md in repository root
- **Configuration Details**: See config.py
- **Docker Documentation**: https://docs.docker.com/

## Clean Up

```bash
# Remove all containers and volumes
docker-compose down -v

# Remove all unused images
docker image prune

# Remove all unused networks
docker network prune

# Full cleanup (warning: removes all Docker data)
docker system prune -a --volumes
```

---

**Last Updated**: March 2026  
**Version**: 1.0.0 (Docker-ready)
