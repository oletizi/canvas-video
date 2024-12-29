"use client"
import React, {useState} from "react";
import {Transport, TransportView} from "@/components/transport";
import {Button, ButtonGroup, Divider} from "@mui/material";

export function SongView({startAudio, transport}: { startAudio: () => void, transport: Transport }) {
    const [shouldDraw, setShouldDraw] = useState<boolean>(false)
    const gap = 10

    return (
        <div className="flex items-center content-center gap-5">
            <div>Start:</div>
            <ButtonGroup>
                <Button onClick={() => setShouldDraw(!shouldDraw)}>Video</Button>
                <Button onClick={() => startAudio()}>Audio</Button>
            </ButtonGroup>
            <Divider orientation="vertical" variant="middle" flexItem/>
            <TransportView model={transport}/>
        </div>)
}