import {scale} from "@/lib-core"
import {Sprite} from "@/sketch/sketch-common";
import p5 from "p5";
import {VuMeter} from "@/audio/vu-meter";

export interface WaveOptions {
    width: number
    height: number
    waveHeight: number
    phase: number
    speed: number
    vuMeter: VuMeter
    q: number
}

export interface WaveObserver {
    update(data:number[])
}

export interface Wave extends Sprite {
    addObserver(o: WaveObserver)
}
export function newWave(opts: WaveOptions): Wave {
    return new BasicWave(opts)
}

function normalDistribution(x, mean, stdDev) {
    const exponent = -((x - mean) ** 2) / (2 * stdDev ** 2);
    const denominator = stdDev * Math.sqrt(2 * Math.PI);
    return Math.exp(exponent) / denominator;
}

class BasicWave implements Wave {
    private readonly opts: WaveOptions;
    private readonly observers: WaveObserver[] = []
    private readonly data: number[]
    private phase: number;
    constructor(opts: WaveOptions) {
        this.opts = opts
        this.phase = scale(opts.phase, 0, 1, 0, opts.width)
        this.data = new Array(opts.width)
    }
    draw(p: p5) {
        const vu = this.opts.vuMeter
        const l = vu.getValue()
        const h = this.opts.height
        const w = this.opts.width
        const q = this.opts.q
        const speed = this.opts.speed
        const stdDev = scale(1 - l, 0, 1, 0, q)
        // const dmax = scale(l, 0, 1, 2, 10)
        const waveHeight = this.opts.waveHeight - scale(l, 0, 1, 0, this.opts.waveHeight)
        for (let x = 0; x < w; x++) {
            const xOffset = x + this.phase >= w ? x + this.phase - w : x + this.phase
            const scaledX = (x / w) * 10 - 5
            // const y = normalDistribution(scaledX, 0, dmax - scale(l, 0, 1, dmin, dmax))
            const y = normalDistribution(scaledX, 0, stdDev)
            // const scaledY = this.h - (y * this.h * 10); // Scale and flip y
            const scaledY = scale(y, 0, 1, 0, waveHeight)
            let y2 = h - scaledY
            this.data[xOffset] = y2
            p.line(xOffset, h, xOffset, y2)
        }
        this.phase = this.phase == w ? 0 : this.phase + speed
        this.observers.forEach(o => o.update(this.data))
    }

    addObserver(o: WaveObserver) {
        this.observers.push(o)
    }
}