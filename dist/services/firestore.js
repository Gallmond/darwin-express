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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
// Import the functions you need from the SDKs you need
const app_1 = require("firebase/app");
const firestore_1 = require("firebase/firestore");
const dotenv_1 = __importDefault(require("dotenv"));
const auth_1 = require("./auth");
const user_1 = __importStar(require("../user"));
dotenv_1.default.config();
// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: 'AIzaSyCS311UBDUOh_oU-vOg2BgPN5ZKycRaQ6s',
    authDomain: 'darwin-express.firebaseapp.com',
    projectId: 'darwin-express',
    storageBucket: 'darwin-express.appspot.com',
    messagingSenderId: '873135243666',
    appId: '1:873135243666:web:cdad74ceae69e54bdd414b'
};
class FirestoreFunctions {
    firestore;
    static _instance;
    constructor(firestore) {
        this.firestore = firestore;
    }
    static get singleton() {
        if (!FirestoreFunctions._instance) {
            FirestoreFunctions._instance = FirestoreFunctions.make();
        }
        return FirestoreFunctions._instance;
    }
    static make() {
        // Initialize Firebase
        const app = (0, app_1.initializeApp)(firebaseConfig);
        const firestore = (0, firestore_1.getFirestore)(app);
        // attach emulators
        if (['local', 'test'].includes(process.env.NODE_ENV ?? 'false')) {
            console.log(`In ${process.env.NODE_ENV} mode. Attaching firestore emulator`);
            (0, firestore_1.connectFirestoreEmulator)(firestore, 'localhost', 8080);
        }
        return new FirestoreFunctions(firestore);
    }
    deleteAllRevokedTokens = async () => {
        const collectionRef = (0, firestore_1.collection)(this.firestore, 'revoked_tokens');
        const docs = await (0, firestore_1.getDocs)(collectionRef);
        const tokensToDelete = [];
        docs.forEach(docSnapshot => {
            tokensToDelete.push(docSnapshot.id);
        });
        const deletePromises = tokensToDelete.map(docId => {
            return (0, firestore_1.deleteDoc)((0, firestore_1.doc)(this.firestore, 'revoked_tokens', docId));
        });
        await Promise.all(deletePromises);
        return tokensToDelete;
    };
    deleteUser = async (identifier) => {
        await (0, firestore_1.deleteDoc)((0, firestore_1.doc)(this.firestore, 'users', identifier));
        return true;
    };
    deleteTestUsers = async () => {
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
    tokenIsRevoked = async (token) => {
        const tokenData = await this.getRevokedToken(token);
        return tokenData !== null && (tokenData.token === token);
    };
    getRevokedToken = async (token) => {
        const docRef = (0, firestore_1.doc)(this.firestore, 'revoked_tokens', token);
        const docSnapshot = await (0, firestore_1.getDoc)(docRef);
        // there is no such revoked token
        if (!docSnapshot || !docSnapshot.exists) {
            return null;
        }
        const data = docSnapshot.data();
        if (!data) {
            throw new Error('//TODO format existant document with no data error');
        }
        if (typeof data.token !== 'string' ||
            !(data.keepUntil instanceof firestore_1.Timestamp) ||
            !(data.createdAt instanceof firestore_1.Timestamp)) {
            throw new Error('//TODO define malformed data error');
        }
        /**
         * If the token exists but we're past the keepUntil date. Treat it as though
         * it's no longer revoked and delete it.
         */
        const now = new Date().valueOf();
        const keepUntilMs = data.keepUntil.toDate().valueOf();
        if (now > keepUntilMs) {
            await (0, firestore_1.deleteDoc)(docRef);
            return null;
        }
        return {
            token: data.token,
            keepUntil: data.keepUntil.toDate(),
            createdAt: data.createdAt.toDate(),
        };
    };
    addRevokedToken = async (token, daysToLive = 100) => {
        const docRef = (0, firestore_1.doc)(this.firestore, 'revoked_tokens', token);
        const createdAt = new Date();
        const dayInMilliseconds = 1000 * 60 * 60 * 24;
        const keepUntil = new Date(createdAt.valueOf() + (dayInMilliseconds * daysToLive));
        await (0, firestore_1.setDoc)(docRef, {
            token, keepUntil, createdAt
        });
    };
    createNewUser = async (username, plaintextPass) => {
        if (await this.getUserByUsername(username) !== null) {
            throw new Error(`${username} already exists`);
        }
        const user = new user_1.default(username, (0, auth_1.hashPassword)(plaintextPass));
        const docRef = (0, firestore_1.doc)(this.firestore, 'users', user.username).withConverter(user_1.userConverter);
        user.uid = docRef.id;
        await (0, firestore_1.setDoc)(docRef, user);
        return user;
    };
    getUserByUsername = async (username) => {
        const docRef = (0, firestore_1.doc)(this.firestore, 'users', username).withConverter(user_1.userConverter);
        const snapshot = await (0, firestore_1.getDoc)(docRef);
        return snapshot.exists() ? snapshot.data() : null;
    };
}
module.exports = FirestoreFunctions;
