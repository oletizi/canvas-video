import {SongAnimation} from "@/video/song-animation";
import {fabric} from "fabric"
import {Pixels} from "@/video/pixels";

export class Face implements SongAnimation {
    private readonly pixels: Pixels;
    private counter = 0
    private direction = 1
    private ball: fabric.Circle;

    constructor() {
        this.pixels = new Pixels(16, 16)
        this.ball = new fabric.Circle({radius: 5, top: 10, left: 10, fill: 'red'})
    }

    setup(c: fabric.Canvas): void {
        // background
        c.add(new fabric.Rect({
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

    draw(c: fabric.Canvas | null): void {
        this.pixels.set(6, 8, `rgb(${this.counter}, ${this.counter}, ${this.counter})`)
        this.pixels.draw(c)
        // this.ball.left = this.counter
        this.ball.set({left: this.counter})
        if (this.counter >= 255) {
            this.direction = -1
        }
        if (this.counter <=128) {
            this.direction = 1
        }
        this.counter += this.direction
    }
}