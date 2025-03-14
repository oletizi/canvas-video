// import {fabric} from "fabric";
import * as fabric from "fabric";
import {scale} from '@/lib/lib-core'
import {Song} from "@/song/song";
import {VuMeter} from "@/audio/vu-meter";
import {newWave, WaveOptions} from "@/video/wave";
import {Face} from "@/video/face";
import {Canvas} from "fabric";

export enum AnimationType {
    DEFAULT,
    PulsingEye,
    Wanderer,
    Waves,
    Face,
}

// TODO: Rename this to something more general—like, <Something>Component
export interface SongAnimation {
    setup(c: fabric.Canvas): void

    draw(c: fabric.Canvas): void
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
            return new Waves(song, fps)
        case AnimationType.Face:
        case AnimationType.DEFAULT:
        default:
            return new Face(song, fps)
    }
}

function getRandomInt(max: number) {
    return Math.floor(Math.random() * max);
}

class Waves implements SongAnimation {
    private song: Song;
    private fps: number;
    private readonly vu: VuMeter
    private stars: any[] = []
    // @ts-ignore
    private firmament: fabric.Group
    // @ts-ignore
    private wave1: SongAnimation
    // @ts-ignore
    private wave2: SongAnimation
    // @ts-ignore
    private waveOpts1: WaveOptions
    // @ts-ignore
    private waveOpts2: WaveOptions
    private count = 0

    constructor(song: Song, fps: number) {
        this.song = song
        this.fps = fps
        this.vu = song.newVuMeter(0.1, 0.3, fps)
    }

    setup(c: fabric.Canvas) {

        const w = c.width
        const h = c.height
        const background = new fabric.Rect({fill: '#333333', height: h, width: w})
        c.add(background)
        const s = []
        for (let i = 0; i < 2048; i++) {
            const dim = getRandomInt(5)
            const x = getRandomInt(w * 2)
            const y = getRandomInt(w * 2)
            const star = new fabric.Rect({fill: '#ffffff', height: dim, width: dim, top: y, left: x})
            this.stars.push({x: x, y: y, size: dim, star: star})
            s.push(star)
            c.add(star)
        }

        this.firmament = new fabric.Group(s)
        c.add(this.firmament)
        // this.firmament.center()

        this.waveOpts1 = {
            fill: '#aaaaaa',
            phase: 0,
            q: 1.2,
            speed: .001,
            vuMeter: this.song.newVuMeter(.001, .5, 60),
            // vuMeter: this.vu,
            waveHeight: h / 3,
            width: w,
            height: h,
        }
        this.waveOpts2 = {
            fill: "#999999",
            height: h,
            phase: 0.25,
            q: 1.2,
            speed: .0005,
            vuMeter: this.vu,
            waveHeight: h / 4,
            width: w
        }
        this.wave2 = newWave(this.waveOpts2)
        this.wave2.setup(c)

        this.wave1 = newWave(this.waveOpts1)
        this.wave1.setup(c)


        const spacing = 5
        const strokeWidth = 2
        const strokeColor = '#777777'
        const opacity = .2
        for (let i = 0; i < h; i += spacing) {
            const line = new fabric.Line([0, i, w, i], {
                stroke: strokeColor,
                strokeWidth: strokeWidth,
                opacity: opacity
            })
            c.add(line)
        }
    }

    draw(c: fabric.Canvas) {
        const h = c.height
        this.count++
        for (let i = 0; i < this.stars.length; i += 8) {
            const s = this.stars[i]
            const star = s.star
            const dim = s.size * (1 + this.vu.getValue() * 6)
            star.set('width', dim)
            star.set('height', dim)
            star.set('left', s.x - dim / 2)
            star.set('top', s.y - dim / 2)
        }

        this.waveOpts1.q = this.waveOpts2.q = scale(this.vu.getValue(), 0, 1, 1.2, 1.7)

        this.waveOpts1.waveHeight = scale(this.vu.getValue(), 0, 1, h / 3, h)
        this.waveOpts2.waveHeight = scale(this.vu.getValue(), 0, 1, h / 4, h)
        this.wave2.draw(c)
        this.wave1.draw(c)
        if (this.count % 10 == 0) {
            this.firmament.rotate(this.count / 360)
        }

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

        if (this.count >= 36000) {
            this.count = 0
        }
    }

}

class Wanderer implements SongAnimation {
    private static DEFAULT_RADIUS = 100

    private readonly song: Song
    private readonly vu: VuMeter
    private circle: fabric.Circle = new fabric.Circle({radius: Wanderer.DEFAULT_RADIUS})
    private direction = 1
    private x = 1
    private y = 0

    constructor(song: Song, fps: number) {
        this.song = song
        this.vu = song.newVuMeter(0.1, 0.5, fps)
    }

    setup(c: fabric.Canvas) {
        const w = c.width//this.w = c.width ? c.width : this.w
        this.y = w / 2
        this.x = Wanderer.DEFAULT_RADIUS + 1
        c.add(this.circle)
    }

    draw(c: Canvas) {
        const w = c.width//this.w = c?.width ? c.width : this.w
        const h = c.height//this.h = c?.height ? c.height : this.h
        const transport = this.song.getTransport()
        const r = this.circle.radius ? this.circle.radius : 10
        if (this.x - r <= 0 || this.x >= w - r) {
            this.direction *= -1
        }

        if (transport.isRunning()) {
            this.circle.setRadius(Wanderer.DEFAULT_RADIUS + Wanderer.DEFAULT_RADIUS * this.vu.getValue())
        }
        this.circle.top = (h / 2) - r
        this.x += this.direction
        this.circle.left = this.x - r
    }

}

class PulsingEye implements SongAnimation {
    private static DEFAULT_RADIUS = 100
    private r = PulsingEye.DEFAULT_RADIUS
    private circle: fabric.Circle = new fabric.Circle({radius: this.r})
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
        const w = c.width//this.w = c?.width ? c.width : this.w
        const h = c.height//this.h = c?.height ? c.height : this.h
        this.circle = new fabric.Circle({radius: this.r, selectable: false, left: w / 2, top: h / 2})
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
        // this.circle.center()
    }
}

