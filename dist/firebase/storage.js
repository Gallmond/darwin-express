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
Object.defineProperty(exports, "__esModule", { value: true });
exports.createFirestoreUser = exports.getUserByUsername = void 0;
// Import the functions you need from the SDKs you need
const app_1 = require("firebase/app");
const firestore_1 = require("firebase/firestore");
const user_1 = __importStar(require("../user"));
const auth_1 = require("../utils/auth");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: 'AIzaSyCS311UBDUOh_oU-vOg2BgPN5ZKycRaQ6s',
    authDomain: 'darwin-express.firebaseapp.com',
    projectId: 'darwin-express',
    storageBucket: 'darwin-express.appspot.com',
    messagingSenderId: '873135243666',
    appId: '1:873135243666:web:cdad74ceae69e54bdd414b',
};
// Initialize Firebase
const app = (0, app_1.initializeApp)(firebaseConfig);
const firestore = (0, firestore_1.getFirestore)(app);
if (process.env.NODE_ENV === 'local' || process.env.NODE_ENV === 'test') {
    const hostName = 'localhost';
    const firestorePort = 8080;
    (0, firestore_1.connectFirestoreEmulator)(firestore, hostName, firestorePort);
    console.log(`connected firestore emulator ${hostName}:${firestorePort}`);
}
const getUserByUsername = async (username) => {
    const ref = (0, firestore_1.doc)(firestore, 'users', username).withConverter(user_1.userConverter);
    const snapshot = await (0, firestore_1.getDoc)(ref);
    return snapshot.exists()
        ? snapshot.data()
        : null;
};
exports.getUserByUsername = getUserByUsername;
const createFirestoreUser = async (username, password) => {
    const existing = await (0, exports.getUserByUsername)(username);
    if (existing !== null) {
        throw new Error(`${username} is taken`);
    }
    const now = new Date();
    const hashedPassword = (0, auth_1.hashPassword)(password);
    const ref = (0, firestore_1.doc)(firestore, 'users', username).withConverter(user_1.userConverter);
    const user = new user_1.default(username, hashedPassword, now, now, 0, 0);
    await (0, firestore_1.setDoc)(ref, user);
    user.setUid(username);
    return user;
};
exports.createFirestoreUser = createFirestoreUser;
