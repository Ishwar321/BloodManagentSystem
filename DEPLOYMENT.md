# 🚀 Deployment Guide

## Overview

This guide covers deploying the MERN Blood Bank Management System to various platforms.

## Prerequisites

- Node.js 18+ installed
- MongoDB database (local or cloud)
- Git repository set up
- Environment variables configured

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Required for all deployments
MONGO_URL=your-mongodb-connection-string
JWT_SECRET=your-super-secure-jwt-secret
NODE_ENV=production
CLIENT_URL=your-frontend-domain
```

## Deployment Options

### 1. Heroku Deployment

#### Step 1: Prepare Heroku

```bash
# Install Heroku CLI
npm install -g heroku

# Login to Heroku
heroku login

# Create new app
heroku create your-app-name
```

#### Step 2: Configure Environment Variables

```bash
heroku config:set MONGO_URL="your-mongodb-atlas-url"
heroku config:set JWT_SECRET="your-jwt-secret"
heroku config:set NODE_ENV="production"
heroku config:set CLIENT_URL="https://your-app-name.herokuapp.com"
```

#### Step 3: Deploy

```bash
git add .
git commit -m "Prepare for Heroku deployment"
git push heroku main
```

### 2. Vercel Deployment

#### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

#### Step 2: Deploy

```bash
vercel --prod
```

#### Step 3: Configure Environment Variables

- Go to Vercel Dashboard
- Add environment variables from `.env.example`

### 3. Render Deployment

#### Step 1: Connect GitHub Repository

- Go to Render.com
- Connect your GitHub repository

#### Step 2: Configure Build Settings

- **Build Command**: `npm run build`
- **Start Command**: `npm start`
- **Node Version**: 18

#### Step 3: Environment Variables

Add all variables from `.env.example`

### 4. DigitalOcean App Platform

#### Step 1: Create New App

- Connect GitHub repository
- Configure build settings

#### Step 2: Environment Configuration

```yaml
name: mern-blood-bank
services:
  - name: api
    source_dir: /
    github:
      repo: your-username/your-repo
      branch: main
    run_command: npm start
    environment_slug: node-js
    instance_count: 1
    instance_size_slug: basic-xxs
    envs:
      - key: NODE_ENV
        value: production
      - key: MONGO_URL
        value: your-mongodb-url
      - key: JWT_SECRET
        value: your-jwt-secret
```

### 5. Docker Deployment

#### Local Docker

```bash
# Build and run with Docker Compose
docker-compose up -d

# Or build manually
docker build -t mern-blood-bank .
docker run -p 8080:8080 -e MONGO_URL="your-mongo-url" mern-blood-bank
```

#### Docker Hub

```bash
# Build and push to Docker Hub
docker build -t your-username/mern-blood-bank .
docker push your-username/mern-blood-bank
```

### 6. AWS Deployment

#### Elastic Beanstalk

1. Create new application
2. Upload deployment package
3. Configure environment variables

#### ECS (Elastic Container Service)

1. Push Docker image to ECR
2. Create ECS task definition
3. Configure service and load balancer

## Database Setup

### MongoDB Atlas (Recommended for Production)

1. Create MongoDB Atlas account
2. Create new cluster
3. Add database user
4. Whitelist IP addresses
5. Get connection string

### Self-hosted MongoDB

Ensure MongoDB is properly secured with:

- Authentication enabled
- SSL/TLS certificates
- Firewall rules
- Regular backups

## Post-Deployment Checklist

### Security

- [ ] Environment variables are set
- [ ] JWT secrets are secure
- [ ] Database is secured
- [ ] HTTPS is enabled
- [ ] CORS is properly configured

### Performance

- [ ] Database indexes are optimized
- [ ] Caching is implemented
- [ ] CDN is configured (if needed)
- [ ] Monitoring is set up

### Monitoring

- [ ] Health check endpoint works
- [ ] Logs are being collected
- [ ] Error tracking is configured
- [ ] Performance metrics are monitored

## Troubleshooting

### Common Issues

#### Build Failures

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### Database Connection Issues

- Verify connection string
- Check IP whitelist
- Ensure database user has proper permissions

#### Environment Variable Issues

- Verify all required variables are set
- Check for typos in variable names
- Ensure secrets are properly escaped

## Scaling Considerations

### Horizontal Scaling

- Use load balancers
- Implement session storage (Redis)
- Database read replicas

### Vertical Scaling

- Monitor resource usage
- Optimize database queries
- Implement caching strategies

## Backup Strategy

### Database Backups

```bash
# MongoDB backup
mongodump --uri="your-connection-string" --out=backup/

# Restore
mongorestore --uri="your-connection-string" backup/
```

### Application Backups

- Regular code commits
- Environment configuration backups
- Database schema versioning

## Support

For deployment issues, check:

1. Application logs
2. Database logs
3. Platform-specific documentation
4. GitHub Issues
