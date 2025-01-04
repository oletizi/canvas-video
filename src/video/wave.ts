import {VuMeter} from "@/audio/vu-meter";
import {fabric} from "fabric";
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

class Curve implements SongAnimation {
    segments: CurveSegment[] = []
    origin: Point
    target: Point

    handle1: Point
    handle2: Point
    private path: fabric.Path;

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


    setup(c: fabric.Canvas) {
        let s = this.calculate();

        this.path = new fabric.Path(s, {stroke: 'black'})
        c.add(this.path)
    }

    draw(c: fabric.Canvas) {
        this.path.set('path', new fabric.Path(this.calculate()).path)
    }

    private calculate(): string {
        let s = `M ${this.origin?.x} ${this.origin?.y} C ${this.handle1?.x} ${this.handle1?.y},`
        s += `  ${this.handle2?.x} ${this.handle2.y}, ${this.target?.x} ${this.target?.y}`
        s += ` ${this.segments.join(' ')}`
        return s;
    }
}

export function newWaveAnimation(opts: WaveOptions): SongAnimation {
    return new Wave(opts)
}

class Wave implements SongAnimation {
    private readonly opts: WaveOptions;
    private curve: Curve;
    constructor(opts: WaveOptions) {
        this.opts = opts
    }

    setup(c: fabric.Canvas) {
        this.curve = this.calculate(c)
        this.curve.setup(c)
    }

    private calculate(c: fabric.Canvas) {
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

    }
}