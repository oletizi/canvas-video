"use client"
import React from "react";
import {Transport, TransportView} from "@/ts/components/transport";

export function SongView({startAudio, transport}: { startAudio: () => void, transport: Transport }) {
    return (
        <div className="flex items-center content-center gap-5">
            <button 
                onClick={() => startAudio()} 
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
            >
                Start Audio
            </button>
            <div className="w-px h-6 bg-gray-300"></div>
            <TransportView model={transport}/>
        </div>)
}