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
exports.createNewUser = exports.getUserByUsername = exports.deleteUser = exports.deleteTestUsers = void 0;
// Import the functions you need from the SDKs you need
const app_1 = require("firebase/app");
const firestore_1 = require("firebase/firestore");
const dotenv_1 = __importDefault(require("dotenv"));
const auth_1 = require("../auth");
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
// Initialize Firebase
const app = (0, app_1.initializeApp)(firebaseConfig);
const firestore = (0, firestore_1.getFirestore)(app);
// attach emulators
if (['local', 'test'].includes(process.env.NODE_ENV ?? 'false')) {
    console.log(`In ${process.env.NODE_ENV} mode. Attaching firestore emulator`);
    (0, firestore_1.connectFirestoreEmulator)(firestore, 'localhost', 8080);
}
/**
 * delete all docs in the 'users' collection that contains 'test' in its id
 */
const deleteTestUsers = async () => {
    const collectionRef = (0, firestore_1.collection)(firestore, 'users');
    const docs = await (0, firestore_1.getDocs)(collectionRef);
    const deletedIds = [];
    docs.forEach(async (docSnapshot) => {
        if (docSnapshot.id.includes('test')) {
            deletedIds.push(docSnapshot.id);
            await (0, exports.deleteUser)(docSnapshot.id);
        }
    });
    return deletedIds;
};
exports.deleteTestUsers = deleteTestUsers;
/**
 * deletes a doc in the 'users' collection by its id
 */
const deleteUser = async (identifier) => {
    await (0, firestore_1.deleteDoc)((0, firestore_1.doc)(firestore, 'users', identifier));
    return true;
};
exports.deleteUser = deleteUser;
/**
 * return User if it exists in the 'users' collection, or null
 */
const getUserByUsername = async (username) => {
    const docRef = (0, firestore_1.doc)(firestore, 'users', username).withConverter(user_1.userConverter);
    const snapshot = await (0, firestore_1.getDoc)(docRef);
    return snapshot.exists() ? snapshot.data() : null;
};
exports.getUserByUsername = getUserByUsername;
/**
 * creates a new User class and stores it in firebase. The username is the id
 */
const createNewUser = async (username, plaintextPass) => {
    if (await (0, exports.getUserByUsername)(username) !== null) {
        throw new Error(`${username} already exists`);
    }
    const user = new user_1.default(username, (0, auth_1.hashPassword)(plaintextPass));
    const docRef = (0, firestore_1.doc)(firestore, 'users', user.username).withConverter(user_1.userConverter);
    user.uid = docRef.id;
    await (0, firestore_1.setDoc)(docRef, user);
    return user;
};
exports.createNewUser = createNewUser;
