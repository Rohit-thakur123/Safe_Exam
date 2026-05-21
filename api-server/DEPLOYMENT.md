# Deployment Guide

This guide provides instructions for deploying the SEB Configuration API Server to production.

---

## 🚀 Deployment Options

1. **Docker** (Recommended)
2. **Traditional Server** (PM2 or systemd)
3. **Cloud Platforms** (Heroku, AWS, Azure, etc.)

---

## Option 1: Docker Deployment

### Step 1: Create Dockerfile

The project should already have a `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --production

# Copy application files
COPY src ./src

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "src/index.js"]
```

### Step 2: Create .dockerignore

```
node_modules
npm-debug.log
.env
.env.local
.git
.gitignore
README.md
*.md
test-*.html
mock-backend.js
.vscode
```

### Step 3: Build Docker Image

```bash
docker build -t seb-config-api:latest .
```

### Step 4: Run Docker Container

```bash
docker run -d \
  --name seb-config-api \
  -p 4000:4000 \
  -e NODE_ENV=production \
  -e JWT_SECRET=your-production-secret \
  -e PRIMARY_FRONTEND_URL=https://app.yourexam.com \
  -e SEB_FRONTEND_URL=https://seb.yourexam.com \
  -e BACKEND_API_URL=https://api.yourexam.com \
  --restart unless-stopped \
  seb-config-api:latest
```

### Step 5: Verify Deployment

```bash
# Check container status
docker ps

# Check logs
docker logs seb-config-api

# Test health endpoint
curl http://localhost:4000/health
```

---

## Option 2: Docker Compose

### Step 1: Create docker-compose.yml

```yaml
version: '3.8'

services:
  seb-config-api:
    build: .
    container_name: seb-config-api
    restart: unless-stopped
    ports:
      - "4000:4000"
    environment:
      - NODE_ENV=production
      - PORT=4000
      - JWT_SECRET=${JWT_SECRET}
      - PRIMARY_FRONTEND_URL=${PRIMARY_FRONTEND_URL}
      - SEB_FRONTEND_URL=${SEB_FRONTEND_URL}
      - BACKEND_API_URL=${BACKEND_API_URL}
      - SEB_QUIT_PASSWORD=${SEB_QUIT_PASSWORD}
      - SEB_ALLOW_QUIT=${SEB_ALLOW_QUIT}
    networks:
      - app-network
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:4000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"]
      interval: 30s
      timeout: 3s
      start_period: 5s
      retries: 3

networks:
  app-network:
    driver: bridge
```

### Step 2: Create .env.production

```env
JWT_SECRET=your-production-secret-change-this
PRIMARY_FRONTEND_URL=https://app.yourexam.com
SEB_FRONTEND_URL=https://seb.yourexam.com
BACKEND_API_URL=https://api.yourexam.com
SEB_QUIT_PASSWORD=production-password
SEB_ALLOW_QUIT=false
```

### Step 3: Deploy

```bash
docker-compose --env-file .env.production up -d
```

---

## Option 3: Traditional Server with PM2

### Step 1: Install PM2

```bash
npm install -g pm2
```

### Step 2: Create ecosystem.config.js

```javascript
module.exports = {
  apps: [{
    name: 'seb-config-api',
    script: 'src/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development',
      PORT: 4000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 4000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true
  }]
};
```

### Step 3: Start Application

```bash
# Production mode
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

### Step 4: Manage Application

```bash
# View status
pm2 status

# View logs
pm2 logs seb-config-api

# Restart
pm2 restart seb-config-api

# Stop
pm2 stop seb-config-api

# Monitor
pm2 monit
```

---

## Option 4: systemd Service

### Step 1: Create systemd Service File

Create `/etc/systemd/system/seb-config-api.service`:

```ini
[Unit]
Description=SEB Configuration API Server
Documentation=https://github.com/your-repo/api-server
After=network.target

