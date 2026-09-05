let connectToDb
let pool

beforeAll(async () => {
  // Ensure the test env file is loaded before the module initializes the pool
  process.env.NODE_ENV = 'test'
  ;({ connectToDb, pool } = await import('../config/database.js'))
  await connectToDb()
})

afterAll(async () => {
  await pool.end()
})

test('database responds', async () => {
  const { rows } = await pool.query('SELECT 1 as ok')
  expect(rows[0].ok).toBe(1)
})

test('schema initialized', async () => {
  const { rows } = await pool.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN ('users', 'service_providers', 'time_slots', 'appointments')
  `)
  const found = rows.map((r) => r.table_name)
  expect(found).toEqual(
    expect.arrayContaining([
      'users',
      'service_providers',
      'time_slots',
      'appointments',
    ]),
  )
})
