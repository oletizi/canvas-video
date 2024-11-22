import {AudioContext, OscillatorNode} from 'standardized-audio-context'


export class Audiator {
    private audioContext: AudioContext;
    private osc: OscillatorNode;

    constructor(audioContext: AudioContext) {
        this.audioContext = audioContext
        this.osc = audioContext.createOscillator()
        this.osc.type = 'sine'
        this.osc.frequency.value = 440
        this.osc.connect(audioContext.destination)
    }

    play() {
        this.osc.start(this.audioContext.currentTime)
    }

    pause() {
        this.osc.stop(this.audioContext.currentTime)
    }
}

