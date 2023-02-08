import { Request, RequestHandler } from 'express'
import { JwtPayload } from 'jsonwebtoken'
import { easyJwt } from '../../services/auth'
import { HTTP401Unauthorized } from '../controllers/exceptions'
import database from '../../services/database'

const db = database.singleton()

const getBearerToken = (req: Request): string | null => {
    const header = req.get('authorization')
    if(!header) return null
    
    const [type, token] = header.split(' ')

    if(type.toLowerCase() !== 'bearer') return null

    return token
}

export const processJwt: RequestHandler = async (req, res, next) => {
    const token = getBearerToken(req)

    if(token){
        let payload: JwtPayload | undefined
        try {
            payload = await easyJwt.verifyJwt(token)    
        } catch (err) {
            next(new HTTP401Unauthorized(err instanceof Error ? err.message : 'unknown jwt error'))            
            return
        }  
        
        if(!payload.sub){
            next(new HTTP401Unauthorized('jwt missing subject'))
            return
        } 

        const revokedTokenData = await db.getRevokedToken( token )
        if(revokedTokenData){
            next(new HTTP401Unauthorized('token revoked'))
            return
        }

        const user = await db.getUser( payload.sub )
        if(!user){
            next(new HTTP401Unauthorized('jwt subject not found'))
            return
        }

        req.auth = {user}
    }

    next()
}
