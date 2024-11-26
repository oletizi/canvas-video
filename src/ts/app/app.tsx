import {createRoot} from "react-dom/client"
import React from 'react'
import {Center, Container, Flex, Group, Input} from '@chakra-ui/react'
import {NumberInputField, NumberInputLabel, NumberInputRoot} from '@/components/chakra/number-input'
import {Provider} from "@/components/chakra/provider"
import p5 from "p5";
import {Button} from "@/components/chakra/button";
import {newTransport} from "@/app/transport";
import {MdOutlinePlayArrow, MdOutlineSkipPrevious, MdOutlineStop} from "react-icons/md"
import {newExperimentSketch, newRandomBandOptions, RandomBandOptions} from "@/sketches/sketch-common";
import {ControlPanel, newControlPanelModel} from "@/components/control-panel";
import {newTransportModel} from "@/components/transport";

const r = document.getElementById('app')

// const transport = newTransport()
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

const optset: RandomBandOptions[] = [opts, core];
let gap = 10
let cp = newControlPanelModel(newTransportModel(), optset, gap);
new p5(newExperimentSketch(cp))


if (r) {
    const root = createRoot(r)
    root.render(
        <Provider>
            <div id="app-canvas"></div>
            <Container>
                <ControlPanel data={cp}/>
            </Container>
        </Provider>
    )
} else {
    console.error(`Can't find id="app".`)
}

