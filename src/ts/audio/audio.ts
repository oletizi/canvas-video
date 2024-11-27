import {Result} from "@/lib-core";
import {Transport} from "@/components/transportView";
import {newClientOutput} from "../../process-output";
export interface Sample {

    play()

    stop()

    reset()
}

export interface SampleResult extends Result {
    data: Sample
}

class WebAudioSample implements Sample {
    private readonly out = newClientOutput(WebAudioSample.name + ': ')
    private readonly c: AudioContext
    private readonly buf: AudioBuffer
    private isPlaying = false
    private source;
    private startTime = 0
    private pauseTime: number = 0;

    constructor(c: AudioContext, buffer: AudioBuffer) {
        this.c = c
        this.buf = buffer
    }

    init() {
        this.source = this.c.createBufferSource()
        this.source.buffer = this.buf
        this.source.connect(this.c.destination)
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
    t.addListener({
        position(p: number) {
        }, reset() {
            console.log(`Transport reset!`)
            s.reset()
        }, started() {
            console.log(`Transport started...`)
            s.play()
        }, stopped() {
            console.log(`Transport stopped.`)
            s.stop()
        }, ticked() {
        }
    })
}

export async function loadAudio(c: AudioContext, url: string): Promise<SampleResult> {
    const rv: SampleResult = {
        data: {} as Sample,
        errors: []
    }
    try {
        const response = await fetch(url)
        if (!response.ok) {
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