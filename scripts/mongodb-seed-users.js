/**
 * Initialize db collections `users` by:
 * - Truncating the current collection
 * - Inserting placeholder users
 * - Building indexes
 *
 * This script is intended to run on the shell, eg:
 * localhost: > mongo lang-dev scripts/mongodb-seed-users.js
 * Atlas: > mongo <db_url> scripts/init.mongo.js
 */

/* global db print */
/* eslint no-restricted-globals: "off" */

db.users.remove({})
const usersSeed = [
  {
    id: 1,
    email: 'mat.berti@gmail.com',
    emailVerified: new Date(),
    password: '$2b$10$dkmpNm1pzRLfXTHgxVB65OcbqnE5mYIkMoSUzjO3dHugLfVKmI6JS',
    role: 'admin',
    name: 'Matt Berti',
    createdAt: new Date(),
    lastLoginAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 2,
    email: 'gustavo_almodovar@foo.bar',
    emailVerified: new Date(),
    password: '$2b$10$WlIh0R5y/WQmcds7WtJWFudTPITswJ5VvIZjW0UGrr31i4LTjC14q',
    role: 'user',
    name: 'Gustavo Almodovar',
    createdAt: new Date(),
    lastLoginAt: new Date(),
    updatedAt: new Date(),
  },
]
db.users.insertMany(usersSeed)
const count = db.users.count()
print('Inserted', count, 'users')

// Track number of users in the `counters` collection
db.counters.remove({ _id: 'users' })
db.counters.insert({ _id: 'users', current: count })

db.users.createIndex({ id: 1 }, { unique: true })
db.users.createIndex({ email: 1 }, { unique: true })
