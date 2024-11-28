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

