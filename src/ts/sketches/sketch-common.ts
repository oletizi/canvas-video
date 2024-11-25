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
    r: Range
    g: Range
    b: Range
    a: Range
}

interface Color {
    r: number
    g: number
    b: number
    a: number
}

export interface RandomBandOptions {
    // Height
    getHeight(): number

    setHeight(h: number)

    // Width
    getWidth(): number

    setWidth(w: number)

    // Background
    getBackground(): Color

    setBackground(c: Color)

    // Band range
    getBandRange(): Range

    /**
     * @param r ratio of band height to total height. 0 - 1
     */
    setBandRatio(r: number)

    // Band color range
    getColorRange(): ColorRange

    setColorRange(c: ColorRange)

    // dirty
    isDirty(): boolean

    setClean()
}


class BasicOptions implements RandomBandOptions {

    private width: number;
    private height: number;
    private background: Color;
    private colorRange: ColorRange;
    private dirty: boolean;
    private bandRatio: number;

    constructor(width, height) {
        this.width = width
        this.height = height
        this.background = {r: 100, g: 100, b: 100, a: 255}
        this.colorRange = {
            r: {min: 255, max: 255},
            g: {min: 0, max: 255},
            b: {min: 0, max: 255},
            a: {min: 255, max: 255}
        }
        this.bandRatio = 0.5
        this.dirty = true
    }

    getBackground(): Color {
        return this.background;
    }

    getBandRange(): Range {
        const bandHeight = this.bandRatio * this.height
        const half = Math.round(bandHeight / 2)
        const middle = Math.round(this.height / 2)
        return {
            min: middle - half,
            max: middle + (half == 1 ? 0 : half)
        }
    }

    getColorRange(): ColorRange {
        return this.colorRange;
    }

    getHeight(): number {
        return this.height
    }

    getWidth(): number {
        return this.width
    }

    isDirty(): boolean {
        return this.dirty
    }

    setBackground(c: Color) {
        this.background = c
        this.dirty = true
    }

    setBandRatio(r: number) {
        this.bandRatio = r
        this.dirty = true
    }

    setColorRange(c: ColorRange) {
        this.colorRange = c
        this.dirty = true
    }

    setHeight(h: number) {
        this.height = Math.round(h)
        this.dirty = true
    }

    setWidth(w: number) {
        this.width = Math.round(w)
        this.dirty = true
    }

    setClean() {
        this.dirty = false
    }

}

export function newRandomBandOptions(width, height) {
    return new BasicOptions(width, height)
}

function noiseBand(img: p5.Image, opts: RandomBandOptions) {
    img.resize(opts.getWidth(), opts.getHeight())
    img.loadPixels()
    const range = opts.getBandRange()
    for (let x = 0; x < img.width; x++) {
        for (let y = 0; y < img.height; y++) {
            if (y >= range.min && y < range.max) {
                let c = opts.getColorRange();
                img.set(x, y, [
                    rand(c.r.min, c.r.max),
                    rand(c.g.min, c.g.max),
                    rand(c.b.min, c.b.max),
                    rand(c.a.min, c.a.max)
                ])
            } else {
                let bg = opts.getBackground();
                img.set(x, y, [bg.r, bg.g, bg.b, bg.a])
            }
        }
    }
    img.updatePixels()
    opts.setClean()
}

export function newBasicSketch(transport: Transport, opts: RandomBandOptions) {

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
            img = p.createImage(window.innerWidth, opts.getHeight())
            noiseBand(img, opts)
            opts.setClean()
        }

        p.draw = () => {
            p.background(127)
            p.fill(255);
            p.rect(30 + transport.getPosition(), 20, 55, 55)
            if (opts.isDirty()) {
                noiseBand(img, opts)
                opts.setClean()
            }
            p.image(img, 0, 100)
            transport.tick()
        }
    }
}