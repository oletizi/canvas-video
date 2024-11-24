import {Transport} from "@/app/transport";
import p5 from "p5"

function rand(min: number, max: number) {
    return Math.floor(Math.max(min, Math.random() * max));
}

interface Range {
    min: number
    max: number
}

interface ColorRange {
    red: Range
    green: Range
    blue: Range
    alpha: Range
}

interface Color {
    red: number
    green: number
    blue: number
    alpha: number
}

export interface Options {
    height: number
    width: number
    background: Color
    domain: Range
    range: Range
    color: ColorRange
}

function noiseBand(img: p5.Image, opts: Options) {
    for (let x = 0; x < img.width; x++) {
        for (let y = 0; y < img.height; y++) {
            if (x >= opts.domain.min && x <= opts.domain.max
                && y >= opts.range.min && y <= opts.range.max) {
                // img.set(x, y, rand(50, 127))
                img.set(x, y, [
                    rand(opts.color.red.min, opts.color.red.max),
                    rand(opts.color.green.min, opts.color.green.max),
                    rand(opts.color.blue.min, opts.color.blue.max),
                    rand(opts.color.alpha.min, opts.color.alpha.max)
                ])
                // const pixel: number[] = img.pixels[x][y]
             } else {
                img.set(x,y, [opts.background.red, opts.background.green, opts.background.blue, opts.background.alpha])
            }
            // else {
            //     img.set(x, y, 100)
            // }
        }
    }
    // img.filter(p5.BLUR, 3)
    img.updatePixels()
}

export function newBasicSketch(transport: Transport, opts:Options) {

    return (p: p5) => {
        let canvas
        let img
        p.preload = () => {
            // img = p.loadImage('/img/avatar.jpg')
        }

        p.setup = () => {
            canvas = p.createCanvas(window.innerWidth, 500)
            canvas.parent('app-canvas')

            p.background(127);
            img = p.createImage(window.innerWidth, opts.height)
            // let fillRange = [1, 2]
            // let opts = {
            //     domain: {min: 0, max: img.width},
            //     range: {min: height / 2 - height / 6, max: height / 2 + height / 6},
            //     color: {
            //         red: {min: 255, max: 255},
            //         green: {min: 0, max: 255},
            //         blue: {min: 0, max: 255},
            //         alpha: {min: 255, max: 255}
            //     }
            // };
            noiseBand(img, opts)
        }

        p.draw = () => {
            p.background(127)
            p.fill(255);
            p.rect(30 + transport.getPosition(), 20, 55, 55)
            p.image(img, 0, 100)
            transport.tick()
        }
    }
}