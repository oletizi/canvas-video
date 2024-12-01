import {createRoot} from "react-dom/client"
import React from 'react'
import {Center, Container, Flex, Group, Separator} from '@chakra-ui/react'
import {Provider} from "@/components/chakra/provider"
import p5 from "p5";
import {newExperimentSketch, SketchModel} from "@/sketch/sketch-common";
import {
    newNoiseBandModel,
    newRandomBandOptions,
    NoiseBandControlPanel,
    NoiseBandOptions
} from "@/components/noise-band-control-panel";
import {newTransport, TransportView} from "@/components/transport";
import {Button} from "@/components/chakra/button";
import {loadAudio, newSamplePlayer} from "@/audio/audio";
import {newClientOutput} from "../../process-output";
import {newSampleAnalyzer} from "@/audio/sample-analyzer";

const r = document.getElementById('app')

const bandGap = 4
const bandHeight = 2
const opacity = 0.2
let opts = newRandomBandOptions(window.innerWidth, bandHeight)
let core = newRandomBandOptions(window.innerWidth, bandHeight)
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
let shouldDraw = false
const optset: NoiseBandOptions[] = [opts, core];
const sketchModel: SketchModel = {
    getWidth: () => window.innerWidth,
    getHeight: () => 500,
    getParentId: () => 'app-canvas',
    getBackground: () => 100,
    shouldDraw: () => shouldDraw
}
const nb = newNoiseBandModel(sketchModel, optset, bandGap, opacity);
const tp = newTransport()

let levelMeter
const p = new p5(newExperimentSketch(sketchModel, tp, nb, () => levelMeter))


// TODO: Move this to a module somewhere
function startAudio(): AudioContext {
    const out = newClientOutput('startAudio: ')
    out.log(`Starting audio...`)
    const audioContext = new AudioContext();
    loadAudio(audioContext, '/assets/audio/waves.wav').then((r) => {
        out.log(r)
        if (r.errors.length > 0) {
            r.errors.forEach(e => out.error(e))
        } else {
            const s = r.data
            out.log(`Creating new sample player for sample:`)
            out.log(s)
            newSamplePlayer(tp, s)
            levelMeter = newSampleAnalyzer(s)
        }
    }).catch(e => console.error(e))
    return audioContext
}

if (r) {
    const root = createRoot(r)
    const gap = 30
    root.render(
        <Provider>
            <Flex direction="column" gap={gap}>
                <div id="app-canvas"></div>
                <Container>
                    <Flex gap={gap}>
                        <Center gap={gap}>
                            <div>Start:</div>
                            <Group attached>
                                <Button onClick={() => shouldDraw = !shouldDraw}>Video</Button>
                                <Button onClick={() => startAudio()}>Audio</Button>
                            </Group>
                        </Center>

                        <Separator orientation="vertical" size="lg" height="10"/>
                        <TransportView model={tp}/>
                        <Separator orientation="vertical" size="lg" height="10"/>
                        <NoiseBandControlPanel model={nb}/>
                    </Flex>
                </Container>
            </Flex>
        </Provider>
    )
} else {
    console.error(`Can't find id="app".`)
}

