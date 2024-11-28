import {createRoot} from "react-dom/client"
import React from 'react'
import {Container, Flex, Separator} from '@chakra-ui/react'
import {Provider} from "@/components/chakra/provider"
import p5 from "p5";
import {newExperimentSketch, newSketchModel} from "@/sketch/sketch-common";
import {
    newNoiseBandModel,
    newRandomBandOptions,
    NoiseBandControlPanel,
    NoiseBandOptions
} from "@/components/noise-band-control-panel";
import {newTransport, TransportView} from "@/components/transport";
import {Button} from "@/components/chakra/button";
import {loadAudio, newSamplePlayer, SampleListener} from "@/audio/audio";
import {newClientOutput} from "../../process-output";
import {LevelMeter, newLevelMeter} from "@/sketch/level-meter";

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

const optset: NoiseBandOptions[] = [opts, core];
const sketchModel = newSketchModel({width: window.innerWidth, height: 500, parentId: 'app-canvas', background: 100})
const nb = newNoiseBandModel(sketchModel, optset, bandGap, opacity);
const tp = newTransport()

const sampleListener: SampleListener = {
    timeDomainData(buf: Float32Array) {
        const out = newClientOutput('sampleListener: ')
        out.log(`Time domain data!`)
    }
}

let levelMeter
const p = new p5(newExperimentSketch(sketchModel, tp, nb, () => levelMeter))


// TODO: Move this to a module somewhere
function startAudio(): AudioContext {
    const out = newClientOutput('startAudio: ')
    out.log(`Starting audio...`)
    const audioContext = new AudioContext();
    loadAudio(audioContext, '/assets/audio/waves.wav', sampleListener).then((r) => {
        out.log(r)
        if (r.errors.length > 0) {
            r.errors.forEach(e => out.error(e))
        } else {
            const s = r.data
            out.log(`Creating new sample player for sample:`)
            out.log(s)
            newSamplePlayer(tp, s)
            levelMeter = newLevelMeter(s)
        }
    }).catch(e => console.error(e))
    return audioContext
}

if (r) {
    const root = createRoot(r)
    root.render(
        <Provider>
            <Flex direction="column" gap={30}>
                <div id="app-canvas"></div>
                <Container>
                    <Flex gap={30}>
                        <Button onClick={() => startAudio()}>Start Audio</Button>
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

