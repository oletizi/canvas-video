import {newClientOutput, ProcessOutput} from "@/process-output"
import {loadAudio, newSamplePlayer} from "@/audio/audio"
import {newSampleAnalyzer, SampleAnalyzer} from "@/audio/sample-analyzer"
import {newTransport, Transport} from "@/components/transport"

export interface Song {
    startAudio(url: string): AudioContext

    getTransport(): Transport

    getSampleAnalyzer(): SampleAnalyzer
}

export function newSong() :Song {
    return new SongBase()
}

class SongBase implements Song {
    private readonly out: ProcessOutput
    private readonly tp: Transport;
    private levelMeter: SampleAnalyzer
    private audioContext: AudioContext;

    constructor(out: ProcessOutput = newClientOutput('SongBase'), transport: Transport = newTransport()) {
        this.out = out
        this.tp = transport
    }

    startAudio(url: string): AudioContext {
        const out = this.out
        out.log(`Starting audio...`)
        if (this.audioContext) {
            out.log(`Closing audio context...`)
            this.audioContext.close().then(out.log(`Audio context closed.`))
        }
        this.audioContext = new AudioContext();
        loadAudio(this.audioContext, url).then((r) => {
            out.log(r)
            if (r.errors.length > 0) {
                r.errors.forEach(e => out.error(e))
            } else {
                const s = r.data
                out.log(`Creating new sample player for sample:`)
                out.log(s)
                newSamplePlayer(this.tp, s)
                this.levelMeter = newSampleAnalyzer(s)
            }
        }).catch(e => console.error(e))
        return this.audioContext
    }

    getTransport(): Transport {
        return this.tp
    }

    getSampleAnalyzer(): SampleAnalyzer {
        return this.levelMeter
    }

}