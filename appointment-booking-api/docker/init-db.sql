-- Initialize databases for development and testing
SELECT 'CREATE DATABASE test_appointment_sys'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'test_appointment_sys')\gexec
