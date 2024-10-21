import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth, setPersistence, browserLocalPersistence, onAuthStateChanged } from 'firebase/auth'
import { useAlert } from './stores/alert'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_1_DOMAIN,
  authDomain: import.meta.env.VITE_FIREBASE_2_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)
const auth = getAuth(app)
const storage = getStorage(app)

setPersistence(auth, browserLocalPersistence).catch((error) => {
  useAlert().show('Erro ao configurar a persistência: ', 500, error)
})

onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log('Usuário autenticado', 200)
  } else {
    console.log('Usuário não autenticado', 500)
  }
})

export { db, auth, storage }
