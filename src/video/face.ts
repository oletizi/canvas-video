import {Canvas, Circle} from "fabric"
import type {Song} from "@/song/song";
import {scale} from "@/lib/lib-core";
import { PixelAnimationBase } from "@/video/pixel-animation-base";
import { PixelConfigManager } from "@/video/pixel-config-manager";
import type { PixelAnimationConfig } from "@/video/pixel-config-types";
import faceConfigData from "@/config/face-config.json";

export class Face extends PixelAnimationBase {
    private readonly ball: Circle;
    private counter = 0
    private direction = 1

    constructor(song: Song, fps: number, config?: PixelAnimationConfig) {
        const faceConfig = config || PixelConfigManager.loadConfigSync(faceConfigData as PixelAnimationConfig);
        super(song, fps, faceConfig);
        this.ball = new Circle({radius: 5, top: 10, left: 10, fill: 'red'})
    }

    protected setupAdditionalElements(c: Canvas): void {
        c.add(this.ball)
    }

    protected updateAnimation(c: Canvas): void {
        const level = this.vu.getValue()
        // this.ball.left = this.counter
        this.ball.set({left: level * 500})
        if (this.counter >= 255) {
            this.direction = -1
        }
        if (this.counter <= 128) {
            this.direction = 1
        }
        this.counter += this.direction
    }
}