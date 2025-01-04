import {fabric} from "fabric";
import {scale} from '@/lib/lib-core'
import {Song} from "@/song/song";
import {VuMeter} from "@/audio/vu-meter";
import {newWave, WaveOptions} from "@/video/wave";

export enum AnimationType {
    DEFAULT,
    PulsingEye,
    Wanderer,
    Waves,
}

// TODO: Rename this to something more general—like, <Something>Component
export interface SongAnimation {
    setup(c: fabric.Canvas)

    draw(c: fabric.Canvas | null)
}

export function newDefaultAnimation(song: Song, fps: number) {
    return newAnimation(AnimationType.DEFAULT, song, fps)
}

export function newAnimation(type: AnimationType, song: Song, fps: number) {
    console.log(`New animation! type:`)
    console.log(type)
    switch (type) {
        case AnimationType.Wanderer:
            return new Wanderer(song, fps)
        case AnimationType.PulsingEye:
            return new PulsingEye(song, fps)
        case AnimationType.Waves:
        case AnimationType.DEFAULT:
        default:
            return new Waves(song, fps)
    }
}

class Waves implements SongAnimation {
    private song: Song;
    private fps: number;
    private readonly vu: VuMeter;
    // line = new fabric.Line([10, 0, 10, 100], {stroke: "black"})
    // private readonly path = new fabric.Path('M10 10 L10 100 L20 100', {stroke: "black"})
    private wave: SongAnimation
    private waveOpts1: WaveOptions;

    constructor(song: Song, fps: number) {
        this.song = song;
        this.fps = fps;
        this.vu = song.newVuMeter(0.1, 0.3, fps)
    }

    setup(c: fabric.Canvas) {
        this.waveOpts1 = {
            height: c.height / 1,
            phase: 0,
            q: 1.2,
            speed: 1,
            vuMeter: this.vu,
            waveHeight: c.height / 2,
            width: c.width / 1
        };
        this.wave = newWave(this.waveOpts1)
        this.wave.setup(c)
    }

    draw(c: fabric.Canvas | null) {
        if (this.song.getTransport().isRunning()) {
            this.waveOpts1.q = scale(this.vu.getValue(), 0, 1, 1.2, 1.7)
            this.waveOpts1.waveHeight = scale(this.vu.getValue(), 0, 1, c?.height / 3, c?.height / 1)
            this.wave.draw(c)
        }
    }

}

class Wanderer implements SongAnimation {
    private static DEFAULT_RADIUS = 100

    private readonly song: Song
    private readonly vu: VuMeter
    private readonly fps: number
    private circle: fabric.Circle
    private direction = 1
    private x = 1
    private y = 0

    constructor(song: Song, fps: number) {
        this.song = song
        this.fps = fps
        this.vu = song.newVuMeter(0.1, 0.5, fps)
    }

    setup(c: fabric.Canvas) {
        this.y = c.width / 2
        this.circle = new fabric.Circle({radius: Wanderer.DEFAULT_RADIUS})
        this.x = Wanderer.DEFAULT_RADIUS + 1
        c.add(this.circle)
    }

    draw(c: fabric.Canvas | null) {
        const transport = this.song.getTransport()
        if (this.x - this.circle.radius <= 0 || this.x >= c.width - this.circle.radius) {
            this.direction *= -1
        }


        if (transport.isRunning()) {
            this.circle.setRadius(Wanderer.DEFAULT_RADIUS + Wanderer.DEFAULT_RADIUS * this.vu.getValue())
        }
        this.circle.top = (c.height / 2) - this.circle.radius
        this.x += this.direction
        this.circle.left = this.x - this.circle.radius
    }

}

class PulsingEye implements SongAnimation {
    private static DEFAULT_RADIUS = 100
    private circle: fabric.Circle;
    private r = PulsingEye.DEFAULT_RADIUS
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
            this.r = PulsingEye.DEFAULT_RADIUS + PulsingEye.DEFAULT_RADIUS * this.vu.getValue()

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

