import {newClientOutput, ProcessOutput} from "../../process-output";
import {loadAudio, newSamplePlayer} from "@/audio/audio";
import {newSampleAnalyzer, SampleAnalyzer} from "@/audio/sample-analyzer";
import {newTransport, Transport, TransportView} from "@/components/transport";
import {Provider} from "@/components/chakra/provider";
import {Center, Container, Flex, Group, Separator} from "@chakra-ui/react";
import {Button} from "@/components/chakra/button";
import React, {useState} from "react";

export interface Song {
    startAudio(url: string): AudioContext

    getTransport(): Transport;
}

export function newSong() {
    return new SongBase()
}

export function SongView({song, url}: { song: Song, url: string }) {
    const [shouldDraw, setShouldDraw] = useState<boolean>(false)
    const gap = 10

    return (
        <Provider>
            <Flex direction="column" gap={gap}>
                <div id="app-canvas"></div>
                <Container>
                    <Flex gap={gap}>
                        <Center gap={gap}>
                            <div>Start:</div>
                            <Group attached>
                                <Button onClick={() => setShouldDraw(!shouldDraw)}>Video</Button>
                                <Button onClick={() => song.startAudio(url)}>Audio</Button>
                            </Group>
                        </Center>
                        <Separator orientation="vertical" size="lg" height="10"/>
                        <TransportView model={song.getTransport()}/>
                    </Flex>
                </Container>
            </Flex>
        </Provider>)
}

class SongBase implements Song {
    private readonly out: ProcessOutput
    private readonly tp: Transport;
    private levelMeter: SampleAnalyzer
    private audioContext: AudioContext;

    constructor(out: ProcessOutput = newClientOutput('SongBase'), transport: Transport = newTransport()) {
        this.out = out
        this.tp = transport
    }

    startAudio(url: string): AudioContext {
        const out = this.out
        out.log(`Starting audio...`)
        if (this.audioContext) {
            out.log(`Closing audio context...`)
            this.audioContext.close().then(out.log(`Audio context closed.`))
        }
        this.audioContext = new AudioContext();
        loadAudio(this.audioContext, url).then((r) => {
            out.log(r)
            if (r.errors.length > 0) {
                r.errors.forEach(e => out.error(e))
            } else {
                const s = r.data
                out.log(`Creating new sample player for sample:`)
                out.log(s)
                newSamplePlayer(this.tp, s)
                this.levelMeter = newSampleAnalyzer(s)
            }
        }).catch(e => console.error(e))
        return this.audioContext
    }

    getTransport(): Transport {
        return this.tp
    }

}