#!/usr/bin/env node

/**
 * Seed database with initial data
 */

import { runSeeds } from '../src/utils/seeders.js'
import { connectToDb } from '../src/config/database.js'

const run = async () => {
  try {
    console.log('Connecting to database...')
    await connectToDb()

    console.log('Running seeds...')
    await runSeeds()

    console.log('✅ Seeding completed successfully!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  }
}

run()
