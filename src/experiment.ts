import app from './app'
import type { Express } from 'express'
import FirestoreFunctions from './services/firestore'

class CoolApplication{
    constructor(
        public expressApp: Express,
    ){
        // promotion
    }

    static make(){
        return new CoolApplication(
            app, // this comes initialised already
        )
    }

    listen(){
        this.expressApp.listen()
    }
}

export default CoolApplication