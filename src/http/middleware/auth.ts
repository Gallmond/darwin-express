import { Request, RequestHandler } from 'express'
import { JsonWebTokenError, JwtPayload } from 'jsonwebtoken'
import { easyJwt } from '../../services/auth'
import { getUserByUsername } from '../../services/firestore'
import { HTTP401Unauthorized } from '../controllers/exceptions'

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
            payload = easyJwt.verifyJwt(token)    
        } catch (err) {
            next(new HTTP401Unauthorized(err instanceof Error ? err.message : 'unknown jwt error'))            
            return
        }  
        

        if(!payload.sub){
            next(new HTTP401Unauthorized('jwt missing subject'))
            return
        } 

        const user = await getUserByUsername(payload.sub)
        if(!user){
            next(new HTTP401Unauthorized('jwt subject not found'))
            return
        }

        req.auth = {user}
    }

    next()
}
