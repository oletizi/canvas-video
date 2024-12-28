import {Center} from "@chakra-ui/react";
import {NumberInputField, NumberInputRoot} from "@/components/chakra/number-input";
import React from "react";
import p5 from "p5";
import {noiseBand} from "@/sketch/noise-band";
import {Color, ColorRange, Graphics, Range, SketchModel} from "@/sketch/sketch-common";

export interface NoiseBandOptions {
    // Height
    getHeight(): number

    setHeight(h: number)

    // Width
    getWidth(): number

    setWidth(w: number)

    // Background
    getBackground(): Color

    setBackground(c: Color)

    // Band range
    getBandRange(): Range

    getBandRatio(): number

    /**
     * @param r ratio of band height to total height. 0 - 1
     */
    setBandRatio(r: number)

    // Band color range
    getColorRange(): ColorRange

    setColorRange(c: ColorRange)

    // Blur
    getBlur(): number

    setBlur(b: number)

    // Opacity (alpha) [0-1]
    getOpacity(): number

    setOpacity(o: number)

    // dirty
    isDirty(): boolean

    setClean()
}

class BasicOptions implements NoiseBandOptions {

    private width: number;
    private height: number;
    private background: Color;
    private colorRange: ColorRange;
    private dirty: boolean;
    private bandRatio: number;
    private blur: number = 0;
    private opacity: number = 1;

    constructor(width, height) {
        this.width = width
        this.height = height
        this.background = {r: 100, g: 100, b: 100, a: 255}
        this.colorRange = {
            r: {min: 255, max: 255},
            g: {min: 0, max: 255},
            b: {min: 0, max: 255},
            a: {min: 255, max: 255}
        }
        this.bandRatio = 0.5
        this.dirty = true
    }

    getBackground(): Color {
        return this.background;
    }

    getBandRange(): Range {
        const bandHeight = this.bandRatio * this.height
        const half = Math.round(bandHeight / 2)
        const middle = Math.round(this.height / 2)
        return {
            min: middle - half,
            max: middle + (half == 1 ? 0 : half)
        }
    }

    getColorRange(): ColorRange {
        return this.colorRange;
    }

    getHeight(): number {
        return this.height
    }

    getWidth(): number {
        return this.width
    }

    isDirty(): boolean {
        return this.dirty
    }

    setBackground(c: Color) {
        this.background = c
        this.dirty = true
    }

    setBandRatio(r: number) {
        this.bandRatio = r
        this.dirty = true
    }

    setColorRange(c: ColorRange) {
        this.colorRange = c
        this.dirty = true
    }

    setHeight(h: number) {
        this.height = Math.round(h)
        this.dirty = true
    }

    setWidth(w: number) {
        this.width = Math.round(w)
        this.dirty = true
    }

    setClean() {
        this.dirty = false
    }

    getBandRatio() {
        return this.bandRatio;
    }

    getBlur(): number {
        return this.blur;
    }

    setBlur(b: number) {
        this.blur = b
        this.dirty = true
    }

    getOpacity(): number {
        return this.opacity;
    }

    setOpacity(o: number) {
        this.opacity = o
        this.dirty = true
    }
}

export function newRandomBandOptions(width, height) {
    return new BasicOptions(width, height)
}

export interface NoiseBandModel {
    getImages(): p5.Image[]

    getCanvasHeight(): number

    getBandOptions(): NoiseBandOptions[]

    // Band gap
    getBandGap(): number

    setBandGap(g: number)

    // Opacity
    getOpacity(): number

    setOpacity(o: number)

    // State
    update(g: Graphics)

    isDirty(): boolean

    setClean(): void
}

export function newNoiseBandModel(sketchModel: SketchModel, bandOptions: NoiseBandOptions[], bandGap: number, opacity: number): NoiseBandModel {
    const images = []

    function setClean() {
        bandOptions.forEach(o => o.setClean())
    }

    function isDirty() {
        return bandOptions.filter(o => o.isDirty()).length > 0
    }

    function update(p: p5) {
        if (images.length < 1 && bandGap > 0) {
            const count = sketchModel.getHeight() / bandGap
            for (let i = 0; i < count; i++) {
                images.push(noiseBand(p, bandOptions))
            }
        } else if (isDirty()) {
            for (let i = 0; i < images.length; i++) {
                images[i] = noiseBand(p, bandOptions)
            }
        }
        setClean()
    }

    return {
        getBandGap(): number {
            return bandGap
        }, getBandOptions(): NoiseBandOptions[] {
            return bandOptions
        }, getCanvasHeight(): number {
            return sketchModel.getHeight()
        }, getImages(): p5.Image[] {
            return images.map((i) => i)
        }, getOpacity(): number {
            return opacity;
        }, setBandGap(g: number) {
            bandGap = g
        }, setOpacity(o: number) {
            opacity = o
        },
        isDirty: isDirty,
        setClean: setClean,
        update: update,
    }
}

export function NoiseBandControlPanel({model}: { model: NoiseBandModel }) {
    const optset = model.getBandOptions()
    if (optset.length < 2) {
        return (<div>Please specify band options.</div>)
    }
    const opts = optset[0]
    const core = optset[1]
    return (
        <Center gap={3}>
            Height: <NumberInputRoot maxW={'5rem'} defaultValue={"" + opts.getHeight()}
                                     min={0}
                                     onValueChange={(e) => optset.forEach(o => o.setHeight(Number.parseInt(e.value)))}>
            <NumberInputField/></NumberInputRoot>

            Gap: <NumberInputRoot maxW={'5rem'} defaultValue={"" + model.getBandGap()}
                                  min={1}
                                  onValueChange={(e) => model.setBandGap(Number.parseInt(e.value))}>
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
                                      onValueChange={(e) => model.setOpacity(Number.parseFloat(e.value))}>

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
        </Center>)
}