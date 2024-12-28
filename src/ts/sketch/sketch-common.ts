import {scale} from "@/lib-core"
import p5 from "p5"
import {NoiseBandModel} from "@/components/noise-band-control-panel";
import {Transport} from "@/components/transport";
import {SampleAnalyzer} from "@/audio/sample-analyzer";
import {newVuFactory} from "@/audio/vu-meter";
import {newStarField} from "@/sketch/stars";
import {newWave} from "@/sketch/waves";
import {newSurfer} from "@/sketch/surfer";

export interface Range {
    min: number
    max: number
}

export interface ColorRange {
    r: Range
    g: Range
    b: Range
    a: Range
}

export interface Color {
    r: number
    g: number
    b: number
    a: number
}

export interface Image {
    setWidth(w: number)

    getWidth(): number

    setHeight(h: number)

    getHeight(): number

    set(x: number, y: number, colorValues: number[]): void

    updatePixels(): void

    copy(img: Image, sx: number, sy: number, sw: number, sh: number, dx: number, dy: number, dw: number, dh: number): void

    getImplementation(): any
}

export interface Graphics {

    background(background: number): void

    fill(fill: number): void

    rect(x: number, y: number, width: number, height: number): void

    stroke(gray: number, alpha: number): void

    strokeWeight(w: number): void

    line(x1: number, y1: number, x2: number, y2: number): void

    tint(gray: number, alpha: number): void

    image(img: p5.Image, x: number, y: number): void

    createImage(width: number, height: number): Image;
}

export interface Sketch {
    preload(): void

    setup(g: Graphics): void

    draw(g: Graphics)
}

export interface SketchModel {
    getHeight(): number

    getWidth(): number

    getParentId(): string

    getBackground(): number

    shouldDraw(): boolean
}

export interface Drawable {
    draw(g: Graphics)
}

export interface Sprite extends Drawable {

}


export function newGraphics(p: p5): Graphics {
    return new P5Graphics(p)
}

class P5Graphics implements Graphics {
    private p: p5;

    constructor(p: p5) {
        this.p = p
    }
    background(background: number): void {
        this.p.background(background)
    }

    fill(fill: number): void {
        this.p.fill(fill)
    }

    image(img: Image, x: number, y: number): void {
        this.p.image(img.getImplementation(), x, y)
    }

    line(x1: number, y1: number, x2: number, y2: number): void {
        this.p.line(x1, y1, x2, y1)
    }

    rect(x: number, y: number, width: number, height: number): void {
        this.p.line(x, y, width, height)
    }

    stroke(gray: number, alpha: number): void {
        this.p.stroke(gray, alpha)
    }

    strokeWeight(w: number): void {
        this.p.strokeWeight(w)
    }

    tint(gray: number, alpha: number): void {
        this.p.tint(gray, alpha)
    }

    createImage(width: number, height: number): Image {
        const img = this.p.createImage(width, height)
        return {
            getImplementation(): any {
                return img
            },
            getHeight(): number {
                return img.height;
            }, getWidth(): number {
                return img.width;
            }, setWidth(w: number) {
                img.width = w
            },
            setHeight(h: number) {
                img.height = h
            },
            copy(img: Image, sx: number, sy: number, sw: number, sh: number, dx: number, dy: number, dw: number, dh: number): void {
                img.copy(img.getImplementation(), sx, sy, sw, sh, dx, dy, dw, dh)
            },
            set(x: number, y: number, colorValues: number[]): void {
                img.set(x, y, colorValues)
            },
            updatePixels(): void {
                img.updatePixels()
            }
        };
    }

}

export function newP5Sketch(e: Sketch) {
    return function (p: p5) {
        const g = newGraphics(p)
        p.preload = () => {
            e.preload()
        }
        p.setup = () => {
            e.setup(g)
        }
        p.draw = () => {
            e.draw(g)
        }
    }
}

