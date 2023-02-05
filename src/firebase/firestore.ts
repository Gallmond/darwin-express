// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app'
import { getFirestore, connectFirestoreEmulator, doc, setDoc, deleteDoc, getDoc, collection, getDocs } from 'firebase/firestore'
import dotenv from 'dotenv'
import { hashPassword } from '../auth'
import User, { userConverter } from '../user'
dotenv.config()

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: 'AIzaSyCS311UBDUOh_oU-vOg2BgPN5ZKycRaQ6s',
    authDomain: 'darwin-express.firebaseapp.com',
    projectId: 'darwin-express',
    storageBucket: 'darwin-express.appspot.com',
    messagingSenderId: '873135243666',
    appId: '1:873135243666:web:cdad74ceae69e54bdd414b'
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const firestore = getFirestore(app)

// attach emulators
if(['local', 'test'].includes(process.env.NODE_ENV ?? 'false')){
    console.log(`In ${process.env.NODE_ENV} mode. Attaching firestore emulator`)
    connectFirestoreEmulator(firestore, 'localhost', 8080)
}

/**
 * delete all docs in the 'users' collection that contains 'test' in its id
 */
export const deleteTestUsers = async () => {
    const collectionRef = collection(firestore, 'users')
    const docs = await getDocs(collectionRef)
    const deletedIds: string[] = []
    docs.forEach(async docSnapshot => {
        if(docSnapshot.id.includes('test')){
            deletedIds.push(docSnapshot.id)
            await deleteUser(docSnapshot.id)
        }
    })
    
    return deletedIds
}

/**
 * deletes a doc in the 'users' collection by its id
 */
export const deleteUser = async (identifier: string): Promise<boolean> => {
    await deleteDoc(doc(firestore, 'users', identifier))

    return true
}

/**
 * return User if it exists in the 'users' collection, or null
 */
export const getUserByUsername = async (username: string): Promise<User | null> => {
    const docRef = doc(firestore, 'users', username).withConverter(userConverter)
    const snapshot = await getDoc(docRef)

    return snapshot.exists() ? snapshot.data() : null
}

/**
 * creates a new User class and stores it in firebase. The username is the id
 */
export const createNewUser = async (username: string, plaintextPass: string): Promise<User> => {
    if(await getUserByUsername(username) !== null){
        throw new Error(`${username} already exists`)
    }
    
    const user = new User(username, hashPassword(plaintextPass))

    const docRef = doc(firestore, 'users', user.username).withConverter(userConverter)
    
    user.uid = docRef.id

    await setDoc(docRef, user)

    return user
}

