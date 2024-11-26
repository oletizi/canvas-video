import {scale} from "@/lib-core"
import p5 from "p5"
import {NoiseBandModel} from "@/components/noise-band-control-panel";
import {TransportModel} from "@/components/transport";

export interface SketchModel {
    getHeight(): number
    getWidth(): number
    getParentId(): string
    getBackground(): number
}

export function newSketchModel(opts: {width: number, height: number, parentId: string, background: number}): SketchModel {
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

export function newExperimentSketch(sketchModel: SketchModel, transport: TransportModel, noiseBandModel: NoiseBandModel) {
    return (p: p5) => {
        p.preload = () => {
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