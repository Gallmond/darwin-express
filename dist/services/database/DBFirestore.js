"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("firebase/app");
const firestore_1 = require("firebase/firestore");
const user_1 = __importStar(require("../../user"));
const auth_1 = require("../auth");
const types_1 = require("./types");
const utils_1 = require("../utils");
class DBFirestore extends types_1.DBClass {
    firestore;
    static instance;
    constructor(firestore) {
        super();
        this.firestore = firestore;
    }
    static make = () => {
        //TODO move to env?
        const firebaseConfig = {
            apiKey: 'AIzaSyCS311UBDUOh_oU-vOg2BgPN5ZKycRaQ6s',
            authDomain: 'darwin-express.firebaseapp.com',
            projectId: 'darwin-express',
            storageBucket: 'darwin-express.appspot.com',
            messagingSenderId: '873135243666',
            appId: '1:873135243666:web:cdad74ceae69e54bdd414b'
        };
        const app = (0, app_1.initializeApp)(firebaseConfig);
        const firestore = (0, firestore_1.getFirestore)(app);
        // attach emulators
        if (['local', 'test'].includes(process.env.NODE_ENV ?? 'false')) {
            console.log(`In ${process.env.NODE_ENV} mode. Attaching firestore emulator`);
            (0, firestore_1.connectFirestoreEmulator)(firestore, 'localhost', 8080);
        }
        return new DBFirestore(firestore);
    };
    static singleton = () => {
        if (DBFirestore.instance === undefined) {
            DBFirestore.instance = DBFirestore.make();
        }
        return DBFirestore.instance;
    };
    createUser = async (username, plaintextPassword) => {
        const existingUser = this.getUser(username);
        if (existingUser !== null) {
            throw new Error(`${username} already exists`);
        }
        const user = new user_1.default(username, (0, auth_1.hashPassword)(plaintextPassword));
        const docRef = (0, firestore_1.doc)(this.firestore, 'users', user.username).withConverter(user_1.userConverter);
        user.uid = docRef.id;
        await (0, firestore_1.setDoc)(docRef, user);
        return user;
    };
    getUser = async (username) => {
        const docRef = (0, firestore_1.doc)(this.firestore, 'users', username).withConverter(user_1.userConverter);
        const snapshot = await (0, firestore_1.getDoc)(docRef);
        return snapshot.exists() ? snapshot.data() : null;
    };
    updateUser = async (username, fields) => {
        const docRef = (0, firestore_1.doc)(this.firestore, 'users', username).withConverter(user_1.userConverter);
        await (0, firestore_1.setDoc)(docRef, fields, { merge: true });
        return true;
    };
    deleteUser = async (username) => {
        await (0, firestore_1.deleteDoc)((0, firestore_1.doc)(this.firestore, 'users', username));
        return true;
    };
    createRevokedToken = async (token, daysToLive = 7) => {
        const createdAt = new Date();
        const keepUntil = new Date(createdAt.valueOf() + (utils_1.MILLISECONDS.DAY * daysToLive));
        const data = {
            token, keepUntil, createdAt
        };
        const docRef = (0, firestore_1.doc)(this.firestore, 'revoked_tokens', token);
        await (0, firestore_1.setDoc)(docRef, data);
        return data;
    };
    getRevokedToken = async (token) => {
        const docRef = (0, firestore_1.doc)(this.firestore, 'revoked_tokens', token);
        const docSnapshot = await (0, firestore_1.getDoc)(docRef);
        if (!docSnapshot || !docSnapshot.exists()) {
            return null;
        }
        const docData = docSnapshot.data();
        if (!docData) {
            throw new Error('revoked_token document has no data');
        }
        const now = new Date().valueOf();
        if (now > docData.keepUntil.toDate().valueOf()) {
            await this.deleteRevokedToken(token);
            return null;
        }
        return {
            token: docData.token,
            createdAt: docData.createdAt.toDate(),
            keepUntil: docData.keepUntil.toDate(),
        };
    };
    deleteRevokedToken = async (token) => {
        const docRef = (0, firestore_1.doc)(this.firestore, 'revoked_tokens', token);
        await (0, firestore_1.deleteDoc)(docRef);
        return true;
    };
    deleteAllTestUsers = async () => {
        const collectionRef = (0, firestore_1.collection)(this.firestore, 'users');
        const docs = await (0, firestore_1.getDocs)(collectionRef);
        const toDelete = [];
        docs.forEach(docSnapshot => {
            if (docSnapshot.id.includes('test')) {
                toDelete.push(docSnapshot.id);
            }
        });
        await Promise.all(toDelete.map(documentId => {
            return (0, firestore_1.deleteDoc)((0, firestore_1.doc)(this.firestore, 'users', documentId));
        }));
        return toDelete;
    };
    deleteAllRevokedTokens = async () => {
        const collectionRef = (0, firestore_1.collection)(this.firestore, 'revoked_tokens');
        const docs = await (0, firestore_1.getDocs)(collectionRef);
        const toDelete = [];
        docs.forEach(docSnapshot => {
            toDelete.push(docSnapshot.id);
        });
        await Promise.all(toDelete.map(documentId => {
            return (0, firestore_1.deleteDoc)((0, firestore_1.doc)(this.firestore, 'revoked_tokens', documentId));
        }));
        return toDelete;
    };
}
exports.default = DBFirestore;
