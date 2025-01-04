import {fabric} from "fabric";
import {scale} from "@/lib/lib-core"
import {VuMeter} from "@/audio/vu-meter";
import {SongAnimation} from "@/video/song-animation";
import {WaveOptions} from "@/sketch/waves";

export interface WaveOptions {
    width: number
    height: number
    waveHeight: number
    phase: number
    speed: number
    vuMeter: VuMeter
    q: number
}


interface Point {
    x: number
    y: number
}

class CurveSegment {
    target
    handle

    constructor(target, handle) {
        this.target = target
        this.handle = handle
    }

    toString() {
        return ` S ${this.handle?.x} ${this.handle?.y}, ${this.target?.x} ${this.target?.y}`
    }
}

class Curve {
    segments: CurveSegment[] = []
    origin: Point
    target: Point

    handle1: Point
    handle2: Point

    constructor(origin: Point, target: Point, handle1: Point, handle2: Point) {
        this.origin = origin
        this.target = target
        this.handle1 = handle1
        this.handle2 = handle2
    }

    append(segment: CurveSegment) {
        this.segments.push(segment)
        return this
    }


    toString(): string {
        let s = `M ${this.origin?.x} ${this.origin?.y} C ${this.handle1?.x} ${this.handle1?.y},`
        s += `  ${this.handle2?.x} ${this.handle2.y}, ${this.target?.x} ${this.target?.y}`
        s += ` ${this.segments.join(' ')}`
        return s;
    }
}

export function newWave(opts: WaveOptions): SongAnimation {
    return new Wave(opts)
}

class Wave implements SongAnimation {
    private readonly opts: WaveOptions;
    private path: fabric.Path

    constructor(opts: WaveOptions) {
        this.opts = opts
    }

    setup(c: fabric.Canvas) {
        this.path = new fabric.Path(this.calculate(c).toString())
        c.add(this.path)
    }

    private calculate(c: null | fabric.Canvas): Curve {
        const h = c.height
        const w = c.width
        const center = w / 2
        const crest = h - this.opts.waveHeight
        const unit = w / 4
        let q = this.opts.q
        const crestCoefficient = 1 + 1 - q
        const baseCoefficient = q
        const origin = {x: 0, y: h} as Point
        const target = {x: center, y: crest} as Point

        const curve = new Curve(origin, target, {x: unit * baseCoefficient, y: origin.y}, {x: center - unit * crestCoefficient, y: crest})
        curve.append(new CurveSegment({x: w, y: origin.y}, {x: w - unit * baseCoefficient, y: origin.y}))
        return curve
    }

    draw(c: fabric.Canvas | null) {
        this.path.set('path', new fabric.Path(this.calculate(c).toString()).path)
    }
}