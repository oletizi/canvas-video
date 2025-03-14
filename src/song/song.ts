"use client"
import {newClientOutput, ProcessOutput} from "@/lib/process-output"
import {loadAudio, newSamplePlayer, SampleResult} from "@/audio/audio"
import {newSampleAnalyzer, nullSampleAnalyzer, SampleAnalyzer} from "@/audio/sample-analyzer"
import {newTransport, Transport, TransportListener} from "@/components/transport"
import {newVuFactory, VuFactory, VuMeter} from "@/audio/vu-meter";

export interface Song {
    startAudio(audioContext: AudioContext, url: string): void

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
    private sampleAnalyzer: SampleAnalyzer = nullSampleAnalyzer()
    private vuMeters: VuFactory;

    constructor(out: ProcessOutput = newClientOutput('SongBase'), transport: Transport = newTransport()) {
        this.out = out
        this.transport = transport
        this.transport.addListener(this)
        this.vuMeters = newVuFactory()
    }

    startAudio(audioContext: AudioContext, url: string) {
        const out = this.out
        out.log(`Starting audio...`)

        loadAudio(audioContext, url).then((r :SampleResult) => {
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