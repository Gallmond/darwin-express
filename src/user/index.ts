
import {QueryDocumentSnapshot, type FirestoreDataConverter, Timestamp} from 'firebase/firestore'

/**
 * tells fireStore how to:
 * - transform User instance and convert it into document data
 * - take document data and return User instance
 */
const userConverter: FirestoreDataConverter<User> = {
    toFirestore(user: User){
        return {
            username: user.username,
            hashedPassword: user.hashedPassword,
            createdAt: Timestamp.fromDate( user.createdAt ),
            updatedAt: Timestamp.fromDate( user.updatedAt ),
            requestCount: user.requestCount,
            darwinRequestCount: user.darwinRequestCount,
            darwinWsdlUrl: user.darwinWsdlUrl,
            darwinAccessToken: user.darwinAccessToken,
        }
    },
    fromFirestore(snapshot: QueryDocumentSnapshot){
        const data = snapshot.data()
        
        const user = new User(
            data.username,
            data.hashedPassword,
            new Date(data.createdAt),
            new Date(data.updatedAt),
            data.requestCount,
            data.darwinRequestCount,
            data.darwinWsdlUrl,
            data.darwinAccessToken,
        )

        user.uid = snapshot.id

        return user
    }
}

class User{
    constructor(
        public username: string,
        public hashedPassword: string,
        public createdAt = new Date(),
        public updatedAt = new Date(),
        public requestCount = 0,
        public darwinRequestCount = 0,
        public darwinWsdlUrl?: string,
        public darwinAccessToken?: string,
        private firebaseId?: string,
    ){ }

    get uid(){
        if(!this.firebaseId) throw new Error('uid accessed before initialisation')

        return this.firebaseId
    }

    set uid(val: string){
        if(this.firebaseId) throw new Error('uid already set')

        this.firebaseId = val
    }

    get json(){
        return {
            firebaseId : this.firebaseId,
            username: this.username,
            hashedPassword: this.hashedPassword,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            requestCount: this.requestCount,
            darwinRequestCount: this.darwinRequestCount,
        }
    }
}

export {userConverter}
export default User
