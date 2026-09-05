import { Pool, types } from 'pg'
import logger from '../utils/logger.js'
import dotenv from 'dotenv'

// Force pg to return DATE columns (OID 1082) as clean 'YYYY-MM-DD' strings
types.setTypeParser(1082, (val) => val)

// Load base env, then override with .env.test when running tests
dotenv.config()
if (process.env.NODE_ENV === 'test') {
  dotenv.config({ path: '.env.test', override: true })
  logger.info('Loaded environment for testing')
} else {
  logger.info('Loaded environment for non-testing')
}

// Support either a DATABASE_URL connection string or individual DB_* vars
const {
  DATABASE_URL,
  DB_HOST,
  DB_PORT,
  DB_NAME,
  DB_USER,
  DB_PASSWORD,
  DB_SSL, // optional override ("true"/"false")
} = process.env

const isProduction = process.env.NODE_ENV === 'production'

// Decide SSL usage: enabled in production by default, overridable via DB_SSL='false'
const useSSL = isProduction && DB_SSL !== 'false'

let poolConfig = {
  connectionTimeoutMillis: 5000,
}

if (DATABASE_URL) {
  poolConfig.connectionString = DATABASE_URL
  poolConfig.ssl = useSSL ? { rejectUnauthorized: true } : false
  logger.info('Using DATABASE_URL for Postgres connection')
} else {
  // If DATABASE_URL not provided, require DB_* vars
  if (!DB_HOST || !DB_PORT || !DB_NAME || !DB_USER) {
    logger.error(
      'Missing database configuration. Provide DATABASE_URL or DB_HOST, DB_PORT, DB_NAME, DB_USER (and DB_PASSWORD if required).',
    )
    process.exit(1)
  }

  poolConfig = {
    ...poolConfig,
    host: DB_HOST,
    port: parseInt(DB_PORT, 10),
    database: DB_NAME,
    user: DB_USER,
    password: DB_PASSWORD,
    ssl: useSSL ? { rejectUnauthorized: true } : false,
  }

  logger.info(
    `Using DB_* variables for Postgres connection: ${DB_HOST}:${DB_PORT}/${DB_NAME}`,
  )
}

const pool = new Pool(poolConfig)

pool.on('connect', () => {
  logger.info('Database client connected')
})

pool.on('error', (err) => {
  logger.error('Unexpected error on idle database client', err)
  process.exit(-1)
})

