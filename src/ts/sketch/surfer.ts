import p5 from "p5";
import {scale} from "@/lib-core"
import {Sprite} from "@/sketch/sketch-common";
import {WaveObserver} from "@/sketch/waves";


export interface SurferOptions {
    phase: number
    speed: number
    width: number
    height: number
}

export interface Surfer extends Sprite, WaveObserver {

}

export function newSurfer(opts: SurferOptions): Surfer {
    let data: number[] = []
    return {
        update(d: number[]) {
            data = d
        },
        draw(p: p5) {
            if (data.length > 0) {
                const xOffset = Math.round(scale(opts.phase, 0, 1, 0, data.length))
                opts.phase = opts.phase >= 1 ? 0 : scale(xOffset + opts.speed, 0, data.length, 0, 1)
                for (let x = 0; x < data.length; x++) {
                    if (x == xOffset) {
                        p.stroke(255)
                        p.fill(255)
                        p.rect(x - opts.width /2, data[x] - opts.height, opts.width, opts.height)
                    }
                }
            }
        }
    }
}