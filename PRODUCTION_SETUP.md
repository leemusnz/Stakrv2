# Production Setup Guide

## 🚀 Deployment Checklist

### 1. Environment Configuration

Create `.env.production` with the following variables:

```bash
# Database
DATABASE_URL="postgresql://username:password@host:port/database"

# Authentication
NEXTAUTH_URL="https://stakr.app"
NEXTAUTH_SECRET="your-production-secret-key-here"

# OAuth Providers
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# AWS S3 Storage
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="stakr-production-bucket"

# AI/Moderation Services
OPENAI_API_KEY="your-openai-api-key"
MODERATION_API_KEY="your-moderation-api-key"

# Email Services
SMTP_HOST="smtp.provider.com"
SMTP_PORT="587"
SMTP_USER="your-smtp-username"
SMTP_PASSWORD="your-smtp-password"
EMAIL_FROM="noreply@stakr.app"

# Payment Processing
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Security
CORS_ORIGIN="https://stakr.app"
RATE_LIMIT_WINDOW="15m"
RATE_LIMIT_MAX_REQUESTS="100"

# Performance
REDIS_URL="redis://localhost:6379"
CACHE_TTL="3600"

# Monitoring
SENTRY_DSN="https://your-sentry-dsn"
LOG_LEVEL="info"

# Feature Flags
ENABLE_AI_MODERATION="true"
ENABLE_PAYMENT_PROCESSING="true"
ENABLE_EMAIL_NOTIFICATIONS="true"
ENABLE_ANALYTICS="true"

# Development/Testing
NODE_ENV="production"
NEXT_PUBLIC_APP_URL="https://stakr.app"
```

### 2. Security Hardening

#### Database Security
- [ ] Enable SSL connections
- [ ] Set up connection pooling
- [ ] Configure proper user permissions
- [ ] Enable audit logging

#### API Security
- [ ] Implement rate limiting
- [ ] Set up CORS properly
- [ ] Enable CSRF protection
- [ ] Configure security headers

#### Authentication Security
- [ ] Use strong session secrets
- [ ] Enable secure cookies
- [ ] Implement proper OAuth scopes
- [ ] Set up account lockout policies

### 3. Performance Optimization

#### Database Optimization
- [ ] Set up proper indexes
- [ ] Configure connection pooling
- [ ] Enable query caching
- [ ] Set up read replicas if needed

#### Application Optimization
- [ ] Enable Next.js production mode
- [ ] Configure CDN for static assets
- [ ] Set up image optimization
- [ ] Enable compression

#### Caching Strategy
- [ ] Redis for session storage
- [ ] CDN for static assets
- [ ] Database query caching
- [ ] API response caching

### 4. Monitoring & Logging

#### Application Monitoring
- [ ] Set up Sentry for error tracking
- [ ] Configure application logs
- [ ] Set up performance monitoring
- [ ] Enable health checks

#### Infrastructure Monitoring
- [ ] Server resource monitoring
- [ ] Database performance monitoring
- [ ] Network latency monitoring
- [ ] Uptime monitoring

### 5. Backup & Recovery

#### Database Backups
- [ ] Set up automated backups
- [ ] Test backup restoration
- [ ] Configure backup retention
- [ ] Set up point-in-time recovery

#### Application Backups
- [ ] Backup configuration files
- [ ] Backup user uploads
- [ ] Test disaster recovery
- [ ] Document recovery procedures

### 6. SSL/TLS Configuration

#### Certificate Management
- [ ] Obtain SSL certificates
- [ ] Configure automatic renewal
- [ ] Set up proper redirects
- [ ] Enable HSTS

### 7. Payment Processing

#### Stripe Configuration
- [ ] Set up production Stripe account
- [ ] Configure webhook endpoints
- [ ] Test payment flows
- [ ] Set up fraud detection

### 8. Email Configuration

#### SMTP Setup
- [ ] Configure production SMTP
- [ ] Set up email templates
- [ ] Test email delivery
- [ ] Configure bounce handling

### 9. Testing in Production

#### Pre-deployment Tests
- [ ] Run full test suite
- [ ] Test security features
- [ ] Verify payment flows
- [ ] Test email functionality

#### Post-deployment Tests
- [ ] Verify all features work
- [ ] Test user registration
- [ ] Test challenge creation
- [ ] Test payment processing

### 10. Documentation

#### User Documentation
- [ ] Create user guides
- [ ] Document API endpoints
- [ ] Write troubleshooting guides
- [ ] Create FAQ section

#### Developer Documentation
- [ ] Document deployment process
- [ ] Create maintenance guides
- [ ] Document security procedures
- [ ] Write incident response plan

## 🔧 Deployment Commands

### Build for Production
```bash
npm run build
```

### Start Production Server
```bash
npm start
```

### Run Production Tests
```bash
npm run test:ci
```

### Security Audit
```bash
npm audit --audit-level moderate
```

## 🚨 Emergency Procedures

### Database Issues
1. Check connection logs
2. Verify database status
3. Restore from backup if needed
4. Update connection settings

### Payment Issues
1. Check Stripe dashboard
2. Verify webhook configuration
3. Test payment endpoints
4. Contact Stripe support if needed

### Security Incidents
1. Review access logs
2. Check for suspicious activity
3. Implement additional security measures
4. Notify affected users if necessary

## 📊 Performance Benchmarks

### Target Metrics
- **Page Load Time**: < 2 seconds
- **API Response Time**: < 500ms
- **Database Query Time**: < 100ms
- **Uptime**: > 99.9%

### Monitoring Alerts
- High error rates
- Slow response times
- Database connection issues
- Payment processing failures

## 🔒 Security Checklist

### Authentication
- [ ] Secure session management
- [ ] Proper password hashing
- [ ] OAuth security configuration
- [ ] Account lockout policies

### Data Protection
- [ ] Encrypted data transmission
- [ ] Secure file uploads
- [ ] Input validation and sanitization
- [ ] SQL injection prevention

### API Security
- [ ] Rate limiting
- [ ] CORS configuration
- [ ] CSRF protection
- [ ] Request validation

### Infrastructure Security
- [ ] Firewall configuration
- [ ] SSL/TLS setup
- [ ] Regular security updates
- [ ] Access control policies

## 📈 Scaling Considerations

### Horizontal Scaling
- [ ] Load balancer setup
- [ ] Multiple application instances
- [ ] Database read replicas
- [ ] CDN configuration

### Vertical Scaling
- [ ] Server resource monitoring
- [ ] Database optimization
- [ ] Caching implementation
- [ ] Code optimization

## 🎯 Success Metrics

### User Experience
- [ ] Fast page load times
- [ ] Smooth user interactions
- [ ] Reliable payment processing
- [ ] Responsive design

### Business Metrics
- [ ] User registration rates
- [ ] Challenge completion rates
- [ ] Payment success rates
- [ ] User retention rates

### Technical Metrics
- [ ] System uptime
- [ ] Error rates
- [ ] Response times
- [ ] Security incidents 