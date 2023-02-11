import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import { Darwin } from 'darwin-ldb-node'
import { mkdirSync, writeFileSync } from 'fs'
dotenv.config()


/**
 * Some configuration to get this file to work
 */
dotenv.config()
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * we need a real darwin to get some services
 */
const d = await Darwin.make()

/**
 * with those services we can look up service details
 */
const getSomeServices = async () => {

    const response = await d.arrivalsAndDepartures({
        crs: 'NCL'
    })

    response.trainServices.forEach( async service => {
        const {serviceID} = service

        console.debug(`await d.serviceDetails( ${serviceID} )`)
        const serviceDetails = await d.serviceDetails( serviceID )

        const dirPath = `${__dirname}/stubs`
        const filePath = `${dirPath}/serviceDetails-${serviceID}.json`

        mkdirSync(dirPath, {recursive: true})
        writeFileSync(filePath, JSON.stringify(serviceDetails, null, 2), {encoding:'utf-8'})

        console.debug('write file', filePath)
    })
    
}

(async () => {
    await getSomeServices()
})()