const initDbSchema = async () => {
  const client = await pool.connect()

  try {
    logger.info('Initializing database schema...')
    await client.query('CREATE EXTENSION IF NOT EXISTS pgcrypto;')

    // Create users table (both clients and providers)
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(150) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(20) NOT NULL CHECK (role IN ('client', 'provider')) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `)

    logger.info('Users table has been successfully created.')

    // Extend the role check to also allow the new prototype roles
    // (farmer, admin) without touching existing client/provider rows.
    // Drop+recreate is safe to re-run on every startup.
    await client.query(`
      ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
      ALTER TABLE users ADD CONSTRAINT users_role_check
        CHECK (role IN ('client', 'provider', 'farmer', 'admin'));
    `)

    logger.info('Users role constraint extended for farmer/admin roles.')

    // Service Providers table (extended info for providers)
    await client.query(`
      CREATE TABLE IF NOT EXISTS service_providers (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL UNIQUE,
      specialization VARCHAR(100),
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `)

    logger.info('Service providers table has been successfully created.')

    // Time Slots table
    await client.query(`
      CREATE TABLE IF NOT EXISTS time_slots (
      id SERIAL PRIMARY KEY,
      provider_id INTEGER NOT NULL,
      slot_date DATE NOT NULL,
      start_time TIME NOT NULL,
      end_time TIME NOT NULL,
      duration INTEGER NOT NULL, -- in minutes
      is_booked BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      
      FOREIGN KEY (provider_id) REFERENCES service_providers(id) ON DELETE CASCADE,
      
      -- Prevent overlapping slots for same provider
      CONSTRAINT unique_provider_time UNIQUE (provider_id, slot_date, start_time)
      );
   `)

    logger.info('Time slots table has been successfully created.')

    // Appointments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS appointments (
      id SERIAL PRIMARY KEY,
      client_id INTEGER NOT NULL,
      provider_id INTEGER NOT NULL,
      time_slot_id INTEGER NOT NULL UNIQUE,
      status VARCHAR(20) DEFAULT 'booked' CHECK (status IN ('booked', 'cancelled', 'completed')),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      
      FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (provider_id) REFERENCES service_providers(id) ON DELETE CASCADE,
      FOREIGN KEY (time_slot_id) REFERENCES time_slots(id) ON DELETE CASCADE
      );
    `)

    logger.info('Appointments table has been successfully created.')

    // Indexes for performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
      CREATE INDEX IF NOT EXISTS idx_time_slots_provider ON time_slots(provider_id);
      CREATE INDEX IF NOT EXISTS idx_time_slots_date ON time_slots(slot_date);
      CREATE INDEX IF NOT EXISTS idx_time_slots_booked ON time_slots(is_booked);
      CREATE INDEX IF NOT EXISTS idx_time_slots_available ON time_slots(provider_id, slot_date, start_time) WHERE is_booked = false;
      CREATE INDEX IF NOT EXISTS idx_appointments_client ON appointments(client_id);
      CREATE INDEX IF NOT EXISTS idx_appointments_provider ON appointments(provider_id);
      CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
    `)

    logger.info('Database schema initialization completed successfully.')

    // ================================================================
    // Farmer Procurement Prototype (SIH) — Phase 1: schema only.
    // These tables are additive and do not touch the existing
    // users / service_providers / time_slots / appointments tables
    // beyond the role check extended above.
    // ================================================================

    // Farmers table (extended profile for users with role = 'farmer')
    await client.query(`
      CREATE TABLE IF NOT EXISTS farmers (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL UNIQUE,
      registration_id VARCHAR(50) UNIQUE,
      name VARCHAR(100) NOT NULL,
      phone VARCHAR(15) NOT NULL,
      village VARCHAR(100),
      address TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `)

    logger.info('Farmers table has been successfully created.')

    // Procurement Centres table
    await client.query(`
      CREATE TABLE IF NOT EXISTS procurement_centres (
      id SERIAL PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      location VARCHAR(200),
      district VARCHAR(100),
      capacity INTEGER NOT NULL DEFAULT 0,
      active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `)

    logger.info('Procurement centres table has been successfully created.')

    // Procurement Slots table (time slots at a given centre)
    await client.query(`
      CREATE TABLE IF NOT EXISTS procurement_slots (
      id SERIAL PRIMARY KEY,
      centre_id INTEGER NOT NULL,
      slot_date DATE NOT NULL,
      start_time TIME NOT NULL,
      end_time TIME NOT NULL,
      capacity INTEGER NOT NULL DEFAULT 0,
      booked_count INTEGER NOT NULL DEFAULT 0,
      status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'full', 'closed')),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (centre_id) REFERENCES procurement_centres(id) ON DELETE CASCADE,

      -- Prevent duplicate slots for the same centre/date/start time
      CONSTRAINT unique_centre_time UNIQUE (centre_id, slot_date, start_time),
      CONSTRAINT booked_within_capacity CHECK (booked_count <= capacity)
      );
    `)

    logger.info('Procurement slots table has been successfully created.')

    // Bookings table (a farmer booking a slot at a centre)
    await client.query(`
      CREATE TABLE IF NOT EXISTS bookings (
      id SERIAL PRIMARY KEY,
      farmer_id INTEGER NOT NULL,
      centre_id INTEGER NOT NULL,
      slot_id INTEGER NOT NULL,
      token_number VARCHAR(20) NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'booked' CHECK (status IN ('booked', 'cancelled', 'completed')),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (farmer_id) REFERENCES farmers(id) ON DELETE CASCADE,
      FOREIGN KEY (centre_id) REFERENCES procurement_centres(id) ON DELETE CASCADE,
      FOREIGN KEY (slot_id) REFERENCES procurement_slots(id) ON DELETE CASCADE
      );
    `)

    logger.info('Bookings table has been successfully created.')

    // A farmer can only hold one ACTIVE ('booked') booking per slot.
    // This was previously a table-level UNIQUE (farmer_id, slot_id)
    // constraint, which also blocked re-booking the same slot after a
    // booking was cancelled. Replaced with a partial unique index so
    // cancelled (and completed) bookings stay in history and no longer
    // block a fresh booking, while still preventing duplicate active
    // bookings for the same farmer + slot. Drop+recreate is safe to
    // re-run on every startup, and also migrates any pre-existing
    // database created before this change.
    await client.query(`
      ALTER TABLE bookings DROP CONSTRAINT IF EXISTS unique_farmer_slot;
      DROP INDEX IF EXISTS unique_farmer_active_slot;
      CREATE UNIQUE INDEX IF NOT EXISTS unique_farmer_active_slot
        ON bookings (farmer_id, slot_id)
        WHERE status = 'booked';
    `)

    logger.info(
      'Bookings unique constraint migrated to partial index on active bookings.',
    )

    // Procurement Records table (post-booking procurement status per booking)
    await client.query(`
      CREATE TABLE IF NOT EXISTS procurement_records (
      id SERIAL PRIMARY KEY,
      booking_id INTEGER NOT NULL UNIQUE,
      farmer_id INTEGER NOT NULL,
      procurement_status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (procurement_status IN ('pending', 'verified', 'procured', 'rejected')),
      quantity NUMERIC(10, 2),
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
      FOREIGN KEY (farmer_id) REFERENCES farmers(id) ON DELETE CASCADE
      );
    `)

    logger.info('Procurement records table has been successfully created.')

    // Payments table (payment status per booking)
    await client.query(`
      CREATE TABLE IF NOT EXISTS payments (
      id SERIAL PRIMARY KEY,
      farmer_id INTEGER NOT NULL,
      booking_id INTEGER NOT NULL,
      amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
      payment_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed')),
      payment_date TIMESTAMP,

      FOREIGN KEY (farmer_id) REFERENCES farmers(id) ON DELETE CASCADE,
      FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
      );
    `)

    logger.info('Payments table has been successfully created.')

    // Indexes for the new procurement-domain tables
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_farmers_village ON farmers(village);
      CREATE INDEX IF NOT EXISTS idx_centres_district ON procurement_centres(district);
      CREATE INDEX IF NOT EXISTS idx_centres_active ON procurement_centres(active);
      CREATE INDEX IF NOT EXISTS idx_slots_centre ON procurement_slots(centre_id);
      CREATE INDEX IF NOT EXISTS idx_slots_date ON procurement_slots(slot_date);
      CREATE INDEX IF NOT EXISTS idx_slots_status ON procurement_slots(status);
      CREATE INDEX IF NOT EXISTS idx_bookings_farmer ON bookings(farmer_id);
      CREATE INDEX IF NOT EXISTS idx_bookings_centre ON bookings(centre_id);
      CREATE INDEX IF NOT EXISTS idx_bookings_slot ON bookings(slot_id);
      CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
      CREATE INDEX IF NOT EXISTS idx_procurement_records_farmer ON procurement_records(farmer_id);
      CREATE INDEX IF NOT EXISTS idx_procurement_records_status ON procurement_records(procurement_status);
      CREATE INDEX IF NOT EXISTS idx_payments_farmer ON payments(farmer_id);
      CREATE INDEX IF NOT EXISTS idx_payments_booking ON payments(booking_id);
      CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(payment_status);
    `)

    logger.info('Farmer procurement prototype schema initialized successfully.')
  } catch (error) {
    logger.error('Error initializing database schema', error)
  } finally {
    client.release()
  }
}

const connectToDb = async () => {
  try {
    const client = await pool.connect()
    logger.info('Successfully connected to the database')
    client.release()
    await initDbSchema()
  } catch (error) {
    logger.error('Error connecting to the database', error)
    process.exit(1)
  }
}

const query = async (text, params) => {
  const start = Date.now()
  try {
    const response = await pool.query(text, params)
    const duration = Date.now() - start
    logger.info(
      `Executed query: { text: ${text.substring(0, 100).trim()}..., paramCount: ${params ? params.length : 0}, duration: ${duration}ms, rows: ${response.rowCount}}`,
    )
    return response
  } catch (error) {
    logger.error(
      `Error executing query: { text: ${text.substring(0, 100).trim()}..., paramCount: ${params ? params.length : 0}, error: ${error.message}}`,
    )
    throw error
  }
}

export { pool, initDbSchema, connectToDb, query }
