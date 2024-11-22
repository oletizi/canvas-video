import fs from "fs/promises"
import path from "path"

const dirs = ['build', path.join('build', 'site'), path.join('build', 'site', 'lyrics')]
for (const dir of dirs) {
    try {
        await fs.mkdir(dir)
    } catch (err) {
        //
    }
}

const copyFiles = [
    {
        from: path.join('src', 'html', 'index.html'),
        to: path.join('build', 'site', 'index.html')
    },
    {
        from: path.join('src', 'lyrics', 'waves.txt'),
        to: path.join('build', 'site', 'lyrics', 'waves.txt')
    },
]

for (const spec of copyFiles) {
    await fs.writeFile(spec.to, await fs.readFile(spec.from))
}


// await fs.writeFile(path.join('build', 'site', 'index.html'), await fs.readFile(path.join('src', 'html', 'index.html')))
// await fs.writeFile(path.join('build', 'site', 'lyrics', 'waves.txt'), await fs.readFile(path.join('src', 'lyrics', 'waves.txt')))