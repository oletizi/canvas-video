import p5 from 'p5'
import {MotionText} from "./glib"

const FRAME_RATE = 60
const textEaseFn = (t) => t + (1 - t) * 0.0047;

const textStart = {x: window.innerWidth, y: 300};
const textEnd = {x: 0, y: 300};
let textLaunchTime = 0
const textLaunchInterval = 200
const words = []
const lyrics = "All those trees along the bank reached into the earth and drank, watched our raft float slowly by"
    + " underneath an angry sky."
    + " All we'd ever known was gone, we were barely holding on"
    + " victims both of shipwrecks underneath an angry sky... underneath an angry sky"

for (const word of lyrics.split(' ')) {
    words.push(new MotionText(word, textStart, textEnd, textEaseFn, textEaseFn, textLaunchTime))
    textLaunchTime += textLaunchInterval * word.length
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
        for (const word of words) {
            word.setTime(time)
            word.draw(p)
        }
    }
}

const p = new p5(sketch)

