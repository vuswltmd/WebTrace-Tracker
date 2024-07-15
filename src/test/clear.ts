const { getDoc, doc, updateDoc } = require('firebase/firestore');
const { initializeApp } = require('firebase/app');
const { getFirestore } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function clearTask(projectId: string, testId: string, taskId: string) {
  try {
    const docRef = await doc(
      db,
      `project/${projectId}/test/${testId}/task/${taskId}`
    );

    if (docRef) {
      await updateDoc(docRef, {
        log: [],
      });
    }
  } catch (err) {
    console.log('setTask error:' + err);
  }
}

clearTask(
  'cCYeFqNi5qU7bidhbtGI',
  'NVxzx3mo1KcwdVVd90yA',
  'YYouQwNJYTDKVDiBIVoY'
);
