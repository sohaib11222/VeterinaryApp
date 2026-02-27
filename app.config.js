// Load .env so EXPO_PUBLIC_* and API URL are available (create .env from .env.example)
const path = require('path');
try {
  require('dotenv').config({ path: path.resolve(__dirname, '.env') });
} catch (_) {}

const appJson = require('./app.json');
module.exports = {
  ...appJson.expo,

  android: {
    ...appJson.expo.android,
    package: "com.sohaibahmad.veterinaryapp"
  },
  extra: {

       eas: {
      projectId: "681c6397-a4d9-4539-9cc2-fdf3f4559d14"
    },
    ...appJson.expo.extra,
    apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL,
    streamApiKey: process.env.EXPO_PUBLIC_STREAM_API_KEY,
  },
};
