import {createRoot} from "react-dom/client"
import React from 'react'
import {Container, Group} from '@chakra-ui/react'
import {Provider} from "@/components/chakra/provider"
import p5 from "p5";
import {Button} from "@/components/chakra/button";
import {newTransport} from "@/app/transport";
import {MdOutlinePlayArrow, MdOutlineSkipPrevious, MdOutlineStop, MdPlayArrow} from "react-icons/md"
import {newBasicSketch} from "@/sketches/sketch-common";
const r = document.getElementById('app')

const transport = newTransport()

new p5(newBasicSketch(transport));

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

