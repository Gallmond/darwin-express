// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app'
import { getFirestore, connectFirestoreEmulator, doc, setDoc, deleteDoc, getDoc, collection, getDocs, addDoc, Timestamp, query } from 'firebase/firestore'
import dotenv from 'dotenv'
import { hashPassword } from './auth'
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

export const deleteAllRevokedTokens = async () => {
    const collectionRef = collection(firestore, 'revoked_tokens')
    const docs = await getDocs(collectionRef)

    const tokensToDelete: string[] = []
    docs.forEach(docSnapshot => {
        tokensToDelete.push(docSnapshot.id)
    })

    const deletePromises = tokensToDelete.map(docId => {
        return deleteDoc(doc(firestore, 'revoked_tokens', docId))
    })

    await Promise.all(deletePromises)

    return tokensToDelete
}

/**
 * delete all docs in the 'users' collection that contains 'test' in its id
 */
export const deleteTestUsers = async () => {
    const collectionRef = collection(firestore, 'users')

    const docs = await getDocs(collectionRef)
    
    const toDelete: string[] = []
    docs.forEach(docSnapshot => {
        if(docSnapshot.id.includes('test')){
            toDelete.push(docSnapshot.id)
        }
    })

    await Promise.all(toDelete.map(documentId => {
        return deleteDoc(doc(firestore, 'users', documentId))
    }))

    return toDelete
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

interface FBRevokedTokenData{
    token: string,
    keepUntil: Timestamp,
    createdAt: Timestamp,
}
interface RevokedTokenData{
    token: string,
    keepUntil: Date,
    createdAt: Date,
}

export const addRevokedToken = async (token: string, daysToLive = 100): Promise<void> => {
    const docRef = doc(firestore, 'revoked_tokens', token)
    const createdAt = new Date()
    
    const dayInMilliseconds = 1000 * 60 * 60 * 24
    const keepUntil = new Date( createdAt.valueOf() + (dayInMilliseconds * daysToLive) )

    await setDoc(docRef, {
        token, keepUntil, createdAt
    })
}

export const getRevokedToken = async (token: string): Promise<RevokedTokenData | null> => {
    const docRef = doc(firestore, 'revoked_tokens', token)
    const docSnapshot = await getDoc(docRef)

    // there is no such revoked token
    if(!docSnapshot || !docSnapshot.exists){
        return null
    }

    const data = docSnapshot.data()
    if(!data){
        throw new Error('//TODO format existant document with no data error')
    }

    if(
        typeof data.token !== 'string' ||
        !(data.keepUntil instanceof Timestamp) ||
        !(data.createdAt instanceof Timestamp)
    ){
        throw new Error('//TODO define malformed data error')
    }

    /**
     * If the token exists but we're past the keepUntil date. Treat it as though
     * it's no longer revoked and delete it.
     */
    const now = new Date().valueOf()
    const keepUntilMs = data.keepUntil.toDate().valueOf()
    if(now > keepUntilMs){
        await deleteDoc(docRef)
        return null
    }

    return {
        token: data.token,
        keepUntil: data.keepUntil.toDate(),
        createdAt: data.createdAt.toDate(),
    }
}

export const tokenIsRevoked = async (token: string): Promise<boolean> => {
    const tokenData = await getRevokedToken(token)
    return tokenData !== null && (tokenData.token === token)
}