import {createRoot} from "react-dom/client"
import React from 'react'
import {Container, Group} from '@chakra-ui/react'
import {Provider} from "@/components/chakra/provider"
import p5 from "p5";
import {Button} from "@/components/chakra/button";
import {newTransport} from "@/app/transport";

const r = document.getElementById('app')

const transport = newTransport()
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
        p.rect(30 + transport.getPosition(), 20, 55, 55)
        transport.tick()
    }
}
const p = new p5(sketch)

if (r) {
    const root = createRoot(r)
    root.render(
        <Provider>
            <div id="app-canvas"></div>
            <Container>
                <h1>Hello.</h1>
                <Group attached>
                    <Button onClick={() => transport.reset()}>Rew</Button>
                    <Button onClick={() => transport.start()}>Start</Button>
                    <Button onClick={() => transport.stop()}>Stop</Button>
                </Group>
            </Container>
        </Provider>
    )
} else {
    console.error(`Can't find id="app".`)
}

