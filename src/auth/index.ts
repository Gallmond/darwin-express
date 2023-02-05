import {scryptSync, randomBytes, timingSafeEqual} from 'node:crypto'

const getSalt = (): string => {
    return randomBytes(16).toString('hex')
}

export const passwordValid = (plaintextPassword: string): boolean => {
    return plaintextPassword.length >= 16
}

export const hashPassword = (plaintextPassword: string, providedSalt?: string): string => {
    const salt = providedSalt ?? getSalt()
    const hashedPassword = scryptSync(plaintextPassword, salt, 64).toString('hex')

    return [hashedPassword, salt].join('.')
}

export const verifyPassword = (plaintextPassword: string, storedHash: string): boolean => {
    const [storedHashedPassword, salt] = storedHash.split('.')
    const [providedHashedPassword] = hashPassword(plaintextPassword, salt).split('.')

    return timingSafeEqual(
        Buffer.from(storedHashedPassword, 'hex'),
        Buffer.from(providedHashedPassword, 'hex')
    )
}