export function newExperimentSketch(sketchModel: SketchModel, transport: Transport, noiseBandModel: NoiseBandModel, analyzer: () => SampleAnalyzer): Sketch {
    const showMeters = false
    let foreground = 140;
    let layers = new Array()
    let vu = 0
    let target = 0
    let padding = 30
    const yOffset = padding
    let fill = 255
    const vuMeters = newVuFactory()
    const vuMeter = vuMeters.newVuMeter(0.1, 0.3, 24)
    const vuMeterWaves = vuMeters.newVuMeter(0.1, 10, 24)
    const xmin = 0
    const xmax = sketchModel.getWidth()
    const ymin = 0
    const ymax = sketchModel.getHeight() - padding
    const stars = newStarField(1024, xmin, xmax, ymin, ymax, 1, 50, () => vuMeter)
    const wave = newWave({
        waveHeight: (sketchModel.getHeight()),
        width: sketchModel.getWidth(),
        height: sketchModel.getHeight() - padding,
        phase: 0,
        speed: 1,
        vuMeter: vuMeterWaves,
        q: 1.3
    })
    const wave2 = newWave({
        waveHeight: (sketchModel.getHeight()) * 0.9,
        width: sketchModel.getWidth(),
        height: sketchModel.getHeight() - padding,
        phase: 0.5,
        speed: .5,
        vuMeter: vuMeterWaves,
        q: 1.3
    })
    const wave3 = newWave({
        waveHeight: (sketchModel.getHeight()) * 0.8,
        width: sketchModel.getWidth(),
        height: sketchModel.getHeight() - padding,
        phase: 0.25,
        speed: .25,
        vuMeter: vuMeterWaves,
        q: 1.3
    })
    const wave4 = newWave({
        waveHeight: (sketchModel.getHeight()) * 0.7,
        width: sketchModel.getWidth(),
        height: sketchModel.getHeight() - padding,
        phase: 0.125,
        speed: .125,
        vuMeter: vuMeterWaves,
        q: 1.4
    })

    const surfer = newSurfer({
        width: 10,
        height: 4,
        phase: .75,
        speed: .25,
    })
    wave.addObserver(surfer)

    const surfer2 = newSurfer({
        width: 10,
        height: 4,
        phase: .8,
        speed: .125,
    })
    wave2.addObserver(surfer2)

    return {
        preload: () => {

        },
        setup: (g) => {
            // s.createCanvas(window.innerWidth, sketchModel.getHeight()).parent(sketchModel.getParentId())
            noiseBandModel.update(g)
            g.background(sketchModel.getBackground());
        },

        draw: (g) => {
            if (!sketchModel.shouldDraw()) return
            g.fill(fill)
            g.fill(255)
            noiseBandModel.update(g)
            const gap = noiseBandModel.getBandGap()
            g.background(sketchModel.getBackground())
            const innerWidth = sketchModel.getWidth() - 2 * padding
            g.rect(0, sketchModel.getHeight() - padding, window.innerWidth, padding)

            let dim = 50
            const sa = analyzer()

            // draw stars
            stars.forEach((s) => s.draw(g))

            // draw waves
            g.stroke(110, 64)
            wave4.draw(g)
            g.stroke(120, 64)
            wave3.draw(g)
            g.stroke(130, 64)
            wave2.draw(g)
            surfer2.draw(g)
            g.stroke(foreground, 64)
            wave.draw(g)
            surfer.draw(g)

            if (sa) {
                const gap = padding
                const yOffset = gap
                let xOffset = gap
                const fft = sa.getFft()
                if (transport.getPosition() % 8 == 0) {
                    target = sa.getLevel()
                    vuMeters.setTarget(target)
                }

                vuMeters.update()
                vu = vuMeter.getValue()
                const level = 10 * Math.pow(scale(vu, 0, 1, 1, sketchModel.getHeight() - yOffset), .6)

                // set square size proportional to audio level
                dim *= 10 * vuMeterWaves.getValue()

                // draw level indicator
                if (showMeters) {

                    const indicatorWidth = gap
                    g.rect(xOffset, sketchModel.getHeight() - yOffset - level, indicatorWidth, level)

                    // draw FFT graph
                    xOffset += gap + indicatorWidth
                    const w = (sketchModel.getWidth() - xOffset - padding) / fft.length
                    const y1 = sketchModel.getHeight() - yOffset
                    g.stroke(255, 64)
                    g.strokeWeight(w)
                    sa.getFft().forEach((f, i) => {
                        const ff = 160 + f
                        const x = xOffset + (i * w)
                        const y2 = y1 - ff
                        g.line(x, y1, x, y2)
                    })
                }
            }

            // draw moon
            g.rect((padding + ((transport.getPosition() / 32) % innerWidth)) - dim / 2, yOffset - dim / 2, dim, dim)

            // Draw noise band display
            if (gap > 0) {
                const images = noiseBandModel.getImages();
                g.tint(255, scale(noiseBandModel.getOpacity(), 0, 1, 0, 255))
                for (let i = 0, y = 0; i < images.length; i++, y += gap) {
                    const img = images[i]
                    g.image(img, 0, y)
                }
            }
            transport.tick()
        }
    }
}

