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

export interface Wave extends SongAnimation {
}

export function newWave(opts: WaveOptions): Wave {
    return new Wave(opts)
}

function normalDistribution(x, mean, stdDev) {
    const exponent = -((x - mean) ** 2) / (2 * stdDev ** 2);
    const denominator = stdDev * Math.sqrt(2 * Math.PI);
    return Math.exp(exponent) / denominator
}

class Wave implements SongAnimation {
    private readonly opts: WaveOptions
    private phase = 0
    private path

    constructor(opts: WaveOptions) {
        this.opts = opts
    }

    setup(c: fabric.Canvas) {
        const w = c.width
        const h = 2 * c.height / 3
        const ox = 0
        const oy = h
        const origin = `M${ox} ${oy}`
        const dx1 = 0
        const dy1 = -h
        const dx2 = w / 2
        const dy2 = -h
        const dxA = w /2
        const dyA = oy
        const dx3 = dx2
        const dy3 = dy2
        const dxB = w
        const dyB = oy


        this.path = new fabric.Path(`${origin} C${dx1},${dy1} ${dx2},${dy2} ${dxA},${dyA} S${dx3},${dy3} ${dxB}, ${dyB} L${ox} ${oy}`, {top: 0, left: 0})
        console.log(`path: ${this.path.path}`)
        c.add(this.path)
    }

    draw(c: fabric.Canvas) {
        if (false) {

            const vu = this.opts.vuMeter
            const l = vu.getValue()
            const h = this.opts.height
            const w = this.opts.width
            const q = this.opts.q
            const speed = this.opts.speed
            const stdDev = scale(1 - l, 0, 1, 0, q)
            // const dmax = scale(l, 0, 1, 2, 10)
            const waveHeight = this.opts.waveHeight - scale(l, 0, 1, 0, this.opts.waveHeight)
            let p = "M0 0"
            for (let x = 0; x < w; x++) {
                const xOffset = x + this.phase >= w ? x + this.phase - w : x + this.phase
                const scaledX = (x / w) * 10 - 5
                // const y = normalDistribution(scaledX, 0, dmax - scale(l, 0, 1, dmin, dmax))
                const y = normalDistribution(scaledX, 0, stdDev)
                // const scaledY = this.h - (y * this.h * 10); // Scale and flip y
                const scaledY = scale(y, 0, 1, 0, waveHeight)
                let y2 = h - scaledY
                p += ` L${x} ${y2}`
                // const line = this.lines[xOffset]
                // if (line) {
                //     line.set({y2: y2})
                // }
                // this.data[xOffset] = y2
                // c.line(xOffset, h, xOffset, y2)
            }
            this.path.set({path: new fabric.Path(p).path})
            this.phase = this.phase == w ? 0 : this.phase + speed
            // this.observers.forEach(o => o.update(this.data))
        }
    }


}