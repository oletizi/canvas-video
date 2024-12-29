import {fabric} from "fabric";
import {Transport} from "@/components/transport";
import {Circle} from "fabric/fabric-impl";

export interface SongAnimation {
    setup(c: fabric.Canvas)

    draw(c: fabric.Canvas)
}

export function newDefaultAnimation(transport: Transport) {
    return new DefaultAnimation(transport)
}

class DefaultAnimation implements SongAnimation {
    private readonly transport: Transport;
    private circle: Circle;
    private r = 100
    private max = 150
    private min = 50
    private direction= 1
    constructor(transport: Transport) {
        this.transport = transport
    }

    setup(c: fabric.Canvas) {
        this.circle = new fabric.Circle({radius: this.r, selectable: false, left: c.width / 2, top: c.height / 2})
        c.add(this.circle)
    }

    draw(c: fabric.Canvas) {
        this.r += this.direction
        if (this.r <= this.min || this.r >= this.max) {
            this.direction *= -1
        }

        this.circle.setRadius(this.r)
        this.circle.center()

        if (this.transport?.isRunning()) {
            // Draw stuff ...
        }
    }
}