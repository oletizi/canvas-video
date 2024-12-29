import {fabric} from "fabric";

export interface SongAnimation {
    setup(c: fabric.Canvas)
    draw(c: fabric.Canvas)
}

export function newDefaultAnimation() {
    return new DefaultAnimation()
}

class DefaultAnimation implements SongAnimation {
    setup(c: fabric.Canvas) {
        const circle = new fabric.Circle({radius: 100, left: c.width / 4, top: +150})
        c.add(circle)
    }

    draw(c: fabric.Canvas) {
        
    }
}