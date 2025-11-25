// firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyCcy98vthKMjz2fVinTHzToOVENMfJAIlc",
  authDomain: "ap-project-554c2.firebaseapp.com",
  databaseURL: "https://ap-project-554c2-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "ap-project-554c2",
  storageBucket: "ap-project-554c2.appspot.com",
  messagingSenderId: "877283520344",
  appId: "1:877283520344:web:03664cdbb5f01a06cebf2d",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getDatabase(app);
export default app;
