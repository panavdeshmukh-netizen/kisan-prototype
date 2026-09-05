# Appointment Booking API

A comprehensive RESTful API for managing appointment bookings between clients and service providers with real-time WebSocket notifications.

![Node.js](https://img.shields.io/badge/node.js-v18+-green.svg)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-v12+-blue.svg)
![Express.js](https://img.shields.io/badge/Express.js-v5.2-lightgrey.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Database Setup](#-database-setup)
- [Running the Application](#-running-the-application)
- [API Documentation](#-api-documentation)
- [Project Structure](#-project-structure)
- [Available Scripts](#-available-scripts)
- [Testing](#-testing)
- [WebSocket Integration](#-websocket-integration)
- [API Endpoints Overview](#-api-endpoints-overview)
- [Error Handling](#-error-handling)
- [Security](#-security)
- [Contributing](#-contributing)
- [License](#-license)

## ✨ Features

### Core Functionality

- **User Authentication & Authorization** - JWT-based authentication with role-based access control (client/provider)
- **User Management** - Complete profile management for clients and providers
- **Provider Management** - Service provider profiles with specializations and descriptions
- **Time Slot Management** - CRUD operations for provider availability scheduling
- **Appointment Booking** - Seamless appointment booking with automatic time slot management
- **Appointment Management** - View, cancel, and complete appointments with proper authorization
- **Real-Time Notifications** - WebSocket-based instant notifications for all appointment events

### Technical Features

- **RESTful API Design** - Clean and consistent API structure
- **Interactive API Documentation** - Swagger/OpenAPI documentation with try-it-out feature
- **Database Transactions** - Ensures data consistency for critical operations
- **Input Validation** - Comprehensive request validation using Joi
- **Error Handling** - Structured error responses with meaningful messages
- **Logging** - Winston-based logging for debugging and monitoring
- **Security** - Helmet.js, CORS, password hashing with bcrypt
- **Database Seeding** - Sample data for quick testing and development

## 🛠 Tech Stack

### Backend

- **Runtime:** Node.js v18+
- **Framework:** Express.js v5.2
- **Database:** PostgreSQL v12+
- **Authentication:** JWT (jsonwebtoken)
- **Real-Time:** Socket.io v4.8
- **Validation:** Joi v18
- **Password Hashing:** bcryptjs v3
- **Documentation:** Swagger (swagger-jsdoc, swagger-ui-express)

### Development Tools

- **Testing:** Jest v30 + Supertest
- **Process Manager:** Nodemon
- **Logging:** Winston v3
- **Security:** Helmet.js, CORS

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** v18.0.0 or higher ([Download](https://nodejs.org/))
- **PostgreSQL** v12.0 or higher ([Download](https://www.postgresql.org/download/))
- **npm** v8.0.0 or higher (comes with Node.js)
- **Git** (optional, for version control)

You can verify your installations:

```bash
node --version    # Should show v18.0.0 or higher
npm --version     # Should show v8.0.0 or higher
psql --version    # Should show PostgreSQL 12 or higher
```

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd appointment-booking-api
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required packages including:

- Express.js and middleware
- PostgreSQL client
- Socket.io for WebSocket
- JWT for authentication
- Joi for validation
- Swagger for documentation
- Winston for logging
- And more...

## ⚙️ Configuration

### Create Environment File

Create a `.env` file in the root directory with the following configuration:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
# You can provide a single connection string via DATABASE_URL, or provide the DB_* variables.
# Example DATABASE_URL: postgres://user:password@localhost:5432/appointment_system
DATABASE_URL=
DB_HOST=localhost
DB_PORT=5432
DB_NAME=appointment_system
DB_USER=postgres
DB_PASSWORD=your_secure_password
DB_SSL=false

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
JWT_EXPIRES_IN=24h

# Password Hashing
HASH_SALT=10
```

### Environment Variables Explained

| Variable         | Description                               | Default            | Required |
| ---------------- | ----------------------------------------- | ------------------ | -------- |
| `PORT`           | Server port                               | 3000               | No       |
| `NODE_ENV`       | Environment (development/production/test) | development        | No       |
| `DB_HOST`        | PostgreSQL host address                   | localhost          | Yes      |
| `DB_PORT`        | PostgreSQL port                           | 5432               | Yes      |
| `DB_NAME`        | Database name                             | appointment_system | Yes      |
| `DB_USER`        | Database username                         | postgres           | Yes      |
| `DB_PASSWORD`    | Database password                         | -                  | Yes      |
| `JWT_SECRET`     | Secret key for JWT signing                | -                  | Yes      |
| `JWT_EXPIRES_IN` | JWT token expiration time                 | 24h                | Yes      |
| `DATABASE_URL`   | Postgres connection string (optional)     | -                  | No\*     |
| `DB_SSL`         | Enable SSL for DB in production (true)    | false              | No       |

**⚠️ Security Note:** Never commit the `.env` file to version control. Always use strong, unique values for `JWT_SECRET` and `DB_PASSWORD` in production.

## 🗄️ Database Setup

### 1. Create PostgreSQL Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create the database
CREATE DATABASE appointment_system;

# Exit psql
\q
```

Alternatively, use the command line:

```bash
createdb -U postgres appointment_system
```

### 2. Database Schema

The application automatically creates the following tables on first run:

**Tables Created:**

- `users` - User accounts (clients and providers)
- `service_providers` - Provider profiles with specializations
- `time_slots` - Available time slots for appointments
- `appointments` - Appointment bookings

**Note:** The database schema is managed by the application. You don't need to run SQL scripts manually.

### 3. Seed Sample Data (Optional but Recommended)

To populate the database with sample providers and time slots:

```bash
npm run seed
```

This creates:

- **4 sample providers** with different specializations
  - Dr. Sarah Johnson (General Practitioner)
  - Dr. Michael Chen (Dentist)
  - Emma Williams (Licensed Therapist)
  - Dr. James Rodriguez (Dermatologist)
- **Time slots** for the next 7 days (morning and afternoon slots)

**Sample Provider Credentials:**

- Email: `sarah.johnson@example.com`
- Password: `Provider123`

(Same password for all seeded providers)

## 🏃 Running the Application

### Development Mode

Start the server with auto-reload on file changes:

```bash
npm start
# or
npm run dev
```

The server will start on `http://localhost:3000` (or the port specified in `.env`)

### Production Mode

For production deployment:

```bash
NODE_ENV=production node ./bin/www
```

### Starting with WebSocket Support

The WebSocket server starts automatically with the application. No additional configuration needed.

### Verify Server is Running

You should see output similar to:

```
Server listening on port 3000
Database connected successfully
WebSocket server initialized
```

Visit `http://localhost:3000/api-docs` to access the Swagger documentation.

## 📚 API Documentation

### Interactive Swagger UI

Access the interactive API documentation at:

```
http://localhost:3000/api-docs
```

Features:

- **Try it out** - Test endpoints directly from the browser
- **Request/Response Examples** - See sample requests and responses
- **Schema Documentation** - Complete data models
- **Authentication** - Test with JWT tokens

### Quick API Reference

| Method | Endpoint                        | Description             | Auth Required  |
| ------ | ------------------------------- | ----------------------- | -------------- |
| POST   | `/auth/register`                | Register new user       | No             |
| POST   | `/auth/login`                   | User login              | No             |
| GET    | `/users/profile`                | Get user profile        | Yes            |
| PUT    | `/users/profile`                | Update profile          | Yes            |
| GET    | `/providers`                    | List all providers      | Yes            |
| GET    | `/providers/:id`                | Get provider details    | Yes            |
| GET    | `/time-slots`                   | List time slots         | Yes            |
| POST   | `/time-slots`                   | Create time slot        | Yes (Provider) |
| POST   | `/appointments`                 | Book appointment        | Yes (Client)   |
| GET    | `/appointments/my-appointments` | Get user's appointments | Yes            |
| PUT    | `/appointments/:id/cancel`      | Cancel appointment      | Yes            |
| PUT    | `/appointments/:id/complete`    | Complete appointment    | Yes (Provider) |

## 📁 Project Structure

```
appointment-booking-api/
├── bin/
│   └── www                          # Server entry point
│
├── scripts/
│   └── seed.js                      # Database seeding script
├── src/
│   ├── app.js                       # Express app configuration
│   ├── config/
│   │   ├── database.js              # PostgreSQL connection pool
│   │   ├── swagger.js               # Swagger configuration
│   │   └── swagger-annotations.js   # Swagger schema definitions
│   ├── middleware/
│   │   ├── auth.middleware.js       # JWT authentication & authorization
│   │   └── index.js                 # Middleware exports
│   ├── modules/
│   │   ├── appointments/            # Appointment management
│   │   │   ├── appointment.controller.js
│   │   │   ├── appointment.routes.js
│   │   │   ├── appointment.service.js
│   │   │   └── appointment.validation.js
│   │   ├── auth/                    # Authentication
│   │   │   ├── auth.controller.js
│   │   │   ├── auth.routes.js
│   │   │   ├── auth.services.js
│   │   │   ├── auth.test.js
│   │   │   └── auth.validation.js
│   │   ├── providers/               # Provider management
│   │   │   ├── provider.controller.js
│   │   │   ├── provider.routes.js
│   │   │   ├── provider.service.js
│   │   │   └── provider.validation.js
│   │   ├── timeSlots/               # Time slot management
│   │   │   ├── timeSlot.controller.js
│   │   │   ├── timeSlot.routes.js
│   │   │   ├── timeSlot.service.js
│   │   │   └── timeSlot.validation.js
│   │   └── users/                   # User management
│   │       ├── user.controller.js
│   │       ├── user.routes.js
│   │       ├── user.service.js
│   │       └── user.validation.js
│   ├── services/
│   │   └── notification.service.js  # WebSocket notification service
│   ├── socket/
│   │   └── socket.handler.js        # Socket.io event handlers
│   ├── tests/
│   │   └── database.test.js         # Database tests
│   └── utils/
│       ├── logger.js                # Winston logger configuration
│       └── seeders.js               # Database seeder functions
├── .env                             # Environment variables (not in repo)
├── .gitignore                       # Git ignore rules
├── jest.config.mjs                  # Jest testing configuration
├── package.json                     # Project dependencies
└── README.md                        # This file
```

### Architecture Pattern

The project follows a **modular architecture** with clear separation of concerns:

- **Routes** - Define API endpoints and apply middleware
- **Controllers** - Handle HTTP requests and responses
- **Services** - Contain business logic and database operations
- **Validation** - Validate request data using Joi schemas
- **Middleware** - Authentication, authorization, and error handling

## 📜 Available Scripts

| Script    | Command        | Description                                         |
| --------- | -------------- | --------------------------------------------------- |
| **Start** | `npm start`    | Start development server with nodemon (auto-reload) |
| **Dev**   | `npm run dev`  | Same as start (alias)                               |
| **Test**  | `npm test`     | Run Jest tests in test environment                  |
| **Seed**  | `npm run seed` | Populate database with sample data                  |

### Script Details

#### Development Server

```bash
npm start
```

- Starts server with nodemon
- Automatically restarts on file changes
- Enables debug logging
- Uses development environment

#### Testing

```bash
npm test
```

- Runs all Jest tests
- Uses test database (configure in `.env`)
- Runs tests sequentially (--runInBand)
- Includes coverage reports (optional)

#### Database Seeding

```bash
npm run seed
```

- Creates 4 sample providers
- Generates time slots for next 7 days
- Safe to run multiple times (checks for existing data)
- Uses credentials: `password` for all seeded users

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- auth.test.js
```

### Test Environment Setup

Create a `.env.test` file for test-specific configuration:

```env
DB_NAME=appointment_system_test
NODE_ENV=test
JWT_SECRET=test_secret_key
```

## 🎯 API Endpoints Overview

### Authentication (`/auth`)

| Endpoint         | Method | Description       | Auth |
| ---------------- | ------ | ----------------- | ---- |
| `/auth/register` | POST   | Register new user | No   |
| `/auth/login`    | POST   | User login        | No   |

### Users (`/users`)

| Endpoint         | Method | Description              | Auth |
| ---------------- | ------ | ------------------------ | ---- |
| `/users/profile` | GET    | Get current user profile | Yes  |
| `/users/profile` | PUT    | Update user profile      | Yes  |
| `/users/:id`     | GET    | Get user by ID           | Yes  |

### Providers (`/providers`)

| Endpoint         | Method | Description             | Auth           |
| ---------------- | ------ | ----------------------- | -------------- |
| `/providers`     | GET    | List all providers      | Yes            |
| `/providers/:id` | GET    | Get provider by ID      | Yes            |
| `/providers`     | POST   | Create provider profile | Yes (Provider) |
| `/providers/:id` | PUT    | Update provider profile | Yes (Provider) |

### Time Slots (`/time-slots`)

| Endpoint               | Method | Description          | Auth           |
| ---------------------- | ------ | -------------------- | -------------- |
| `/time-slots`          | GET    | List time slots      | Yes            |
| `/time-slots/my-slots` | GET    | Get provider's slots | Yes (Provider) |
| `/time-slots`          | POST   | Create time slot     | Yes (Provider) |
| `/time-slots/:id`      | PUT    | Update time slot     | Yes (Provider) |
| `/time-slots/:id`      | DELETE | Delete time slot     | Yes (Provider) |

### Appointments (`/appointments`)

| Endpoint                        | Method | Description                 | Auth           |
| ------------------------------- | ------ | --------------------------- | -------------- |
| `/appointments`                 | POST   | Book appointment            | Yes (Client)   |
| `/appointments/my-appointments` | GET    | Get user's appointments     | Yes            |
| `/appointments/provider/:id`    | GET    | Get provider's appointments | Yes            |
| `/appointments/:id`             | GET    | Get appointment by ID       | Yes            |
| `/appointments/:id/cancel`      | PUT    | Cancel appointment          | Yes            |
| `/appointments/:id/complete`    | PUT    | Complete appointment        | Yes (Provider) |

### Query Parameters

**Time Slots:**

- `?provider_id=1` - Filter by provider
- `?is_booked=false` - Filter by availability
- `?date=2026-02-15` - Filter by date

**Appointments:**

- `?status=booked` - Filter by status (booked, cancelled, completed)

## 🚨 Error Handling

### Error Response Format

All errors follow a consistent format:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error (development only)"
}
```

### HTTP Status Codes

| Code | Description           | Common Causes                           |
| ---- | --------------------- | --------------------------------------- |
| 200  | OK                    | Successful request                      |
| 201  | Created               | Resource created successfully           |
| 400  | Bad Request           | Validation error, invalid input         |
| 401  | Unauthorized          | Missing or invalid JWT token            |
| 403  | Forbidden             | Insufficient permissions                |
| 404  | Not Found             | Resource doesn't exist                  |
| 409  | Conflict              | Duplicate resource (e.g., email exists) |
| 500  | Internal Server Error | Server-side error                       |

## 👤 Author

**Developed by:** MUEGHE ABUEMKEZE CHU

Connect with me:

- 🐙 GitHub: [@chu29](https://github.com/chu29)
- 🐦 Twitter: [@unku_chu](https://twitter.com/unku_chu)
- 💼 LinkedIn: [MUEGHE ABUEMKEZE CHU](https://linkedin.com/in/chu-abuemkeze)
- 📧 Email: chu.amk22@gmail.com
