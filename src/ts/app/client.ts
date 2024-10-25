import p5 from 'p5'
import {parseLyrics} from "./lyrics"
import {MotionText} from "./glib"
import {timecode2Millis} from "./timecode";

const SOURCE_FRAME_RATE = 29.9
const FRAME_RATE = 60
const textEaseFn = (t) => t + (1 - t) * 0.0047;

const textStart = {x: window.innerWidth, y: 300};
const textEnd = {x: 0, y: 300};
let textLaunchTime = 0
const textLaunchInterval = 100
const timeTexts = []

doIt().then(() => {
    console.log('Done.')
})

async function doIt() {

    const res = await fetch('/lyrics/waves.txt')
    const lyrics = await res.text()

    const parsed = parseLyrics(lyrics)
    console.log(`parsed: ${parsed}`)
    const tt0 = parsed[0]
    console.log(`tt0: ${JSON.stringify(tt0, null, 2)}`)
    const t0 = timecode2Millis(SOURCE_FRAME_RATE, parsed[0].time)

    for (const line of parsed) {
        textLaunchTime = timecode2Millis(SOURCE_FRAME_RATE, line.time) - t0
        const words = line.text.split(' ')
        for (const word of words) {
            timeTexts.push(new MotionText(word, textStart, textEnd, textEaseFn, textEaseFn, textLaunchTime))
            textLaunchTime += textLaunchInterval * word.length
        }
    }

    let sketch = function (p) {
        let time = 0
        p.setup = function () {
            p.createCanvas(window.innerWidth, window.innerHeight);
            p.textSize(16)
            p.frameRate(FRAME_RATE)
        }

        p.draw = function () {
            time += 1 / FRAME_RATE * 1000
            p.background(127);
            p.fill(255);

            p.textSize(48)
            for (const word of timeTexts) {
                word.setTime(time)
                word.draw(p)
            }
        }
    }

    const p = new p5(sketch)

}