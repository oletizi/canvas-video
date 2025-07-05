"use client"
import {newClientOutput} from "@/lib/process-output"
import type {ProcessOutput} from "@/lib/process-output"
import {newSamplePlayer, WebAudioSample} from "@/ts/audio/audio"
import {newSampleAnalyzer, nullSampleAnalyzer} from "@/ts/audio/sample-analyzer"
import type {SampleAnalyzer} from "@/ts/audio/sample-analyzer"
import {newTransport} from "@/ts/components/transport"
import type {Transport, TransportListener} from "@/ts/components/transport"
import {newVuFactory} from "@/ts/audio/vu-meter"
import type {VuFactory, VuMeter} from "@/ts/audio/vu-meter";

export interface Song {
    startAudioFromBuffer(audioContext: AudioContext, buffer: AudioBuffer): void

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


    startAudioFromBuffer(audioContext: AudioContext, buffer: AudioBuffer) {
        const out = this.out
        out.log(`Starting audio from buffer...`)
        
        try {
            // Create WebAudioSample directly from buffer
            const sample = new WebAudioSample(audioContext, buffer)
            
            out.log(`Creating new sample player for generated audio buffer`)
            newSamplePlayer(this.transport, sample)
            this.sampleAnalyzer = newSampleAnalyzer(sample)
        } catch (e) {
            out.error(`Error starting audio from buffer: ${e}`)
            console.error(e)
        }
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