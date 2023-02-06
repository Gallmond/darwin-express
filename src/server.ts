import app from './app'

const port = 5432

app.listen(port, () => {
    console.log(`listening on http://localhost:${port}`)
})