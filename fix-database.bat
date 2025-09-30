@echo off
echo Fixing database...
echo.

echo Step 1: Loading missing data...
docker-compose exec -T postgres psql -U admin -d betting_platform < database/init/07-fix-missing-data.sql

echo.
echo Step 2: Creating views...
docker-compose exec -T postgres psql -U admin -d betting_platform < database/init/08-create-views-fixed.sql

echo.
echo Step 3: Testing database...
docker-compose exec postgres psql -U admin -d betting_platform -c "SELECT COUNT(*) as user_count FROM users;"
docker-compose exec postgres psql -U admin -d betting_platform -c "SELECT COUNT(*) as broker_count FROM brokers;"
docker-compose exec postgres psql -U admin -d betting_platform -c "SELECT COUNT(*) as transaction_count FROM transactions;"
docker-compose exec postgres psql -U admin -d betting_platform -c "SELECT COUNT(*) as view_count FROM information_schema.views WHERE table_schema = 'public';"

echo.
echo Database fix completed!
echo You can now test with: npm run db:shell
pause
