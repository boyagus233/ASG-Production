import { initializeApp, getApps, getApp } from "firebase/app";
import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";
import { Platform } from "react-native";

const firebaseConfig = {
  apiKey: "AIzaSyAojiobndoMzC66bwRdBOJboQ3qLcfexek",
  authDomain: "asg-production-ee8d3.firebaseapp.com",
  projectId: "asg-production-ee8d3",
  storageBucket: "asg-production-ee8d3.firebasestorage.app",
  messagingSenderId: "459231455784",
  appId: "1:459231455784:web:3a7d6683ab7de0f59d231d",
  measurementId: "G-1EF9T0FW8Y"
};

let app: any;
let messaging: any;

// Initialize Firebase only on web platform
if (Platform.OS === 'web') {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
}

export const getFirebaseMessaging = async () => {
  if (Platform.OS !== 'web') return null;
  const supported = await isSupported();
  if (!supported) return null;
  
  if (!messaging) {
    messaging = getMessaging(app);
  }
  return messaging;
};

// VAPID Key untuk Web Push
export const VAPID_KEY = "BOUpMUF-aR8tSspDv5hSLQP641m55gp-8Seg5Pnj63qEGS8tM01LtJuMexKNIjNgotJFwk0NMYtBFAcdvO8pwEg";
