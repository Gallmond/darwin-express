import { initializeApp } from 'firebase/app'
import { collection, connectFirestoreEmulator, deleteDoc, doc, Firestore, getDoc, getDocs, getFirestore, setDoc, Timestamp } from 'firebase/firestore'
import User, { userConverter } from '../../user'
import { hashPassword } from '../auth'
import { DBClass, MutableUserData, RevokedTokenData } from './types'
import { MILLISECONDS } from '../utils'

interface FirestoreRevokedTokenData{
    token: string,
    createdAt: Timestamp,
    keepUntil: Timestamp,
}

class DBFirestore extends DBClass{
    private static instance: DBFirestore | undefined
    
    constructor(
        private firestore: Firestore
    ){
        super()
    }

    static make = (): DBFirestore => {
        //TODO move to env?
        const firebaseConfig = {
            apiKey: 'AIzaSyCS311UBDUOh_oU-vOg2BgPN5ZKycRaQ6s',
            authDomain: 'darwin-express.firebaseapp.com',
            projectId: 'darwin-express',
            storageBucket: 'darwin-express.appspot.com',
            messagingSenderId: '873135243666',
            appId: '1:873135243666:web:cdad74ceae69e54bdd414b'
        }

        const app = initializeApp(firebaseConfig)
        const firestore = getFirestore(app)

        // attach emulators
        if(['local', 'test'].includes(process.env.NODE_ENV ?? 'false')){
            console.log(`In ${process.env.NODE_ENV} mode. Attaching firestore emulator`)
            connectFirestoreEmulator(firestore, 'localhost', 8080)
        }

        return new DBFirestore(firestore)
    }

    static singleton = (): DBFirestore => {
        if(DBFirestore.instance === undefined){
            DBFirestore.instance = DBFirestore.make()
        }

        return DBFirestore.instance
    }

    createUser = async (username: string, plaintextPassword: string): Promise<User> => {
        const existingUser = this.getUser( username )
        if(existingUser !== null){
            throw new Error(`${username} already exists`)
        }

        const user = new User(username, hashPassword(plaintextPassword))

        const docRef = doc(this.firestore, 'users', user.username).withConverter(userConverter)

        user.uid = docRef.id

        await setDoc(docRef, user)

        return user
    } 

    getUser = async (username: string): Promise<User | null> => {
        const docRef = doc(this.firestore, 'users', username).withConverter(userConverter)
        const snapshot = await getDoc(docRef)

        return snapshot.exists() ? snapshot.data() : null
    } 

    updateUser = async (username: string, fields: MutableUserData): Promise<boolean> => {
        const docRef = doc(this.firestore, 'users', username).withConverter(userConverter)
        await setDoc(docRef, fields, {merge: true})

        return true
    } 
    
    deleteUser = async (username: string): Promise<boolean> => {
        await deleteDoc(doc(this.firestore, 'users', username))

        return true
    } 
    
    createRevokedToken = async (token: string, daysToLive = 7): Promise<RevokedTokenData> => {
        const createdAt = new Date()
        const keepUntil = new Date(
            createdAt.valueOf() + (MILLISECONDS.DAY * daysToLive)
        )

        const data = {
            token, keepUntil, createdAt
        }

        const docRef = doc(this.firestore, 'revoked_tokens', token)

        await setDoc(docRef, data)

        return data
    } 
    
    getRevokedToken = async (token: string): Promise<RevokedTokenData | null> => {
        const docRef = doc(this.firestore, 'revoked_tokens', token)
        const docSnapshot = await getDoc(docRef)

        if(!docSnapshot || !docSnapshot.exists()){
            return null
        }

        const docData = docSnapshot.data() as FirestoreRevokedTokenData | undefined
        if(!docData){
            throw new Error('revoked_token document has no data')
        }

        const now = new Date().valueOf()
        if(now > docData.keepUntil.toDate().valueOf()){
            await this.deleteRevokedToken(token)
            return null
        }

        return{
            token: docData.token,
            createdAt: docData.createdAt.toDate(),
            keepUntil: docData.keepUntil.toDate(),
        }
    } 

    deleteRevokedToken = async (token: string): Promise<boolean> => {
        const docRef = doc(this.firestore, 'revoked_tokens', token)
        await deleteDoc(docRef)

        return true
    } 

    deleteAllTestUsers = async (): Promise<string[]> => {
        const collectionRef = collection(this.firestore, 'users')
        const docs = await getDocs(collectionRef)

        const toDelete: string[] = []
        docs.forEach(docSnapshot => {
            if(docSnapshot.id.includes('test')){
                toDelete.push(docSnapshot.id)
            }
        })

        await Promise.all(toDelete.map(documentId => {
            return deleteDoc(doc(this.firestore, 'users', documentId))
        }))

        return toDelete
    } 

    deleteAllRevokedTokens = async (): Promise<string[]> => {
        const collectionRef = collection(this.firestore, 'revoked_tokens')
        const docs = await getDocs(collectionRef)

        const toDelete: string[] = []
        docs.forEach(docSnapshot => {
            toDelete.push(docSnapshot.id)
        })

        await Promise.all(toDelete.map(documentId => {
            return deleteDoc(doc(this.firestore, 'revoked_tokens', documentId))
        }))

        return toDelete
    } 
}

export default DBFirestore