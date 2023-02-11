
export enum MILLISECONDS{
    HOUR = 1000 * 60 * 60,
    DAY = 1000 * 60 * 60 * 24,
}


export const daysBetweenDates = (dateOne: Date, dateTwo: Date): number => {
    const diff = Math.abs(dateOne.valueOf() - dateTwo.valueOf())

    return diff / MILLISECONDS.DAY
}

/**
 * only an actual boolean or string 'true' should be true
 */
export const boolOrNull = (val: unknown): boolean | null => {
    if(typeof val === null) return null
    
    if(typeof val === 'boolean') return val

    if(typeof val === 'string'){
        if(val.toLowerCase() === 'true') return true
        
        return false
    }

    return false
}