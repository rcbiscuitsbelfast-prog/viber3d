import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDwm190rmzMLrlZen_BbYi_LzuDrfh1Gg0",
  authDomain: "quests4friends.firebaseapp.com",
  projectId: "quests4friends",
  storageBucket: "quests4friends.firebasestorage.app",
  messagingSenderId: "896975079647",
  appId: "1:896975079647:web:ac2c98611984ba9b5a416a",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
