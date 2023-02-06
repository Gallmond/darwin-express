import supertest from 'supertest'
import app from '../src/app'

describe('express', () => {

    const service = supertest(app)

    test('express app boots', async () => {
        const response = await service
            .get('/hello-world')
            .expect(200)
        
        expect(response.body).toEqual({message: 'hello world'})    
    })
})