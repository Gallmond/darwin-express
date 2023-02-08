
export enum MILLISECONDS{
    HOUR = 1000 * 60 * 60,
    DAY = 1000 * 60 * 60 * 24,
}


export const daysBetweenDates = (dateOne: Date, dateTwo: Date): number => {
    const diff = Math.abs(dateOne.valueOf() - dateTwo.valueOf())

    return diff / MILLISECONDS.DAY
}