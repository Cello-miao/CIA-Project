'use strict'

// Only enable New Relic if license key is provided
if (process.env.NEW_RELIC_LICENSE_KEY) {
  exports.config = {
    app_name: ['cia-backend-api'],
    license_key: process.env.NEW_RELIC_LICENSE_KEY,
    logging: { level: 'info' }
  }
} else {
  // Disable New Relic by setting enabled to false
  exports.config = {
    enabled: false
  }
}
