import type {Sample} from "@/ts/audio/audio";

export interface SampleAnalyzer {
    getLevel(): number

    getFft(): Float32Array
}

export function nullSampleAnalyzer() : SampleAnalyzer{
    return {
        getFft(): Float32Array {
            return new Float32Array([])
        }, getLevel(): number {
            return 0;
        }
    }
}

export function newSampleAnalyzer(s: Sample): SampleAnalyzer {
    let level = 0
    let fft = new Float32Array(0)

    s.addListener({
        frequencyDomainData(buf: Float32Array) {
            fft = buf
        },
        timeDomainData(buf: Float32Array) {
            level = Math.sqrt(buf.reduce((a, f) => a + f * f) / buf.length)
            // Debug logging (remove in production)
            if (Math.random() < 0.01) { // Log ~1% of the time to avoid spam
                console.log('Audio level:', level.toFixed(3))
            }
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

