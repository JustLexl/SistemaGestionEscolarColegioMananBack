const {
  initializeApp,
  applicationDefault,
  getApps
} = require('firebase-admin/app');

const { getAuth } = require('firebase-admin/auth');

if (getApps().length === 0) {
  initializeApp({
    credential: applicationDefault()
  });
}

const auth = getAuth();

module.exports = {
  auth
};