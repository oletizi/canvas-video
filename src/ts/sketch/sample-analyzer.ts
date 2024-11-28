import {Sample} from "@/audio/audio";

export interface SampleAnalyzer {
    getLevel(): number
    getFft(): Float32Array
}

export function newSampleAnalyzer(s: Sample): SampleAnalyzer {
    let level = 0
    let fft : Float32Array = new Float32Array(0)

    s.addListener({
        frequencyDomainData(buf: Float32Array) {
            fft = buf
        },
        timeDomainData(buf: Float32Array) {
            level = Math.sqrt(buf.reduce((a, f) => a += f * f) / buf.length)
        }
    })
    return {
        getFft(): Float32Array {
            return fft;
        },
        getLevel(): number {
            return level;
        }
    }
}