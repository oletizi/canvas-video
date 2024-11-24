import {createRoot} from "react-dom/client"
import React from 'react'
import {Container, Group} from '@chakra-ui/react'
import {Provider} from "@/components/chakra/provider"
import p5 from "p5";
import {Button} from "@/components/chakra/button";
import {newTransport} from "@/app/transport";
import {MdOutlinePlayArrow, MdOutlineSkipPrevious, MdOutlineStop} from "react-icons/md"
import {newBasicSketch, Options} from "@/sketches/sketch-common";
const r = document.getElementById('app')

const transport = newTransport()
const height = 10
const opts: Options = {
        height: height,
        width: window.innerWidth,
    background: {
            red: 100,
        green: 100,
        blue:100,
        alpha: 255
    },
        domain: {min: 0, max: window.innerWidth},
        range: {min: height / 2 - height / 6, max: height / 2 + height / 6},
        color: {
            red: {min: 255, max: 255},
            green: {min: 0, max: 255},
            blue: {min: 0, max: 255},
            alpha: {min: 255, max: 255}
        }
    };
new p5(newBasicSketch(transport, opts))


if (r) {
    const root = createRoot(r)
    root.render(
        <Provider>
            <div id="app-canvas"></div>
            <Container>
                <h1>Hello.</h1>
                <Group attached>
                    <Button onClick={() => transport.reset()}><MdOutlineSkipPrevious/></Button>
                    <Button onClick={() => transport.start()}><MdOutlinePlayArrow/></Button>
                    <Button onClick={() => transport.stop()}><MdOutlineStop/></Button>
                </Group>
            </Container>
        </Provider>
    )
} else {
    console.error(`Can't find id="app".`)
}

