import p5 from "p5";
import {VuMeter} from "@/audio/vu-meter";
import {rand} from "@/lib-core";
import {Sprite} from "@/sketch/sketch-common";


export function newStarField(count: number, xmin: number, xmax: number, ymin: number, ymax: number, minFactor: number, maxFactor: number, getVuMeter: () => VuMeter): Sprite[] {
    const rv: Sprite[] = []
    for (let i = 0; i < count; i++) {
        rv.push(newStar(rand(xmin, xmax), rand(ymin, ymax), rand(minFactor, maxFactor), getVuMeter))
    }
    return rv
}

export function newStar(x: number, y: number, factor: number, getVuMeter: () => VuMeter): Sprite {
    return {
        draw(p: p5) {
            const dim = getVuMeter() ? getVuMeter().getValue() * factor : factor
            p.rect(x - dim / 2, y - dim / 2, dim, dim)
        }
    }

}