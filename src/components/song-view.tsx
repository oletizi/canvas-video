"use client"
import React from "react";
import {Transport, TransportView} from "@/components/transport";
import {Button, Divider} from "@mui/material";

export function SongView({startAudio, transport}: { startAudio: () => void, transport: Transport }) {
    return (
        <div className="flex items-center content-center gap-5">
            <Button onClick={() => startAudio()} variant="outlined">Start Audio</Button>
            <Divider orientation="vertical" variant="middle" flexItem/>
            <TransportView model={transport}/>
        </div>)
}