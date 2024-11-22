import {createRoot} from "react-dom/client"
import React from 'react'
import {Container} from '@chakra-ui/react'
import {Provider} from "../components/chakra/provider"
import p5 from "p5";

const e = document.getElementById('app')

let sketch = function (p) {
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
        p.rect(30, 20, 55, 55)
    }
}
const p = new p5(sketch)

if (e) {
    const root = createRoot(e)
    root.render(
        <Provider>
            <div id="app-canvas"></div>
            <Container>
                <h1>Hello.</h1>
            </Container>
        </Provider>
    )
} else {
    console.error(`Can't find id="app".`)
}
