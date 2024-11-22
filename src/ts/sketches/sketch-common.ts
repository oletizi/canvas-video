import {Transport} from "@/app/transport";
import p5 from "p5"


export function newBasicSketch(transport: Transport) {
    return (p: p5) => {
        let canvas
        let img
        p.preload = () => {
            // img = p.loadImage('/img/avatar.jpg')
        }

        p.setup = () => {
            canvas = p.createCanvas(window.innerWidth, 500)
            canvas.parent('app-canvas')

            p.background(127);
            img = p.createImage(window.innerWidth, 10)
            let fillRange = [4, 5]
            for (let x = 0; x < img.width; x++) {
                for (let y = 0; y < img.height; y++) {
                    if (y >= fillRange[0] && y <= fillRange[1]) {
                        img.set(x, y, 0)
                    } else {
                        img.set(x, y, 100)
                    }
                }
            }
            img.updatePixels()
        }

        p.draw = () => {
            p.background(127)
            p.fill(255);
            p.rect(30 + transport.getPosition(), 20, 55, 55)
            p.image(img, 0, 100)
            transport.tick()
        }
    }
}