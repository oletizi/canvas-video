import express from "express"
import path from "path"

const app = express()
const port = 3000

app.use(express.json())

app.use(express.static(path.join(process.cwd(), 'build', 'site', 'static'), {extensions: ['html']}))

app.get('/assets/video/waves.mp4', async (req, res) => {
    res.sendFile(path.join(process.cwd(), 'assets', 'video', 'waves.mp4'))
})

app.listen(port, () => {
    console.log(`Converter app listening on port ${port}`)
})