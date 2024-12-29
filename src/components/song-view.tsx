"use client"
import React, {useState} from "react";
import {Provider} from "@/components/chakra/provider";
import {Center, Container, Flex, Group, Separator} from "@chakra-ui/react";
import {Button} from "@/components/chakra/button";
import {Transport, TransportView} from "@/components/transport";

export function SongView({startAudio, transport}: { startAudio: () => void, transport: Transport}) {
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
                                <Button onClick={() => startAudio()}>Audio</Button>
                            </Group>
                        </Center>
                        <Separator orientation="vertical" size="lg" height="10"/>
                        <TransportView model={transport}/>
                    </Flex>
                </Container>
            </Flex>
        </Provider>)
}