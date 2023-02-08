import DBFirestore from './DBFirestore'
import DBMemory from './DBMemory'

const database = ['test', 'local'].includes(process.env.NODE_ENV ?? '')
    ? DBMemory
    : DBFirestore

export default database

