import {Result} from "@/lib-core";
import {Transport} from "@/components/transport";
import {newClientOutput} from "../../process-output";

export interface Sample {

    addListener(l: SampleListener)

    play()

    stop()

    reset()
}

export interface SampleResult extends Result {
    data: Sample
}

export interface SampleListener {
    timeDomainData(buf: Float32Array)

    frequencyDomainData(buf: Float32Array)
}

class WebAudioSample implements Sample {
    private readonly listeners: SampleListener[] = []
    private readonly out = newClientOutput(WebAudioSample.name + ': ')
    private readonly c: AudioContext
    private readonly audioBuffer: AudioBuffer
    private readonly analyzer: AnalyserNode
    private readonly timeDamainBuffer: Float32Array
    private readonly frequencyDomainBuffer: Float32Array
    private isPlaying = false
    private source;
    private startTime = 0
    private pauseTime: number = 0;

    constructor(c: AudioContext, buffer: AudioBuffer) {
        this.c = c
        this.audioBuffer = buffer
        this.analyzer = c.createAnalyser()
        this.timeDamainBuffer = new Float32Array(this.analyzer.frequencyBinCount)
        this.frequencyDomainBuffer = new Float32Array(this.analyzer.frequencyBinCount)
        setInterval((me: WebAudioSample) => {
            if (me.isPlaying) {
                me.listeners.forEach((l) => {
                    me.analyzer.getFloatTimeDomainData(me.timeDamainBuffer)
                    me.analyzer.getFloatFrequencyData(me.frequencyDomainBuffer)
                    l.timeDomainData(me.timeDamainBuffer)
                    l.frequencyDomainData(me.frequencyDomainBuffer)
                })
            }
        }, 100, this)
    }

    addListener(l: SampleListener) {
        this.listeners.push(l)
    }

    init() {
        this.source = this.c.createBufferSource()
        this.source.buffer = this.audioBuffer
        this.source.connect(this.c.destination)
        this.source.connect(this.analyzer)
    }

    reset() {
        this.out.log(`Reset!`)
        this.startTime = this.pauseTime = 0
        this.init()
        if (this.isPlaying) {
            this.play()
        }
        this.out.log(this)
    }

    stop() {
        if (this.isPlaying) {
            this.out.log(`Stop!`)
            this.pauseTime = this.c.currentTime
            this.source.stop(0)
            this.isPlaying = false
            this.out.log(this)
        }
    }

    play() {
        if (!this.isPlaying) {
            this.init()
            const offset = this.pauseTime || 0;
            this.source.start(0, offset)
            this.startTime = this.c.currentTime - offset
            this.isPlaying = true
            this.out.log(`Play! offset: ${offset}`)
            this.out.log(this)
        }
    }

}

export function newSamplePlayer(t: Transport, s: Sample) {
    const out = newClientOutput('Sample player: ')
    t.addListener({
        position(p: number) {
        }, reset() {
            out.log(`Transport reset!`)
            s.reset()
        }, started() {
            out.log(`Transport started...`)
            s.play()
        }, stopped() {
            out.log(`Transport stopped.`)
            s.stop()
        }, ticked() {
        }
    })
}

export async function loadAudio(c: AudioContext, url: string): Promise<SampleResult> {
    const out = newClientOutput(`loadAudio: `)
    const rv: SampleResult = {
        data: {} as Sample,
        errors: []
    }
    try {
        const response = await fetch(url)
        if (!response.ok) {
            out.log(`response not ok: ${response.status}: ${response.statusText}`)
            rv.errors.push(new Error(response.statusText))
        } else {
            const audioBuffer = await c.decodeAudioData(await response.arrayBuffer())
            rv.data = new WebAudioSample(c, audioBuffer)
        }
    } catch (e) {
        rv.errors.push(e)
    }
    return rv
}