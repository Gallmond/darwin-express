
import {QueryDocumentSnapshot, type FirestoreDataConverter, Timestamp} from 'firebase/firestore'

const userConverter: FirestoreDataConverter<User> = {
    toFirestore(user: User){
        return {
            username: user.username,
            hashedPassword: user.hashedPassword,
            createdAt: Timestamp.fromDate( user.createdAt ),
            updatedAt: Timestamp.fromDate( user.updatedAt ),
            requestCount: user.requestCount,
            darwinRequestCount: user.darwinRequestCount,
        }
    },
    fromFirestore(snapshot: QueryDocumentSnapshot){
        const {
            username,
            hashedPassword,
            createdAt,
            updatedAt,
            requestCount,
            darwinRequestCount,
        } = snapshot.data()
        
        const user = new User(
            username,
            hashedPassword,
            new Date(createdAt),
            new Date(updatedAt),
            requestCount,
            darwinRequestCount,
        )

        user.uid = snapshot.id

        return user
    }
}

class User{
    username: string
    hashedPassword: string
    createdAt: Date
    updatedAt: Date
    requestCount: number
    darwinRequestCount: number

    _uid: string | undefined

    constructor(
        username: string,
        hashedPassword: string,
        createdAt: Date = new Date(),
        updatedAt: Date = new Date(),
        requestCount = 0,
        darwinRequestCount = 0,
    ){
        this.username = username
        this.hashedPassword = hashedPassword
        this.createdAt = createdAt
        this.updatedAt = updatedAt
        this.requestCount = requestCount
        this.darwinRequestCount = darwinRequestCount
    }

    static make(username: string, hashedPassword: string){
        const now = new Date()
        
        return new User( username, hashedPassword, now, now, 0, 0 )
    }

    get uid(){
        if(!this._uid) throw new Error('uid accessed before initialisation')

        return this._uid
    }

    set uid(val: string){
        if(this._uid) throw new Error('uid already set')

        this._uid = val
    }

}

export {userConverter}
export default User
