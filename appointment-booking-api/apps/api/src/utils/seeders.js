import { pool, initDbSchema } from '../config/database.js'
import logger from '../utils/logger.js'
import bcrypt from 'bcryptjs'

const HASH_SALT = 10

/**
 * Seed database with initial provider users
 */
export const seedProviders = async () => {
  const client = await pool.connect()

  try {
    logger.info('Starting provider seed...')

    // Define seed providers
    const providers = [
      {
        name: 'Dr. Sarah Johnson',
        email: 'sarah.johnson@example.com',
        password: 'Provider123',
        specialization: 'General Practitioner',
        description:
          'Experienced GP with 10+ years in family medicine. Available for general consultations and health checkups.',
      },
      {
        name: 'Dr. Michael Chen',
        email: 'michael.chen@example.com',
        password: 'Provider123',
        specialization: 'Dentist',
        description:
          'Specialist in dental care, teeth cleaning, and cosmetic dentistry. Gentle approach with modern equipment.',
      },
      {
        name: 'Emma Williams',
        email: 'emma.williams@example.com',
        password: 'Provider123',
        specialization: 'Licensed Therapist',
        description:
          'Mental health counselor specializing in anxiety, depression, and relationship counseling.',
      },
      {
        name: 'Dr. James Rodriguez',
        email: 'james.rodriguez@example.com',
        password: 'Provider123',
        specialization: 'Dermatologist',
        description:
          'Board-certified dermatologist treating skin conditions, acne, and cosmetic procedures.',
      },
    ]

    for (const provider of providers) {
      // Check if user already exists
      const userCheck = await client.query(
        'SELECT id FROM users WHERE email = $1',
        [provider.email],
      )

      let userId

      if (userCheck.rows.length > 0) {
        logger.info(`Provider user already exists: ${provider.email}`)
        userId = userCheck.rows[0].id
      } else {
        // Create user
        const hashedPassword = await bcrypt.hash(provider.password, HASH_SALT)
        const userResult = await client.query(
          `INSERT INTO users (name, email, password_hash, role) 
           VALUES ($1, $2, $3, 'provider') 
           RETURNING id`,
          [provider.name, provider.email, hashedPassword],
        )
        userId = userResult.rows[0].id
        logger.info(`Created provider user: ${provider.email}`)
      }

      // Check if provider profile exists
      const providerCheck = await client.query(
        'SELECT id FROM service_providers WHERE user_id = $1',
        [userId],
      )

      if (providerCheck.rows.length > 0) {
        logger.info(`Provider profile already exists for: ${provider.email}`)
      } else {
        // Create provider profile
        await client.query(
          `INSERT INTO service_providers (user_id, specialization, description) 
           VALUES ($1, $2, $3)`,
          [userId, provider.specialization, provider.description],
        )
        logger.info(`Created provider profile for: ${provider.email}`)
      }
    }

    logger.info('Provider seed completed successfully')
  } catch (error) {
    logger.error('Error seeding providers', error)
    throw error
  } finally {
    client.release()
  }
}

/**
 * Seed some sample time slots for providers
 */
export const seedTimeSlots = async () => {
  const client = await pool.connect()

  try {
    logger.info('Starting time slots seed...')

    // Get all providers
    const providersResult = await client.query(
      'SELECT id FROM service_providers ORDER BY id LIMIT 2',
    )

    if (providersResult.rows.length === 0) {
      logger.warn('No providers found. Run seedProviders first.')
      return
    }

    // Create time slots for next 7 days
    const today = new Date()
    const slots = []

    for (let dayOffset = 1; dayOffset <= 7; dayOffset++) {
      const date = new Date(today)
      date.setDate(date.getDate() + dayOffset)
      const dateStr = date.toISOString().split('T')[0]

      // Morning slots: 9:00 AM - 12:00 PM
      const morningSlots = [
        { start: '09:00', end: '10:00', duration: 60 },
        { start: '10:00', end: '11:00', duration: 60 },
        { start: '11:00', end: '12:00', duration: 60 },
      ]

      // Afternoon slots: 2:00 PM - 5:00 PM
      const afternoonSlots = [
        { start: '14:00', end: '15:00', duration: 60 },
        { start: '15:00', end: '16:00', duration: 60 },
        { start: '16:00', end: '17:00', duration: 60 },
      ]

      const allSlots = [...morningSlots, ...afternoonSlots]

      for (const provider of providersResult.rows) {
        for (const slot of allSlots) {
          slots.push({
            provider_id: provider.id,
            date: dateStr,
            start_time: slot.start,
            end_time: slot.end,
            duration: slot.duration,
          })
        }
      }
    }

    // Insert time slots
    let created = 0
    let skipped = 0

    for (const slot of slots) {
      try {
        await client.query(
          `INSERT INTO time_slots (provider_id, slot_date, start_time, end_time, duration) 
           VALUES ($1, $2, $3, $4, $5)`,
          [
            slot.provider_id,
            slot.date,
            slot.start_time,
            slot.end_time,
            slot.duration,
          ],
        )
        created++
      } catch (error) {
        if (error.code === '23505') {
          // Duplicate slot, skip
          skipped++
        } else {
          throw error
        }
      }
    }

    logger.info(
      `Time slots seed completed. Created: ${created}, Skipped: ${skipped}`,
    )
  } catch (error) {
    logger.error('Error seeding time slots', error)
    throw error
  } finally {
    client.release()
  }
}

