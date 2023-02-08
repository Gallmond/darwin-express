import {daysBetweenDates, MILLISECONDS} from '../src/services/utils'

describe('misc utility functions', () => {

    test('daysBetweenDates', () => {
        const now = new Date()
        const future = new Date( now.valueOf() + (MILLISECONDS.DAY * 5) )
        const past = new Date( now.valueOf() - (MILLISECONDS.DAY * 2.5) )
        
        expect(daysBetweenDates(now, future)).toBe(5)
        expect(daysBetweenDates(now, past)).toBe(2.5)
    })

})