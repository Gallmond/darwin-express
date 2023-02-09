import path from 'path'
import { writeFileSync, mkdirSync } from 'fs'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import { Darwin } from 'darwin-ldb-node'

/**
 * Some configuration to get this file to work
 */
dotenv.config()
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * instantiate the real service. This requires the env variables to be set
 */
const d = await Darwin.make()

/**
 * stub for request GET /arrivalsAndDepartures/NCL
 */
const allAtCrs = async () => {
    const options = {
        crs: 'NCL'
    }
    const response = await d.arrivalsAndDepartures(options)

    return {
        options, response
    }
}

/**
 * stub for request GET /arrivalsAndDepartures/NCL/to/KGX
 */
const csrToCrs = async () => {
    const options = {
        crs: 'NCL',
        filterCrs: 'KGX',
        filterType: 'to',
    }
    const response = await d.arrivalsAndDepartures(options)

    return {
        options, response
    }
}

/**
 * stub for request GET /arrivalsAndDepartures/NCL/from/KGX
 */
const csrFromCrs = async () => {
    const options = {
        crs: 'NCL',
        filterCrs: 'KGX',
        filterType: 'from',
    }
    const response = await d.arrivalsAndDepartures(options)

    return {
        options, response
    }
}

/**
 * save the request options and the response to a json file
 * {
 *   options: the argument given to darwin.arrivalsAndDepartures (ie, StationBoardInput)
 *   response: the returned object
 * }
 */
const makeStub = (options, response, name) => {
    // eslint-disable-next-line no-undef
    const dirPath = `${__dirname}/stubs`
    const filePath = `${dirPath}/${name}`
    const content = { options, response }

    mkdirSync(dirPath, {recursive: true})
    writeFileSync(filePath, JSON.stringify(content, null, 2), {encoding: 'utf-8'})

    console.log('wrote file', filePath)
}

(async () => {
    allAtCrs()
        .then(data => makeStub(data.options, data.response, 'AllAtCrs.json'))
    csrToCrs()
        .then(data => makeStub(data.options, data.response, 'CrsToCrs.json'))
    csrFromCrs()
        .then(data => makeStub(data.options, data.response, 'CrsFromCrs.json'))
})()




