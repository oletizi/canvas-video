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
    private readonly vu: VuMeter
    private wave1: SongAnimation
    private wave2: SongAnimation
    private waveOpts1: WaveOptions
    private waveOpts2: WaveOptions

    constructor(song: Song, fps: number) {
        this.song = song
        this.fps = fps
        this.vu = song.newVuMeter(0.1, 0.3, fps)
    }

    setup(c: fabric.Canvas) {
        const background = new fabric.Rect({fill: '#333333', height: c.height, width: c.width})
        c.add(background)

        this.waveOpts1 = {
            fill: '#aaaaaa',
            phase: 0,
            q: 1.2,
            speed: .001,
            vuMeter: this.vu,
            waveHeight: c.height / 3,
            width: c.width / 1,
            height: c.height / 1,
        }
        this.waveOpts2 = {
            fill: "#999999",
            height: c.height / 1,
            phase: 0.25,
            q: 1.2,
            speed: .0005,
            vuMeter: this.vu,
            waveHeight: c.height / 4,
            width: c.width / 1
        }
        this.wave1 = newWave(this.waveOpts1)
        this.wave1.setup(c)

        this.wave2 = newWave(this.waveOpts2)
        this.wave2.setup(c)
    }

    draw(c: fabric.Canvas) {
        this.waveOpts1.q = this.waveOpts2.q = scale(this.vu.getValue(), 0, 1, 1.2, 1.7)

        this.waveOpts1.waveHeight = scale(this.vu.getValue(), 0, 1, c?.height / 3, c?.height / 1)
        this.waveOpts2.waveHeight = scale(this.vu.getValue(), 0, 1, c?.height / 4, c?.height / 1)
        this.wave2.draw(c)
        this.wave1.draw(c)

        if (this.waveOpts2.phase >= 1) {
            this.waveOpts2.phase = 0
        } else {
            this.waveOpts2.phase += this.waveOpts2.speed
        }

        if (this.waveOpts1.phase >= 1) {
            this.waveOpts1.phase = 0
        } else {
            this.waveOpts1.phase += this.waveOpts1.speed
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

