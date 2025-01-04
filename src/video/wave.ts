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
    private leadingPath: fabric.Path
    private trailingPath: fabric.Path;

    constructor(opts: WaveOptions) {
        this.opts = opts
    }

    setup(c: fabric.Canvas) {
        this.leadingPath = new fabric.Path(this.calculate(c).toString())
        c.add(this.leadingPath)
    }

    private calculate(c: null | fabric.Canvas, xOffset: number): Curve {
        const h = c.height
        const w = c.width
        // const xOffset = scale(this.opts.phase, 0, 1, 0, c?.width / 1)
        const center = w / 2 + xOffset
        const crest = h - this.opts.waveHeight
        const unit = w / 4
        let q = this.opts.q
        const crestCoefficient = 1 + 1 - q
        const baseCoefficient = q
        const origin = {x: xOffset, y: h} as Point
        const target = {x: center, y: crest} as Point

        const curve = new Curve(origin, target, {x: xOffset + unit * baseCoefficient, y: origin.y}, {x: center - unit * crestCoefficient, y: crest})
        curve.append(new CurveSegment({x: w + xOffset, y: origin.y}, {x: xOffset + w - unit * baseCoefficient, y: origin.y}))
        return curve
    }

    draw(c: fabric.Canvas | null) {
        if (c) {
            c?.remove(this.leadingPath)
            c?.remove(this.trailingPath)
            const xOffset = scale(this.opts.phase, 0, 1, 0, c?.width / 1)
            this.leadingPath = new fabric.Path(this.calculate(c, xOffset).toString())
            this.trailingPath = new fabric.Path(this.calculate(c, xOffset - c.width).toString())
            c.add(this.leadingPath)
            c.add(this.trailingPath)
        }
    }
}