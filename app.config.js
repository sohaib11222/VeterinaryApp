// Load .env so EXPO_PUBLIC_* and API URL are available (create .env from .env.example)
const path = require('path');
try {
  require('dotenv').config({ path: path.resolve(__dirname, '.env') });
} catch (_) {}

const appJson = require('./app.json');
module.exports = {
  ...appJson.expo,
  extra: {
    ...appJson.expo.extra,
    apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL,
  },
};
