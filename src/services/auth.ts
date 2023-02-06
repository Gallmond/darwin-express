import EasyJWT from 'easy-jwt'
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

export const easyJwt = new EasyJWT({
    secret: process.env.JWT_SECRET ?? randomBytes(12).toString('hex'),
    audience: process.env.JWT_AUD ?? 'darwin-express',
    accessToken: {expiresIn: 60 * 60 * 24 },
    refreshToken: {expiresIn: 60 * 60 * 24 * 7 },
})
