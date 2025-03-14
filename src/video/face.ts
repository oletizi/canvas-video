import {SongAnimation} from "@/video/song-animation";
import {Canvas, Circle, Rect} from "fabric"
import {Pixels} from "@/video/pixels";
import {Song} from "@/song/song";
import {VuMeter} from "@/audio/vu-meter";
import {scale} from "@/lib/lib-core";

export class Face implements SongAnimation {
    private readonly pixels: Pixels;
    private readonly ball: Circle;
    private readonly vu: VuMeter;
    private counter = 0
    private direction = 1

    constructor(song: Song, fps: number) {
        this.vu = song.newVuMeter(0.1, 0.3, fps)
        this.pixels = new Pixels(16, 16)
        this.ball = new Circle({radius: 5, top: 10, left: 10, fill: 'red'})
    }

    setup(c: Canvas): void {
        // background
        c.add(new Rect({
            width: c.width,
            height: c.height,
            fill: 'black'
        }))

        this.pixels.setup(c)
        this.pixels.set(4, 4, 'white')
        this.pixels.set(7, 3, '#ff3f00')
        this.pixels.set(7, 4, 'white')
        this.pixels.set(5, 7, 'white')
        this.pixels.set(6, 7, 'white')

        c.add(this.ball)
    }

    draw(c: Canvas): void {
        const level = this.vu.getValue()
        const mouth = scale(level, 0, 1, 0, 128, .5) + 128
        this.pixels.set(6, 8, `rgb(${mouth}, ${mouth}, ${mouth})`)
        this.pixels.draw(c)
        // this.ball.left = this.counter
        this.ball.set({left: level * 500})
        if (this.counter >= 255) {
            this.direction = -1
        }
        if (this.counter <= 128) {
            this.direction = 1
        }
        this.counter += this.direction
    }
}