[Service]
Type=simple
User=nodeuser
WorkingDirectory=/opt/seb-config-api
Environment=NODE_ENV=production
Environment=PORT=4000
EnvironmentFile=/opt/seb-config-api/.env
ExecStart=/usr/bin/node src/index.js
Restart=on-failure
RestartSec=10
KillMode=process
StandardOutput=append:/var/log/seb-config-api/output.log
StandardError=append:/var/log/seb-config-api/error.log

[Install]
WantedBy=multi-user.target
```

### Step 2: Enable and Start Service

```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable service (start on boot)
sudo systemctl enable seb-config-api

# Start service
sudo systemctl start seb-config-api

# Check status
sudo systemctl status seb-config-api

# View logs
sudo journalctl -u seb-config-api -f
```

---

## Cloud Platform Deployments

### Heroku

**Step 1:** Create `Procfile`
```
web: node src/index.js
```

**Step 2:** Deploy
```bash
heroku create seb-config-api
heroku config:set JWT_SECRET=your-secret
heroku config:set PRIMARY_FRONTEND_URL=https://app.yourexam.com
git push heroku main
```

---

### AWS EC2

1. Launch EC2 instance (Ubuntu/Amazon Linux)
2. Install Node.js and npm
3. Clone repository
4. Install dependencies: `npm ci --production`
5. Configure environment variables
6. Use PM2 or systemd (see above)
7. Configure security groups (allow port 4000)
8. Set up Application Load Balancer (optional)
9. Configure SSL/TLS with ACM

---

### Azure App Service

1. Create App Service (Node.js)
2. Configure deployment (GitHub Actions or Azure DevOps)
3. Set environment variables in Configuration
4. Enable Application Insights (optional)
5. Configure custom domain and SSL

---

### Google Cloud Platform (Cloud Run)

**Step 1:** Create `cloudbuild.yaml`
```yaml
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/seb-config-api', '.']
images:
  - 'gcr.io/$PROJECT_ID/seb-config-api'
```

**Step 2:** Deploy
```bash
gcloud builds submit --config cloudbuild.yaml
gcloud run deploy seb-config-api \
  --image gcr.io/$PROJECT_ID/seb-config-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

---

## SSL/TLS Configuration

### Using Nginx as Reverse Proxy

**Step 1:** Install Nginx
```bash
sudo apt update
sudo apt install nginx
```

**Step 2:** Create Nginx Configuration

`/etc/nginx/sites-available/seb-config-api`:

```nginx
server {
    listen 80;
    server_name api-seb.yourexam.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api-seb.yourexam.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/api-seb.yourexam.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api-seb.yourexam.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy Configuration
    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Health check endpoint
    location /health {
        access_log off;
        proxy_pass http://localhost:4000/health;
    }
}
```

**Step 3:** Enable Configuration
```bash
sudo ln -s /etc/nginx/sites-available/seb-config-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

**Step 4:** Install SSL Certificate (Let's Encrypt)
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api-seb.yourexam.com
```

---

## Environment Variables for Production

**Required:**
```env
NODE_ENV=production
PORT=4000
JWT_SECRET=<strong-random-secret-minimum-32-characters>
PRIMARY_FRONTEND_URL=https://app.yourexam.com
SEB_FRONTEND_URL=https://seb.yourexam.com
BACKEND_API_URL=https://api.yourexam.com
```

**Optional:**
```env
SEB_QUIT_PASSWORD=<strong-password>
SEB_ALLOW_QUIT=false
```

**Generate Strong JWT Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## Monitoring and Logging

### Option 1: PM2 Plus (Free Tier Available)

```bash
pm2 link <secret> <public>
```

### Option 2: Custom Logging

Install Winston:
```bash
npm install winston
```

Update logger utility to use Winston with file transports.

### Option 3: Cloud Monitoring

- **AWS:** CloudWatch
- **Azure:** Application Insights
- **GCP:** Cloud Logging
- **Heroku:** Papertrail

---

## Performance Optimization

### 1. Enable Clustering

Use PM2 cluster mode:
```bash
pm2 start ecosystem.config.js --env production
```

### 2. Add Rate Limiting

Install express-rate-limit:
```bash
npm install express-rate-limit
```

