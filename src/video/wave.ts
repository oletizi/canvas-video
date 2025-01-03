import {VuMeter} from "@/audio/vu-meter";
import {fabric} from "fabric";
import {scale} from "@/lib/lib-core";
import {SongAnimation} from "@/video/song-animation";

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

    append(segment) {
        this.segments.push(segment)
        return this
    }


    setup(c) {
        let s = `M ${this.origin?.x} ${this.origin?.y} C ${this.handle1?.x} ${this.handle1?.y},`

        s += `  ${this.handle2?.x} ${this.handle2.y}, ${this.target?.x} ${this.target?.y}`

        s += ` ${this.segments.join(' ')}`

        console.log(`Curve: ${s}`)
        const curve = new fabric.Path(s, {stroke: 'black'})
        c.add(curve)

        s = `M ${this.origin?.x} ${this.origin?.y} L ${this.handle1?.x} ${this.handle1?.y}`
        console.log(`Handle 1: ${s}`)
        const h1 = new fabric.Path(s, {stroke: 'red'})
        c.add(h1)

        s = `M ${this.target?.x} ${this.target?.y} L ${this.handle2?.x} ${this.handle2.y}`
        console.log(`Handle 2: ${s}`)
        const h2 = new fabric.Path(s, {stroke: 'red'})
        c.add(h2)

        for (const segment of this.segments) {
            let points = [segment.handle?.x, segment.handle?.y, segment.target?.x, segment.target?.y];
            console.log(`handle points for ${segment}:`)
            console.log(points)
            const l = new fabric.Line(points, {stroke: 'red'})
            c.add(l)
        }
    }
}

export function newWaveAnimation(opts: WaveOptions): SongAnimation {
    return new WaveAnimation(opts)
}

class WaveAnimation implements SongAnimation {
    private readonly opts: WaveOptions
    private phase = 0
    private path

    constructor(opts: WaveOptions) {
        this.opts = opts
    }

    setup(c: fabric.Canvas) {
        const h = c.height
        const w = c.width
        const top = 0
        const middle = h / 2
        const bottom = h
        const center = w / 2
        const crest = h - this.opts.waveHeight
        const unit = w/4
        let q = 1
        const crestCoefficient = 1 + 1 - q
        const baseCoefficient = q
        const origin = {x: 0, y: h} as Point
        const target = {x: w, y: h} as Point

        const curve = new Curve(origin, target, {x: unit * baseCoefficient, y: middle}, {x: center - unit * crestCoefficient, y: crest})
        curve.setup(c)
    }

    draw(c: fabric.Canvas) {

    }


}