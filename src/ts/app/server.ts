import express from "express"
import path from "path"

const app = express()
const port = 3000

app.use(express.json())

app.use(express.static(path.join(process.cwd(), 'build', 'site', 'static'), {extensions: ['html']}))
// app.get('/', async (req, res) => {
//     res.sendFile(path.join(process.cwd(), 'build', 'site', 'index.html'))
// })
//
// app.get('/styles.css', async (req, res) => {
//     res.sendFile(path.join(process.cwd(), 'build', 'site', 'styles.css'))
// })
//
// app.get('/client.js', async (req, res) => {
//     res.sendFile(path.join(process.cwd(), 'build', 'site', 'client.js'))
// })
//
// app.get('/lyrics/waves.txt', async (req, res) => {
//     res.sendFile(path.join(process.cwd(), 'build', 'site', 'lyrics', 'waves.txt'))
// })
//
app.get('/assets/video/waves.mp4', async (req, res) => {
    res.sendFile(path.join(process.cwd(), 'assets', 'video', 'waves.mp4'))
})

app.listen(port, () => {
    console.log(`Converter app listening on port ${port}`)
})