/**
 * Seed farmer users + farmer profiles for the procurement prototype
 */
export const seedFarmers = async () => {
  const client = await pool.connect()

  try {
    logger.info('Starting farmer seed...')

    const farmers = [
      {
        name: 'Ramesh Kumar',
        email: 'ramesh.kumar@example.com',
        password: 'Farmer123',
        registrationId: 'FARM-001',
        phone: '9876543210',
        village: 'Sector 12',
      },
      {
        name: 'Suresh Patel',
        email: 'suresh.patel@example.com',
        password: 'Farmer123',
        registrationId: 'FARM-002',
        phone: '9876543211',
        village: 'Rampur',
      },
      {
        name: 'Lakshmi Devi',
        email: 'lakshmi.devi@example.com',
        password: 'Farmer123',
        registrationId: 'FARM-003',
        phone: '9876543212',
        village: 'Block A',
      },
    ]

    for (const farmer of farmers) {
      // Check if the user account already exists
      const userCheck = await client.query(
        'SELECT id FROM users WHERE email = $1',
        [farmer.email],
      )

      let userId

      if (userCheck.rows.length > 0) {
        logger.info(`Farmer user already exists: ${farmer.email}`)
        userId = userCheck.rows[0].id
      } else {
        const hashedPassword = await bcrypt.hash(farmer.password, HASH_SALT)
        const userResult = await client.query(
          `INSERT INTO users (name, email, password_hash, role)
           VALUES ($1, $2, $3, 'farmer')
           RETURNING id`,
          [farmer.name, farmer.email, hashedPassword],
        )
        userId = userResult.rows[0].id
        logger.info(`Created farmer user: ${farmer.email}`)
      }

      // Check if the farmer profile already exists
      const farmerCheck = await client.query(
        'SELECT id FROM farmers WHERE user_id = $1',
        [userId],
      )

      if (farmerCheck.rows.length > 0) {
        logger.info(`Farmer profile already exists for: ${farmer.email}`)
      } else {
        await client.query(
          `INSERT INTO farmers (user_id, registration_id, name, phone, village)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            userId,
            farmer.registrationId,
            farmer.name,
            farmer.phone,
            farmer.village,
          ],
        )
        logger.info(`Created farmer profile for: ${farmer.email}`)
      }
    }

    logger.info('Farmer seed completed successfully')
  } catch (error) {
    logger.error('Error seeding farmers', error)
    throw error
  } finally {
    client.release()
  }
}

/**
 * Seed sample procurement centres
 */
export const seedProcurementCentres = async () => {
  const client = await pool.connect()

  try {
    logger.info('Starting procurement centre seed...')

    const centres = [
      {
        name: 'Village Procurement Centre - Sector 12',
        location: 'Sector 12, Village Road',
        district: 'Pune',
        capacity: 50,
      },
      {
        name: 'Agricultural Procurement Centre - Main Road',
        location: 'Main Road, Town Centre',
        district: 'Pune',
        capacity: 40,
      },
      {
        name: 'District Procurement Centre - Block A',
        location: 'Block A, District HQ',
        district: 'Pune',
        capacity: 60,
      },
    ]

    for (const centre of centres) {
      const existing = await client.query(
        'SELECT id FROM procurement_centres WHERE name = $1',
        [centre.name],
      )

      if (existing.rows.length > 0) {
        logger.info(`Procurement centre already exists: ${centre.name}`)
      } else {
        await client.query(
          `INSERT INTO procurement_centres (name, location, district, capacity)
           VALUES ($1, $2, $3, $4)`,
          [centre.name, centre.location, centre.district, centre.capacity],
        )
        logger.info(`Created procurement centre: ${centre.name}`)
      }
    }

    logger.info('Procurement centre seed completed successfully')
  } catch (error) {
    logger.error('Error seeding procurement centres', error)
    throw error
  } finally {
    client.release()
  }
}

/**
 * Seed sample procurement slots for the next few days at each centre
 */
export const seedProcurementSlots = async () => {
  const client = await pool.connect()

  try {
    logger.info('Starting procurement slots seed...')

    const centresResult = await client.query(
      'SELECT id FROM procurement_centres ORDER BY id',
    )

    if (centresResult.rows.length === 0) {
      logger.warn(
        'No procurement centres found. Run seedProcurementCentres first.',
      )
      return
    }

    const today = new Date()
    const dailySlots = [
      { start: '09:00', end: '10:00' },
      { start: '10:00', end: '11:00' },
      { start: '11:00', end: '12:00' },
      { start: '14:00', end: '15:00' },
    ]

    let created = 0
    let skipped = 0

    for (let dayOffset = 1; dayOffset <= 5; dayOffset++) {
      const date = new Date(today)
      date.setDate(date.getDate() + dayOffset)
      const dateStr = date.toISOString().split('T')[0]

      for (const centre of centresResult.rows) {
        for (const slot of dailySlots) {
          try {
            await client.query(
              `INSERT INTO procurement_slots (centre_id, slot_date, start_time, end_time, capacity)
               VALUES ($1, $2, $3, $4, $5)`,
              [centre.id, dateStr, slot.start, slot.end, 10],
            )
            created++
          } catch (error) {
            if (error.code === '23505') {
              // Duplicate slot, skip
              skipped++
            } else {
              throw error
            }
          }
        }
      }
    }

    logger.info(
      `Procurement slots seed completed. Created: ${created}, Skipped: ${skipped}`,
    )
  } catch (error) {
    logger.error('Error seeding procurement slots', error)
    throw error
  } finally {
    client.release()
  }
}

/**
 * Seed a couple of sample bookings (with matching procurement + payment records)
 * so the prototype has some non-empty data to demo against.
 */
export const seedSampleBookings = async () => {
  const client = await pool.connect()

  try {
    logger.info('Starting sample bookings seed...')

    const farmersResult = await client.query(
      'SELECT id FROM farmers ORDER BY id LIMIT 2',
    )
    const slotsResult = await client.query(
      `SELECT id, centre_id FROM procurement_slots
       ORDER BY slot_date, start_time LIMIT 2`,
    )

    if (farmersResult.rows.length === 0 || slotsResult.rows.length === 0) {
      logger.warn(
        'No farmers or procurement slots found. Run seedFarmers and seedProcurementSlots first.',
      )
      return
    }

    const sampleTokens = ['T-048', 'T-049']

    for (
      let i = 0;
      i < Math.min(farmersResult.rows.length, slotsResult.rows.length);
      i++
    ) {
      const farmer = farmersResult.rows[i]
      const slot = slotsResult.rows[i]
      const token = sampleTokens[i] || `T-0${48 + i}`

      const existingBooking = await client.query(
        'SELECT id FROM bookings WHERE farmer_id = $1 AND slot_id = $2',
        [farmer.id, slot.id],
      )

      let bookingId

      if (existingBooking.rows.length > 0) {
        logger.info(
          `Sample booking already exists for farmer ${farmer.id}, slot ${slot.id}`,
        )
        bookingId = existingBooking.rows[0].id
      } else {
        const bookingResult = await client.query(
          `INSERT INTO bookings (farmer_id, centre_id, slot_id, token_number)
           VALUES ($1, $2, $3, $4)
           RETURNING id`,
          [farmer.id, slot.centre_id, slot.id, token],
        )
        bookingId = bookingResult.rows[0].id

        // Keep the slot's booked_count in sync with the new booking
        await client.query(
          'UPDATE procurement_slots SET booked_count = booked_count + 1 WHERE id = $1',
          [slot.id],
        )

        logger.info(
          `Created sample booking (token ${token}) for farmer ${farmer.id}`,
        )
      }

      // Matching procurement record
      const existingRecord = await client.query(
        'SELECT id FROM procurement_records WHERE booking_id = $1',
        [bookingId],
      )

      if (existingRecord.rows.length === 0) {
        await client.query(
          `INSERT INTO procurement_records (booking_id, farmer_id, procurement_status, quantity)
           VALUES ($1, $2, 'pending', $3)`,
          [bookingId, farmer.id, 10 + i * 5],
        )
        logger.info(`Created procurement record for booking ${bookingId}`)
      }

      // Matching payment record
      const existingPayment = await client.query(
        'SELECT id FROM payments WHERE booking_id = $1',
        [bookingId],
      )

      if (existingPayment.rows.length === 0) {
        await client.query(
          `INSERT INTO payments (farmer_id, booking_id, amount, payment_status)
           VALUES ($1, $2, $3, 'pending')`,
          [farmer.id, bookingId, 0],
        )
        logger.info(`Created payment record for booking ${bookingId}`)
      }
    }

    logger.info('Sample bookings seed completed successfully')
  } catch (error) {
    logger.error('Error seeding sample bookings', error)
    throw error
  } finally {
    client.release()
  }
}

/**
 * Run all seeds
 */
export const runSeeds = async () => {
  try {
    await initDbSchema()
    await seedProviders()
    await seedTimeSlots()
    await seedFarmers()
    await seedProcurementCentres()
    await seedProcurementSlots()
    await seedSampleBookings()
    logger.info('All seeds completed successfully')
  } catch (error) {
    logger.error('Error running seeds', error)
    throw error
  }
}
