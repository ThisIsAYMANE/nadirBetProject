# Betting Platform Database

This directory contains the PostgreSQL database setup for the betting platform application.

## Structure

```
database/
├── init/                    # Database initialization scripts
│   ├── 01-create-enums.sql     # Custom enum types
│   ├── 02-create-tables.sql    # Table definitions
│   ├── 03-create-indexes.sql   # Database indexes
│   ├── 04-create-triggers.sql  # Triggers and functions
│   ├── 05-insert-sample-data.sql # Sample data for development
│   └── 06-create-views.sql     # Useful views for dashboards
├── backups/                 # Database backup directory
└── README.md               # This file
```

## Quick Start

1. **Start the database:**
   ```bash
   docker-compose up -d postgres
   ```

2. **Access the database:**
   - **Direct connection:** `postgresql://admin:admin123@localhost:5432/betting_platform`
   - **PgAdmin:** http://localhost:8080 (admin@bettingplatform.com / admin123)

3. **Stop the database:**
   ```bash
   docker-compose down
   ```

## Database Schema

### Core Tables
- **users** - User accounts (super_admin, broker, regular_user)
- **brokers** - Broker-specific information
- **user_points** - User point balances and transaction history
- **transactions** - All financial transactions
- **bets** - Betting records and outcomes
- **cashout_requests** - Cashout request management

### Supporting Tables
- **points_allocation** - Broker point allocations
- **messages** - Internal messaging system
- **broker_reviews** - User reviews and ratings
- **alerts** - System notifications
- **audit_logs** - Complete audit trail
- **fraud_alerts** - Fraud detection and monitoring

### Key Features
- **Comprehensive audit trail** - All changes are logged
- **Automatic point updates** - Triggers handle point balance changes
- **Performance optimization** - Strategic indexes for fast queries
- **Data integrity** - Foreign keys and constraints ensure consistency
- **Dashboard views** - Pre-built views for common queries

## Sample Data

The database includes sample data for development:
- 1 Super Admin user
- 3 Broker accounts
- 4 Regular users
- Sample transactions, bets, and reviews
- Test alerts and messages

## Dashboard Integration

The database is fully compatible with the React dashboard application. Key views available:

- `user_dashboard_view` - User management data
- `broker_dashboard_view` - Broker performance metrics
- `transaction_dashboard_view` - Transaction history
- `super_admin_kpis` - KPI calculations
- `monthly_revenue_chart` - Revenue chart data
- `broker_performance_metrics` - Broker analytics
- `fraud_monitoring_view` - Fraud detection data

## Environment Variables

Copy `env.example` to `.env` and configure:

```bash
cp env.example .env
```

Key variables:
- `DATABASE_URL` - PostgreSQL connection string
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` - Database credentials
- `JWT_SECRET` - Authentication secret
- `NODE_ENV` - Environment (development/production)

## Backup and Restore

### Create Backup
```bash
docker-compose exec postgres pg_dump -U admin betting_platform > backups/backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restore Backup
```bash
docker-compose exec -T postgres psql -U admin betting_platform < backups/backup_file.sql
```

## Development Commands

```bash
# View database logs
docker-compose logs postgres

# Access database shell
docker-compose exec postgres psql -U admin -d betting_platform

# Reset database (WARNING: Deletes all data)
docker-compose down -v
docker-compose up -d postgres

# View running containers
docker-compose ps
```

## Production Considerations

1. **Change default passwords** in production
2. **Enable SSL** for database connections
3. **Set up regular backups**
4. **Configure monitoring** and alerting
5. **Use connection pooling** for high traffic
6. **Implement read replicas** for scaling

## Troubleshooting

### Common Issues

1. **Port already in use:**
   ```bash
   # Change port in docker-compose.yml
   ports:
     - "5433:5432"  # Use different port
   ```

2. **Permission denied:**
   ```bash
   # Fix file permissions
   sudo chown -R $USER:$USER database/
   ```

3. **Database connection failed:**
   - Check if container is running: `docker-compose ps`
   - Check logs: `docker-compose logs postgres`
   - Verify credentials in `.env` file

4. **Data not persisting:**
   - Ensure volumes are properly configured
   - Check if data directory exists and has correct permissions
