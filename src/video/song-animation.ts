import {fabric} from "fabric";
import {Transport} from "@/components/transport";
import {Circle} from "fabric/fabric-impl";
import {SampleAnalyzer} from "@/audio/sample-analyzer";
import {Song} from "@/song/song";

export interface SongAnimation {
    setup(c: fabric.Canvas)

    draw(c: fabric.Canvas)
}

export function newDefaultAnimation(song: Song) {
    return new DefaultAnimation(song)
}

class DefaultAnimation implements SongAnimation {
    private circle: Circle;
    private r = 100
    private max = 150
    private min = 50
    private direction= 1
    private song: Song;
    constructor(song: Song) {
        this.song = song
    }

    setup(c: fabric.Canvas) {
        this.circle = new fabric.Circle({radius: this.r, selectable: false, left: c.width / 2, top: c.height / 2})
        c.add(this.circle)
    }

    draw(c: fabric.Canvas) {
        const transport = this.song.getTransport()
        const analyzer = this.song.getSampleAnalyzer()

        this.circle.setRadius(this.r)
        this.circle.center()

        if (transport?.isRunning()) {
            this.r = analyzer.getLevel() * 100
        } else {
            this.r += this.direction
            if (this.r <= this.min || this.r >= this.max) {
                this.direction *= -1
            }
        }
    }
}