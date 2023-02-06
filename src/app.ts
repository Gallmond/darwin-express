import express, { ErrorRequestHandler } from 'express'

const app = express()

import authController from './http/controllers/auth'
import { BaseError, HTTP401Unauthorized } from './http/controllers/exceptions'
import { processJwt } from './http/middleware/auth'

// global middleware
app.use(express.json())
app.use(processJwt)

app.get('/hello-world', (req, res) => {
    res.status(200).json({message: 'hello world'})
})
app.get('/guarded', async (req, res, next) => {
    if(!req.auth){
        next(new HTTP401Unauthorized('Guarded route without token'))
        return
    }

    res.status(200).json(req.auth.user)
})

app.use(authController)


// global error handler
const globalErrorHandler: ErrorRequestHandler = (err, req, res, next) => {
    if(err instanceof BaseError){
        res.status(err.code).json(err.json).end()
        return
    }

    console.error('encountered unhandled error', {err})
    next(err)
}
app.use(globalErrorHandler)

export default app