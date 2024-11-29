import {scale} from "@/lib-core"
import {Sprite} from "@/sketch/sketch-common";
import p5 from "p5";
import {VuMeter} from "@/audio/vu-meter";

export function newWave(width: number, height: number, stdDev): Sprite {
    return new Wave(width, height, stdDev)
}

function normalDistribution(x, mean, stdDev) {
    const exponent = -((x - mean) ** 2) / (2 * stdDev ** 2);
    const denominator = stdDev * Math.sqrt(2 * Math.PI);
    return Math.exp(exponent) / denominator;
}

class Wave implements Sprite {
    private readonly w: number;
    private readonly h: number;
    private readonly vu: VuMeter;
    private cursor = 0

    constructor(width: number, height: number, vu: VuMeter) {
        this.w = width
        this.h = height
        this.vu = vu
    }

    draw(p: p5) {
        const l = this.vu.getValue()

        const stdDev = scale(1 - l, 0, 1, 0, 1.5)
        // const dmax = scale(l, 0, 1, 2, 10)
        const waveHeight = this.h - scale(l, 0, 1, 0, this.h)
        for (let x = 0; x < this.w; x++) {
            const xOffset = x + this.cursor > this.w ? x + this.cursor - this.w : x + this.cursor
            const scaledX = (x / this.w) * 10 - 5
            // const y = normalDistribution(scaledX, 0, dmax - scale(l, 0, 1, dmin, dmax))
            const y = normalDistribution(scaledX, 0, stdDev)
            // const scaledY = this.h - (y * this.h * 10); // Scale and flip y
            const scaledY = scale(y, 0, 1, 0, waveHeight)
            p.line(xOffset, this.h, xOffset, waveHeight - scaledY)
        }
        this.cursor = this.cursor == this.w ? 0 : this.cursor + 1
    }
}