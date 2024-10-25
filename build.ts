import fs from "fs/promises"
import path from "path"
const dirs = ['build', path.join('build', 'site')]
for (const dir of dirs) {
    try {
        await fs.mkdir(dir)
    } catch (err) {
        //
    }
}

await fs.writeFile(path.join('build', 'site', 'index.html'), await fs.readFile(path.join('src', 'html', 'index.html')))