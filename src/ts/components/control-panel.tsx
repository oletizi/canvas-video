import {Center, Flex, Group} from "@chakra-ui/react";
import {Button} from "@/components/chakra/button";
import {MdOutlinePlayArrow, MdOutlineSkipPrevious, MdOutlineStop} from "react-icons/md";
import {NumberInputField, NumberInputRoot} from "@/components/chakra/number-input";
import React from "react";
import {TransportModel} from "@/components/transport";
import {RandomBandOptions} from "@/sketches/sketch-common";

export interface ControlPanelModel {
    transport: TransportModel
    bandOptions: RandomBandOptions[]
    bandGap: number
}

export function newControlPanelModel(transport: TransportModel, bandOptions: RandomBandOptions[], bandGap: number) {
    const rv: ControlPanelModel = {transport: transport, bandOptions: bandOptions, bandGap: bandGap}
    return rv
}

export function ControlPanel({data}: { data: ControlPanelModel }) {
    const transport = data.transport
    const optset = data.bandOptions
    if (optset.length < 2) {
        return (<div>Please specify band options.</div>)
    }
    const opts = optset[0]
    const core = optset[1]
    return (
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

                Opacity: <NumberInputRoot maxW={'5rem'} defaultValue={"" + opts.getOpacity()}
                                          min={0}
                                          max={1}
                                          step={.1}
                                          onValueChange={(e) => opts.setOpacity(Number.parseFloat(e.value))}>

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
        </Flex>)
}