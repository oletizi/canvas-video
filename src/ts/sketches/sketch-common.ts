import {Transport} from "@/app/transport";



export function newBasicSketch(transport:Transport) {
    return  (p) => {
        let canvas
        p.preload = () => {

        }

        p.setup = () => {
            canvas = p.createCanvas(window.innerWidth, 500)
            canvas.parent('app-canvas')
        }

        p.draw = () => {
            p.background(127);
            p.fill(255);
            p.rect(30 + transport.getPosition(), 20, 55, 55)
            transport.tick()
        }
    }
}