import {Darwin,SoapConnector} from 'darwin-ldb-node'
import { HTTP500DarwinException } from '../http/controllers/exceptions'
import User from '../user'

const d = new Darwin()

const userConnector = (user: User) => {
    const wsdlUrl = user.darwinWsdlUrl ?? null
    const accessToken = user.darwinAccessToken ?? null

    if(
        typeof wsdlUrl !== 'string'
        || typeof accessToken !== 'string'
    ){
        throw new HTTP500DarwinException('Could not get darwin config')
    }

    console.debug('creating soapConnector for user')
    return new SoapConnector(
        wsdlUrl, accessToken
    )
}

const darwinForService = async () => {
    const wsdlUrl = process.env.LDB_DARWIN_WSDL_URL ?? null
    const accessToken = process.env.LDB_DARWIN_ACCESS_TOKEN ?? null

    if(typeof wsdlUrl !== 'string' || typeof accessToken !== 'string'){
        throw new HTTP500DarwinException('Could not get darwin config')
    }

    d.connector = new SoapConnector(wsdlUrl, accessToken)
    await d.init()

    return d
}

const darwinForUser = async (user: User) => {
    console.debug('calling userconnector')
    d.connector = userConnector(user)
    console.debug('trying to init')
    await d.init()
    console.debug('init complete')

    return d
}

export {
    darwinForService,
    darwinForUser
}