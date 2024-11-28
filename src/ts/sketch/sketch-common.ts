import {scale} from "@/lib-core"
import p5 from "p5"
import {NoiseBandModel} from "@/components/noise-band-control-panel";
import {Transport} from "@/components/transport";
import {loadAudio} from "@/audio/audio";
import {SampleAnalyzer} from "@/sketch/sample-analyzer";

export interface SketchModel {
    getHeight(): number

    getWidth(): number

    getParentId(): string

    getBackground(): number
}

export function newSketchModel(opts: {
    width: number,
    height: number,
    parentId: string,
    background: number
}): SketchModel {
    return {
        getBackground(): number {
            return opts.background
        }, getHeight(): number {
            return opts.height
        }, getParentId(): string {
            return opts.parentId
        }, getWidth(): number {
            return opts.width
        }
    }
}

export function newExperimentSketch(sketchModel: SketchModel, transport: Transport, noiseBandModel: NoiseBandModel, analyzer: () => SampleAnalyzer) {

    return (p: p5) => {
        p.preload = () => {
            // p.load
            // sound = p.loadSound('//assets/doorbell.mp3');
            // waves = p.loadSound('/assets/waves.wav')
            // loadAudio(ac, '/assets/waves.wav').then(s => console.log(`Loaded!`)).catch(e => console.error(e))
        }

        p.setup = () => {
            p.createCanvas(window.innerWidth, sketchModel.getHeight()).parent(sketchModel.getParentId())
            noiseBandModel.update(p)
            p.background(sketchModel.getBackground());
        }

        p.draw = () => {
            noiseBandModel.update(p)
            const gap = noiseBandModel.getBandGap();
            p.background(sketchModel.getBackground())
            p.fill(255);
            p.rect(30 + transport.getPosition(), 20, 55, 55)
            const sa = analyzer()
            if (sa) {
                let margin = 30
                let gap = margin
                const yOffset = gap
                let xOffset = gap
                const fft = sa.getFft()
                const level = scale(sa.getLevel(), 0, 1, 1, sketchModel.getHeight() - yOffset)

                // draw level indicator
                const indicatorWidth = 20
                p.rect(xOffset, sketchModel.getHeight() - yOffset - level, indicatorWidth, level)

                // draw FFT graph
                xOffset += gap + indicatorWidth
                const w = (sketchModel.getWidth() - xOffset - margin) / fft.length
                const y1 = sketchModel.getHeight() - yOffset
                p.stroke(255)
                p.strokeWeight(w)
                sa.getFft().forEach((f, i) => {
                    const ff = f + 160
                    const x = xOffset + (i * w)
                    const y2 = y1 - ff
                    p.line(x, y1, x, y2)
                })
            }
            if (gap > 0) {
                const images = noiseBandModel.getImages();
                p.tint(255, scale(noiseBandModel.getOpacity(), 0, 1, 0, 255))
                for (let i = 0, y = 0; i < images.length; i++, y += gap) {
                    const img = images[i]
                    p.image(img, 0, y)
                }
            }
            transport.tick()
        }
    }
}