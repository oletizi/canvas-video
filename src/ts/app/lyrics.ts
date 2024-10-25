import {newTimecode, Timecode} from "./timecode";


type TimeText = {
    time: Timecode
    text: string
}


export function parseLyrics(text: string): TimeText[] {
    const rv: TimeText[] = []
    const lines = text.split('\n')
    let tc = newTimecode("00:00:00:00.00")
    for (const line of lines) {
        if (line.startsWith('[')) {
            // XXX: Fragile
            const code = line.substring(line.lastIndexOf('[') + 1, line.lastIndexOf(']'))
            tc = newTimecode(code)
        } else {
            rv.push({time: tc, text: line})
        }
    }
    return rv
}
