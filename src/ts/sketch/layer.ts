import {Color, Drawable, Sprite} from "@/sketch/sketch-common";
import p5 from "p5";

export interface LayerOptions {
    defaultFill() : Color
    defaultStroke(): Color
    defaultStrokeWeight(): number
}

export interface Layer extends Drawable {
    addSprite(s:Sprite)
}

export function newLayer(opts: LayerOptions) : Layer {
    const sprites = []
    return {
        addSprite(s: Sprite) {
            sprites.push(s)
        }, draw(p: p5) {

            sprites.forEach(s => s.draw(p))
        }
    }
}