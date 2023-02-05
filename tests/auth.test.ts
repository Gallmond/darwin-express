import { hashPassword, passwordValid, verifyPassword } from '../src/auth'

describe('Auth utils', () => {

    test('passwordValid', () => {
        const minValidPass = 'this is 16 chars'
        expect(minValidPass.length).toBe(16)
        expect(passwordValid(minValidPass)).toBe(true)

        const maxInvalidPass = 'only 15 letters'
        expect(maxInvalidPass.length).toBe(15)
        expect(passwordValid(maxInvalidPass)).toBe(false)
    })

    test('hashPassword', () => {
        const secret = 'my cool pass'
        const hash = hashPassword( secret )

        expect(typeof hash).toBe('string')
        expect(hash.split('.').length).toBe(2)
    })

    test('verifyPassword success', () => {
        const secret = 'my cool pass'
        const hash = hashPassword( secret )

        expect(verifyPassword(secret, hash)).toBe(true)
    })

    test('verifyPassword failure', () => {
        const secret = 'my cool pass'
        const hash = hashPassword( secret )

        expect(verifyPassword(secret + 'foobar', hash)).toBe(false)
    })

})