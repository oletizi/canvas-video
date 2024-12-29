"use client"
import React, {useState} from "react";
import {Provider} from "@/components/chakra/provider";
import {Center, Container, Flex, Group, Separator} from "@chakra-ui/react";
import {Button} from "@/components/chakra/button";
import {TransportView} from "@/components/transport";
import {Song} from "@/song/song";

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