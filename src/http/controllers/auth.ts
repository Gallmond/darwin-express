import router, { Request } from 'express'
import { createNewUser, getUserByUsername } from '../../services/firestore'
import { HTTP401Unauthorized, HTTP422UnprocessableEntity } from './exceptions'
import { easyJwt } from '../../services/auth'
import { verifyPassword } from '../../services/auth'

const authController = router()

const validLoginParams = (req: Request): boolean => {
    return req.body && req.body.username && req.body.password
}

authController.post('/refresh', async (req, res, next) => {
    const { refreshToken } = req.body
    if(!refreshToken){
        next(new HTTP422UnprocessableEntity('missing refreshToken'))
        return
    }

    let accessToken: string | undefined
    try {
        accessToken = easyJwt.refreshJwt(refreshToken)
    } catch (error) {
        next(new HTTP422UnprocessableEntity(
            error instanceof Error ? error.message : 'refresh token invalid'
        ))
        return
    }
    
    res.status(200).json({accessToken})

})

authController.post('/register', async (req, res, next) => {
    if(!validLoginParams(req)){
        next(new HTTP422UnprocessableEntity('Invalid username or password'))
        return
    }

    const {username, password} = req.body

    // if this user exists return 422
    const existingUser = await getUserByUsername(username)
    if(existingUser !== null){
        next(new HTTP422UnprocessableEntity('Username must be unique'))
        return
    }

    // create user
    const newUser = await createNewUser(username, password)

    // generate a JWT
    const {accessToken, expiresIn, refreshToken} = easyJwt.createTokens(
        newUser.uid
    )

    res.status(201).json({ accessToken, expiresIn, refreshToken })
})

authController.post('/auth', async (req, res, next) => {
    if(!validLoginParams(req)){
        next(new HTTP422UnprocessableEntity('Invalid username or password'))
        return
    }

    const {username, password} = req.body

    // get user
    const existingUser = await getUserByUsername(username)
    
    // error if not exist
    if(existingUser===null){
        next(new HTTP401Unauthorized('no such user'))
        return
    }

    // error if pass invalid
    if(!verifyPassword(password, existingUser.hashedPassword)){
        next(new HTTP401Unauthorized('invalid credentials'))
        return
    }

    // get tokens
    const {accessToken, expiresIn, refreshToken} = easyJwt.createTokens(
        existingUser.uid
    )

    res.status(200).json({ accessToken, expiresIn, refreshToken })

})

export default authController