export type Timecode = {
    hours: number
    minutes: number
    seconds: number
    frames: number
    subframes: number
}

export function newTimecode(code: string) {
    // const tc = {hours: 0, minutes: 0, seconds: 0, frames: 0, subframes: 0}
    const chunks= code.split(':')
    if (chunks.length != 4) {
        throw new Error("Parse error. Malformed timecode: " + code)
    }
    const fr = chunks[3].split('.')
    if (fr.length != 2) {
        throw new Error("Parse error. Malformed timecode: " + code)
    }
    return {
        hours: Number.parseInt(chunks[0]),
        minutes: Number.parseInt(chunks[1]),
        seconds: Number.parseInt(chunks[2]),
        frames: Number.parseInt(fr[0]),
        subframes: Number.parseInt(fr[1])
    }
}

export function timecode2Millis(framesPerSecond: number, tc: Timecode): number {
    if (framesPerSecond <= 0) {
        return 0
    }
    return (tc.hours * 60 * 60 * 1000)
        + (tc.minutes * 60 * 1000)
        + (tc.seconds * 1000)
        + (tc.frames/framesPerSecond * 1000)
        // TODO: Subframe precision
}