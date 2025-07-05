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
            // Calculate RMS (Root Mean Square) for better audio level detection
            const sum = buf.reduce((a, f) => a + f * f, 0)
            level = Math.sqrt(sum / buf.length)
            
            // Apply some smoothing and scaling for better visualization response
            // Normalize to a reasonable range (0-1) for visualization
            level = Math.min(1, level * 3) // Scale up the level for better visibility
            
            // Debug logging (remove in production)
            if (Math.random() < 0.01) { // Slightly more frequent logging for debugging
                console.log('Audio level:', level.toFixed(3), 'buffer length:', buf.length)
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

