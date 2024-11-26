import {rand, scale} from "@/lib-core"
import p5 from "p5"
import {ControlPanelModel} from "@/components/control-panel";

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

    getBandRatio(): number

    /**
     * @param r ratio of band height to total height. 0 - 1
     */
    setBandRatio(r: number)

    // Band color range
    getColorRange(): ColorRange

    setColorRange(c: ColorRange)

    // Blur
    getBlur(): number

    setBlur(b: number)

    // Opacity (alpha) [0-1]
    getOpacity(): number

    setOpacity(o: number)

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
    private blur: number = 0;
    private opacity: number = 1;

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

    getBandRatio() {
        return this.bandRatio;
    }

    getBlur(): number {
        return this.blur;
    }

    setBlur(b: number) {
        this.blur = b
        this.dirty = true
    }

    getOpacity(): number {
        return this.opacity;
    }

    setOpacity(o: number) {
        this.opacity = o
        this.dirty = true
    }
}

export function newRandomBandOptions(width, height) {
    return new BasicOptions(width, height)
}

function noiseBand(p: p5, optset: RandomBandOptions[]) {
    let rv: p5.Image
    for (let i = 0; i < optset.length; i++) {
        const opts = optset[i]
        const img = p.createImage(opts.getWidth(), opts.getHeight())
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
                    const bg = opts.getBackground();
                    if (bg) {
                        img.set(x, y, [bg.r, bg.g, bg.b, bg.a])
                    }
                }
            }
        }
        img.updatePixels()
        opts.setClean()
        if (!rv) {
            rv = img
        } else {
            rv.copy(img, 0, 0, img.width, img.height, 0, 0, rv.width, rv.height)
        }
    }
    rv.filter('blur', optset[0].getBlur())

    return rv
}

export interface SketchHook {
    (p: p5): void
}

export function newSketch(preload: SketchHook, setup: SketchHook, draw: SketchHook) {
    return (p: p5) => {
        p.preload = () => preload(p)
        p.setup = () => setup(p)
        p.draw = () => draw(p)
    }
}

export function newExperimentSketch(cp:ControlPanelModel) {
    const transport =  cp.transport
    const optset = cp.bandOptions
    const gap = cp.bandGap
    return (p: p5) => {
        let height = 500
        let img
        let canvas
        const opts = optset.length > 0 ? optset[0] : null
        p.preload = () => {
            // img = p.loadImage('/img/avatar.jpg')
        }

        p.setup = () => {
            canvas = p.createCanvas(window.innerWidth, height)
            canvas.parent('app-canvas')

            p.background(127);
            if (opts) {
                img = noiseBand(p, optset)
            }
        }

        p.draw = () => {
            p.background(127)
            p.fill(255);
            p.rect(30 + transport.getPosition(), 20, 55, 55)
            let dirty = optset.filter(o => o.isDirty()).length > 0;
            if (dirty) {
                img = noiseBand(p, optset)
                p.tint(255, scale(optset[0].getOpacity(), 0, 1, 0, 255))
            }
            // if (img) p.image(img, 0, 100)
            if (gap > 0) {
                for (let i = 0; i < height; i += gap) {
                    p.image(img, 0, i)
                }
            }
            transport.tick()
        }
    }
}