import {fabric} from "fabric";
import {Circle} from "fabric/fabric-impl";
import {Song} from "@/song/song";
import {VuMeter} from "@/audio/vu-meter";

export enum AnimationType {
    DEFAULT,
    Foo,
    Bar,
    Baz
}

export interface SongAnimation {
    setup(c: fabric.Canvas)

    draw(c: fabric.Canvas | null)
}

export function newDefaultAnimation(song: Song, fps: number) {
    return newAnimation(AnimationType.DEFAULT, song, fps)
}

export function newAnimation(type:AnimationType, song: Song, fps: number) {
    switch (type) {
        case AnimationType.DEFAULT:
        default:
            return new DefaultAnimation(song, fps)
    }
}

class DefaultAnimation implements SongAnimation {
    private static DEFAULT_RADIUS = 100
    private circle: Circle;
    private r = DefaultAnimation.DEFAULT_RADIUS
    private max = this.r + this.r * .5
    private min = this.r - this.r * .5
    private direction = 1
    private song: Song;
    private fps: number;
    private vu: VuMeter;

    constructor(song: Song, fps: number) {
        this.song = song
        this.fps = fps
        this.vu = song.newVuMeter(0.1, 0.3, fps)
    }

    setup(c: fabric.Canvas) {
        this.circle = new fabric.Circle({radius: this.r, selectable: false, left: c.width / 2, top: c.height / 2})
        c.add(this.circle)
    }

    draw(c: fabric.Canvas) {
        const transport = this.song.getTransport()
        if (transport?.isRunning()) {
            // this.r = analyzer.getLevel() * 100
            this.r = DefaultAnimation.DEFAULT_RADIUS + DefaultAnimation.DEFAULT_RADIUS * this.vu.getValue()

        } else {
            this.r += this.direction
            if (this.r <= this.min || this.r >= this.max) {
                this.direction *= -1
            }
        }

        this.circle.setRadius(this.r)
        this.circle.center()
    }
}