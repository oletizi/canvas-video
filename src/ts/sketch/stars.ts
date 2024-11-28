import p5 from "p5";
import {VuMeter} from "@/audio/vu-meter";

interface Sprite {
    draw(p: p5)
}

export function newStar(x:number, y:number, factor:number, vu: VuMeter): Sprite {
    return {
        draw(p: p5) {
            const dim = vu.getValue() * factor
            p.rect(x, y, dim, dim)
        }
    }

}