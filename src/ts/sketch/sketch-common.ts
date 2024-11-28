import {scale} from "@/lib-core"
import p5 from "p5"
import {NoiseBandModel} from "@/components/noise-band-control-panel";
import {Transport} from "@/components/transport";
import {loadAudio} from "@/audio/audio";
import {SampleAnalyzer, VuMeter} from "@/sketch/sample-analyzer";

export interface SketchModel {
    getHeight(): number

    getWidth(): number

    getParentId(): string

    getBackground(): number
}

export function newExperimentSketch(sketchModel: SketchModel, transport: Transport, noiseBandModel: NoiseBandModel, analyzer: () => SampleAnalyzer) {
    let vu = 0
    let target = 0
    return (p: p5) => {
        p.preload = () => {
        }

        p.setup = () => {
            p.createCanvas(window.innerWidth, sketchModel.getHeight()).parent(sketchModel.getParentId())
            noiseBandModel.update(p)
            p.background(sketchModel.getBackground());
        }

        p.draw = () => {
            let padding = 30
            noiseBandModel.update(p)
            const gap = noiseBandModel.getBandGap()
            p.background(sketchModel.getBackground())
            p.fill(255)
            const innerWidth = sketchModel.getWidth() - 2 * padding

            const yOffset = padding
            let dim = 50
            const sa = analyzer()

            if (sa) {

                let gap = padding
                const yOffset = gap
                let xOffset = gap
                const fft = sa.getFft()
                if (transport.getPosition() % 8 == 0) {
                    target = sa.getLevel()
                }
                vu = (target - vu)  / 2
                const level = scale(vu, 0, 1, 1, sketchModel.getHeight() - yOffset)

                // set square size proportional to audio level
                dim *= 10 * vu

                // draw level indicator
                const indicatorWidth = gap
                p.rect(xOffset, sketchModel.getHeight() - yOffset - level, indicatorWidth, level)

                // draw FFT graph
                xOffset += gap + indicatorWidth
                const w = (sketchModel.getWidth() - xOffset - padding) / fft.length
                const y1 = sketchModel.getHeight() - yOffset
                p.stroke(255)
                p.strokeWeight(w)
                sa.getFft().forEach((f, i) => {
                    const ff = 160 + f
                    const x = xOffset + (i * w)
                    const y2 = y1 - ff
                    p.line(x, y1, x, y2)
                })
            }

            p.rect(padding + (transport.getPosition() % innerWidth), yOffset, dim, dim)

            // Draw noise band display
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