Add to `src/index.js`:
```javascript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

### 3. Add Compression

```bash
npm install compression
```

Add to `src/index.js`:
```javascript
import compression from 'compression';
app.use(compression());
```

### 4. Enable HTTP/2

Configure in Nginx or use Node.js http2 module.

---

## Security Checklist

- [ ] Use strong JWT_SECRET (min 32 characters)
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS properly
- [ ] Add rate limiting
- [ ] Use security headers
- [ ] Keep dependencies updated
- [ ] Use non-root user for running app
- [ ] Restrict file permissions
- [ ] Enable firewall
- [ ] Regular security audits
- [ ] Monitor logs for suspicious activity

---

## Backup and Recovery

### Database Backup (if using database)

Set up automated backups for any persistent data.

### Configuration Backup

```bash
# Backup environment variables
cp .env .env.backup

# Backup ecosystem config
cp ecosystem.config.js ecosystem.config.js.backup
```

### Disaster Recovery Plan

1. Document all environment variables
2. Store encrypted backups in secure location
3. Test recovery procedures regularly
4. Have rollback plan ready

---

## Health Checks and Monitoring

### Setup Health Check Endpoint

Already implemented at `/health`

### External Monitoring

Use services like:
- UptimeRobot
- Pingdom
- New Relic
- Datadog

### Alert Configuration

Set up alerts for:
- Server downtime
- High error rates
- Memory/CPU usage
- Slow response times

---

## Scaling

### Horizontal Scaling

1. Use load balancer (Nginx, AWS ELB, etc.)
2. Run multiple instances
3. Use PM2 cluster mode
4. Consider Kubernetes for container orchestration

### Vertical Scaling

Upgrade server resources:
- More CPU cores
- More RAM
- Faster disk I/O

---

## Troubleshooting Production Issues

### Common Issues

**Issue 1: Port already in use**
```bash
# Find process
lsof -ti:4000
# Kill process
kill -9 <PID>
```

**Issue 2: Permission denied**
```bash
# Fix permissions
sudo chown -R nodeuser:nodeuser /opt/seb-config-api
```

**Issue 3: Module not found**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

**Issue 4: Memory leaks**
```bash
# Monitor memory
pm2 monit
# Restart if needed
pm2 restart seb-config-api
```

---

## Rollback Procedure

### Using Git

```bash
# View commit history
git log --oneline

# Rollback to previous version
git checkout <commit-hash>

# Restart application
pm2 restart seb-config-api
```

### Using Docker

```bash
# Pull previous image
docker pull seb-config-api:previous-tag

# Stop current container
docker stop seb-config-api

# Remove current container
docker rm seb-config-api

# Run previous version
docker run -d --name seb-config-api seb-config-api:previous-tag
```

---

## Post-Deployment Checklist

- [ ] Server is running and accessible
- [ ] Health check endpoint returns 200
- [ ] API endpoints respond correctly
- [ ] CORS is configured properly
- [ ] SSL/TLS certificate is valid
- [ ] Environment variables are set
- [ ] Logs are being written
- [ ] Monitoring is active
- [ ] Backups are configured
- [ ] Documentation is updated
- [ ] Team is notified

---

## Maintenance

### Regular Tasks

**Daily:**
- Check logs for errors
- Monitor server resources
- Verify health checks

**Weekly:**
- Review security alerts
- Check dependency updates
- Analyze performance metrics

**Monthly:**
- Update dependencies
- Review and rotate logs
- Test backup restoration
- Security audit

---

## Support and Documentation

- Keep API documentation up to date
- Document any custom configurations
- Maintain runbook for common issues
- Train team on deployment procedures

---

## Useful Commands

```bash
# Check server status
systemctl status seb-config-api

# View logs
journalctl -u seb-config-api -f

# Test API endpoint
curl https://api-seb.yourexam.com/health

# Check SSL certificate
openssl s_client -connect api-seb.yourexam.com:443

# View Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# PM2 commands
pm2 status
pm2 logs
pm2 monit
pm2 restart all
```

---

**Deployment Complete! 🎉**

For additional support, refer to the main README.md or contact the development team.
