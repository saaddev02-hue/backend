const { Pool } = require('pg');

class Database {
  constructor() {
    this.pool = null;
  }

  async connect() {
    try {
      if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL environment variable is not defined');
      }

      this.pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
      });

      // Test connection
      const client = await this.pool.connect();
      console.log('Connected to PostgreSQL');
      client.release();

      // Initialize database schema
      await this.initializeSchema();
    } catch (error) {
      console.error('Database connection error:', error.message || error);
      console.log('\n📋 To fix this error:');
      console.log('1. Set up a PostgreSQL database');
      console.log('2. Set DATABASE_URL in your .env file');
      console.log('3. Restart the server');
      throw error;
    }
  }

  async initializeSchema() {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Create company table
      await client.query(`
        CREATE TABLE IF NOT EXISTS company (
          id BIGSERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          domain_name TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `);

      // Create user table
      await client.query(`
        CREATE TABLE IF NOT EXISTS "user" (
          id BIGSERIAL PRIMARY KEY,
          company_id BIGINT NOT NULL REFERENCES company(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          is_email_verified BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ,
          is_active BOOLEAN DEFAULT TRUE,
          last_login_time TIMESTAMPTZ,
          last_login_ip INET,
          allowed_ip_list INET[]
        )
      `);

      // Add additional fields for authentication
      await client.query(`
        ALTER TABLE "user" 
        ADD COLUMN IF NOT EXISTS password_hash TEXT,
        ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user',
        ADD COLUMN IF NOT EXISTS email_verification_token TEXT,
        ADD COLUMN IF NOT EXISTS email_verification_expires TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS password_reset_token TEXT,
        ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS email_validated BOOLEAN DEFAULT FALSE
      `);

      // Remove 2FA related fields if they exist
      await client.query(`
        ALTER TABLE "user" 
        DROP COLUMN IF EXISTS two_factor_secret,
        DROP COLUMN IF EXISTS two_factor_enabled,
        DROP COLUMN IF EXISTS two_factor_backup_codes
      `);

      // Create hierarchy_level table
      await client.query(`
        CREATE TABLE IF NOT EXISTS hierarchy_level (
          id BIGSERIAL PRIMARY KEY,
          level_order INTEGER NOT NULL UNIQUE,
          name TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `);

      // Create hierarchy table
      await client.query(`
        CREATE TABLE IF NOT EXISTS hierarchy (
          id BIGSERIAL PRIMARY KEY,
          company_id BIGINT NOT NULL REFERENCES company(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          level_id BIGINT NOT NULL REFERENCES hierarchy_level(id) ON DELETE RESTRICT,
          parent_id BIGINT REFERENCES hierarchy(id) ON DELETE CASCADE,
          can_attach_device BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ
        )
      `);

      // Create device_type table (for hierarchy_device relationships)
      await client.query(`
        CREATE TABLE IF NOT EXISTS device_type (
          id BIGSERIAL PRIMARY KEY,
          type_name TEXT NOT NULL UNIQUE,
          logo TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `);

      // Create device table (for hierarchy_device relationships)
      await client.query(`
        CREATE TABLE IF NOT EXISTS device (
          id BIGSERIAL PRIMARY KEY,
          company_id BIGINT NOT NULL REFERENCES company(id) ON DELETE CASCADE,
          device_type_id BIGINT NOT NULL REFERENCES device_type(id) ON DELETE RESTRICT,
          serial_number TEXT NOT NULL UNIQUE,
          metadata JSONB,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ
        )
      `);

      // Create device_data table for storing time-series data
      await client.query(`
        CREATE TABLE IF NOT EXISTS device_data (
          id BIGSERIAL PRIMARY KEY,
          device_id BIGINT NOT NULL REFERENCES device(id) ON DELETE CASCADE,
          serial_number TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          data JSONB NOT NULL
        )
      `);

      // Create hierarchy_device table (many-to-many relationship)
      await client.query(`
        CREATE TABLE IF NOT EXISTS hierarchy_device (
          id BIGSERIAL PRIMARY KEY,
          hierarchy_id BIGINT NOT NULL REFERENCES hierarchy(id) ON DELETE CASCADE,
          device_id BIGINT NOT NULL REFERENCES device(id) ON DELETE CASCADE,
          attached_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          UNIQUE(hierarchy_id, device_id)
        )
      `);
      // Create indexes
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_user_email ON "user"(email);
        CREATE INDEX IF NOT EXISTS idx_user_company_id ON "user"(company_id);
        CREATE INDEX IF NOT EXISTS idx_company_domain ON company(domain_name);
        CREATE INDEX IF NOT EXISTS idx_hierarchy_company_id ON hierarchy(company_id);
        CREATE INDEX IF NOT EXISTS idx_hierarchy_parent_id ON hierarchy(parent_id);
        CREATE INDEX IF NOT EXISTS idx_hierarchy_level_id ON hierarchy(level_id);
        CREATE INDEX IF NOT EXISTS idx_hierarchy_device_hierarchy_id ON hierarchy_device(hierarchy_id);
        CREATE INDEX IF NOT EXISTS idx_hierarchy_device_device_id ON hierarchy_device(device_id);
        CREATE INDEX IF NOT EXISTS idx_device_company_id ON device(company_id);
        CREATE INDEX IF NOT EXISTS idx_device_serial ON device(serial_number);
        CREATE INDEX IF NOT EXISTS idx_device_data_device_id ON device_data(device_id);
        CREATE INDEX IF NOT EXISTS idx_device_data_created_at ON device_data(created_at);
        CREATE INDEX IF NOT EXISTS idx_device_data_serial ON device_data(serial_number);
      `);

      await client.query('COMMIT');
      console.log('Database schema initialized');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async query(text, params) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(text, params);
      return result;
    } finally {
      client.release();
    }
  }

  async transaction(callback) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async disconnect() {
    if (this.pool) {
      await this.pool.end();
      console.log('Database disconnected');
    }
  }
}

module.exports = new Database();