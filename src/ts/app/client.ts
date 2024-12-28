import p5 from 'p5'
import {parseLyrics} from "./lyrics"
import {MotionText} from "./glib"
import {timecode2Millis} from "./timecode"
import {Audiator} from '@/audio/audiator'

const SOURCE_FRAME_RATE = 29.9
const FRAME_RATE = 60
const textEaseFn = (t) => t + (1 - t) * 0.0047;

const lowerThird = 2 * window.innerHeight / 3

const textStart = {x: window.innerWidth, y: lowerThird};
const textEnd = {x: 0, y: lowerThird};
let textLaunchTime = 0
const textLaunchInterval = 100
const timeTexts = []
doIt().then(() => {
    console.log('Done.')

})



async function doIt() {

    let audiator

    const res = await fetch('/lyrics/waves.txt')
    const lyrics = await res.text()

    const parsed = parseLyrics(lyrics)
    const tt0 = parsed[0]
    const t0 = timecode2Millis(SOURCE_FRAME_RATE, parsed[0].time)
    for (const line of parsed) {
        textLaunchTime = timecode2Millis(SOURCE_FRAME_RATE, line.time)// - t0
        const words = line.text.split(' ')
        for (const word of words) {
            timeTexts.push(new MotionText(word, textStart, textEnd, textEaseFn, textEaseFn, textLaunchTime))
            textLaunchTime += textLaunchInterval * word.length
        }
    }

    let sketch = function (p) {
        let time = 0
        let video
        let playing = false
        p.preload = function () {
            video = p.createVideo(['/assets/video/waves.mp4'])
        }
        p.setup = function () {
            p.createCanvas(window.innerWidth, window.innerHeight);
            p.textSize(16)
            p.frameRate(FRAME_RATE)
            // video.showControls()
            video.hide()
        }

        p.draw = function () {
            if (playing) {
                time += 1 / FRAME_RATE * 1000
            }
            p.background(127);
            p.fill(255);

            p.image(video, 0, 0, window.innerWidth)

            p.textSize(48)
            if (playing) {
                for (const word of timeTexts) {
                    word.setTime(time)
                    word.draw(p)
                }
            }


            p.mousePressed = function () {
                if (audiator == undefined) {
                    audiator = new Audiator(new AudioContext())
                }
                // When the canvas is clicked, check to see if the videos are
                // paused or playing. If they are playing, pause the videos.
                if (playing) {
                    console.log(`Pausing!`)
                    video.pause()
                    audiator.pause()
                } else {
                    // If they are paused, play the videos.
                    console.log(`Playing!`)
                    video.loop()
                    audiator.play()
                }

                // Change the playing value to the opposite boolean.
                playing = !playing;
            }
        }
    }

    const p = new p5(sketch)

}