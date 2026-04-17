# UK CBAM MVP - Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the UK CBAM MVP completion features to staging and production environments.

---

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Staging Deployment](#staging-deployment)
3. [Production Deployment](#production-deployment)
4. [Rollback Procedures](#rollback-procedures)
5. [Post-Deployment Verification](#post-deployment-verification)
6. [Monitoring](#monitoring)

---

## Pre-Deployment Checklist

### 1. Code Review

- [ ] All code changes reviewed and approved
- [ ] No console.log or debug statements in production code
- [ ] All TODOs addressed or documented
- [ ] Code follows project style guidelines

### 2. Testing

- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] Property-based tests passing (if applicable)
- [ ] Manual testing completed for all new features
- [ ] Cross-browser testing completed (Chrome, Firefox, Safari, Edge)
- [ ] Mobile responsiveness verified

### 3. Database Migrations

- [ ] Migration files created and reviewed
  - `20260415_202003_add_installation_fields.py`
  - `20260415_202100_create_compliance_deadlines.py`
- [ ] Migration tested on local database
- [ ] Migration tested on staging database
- [ ] Rollback migrations tested
- [ ] Data integrity verified after migration

### 4. Dependencies

**Backend Dependencies:**
```bash
# Verify all dependencies in requirements.txt
pandas==2.1.0
openpyxl==3.1.2
python-multipart==0.0.6
```

- [ ] All backend dependencies installed and tested
- [ ] No conflicting package versions
- [ ] Security vulnerabilities checked (`pip audit`)

**Frontend Dependencies:**
```bash
# Verify all dependencies in package.json
react-dropzone@14.2.3
papaparse@5.4.1
```

- [ ] All frontend dependencies installed and tested
- [ ] No conflicting package versions
- [ ] Security vulnerabilities checked (`npm audit`)

### 5. Environment Variables

- [ ] All required environment variables documented
- [ ] Staging environment variables configured
- [ ] Production environment variables configured
- [ ] Secrets properly secured (not in version control)

### 6. Documentation

- [ ] API documentation updated (`docs/API_DOCUMENTATION.md`)
- [ ] Frontend component documentation updated (`docs/FRONTEND_COMPONENTS.md`)
- [ ] README.md updated with new features
- [ ] Deployment guide reviewed (this document)

### 7. Performance

- [ ] CSV import tested with 100, 500, 1000 rows
- [ ] Excel export tested with 100, 1000 records
- [ ] Page load times acceptable (<3s)
- [ ] API response times acceptable (<500ms)

### 8. Security

- [ ] CSV formula injection prevention tested
- [ ] Excel formula injection prevention tested
- [ ] Cross-organization access prevention tested
- [ ] Rate limiting configured and tested
- [ ] SQL injection prevention verified (parameterized queries)
- [ ] File upload size limits enforced (10MB)

---

## Staging Deployment

### Step 1: Prepare Staging Environment

```bash
# 1. Connect to staging server
ssh user@staging-server

# 2. Navigate to application directory
cd /var/www/uk-cbam-app

# 3. Create backup
./scripts/backup.sh staging
```

### Step 2: Deploy Backend

```bash
# 1. Pull latest code
git fetch origin
git checkout main
git pull origin main

# 2. Activate virtual environment
cd backend
source .venv/bin/activate

# 3. Install/update dependencies
pip install -r requirements.txt

# 4. Run database migrations
alembic upgrade head

# 5. Verify migrations
alembic current
alembic history

# 6. Seed compliance deadlines (if needed)
python -c "from app.seeders.compliance_deadlines_seed import seed_compliance_deadlines; import asyncio; asyncio.run(seed_compliance_deadlines())"

# 7. Restart backend service
sudo systemctl restart uk-cbam-backend

# 8. Check service status
sudo systemctl status uk-cbam-backend

# 9. Check logs for errors
sudo journalctl -u uk-cbam-backend -n 50 --no-pager
```

### Step 3: Deploy Frontend

```bash
# 1. Navigate to frontend directory
cd /var/www/uk-cbam-app/frontend

# 2. Install/update dependencies
npm install

# 3. Build production bundle
npm run build

# 4. Verify build output
ls -lh dist/

# 5. Deploy to web server
sudo cp -r dist/* /var/www/html/uk-cbam/

# 6. Restart web server (if needed)
sudo systemctl restart nginx

# 7. Check web server status
sudo systemctl status nginx
```

### Step 4: Run Smoke Tests

```bash
# 1. Test backend health
curl https://staging.uk-cbam.com/api/health

# 2. Test CSV template download
curl -o template.csv https://staging.uk-cbam.com/api/imports/csv-template

# 3. Test frontend loads
curl -I https://staging.uk-cbam.com

# 4. Run automated smoke tests
cd /var/www/uk-cbam-app
npm run test:smoke:staging
```

### Step 5: Manual Verification

- [ ] Login to staging application
- [ ] Create a test import with installation fields
- [ ] Upload a test CSV file (5-10 rows)
- [ ] Export imports to Excel
- [ ] View UK CBAM Calculator page
- [ ] View UK CBAM Products page
- [ ] Check deadline widget on dashboard
- [ ] Verify all new features working

### Step 6: Performance Testing

```bash
# Run load tests
cd /var/www/uk-cbam-app/tests
./load-test.sh staging

# Monitor results
# - CSV import: <10s for 1000 rows
# - Excel export: <3s for 1000 records
# - API response times: <500ms
```

---

## Production Deployment

### Pre-Production Checklist

- [ ] Staging deployment successful
- [ ] All smoke tests passing on staging
- [ ] Performance tests passing on staging
- [ ] Stakeholder approval obtained
- [ ] Deployment window scheduled
- [ ] Team notified of deployment
- [ ] Rollback plan reviewed

### Step 1: Prepare Production Environment

```bash
# 1. Connect to production server
ssh user@production-server

# 2. Navigate to application directory
cd /var/www/uk-cbam-app

# 3. Create full backup
./scripts/backup.sh production

# 4. Verify backup
ls -lh backups/
```

### Step 2: Enable Maintenance Mode

```bash
# 1. Enable maintenance page
sudo cp /var/www/maintenance.html /var/www/html/index.html

# 2. Notify users (if applicable)
# Send email/notification about maintenance window
```

### Step 3: Deploy Backend

```bash
# 1. Pull latest code
git fetch origin
git checkout main
git pull origin main

# 2. Activate virtual environment
cd backend
source .venv/bin/activate

# 3. Install/update dependencies
pip install -r requirements.txt

# 4. Run database migrations
alembic upgrade head

# 5. Verify migrations
alembic current

# 6. Seed compliance deadlines for all organizations
python -c "from app.seeders.compliance_deadlines_seed import seed_compliance_deadlines; import asyncio; asyncio.run(seed_compliance_deadlines())"

# 7. Restart backend service
sudo systemctl restart uk-cbam-backend

# 8. Check service status
sudo systemctl status uk-cbam-backend

# 9. Monitor logs
sudo journalctl -u uk-cbam-backend -f
```

### Step 4: Deploy Frontend

```bash
# 1. Navigate to frontend directory
cd /var/www/uk-cbam-app/frontend

# 2. Install/update dependencies
npm ci --production

# 3. Build production bundle
npm run build

# 4. Verify build
ls -lh dist/

# 5. Deploy to web server
sudo cp -r dist/* /var/www/html/uk-cbam/

# 6. Clear CDN cache (if applicable)
# aws cloudfront create-invalidation --distribution-id XXX --paths "/*"
```

### Step 5: Disable Maintenance Mode

```bash
# 1. Remove maintenance page
sudo rm /var/www/html/index.html

# 2. Restart web server
sudo systemctl restart nginx

# 3. Verify web server
sudo systemctl status nginx
```

### Step 6: Post-Deployment Verification

```bash
# 1. Test backend health
curl https://uk-cbam.com/api/health

# 2. Test API endpoints
curl -H "Authorization: Bearer TOKEN" https://uk-cbam.com/api/deadlines/next

# 3. Test frontend
curl -I https://uk-cbam.com

# 4. Run smoke tests
npm run test:smoke:production
```

### Step 7: Monitor Error Logs

```bash
# Backend logs
sudo journalctl -u uk-cbam-backend -f

# Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Application logs
tail -f /var/www/uk-cbam-app/backend/logs/app.log
```

### Step 8: Verify All Features

- [ ] Login to production application
- [ ] Test CSV import with real data
- [ ] Test Excel export
- [ ] Verify calculator page
- [ ] Verify products reference page
- [ ] Check deadline widget
- [ ] Test installation fields
- [ ] Verify all existing features still working

---

## Rollback Procedures

### When to Rollback

Rollback immediately if:
- Critical bugs discovered in production
- Database corruption detected
- Performance degradation >50%
- Security vulnerability exposed
- Core functionality broken

### Backend Rollback

```bash
# 1. Connect to production server
ssh user@production-server

# 2. Navigate to application directory
cd /var/www/uk-cbam-app

# 3. Checkout previous version
git log --oneline -10  # Find previous commit
git checkout <previous-commit-hash>

# 4. Rollback database migrations
cd backend
source .venv/bin/activate
alembic downgrade -1  # Rollback one migration
# OR
alembic downgrade <previous-revision>  # Rollback to specific revision

# 5. Restart backend service
sudo systemctl restart uk-cbam-backend

# 6. Verify rollback
sudo systemctl status uk-cbam-backend
```

### Frontend Rollback

```bash
# 1. Restore previous build
cd /var/www/uk-cbam-app
sudo cp -r backups/frontend-<timestamp>/* /var/www/html/uk-cbam/

# 2. Restart web server
sudo systemctl restart nginx

# 3. Clear CDN cache (if applicable)
# aws cloudfront create-invalidation --distribution-id XXX --paths "/*"
```

### Database Rollback

```bash
# 1. Stop application
sudo systemctl stop uk-cbam-backend

# 2. Restore database from backup
pg_restore -U postgres -d netzeroworks backups/db-<timestamp>.dump

# 3. Verify database
psql -U postgres -d netzeroworks -c "SELECT * FROM alembic_version;"

# 4. Start application
sudo systemctl start uk-cbam-backend
```

### Post-Rollback

- [ ] Verify application is working
- [ ] Notify team of rollback
- [ ] Document rollback reason
- [ ] Create incident report
- [ ] Plan fix and re-deployment

---

## Post-Deployment Verification

### Automated Tests

```bash
# Run full test suite
cd /var/www/uk-cbam-app
npm run test:e2e:production

# Run API tests
cd backend
pytest tests/integration/

# Run frontend tests
cd frontend
npm run test
```

### Manual Verification Checklist

#### CSV Import
- [ ] Upload CSV with 10 valid rows - all imported
- [ ] Upload CSV with mixed valid/invalid rows - partial import with errors
- [ ] Upload CSV >10MB - rejected
- [ ] Upload CSV >1000 rows - rejected
- [ ] Download CSV template - correct format

#### Excel Export
- [ ] Export all imports - file downloads
- [ ] Export with year filter - correct data
- [ ] Export with sector filter - correct data
- [ ] Open Excel file - 3 sheets present
- [ ] Verify calculations in Excel - match database

#### Compliance Deadlines
- [ ] View deadlines on dashboard - next 3 shown
- [ ] View all deadlines page - all deadlines listed
- [ ] Mark deadline complete - status updates
- [ ] Color coding correct - red/amber/green

#### UK CBAM Calculator
- [ ] Select product - loads correctly
- [ ] Enter import details - validation works
- [ ] View calculation - formula breakdown shown
- [ ] Save as import - creates import record
- [ ] Calculate another - form resets

#### UK CBAM Products
- [ ] Page loads - all products shown
- [ ] Search by CN code - filters correctly
- [ ] Filter by sector - filters correctly
- [ ] Sort by column - sorts correctly
- [ ] Click product row - modal opens
- [ ] Export to CSV - file downloads

#### Installation Fields
- [ ] Create import with installation fields - saves correctly
- [ ] Update import installation fields - updates correctly
- [ ] View import detail - installation fields displayed
- [ ] CSV import with installation fields - imports correctly

### Performance Verification

```bash
# Test CSV import performance
time curl -X POST -F "file=@test-100-rows.csv" \
  -H "Authorization: Bearer TOKEN" \
  https://uk-cbam.com/api/imports/bulk-csv

# Expected: <2s for 100 rows

# Test Excel export performance
time curl -H "Authorization: Bearer TOKEN" \
  https://uk-cbam.com/api/imports/export-excel \
  -o export.xlsx

# Expected: <3s for 1000 records
```

### Security Verification

- [ ] CSV formula injection prevented - cells prefixed with '
- [ ] Excel formula injection prevented - cells prefixed with '
- [ ] Cross-org access blocked - 403 errors
- [ ] Rate limiting working - 429 errors after limit
- [ ] File size limits enforced - 413 errors for large files

---

## Monitoring

### Key Metrics to Monitor

#### Application Metrics

```bash
# Backend response times
# Target: p95 < 500ms, p99 < 1000ms

# Frontend page load times
# Target: p95 < 3s

# Error rates
# Target: < 0.1%

# CSV import success rate
# Target: > 95%

# Excel export success rate
# Target: > 98%
```

#### Infrastructure Metrics

```bash
# CPU usage
# Target: < 70% average

# Memory usage
# Target: < 80%

# Disk usage
# Target: < 80%

# Database connections
# Target: < 80% of max
```

### Monitoring Tools

**Application Monitoring:**
- Sentry for error tracking
- New Relic for APM
- CloudWatch for AWS metrics

**Log Aggregation:**
- ELK Stack (Elasticsearch, Logstash, Kibana)
- CloudWatch Logs

**Uptime Monitoring:**
- Pingdom
- UptimeRobot

### Alerts

Configure alerts for:
- [ ] Error rate > 1%
- [ ] Response time p95 > 1000ms
- [ ] CPU usage > 80%
- [ ] Memory usage > 90%
- [ ] Disk usage > 85%
- [ ] Failed deployments
- [ ] Database connection errors

---

## Troubleshooting

### Common Issues

#### Issue: Migration Fails

**Symptoms:** Alembic upgrade fails with error

**Solution:**
```bash
# Check current migration state
alembic current

# Check migration history
alembic history

# Try manual migration
alembic upgrade head --sql > migration.sql
# Review SQL and apply manually if needed
psql -U postgres -d netzeroworks -f migration.sql
```

#### Issue: CSV Import Fails

**Symptoms:** All CSV imports fail with 500 error

**Solution:**
```bash
# Check backend logs
sudo journalctl -u uk-cbam-backend -n 100

# Verify pandas and openpyxl installed
pip list | grep pandas
pip list | grep openpyxl

# Test CSV parsing manually
python -c "import pandas as pd; print(pd.read_csv('test.csv'))"
```

#### Issue: Excel Export Fails

**Symptoms:** Excel export returns 500 error

**Solution:**
```bash
# Check openpyxl installation
pip list | grep openpyxl

# Test Excel generation manually
python -c "from openpyxl import Workbook; wb = Workbook(); wb.save('test.xlsx')"

# Check disk space
df -h
```

#### Issue: Frontend Not Loading

**Symptoms:** Blank page or 404 errors

**Solution:**
```bash
# Check nginx configuration
sudo nginx -t

# Check file permissions
ls -la /var/www/html/uk-cbam/

# Check nginx logs
sudo tail -f /var/log/nginx/error.log

# Rebuild frontend
cd frontend
npm run build
sudo cp -r dist/* /var/www/html/uk-cbam/
```

#### Issue: Deadlines Not Showing

**Symptoms:** Deadline widget empty

**Solution:**
```bash
# Check if deadlines seeded
psql -U postgres -d netzeroworks -c "SELECT COUNT(*) FROM compliance_deadlines;"

# Seed deadlines manually
cd backend
source .venv/bin/activate
python -c "from app.seeders.compliance_deadlines_seed import seed_compliance_deadlines; import asyncio; asyncio.run(seed_compliance_deadlines())"
```

---

## Maintenance

### Regular Maintenance Tasks

**Daily:**
- [ ] Check error logs
- [ ] Monitor performance metrics
- [ ] Verify backups completed

**Weekly:**
- [ ] Review security alerts
- [ ] Check disk space
- [ ] Update dependencies (if needed)

**Monthly:**
- [ ] Review and archive old logs
- [ ] Database maintenance (VACUUM, ANALYZE)
- [ ] Performance optimization review

### Database Maintenance

```bash
# Vacuum and analyze
psql -U postgres -d netzeroworks -c "VACUUM ANALYZE;"

# Check database size
psql -U postgres -d netzeroworks -c "SELECT pg_size_pretty(pg_database_size('netzeroworks'));"

# Check table sizes
psql -U postgres -d netzeroworks -c "SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) FROM pg_tables WHERE schemaname = 'public' ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;"
```

---

## Support Contacts

**Development Team:**
- Lead Developer: [email]
- Backend Developer: [email]
- Frontend Developer: [email]

**Infrastructure:**
- DevOps Engineer: [email]
- Database Administrator: [email]

**Emergency Contacts:**
- On-Call Engineer: [phone]
- Team Lead: [phone]

---

## Appendix

### A. Migration Files

**Installation Fields Migration:**
```python
# backend/alembic/versions/20260415_202003_add_installation_fields.py
def upgrade():
    op.add_column('imports', sa.Column('installation_name', sa.String(255), nullable=True))
    op.add_column('imports', sa.Column('installation_id', sa.String(100), nullable=True))
    op.add_column('imports', sa.Column('production_route', sa.String(50), nullable=True))

def downgrade():
    op.drop_column('imports', 'production_route')
    op.drop_column('imports', 'installation_id')
    op.drop_column('imports', 'installation_name')
```

**Compliance Deadlines Migration:**
```python
# backend/alembic/versions/20260415_202100_create_compliance_deadlines.py
def upgrade():
    op.create_table(
        'compliance_deadlines',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('org_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('organisations.id'), nullable=False),
        sa.Column('deadline_type', sa.String(50), nullable=False),
        sa.Column('due_date', sa.Date(), nullable=False),
        sa.Column('status', sa.String(20), default='upcoming'),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), default=datetime.utcnow)
    )
    op.create_index('idx_deadlines_org_date', 'compliance_deadlines', ['org_id', 'due_date'])

def downgrade():
    op.drop_index('idx_deadlines_org_date')
    op.drop_table('compliance_deadlines')
```

### B. Environment Variables

**Required Backend Variables:**
```env
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/netzeroworks
SECRET_KEY=your-secret-key
FRONTEND_URL=https://uk-cbam.com
UPLOAD_DIR=./uploads
```

**Optional Backend Variables:**
```env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GEMINI_API_KEY=your-gemini-api-key
```

### C. Nginx Configuration

```nginx
server {
    listen 80;
    server_name uk-cbam.com;
    
    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name uk-cbam.com;
    
    ssl_certificate /etc/ssl/certs/uk-cbam.crt;
    ssl_certificate_key /etc/ssl/private/uk-cbam.key;
    
    # Frontend
    location / {
        root /var/www/html/uk-cbam;
        try_files $uri $uri/ /index.html;
    }
    
    # Backend API
    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Increase timeout for CSV uploads
        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
    }
    
    # File upload size limit
    client_max_body_size 10M;
}
```

---

**Last Updated:** January 2025  
**Version:** 1.0.0
