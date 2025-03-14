import {Canvas, Path} from "fabric";
import {scale} from "@/lib/lib-core"
import {SongAnimation} from "@/video/song-animation";
import {VuMeter} from "@/audio/vu-meter";

export interface WaveOptions {
    fill: string
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

    constructor(target: Point, handle: Point) {
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
    private leadingPath: Path = new Path("")
    private trailingPath: Path = new Path("");

    constructor(opts: WaveOptions) {
        this.opts = opts
    }

    setup(c: Canvas) {
        if (c) {
            const xOffset = this.getXOffset(c)
            const pathOptions = {
                fill: this.opts.fill
            }
            const h = this.opts.waveHeight
            // @ts-ignore
            this.opts.waveHeight = c.height
            this.leadingPath = new Path(this.calculate(c, 0).toString(), pathOptions)
            this.trailingPath = new Path(this.calculate(c, 0).toString(), pathOptions)
            this.leadingPath.set('left', 0)
            // @ts-ignore
            this.trailingPath.set('left', xOffset - c.width)

            c.add(this.leadingPath)
            c.add(this.trailingPath)

            this.opts.waveHeight = h
        }
    }

    private calculate(c: Canvas, xOffset: number): Curve {
        const w: number = c.width ? c.width : 1000
        const h: number = c.height ? c.height : w * .45
        // const xOffset = scale(this.opts.phase, 0, 1, 0, c?.width / 1)
        const center = w / 2 + xOffset
        const crest = h - this.opts.waveHeight
        const unit = w / 4
        let q = this.opts.q
        const crestCoefficient = 1 + 1 - q
        const baseCoefficient = q
        const origin = {x: xOffset, y: h} as Point
        const target = {x: center, y: crest} as Point

        const curve = new Curve(origin, target, {
            x: xOffset + unit * baseCoefficient,
            y: origin.y
        }, {x: center - unit * crestCoefficient, y: crest})
        curve.append(new CurveSegment({x: w + xOffset, y: origin.y}, {
            x: xOffset + w - unit * baseCoefficient,
            y: origin.y
        }))
        return curve
    }

    getXOffset(c: Canvas) {
        const w = c.width ? c.width : 1000
        return scale(this.opts.phase, 0, 1, 0, w)
    }

    draw(c: Canvas) {
        const w = c.width ? c.width : 1000
        const xOffset = this.getXOffset(c)
        const pathOptions = {fill: this.opts.fill}


        this.leadingPath.set('path', new Path(this.calculate(c, 0).toString(), pathOptions).path)
        this.leadingPath.set('left', xOffset)
        this.leadingPath.setCoords()

        this.trailingPath.set('path', new Path(this.calculate(c, 0).toString(), pathOptions).path)
        this.trailingPath.set('left', xOffset - w)
        this.trailingPath.setCoords()
    }
}