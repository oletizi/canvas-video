import {createRoot} from "react-dom/client"
import React from 'react'
import {Center, Container, Flex, Group, Input} from '@chakra-ui/react'
import {NumberInputField, NumberInputLabel, NumberInputRoot} from '@/components/chakra/number-input'
import {Provider} from "@/components/chakra/provider"
import p5 from "p5";
import {Button} from "@/components/chakra/button";
import {newTransport} from "@/app/transport";
import {MdOutlinePlayArrow, MdOutlineSkipPrevious, MdOutlineStop} from "react-icons/md"
import {newBasicSketch, newRandomBandOptions} from "@/sketches/sketch-common";

const r = document.getElementById('app')

const transport = newTransport()
const height = 10

let opts = newRandomBandOptions(window.innerWidth, 10)
let core = newRandomBandOptions(window.innerWidth, 10)
core.setBandRatio(0.1)
const c = core.getColorRange()
c.r = {min: 255, max: 255}
c.g = {min: 255, max: 255}
c.b = {min: 0, max: 0}
c.a = {min: 0, max: 255}
core.setColorRange(c)

const bg = core.getBackground()
bg.a = 0
core.setBackground(bg)

const optset = [opts, core];
new p5(newBasicSketch(transport, optset))


if (r) {
    const root = createRoot(r)
    root.render(
        <Provider>
            <div id="app-canvas"></div>
            <Container>
                <Flex>
                    <Center gap={3}>

                        <Group attached>
                            <Button onClick={() => transport.reset()}><MdOutlineSkipPrevious/></Button>
                            <Button onClick={() => transport.start()}><MdOutlinePlayArrow/></Button>
                            <Button onClick={() => transport.stop()}><MdOutlineStop/></Button>
                        </Group>
                        Height: <NumberInputRoot maxW={'5rem'} defaultValue={"" + opts.getHeight()}
                                                 onValueChange={(e) => optset.forEach(o => o.setHeight(Number.parseInt(e.value)))}>
                        <NumberInputField/></NumberInputRoot>
                        Blur: <NumberInputRoot maxW={'5rem'} defaultValue={"" + opts.getBlur()}
                                               min={0}
                                               max={10}
                                               step={1}
                                               onValueChange={(e) => opts.setBlur(Number.parseInt(e.value))}>

                        <NumberInputField/></NumberInputRoot>

                        Ratio: <NumberInputRoot maxW={'5rem'}
                                                defaultValue={"" + opts.getBandRatio()}
                                                min={0}
                                                max={1}
                                                step={0.1}
                                                onValueChange={e => opts.setBandRatio(Number.parseFloat(e.value))}>
                        <NumberInputField/></NumberInputRoot>
                        Core ratio: <NumberInputRoot maxW={'5rem'}
                                                     defaultValue={"" + core.getBandRatio()}
                                                     min={0}
                                                     max={1}
                                                     step={0.1}
                                                     onValueChange={e => core.setBandRatio(Number.parseFloat(e.value))}>
                        <NumberInputField/></NumberInputRoot>
                    </Center>
                </Flex>
            </Container>
        </Provider>
    )
} else {
    console.error(`Can't find id="app".`)
}

