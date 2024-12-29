import {newClientOutput, ProcessOutput} from "@/process-output"
import {loadAudio, newSamplePlayer} from "@/audio/audio"
import {newSampleAnalyzer, SampleAnalyzer} from "@/audio/sample-analyzer"
import {newTransport, Transport, TransportListener} from "@/components/transport"
import {newVuFactory, VuFactory, VuMeter} from "@/audio/vu-meter";

export interface Song {
    startAudio(url: string): AudioContext

    getTransport(): Transport

    getSampleAnalyzer(): SampleAnalyzer

    newVuMeter(attackTime: number, decayTime: number, fps: number): VuMeter
}

export function newSong(): Song {
    return new SongBase()
}

class SongBase implements Song, TransportListener {
    private readonly out: ProcessOutput
    private readonly transport: Transport;
    private sampleAnalyzer: SampleAnalyzer
    private audioContext: AudioContext;
    private vuMeters: VuFactory;

    constructor(out: ProcessOutput = newClientOutput('SongBase'), transport: Transport = newTransport()) {
        this.out = out
        this.transport = transport
        this.transport.addListener(this)
        this.vuMeters = newVuFactory()
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
                newSamplePlayer(this.transport, s)
                this.sampleAnalyzer = newSampleAnalyzer(s)
            }
        }).catch(e => console.error(e))
        return this.audioContext
    }

    getTransport(): Transport {
        return this.transport
    }

    getSampleAnalyzer(): SampleAnalyzer {
        return this.sampleAnalyzer
    }

    newVuMeter(attackTime: number, decayTime: number, fps: number): VuMeter {
        return this.vuMeters.newVuMeter(attackTime, decayTime, fps)
    }

    // <TransportListener>

    position(p: number) {
    }

    reset() {
    }

    started() {
    }

    stopped() {
    }

    ticked() {
        if (this.sampleAnalyzer) {
            if (this.transport.getPosition() % 8 == 0) {
                this.vuMeters.setTarget(this.sampleAnalyzer.getLevel())
            }
            this.vuMeters.update()
        }
    }


    // </TransportListener>

}