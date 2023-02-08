import router, { Request } from 'express'
import { HTTP401Unauthorized, HTTP422UnprocessableEntity } from './exceptions'
import { easyJwt } from '../../services/auth'
import { verifyPassword } from '../../services/auth'
import { daysBetweenDates } from '../../services/utils'
import database from '../../services/database'

const db = database.singleton()

const authController = router()

const validLoginParams = (req: Request): boolean => {
    return req.body && req.body.username && req.body.password
}

authController.post('/revoke', async (req, res, next) => {
    const { token } = req.body

    if(!token){
        next(new HTTP422UnprocessableEntity('missing token'))
        return
    }

    // only keep as long as it is valid
    const tokenData = easyJwt.decode( token )
    if(
        tokenData === null ||
        typeof tokenData.payload === 'string'
    ){
        next(new HTTP422UnprocessableEntity('token could not be decoded'))
        return
    }
    
    const { payload: { exp }} = tokenData

    /**
     * if token has expiry only keep it for as many days until that expiry
     * default 7 days
     */
    const daysToKeep = exp
        ? daysBetweenDates(new Date(), new Date(exp * 1000))
        : 7

    await db.createRevokedToken(token, daysToKeep)

    res.status(200).send()
})

authController.post('/refresh', async (req, res, next) => {
    const { refreshToken } = req.body
    if(!refreshToken){
        next(new HTTP422UnprocessableEntity('missing refreshToken'))
        return
    }

    let accessToken: string | undefined
    try {
        accessToken = await easyJwt.refreshJwt(refreshToken)
    } catch (error) {
        next(new HTTP401Unauthorized(
            error instanceof Error ? error.message : 'refresh token invalid'
        ))
        return
    }

    const revokedTokenData = await db.getRevokedToken( refreshToken )
    if(revokedTokenData){
        next(new HTTP401Unauthorized('refresh token revoked'))
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
    const existingUser = await db.getUser( username )
    if(existingUser !== null){
        next(new HTTP422UnprocessableEntity('Username must be unique'))
        return
    }

    // create user
    const newUser = await db.createUser(username, password)

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
    const existingUser = await db.getUser( username )
        
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