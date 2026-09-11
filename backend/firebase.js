const { initializeApp, cert } = require('firebase-admin/app');
const { getMessaging } = require('firebase-admin/messaging');
const db = require('./db');
let serviceAccount;
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } else {
    serviceAccount = require('./firebase-admin.json');
  }
} catch (e) {
  console.log('⚠️ Firebase Admin credential not loaded, push notifications will be inactive');
}

if (serviceAccount) {
  try {
    initializeApp({
      credential: cert(serviceAccount)
    });
    console.log('🔥 Firebase Admin successfully initialized');
  } catch (err) {
    console.error('Firebase Admin init error:', err.message);
  }
}

const sendPushNotification = async (tokens, title, body, data = {}) => {
  if (!tokens || tokens.length === 0) return;

  const uniqueTokens = [...new Set(tokens.filter(Boolean))];
  if (uniqueTokens.length === 0) return;

  const stringData = {};
  for (const key in data) {
    stringData[key] = String(data[key]);
  }
  stringData.title = String(title);
  stringData.body = String(body);

  // Single Unified FCM Multicast Message (strictly separated platform payloads to avoid duplicate notifications)
  const unifiedMessage = {
    android: {
      priority: 'high',
      notification: {
        title: String(title),
        body: String(body),
        sound: 'default',
        channelId: 'asg_high_importance',
        priority: 'max',
        visibility: 'public'
      }
    },
    webpush: {
      headers: {
        Urgency: 'high'
      }
    },
    data: stringData,
    tokens: uniqueTokens
  };

  try {
    const res = await getMessaging().sendEachForMulticast(unifiedMessage);
    console.log(`FCM Delivery - Success: ${res.successCount} | Failed: ${res.failureCount}`);

    // Clean up invalid tokens if any
    res.responses.forEach(async (resp, idx) => {
      if (!resp.success && (resp.error?.code === 'messaging/registration-token-not-registered' || resp.error?.message?.includes('NotRegistered'))) {
        const tokenToClean = tokens[idx];
        try {
          await db.query('DELETE FROM user_push_tokens WHERE push_token = $1', [tokenToClean]);
          console.log(`Auto-cleaned stale token: ${tokenToClean}`);
        } catch (err) {
          console.error('Error auto-cleaning stale token:', err);
        }
      }
    });
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
};

module.exports = { sendPushNotification };
