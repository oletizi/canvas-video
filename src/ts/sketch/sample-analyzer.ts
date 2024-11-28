import {Sample} from "@/audio/audio";

export interface SampleAnalyzer {
    getLevel(): number

    getFft(): Uint8Array
}

export function newSampleAnalyzer(s: Sample): SampleAnalyzer {
    let level = 0
    let fft = new Uint8Array(0)

    s.addListener({
        frequencyDomainData(buf: Uint8Array) {
            fft = buf
        },
        timeDomainData(buf: Float32Array) {
            // let a = 0
            // for (let f of buf) {
            //     a += f * f
            // }
            // level = Math.sqrt(a / buf.length)
            level = Math.sqrt(buf.reduce((a, f) => a + f * f) / buf.length)
        }
    })
    return {
        getFft(): Uint8Array {
            return fft;
        },
        getLevel(): number {
            return level;
        }
    }
}

export class VuMeter {
    private attackTime: number;
    private decayTime: number;
    private fps: number;
    private currentValue: number;
    private targetValue: number;
    private frameDuration: number;
    constructor(attackTime = 0.1, decayTime = 0.3, fps = 60) {
        this.attackTime = attackTime; // Time to respond to increase (in seconds)
        this.decayTime = decayTime;  // Time to decay (in seconds)
        this.fps = fps;              // Frames per second for updates

        this.currentValue = 0;       // Current VU level (0 to 1)
        this.targetValue = 0;        // Target VU level
        this.frameDuration = 1 / this.fps; // Duration of each frame
    }

    getValue() : number {
        return this.currentValue
    }
    // Update the current VU level based on the target level
    update() {
        const attackCoefficient = this.frameDuration / this.attackTime;
        const decayCoefficient = this.frameDuration / this.decayTime;

        if (this.currentValue < this.targetValue) {
            // Attack: Increase current value towards target
            this.currentValue += attackCoefficient * (this.targetValue - this.currentValue);
        } else if (this.currentValue > this.targetValue) {
            // Decay: Decrease current value towards target
            this.currentValue -= decayCoefficient * (this.currentValue - this.targetValue);
        }

        // Clamp current value between 0 and 1
        this.currentValue = Math.max(0, Math.min(1, this.currentValue));
    }

    // Set a new target value
    setTarget(value) {
        this.targetValue = Math.max(0, Math.min(1, value)); // Clamp target value between 0 and 1
    }
}