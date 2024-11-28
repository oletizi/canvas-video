import {Sample} from "@/audio/audio";

export interface LevelMeter {
    getLevel(): number
}

export function newLevelMeter(s: Sample): LevelMeter {
    let level = 0
    s.addListener({
        timeDomainData(buf: Float32Array) {
            let sum = 0
            for (const f of buf) {
                    sum += f * f
            }
            level = Math.sqrt(sum / buf.length)
        }
    })
    return {
        getLevel(): number {
            return level;
        }
    }
}