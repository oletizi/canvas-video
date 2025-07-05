"use client"
import React from "react";
import {TransportView} from "@/ts/components/transport";
import type {Transport} from "@/ts/components/transport";

export function SongView({startAudio, transport, disabled = false}: { startAudio: () => void, transport: Transport, disabled?: boolean }) {
    return (
        <div className="flex items-center content-center gap-5">
            <button 
                onClick={() => startAudio()} 
                disabled={disabled}
                className={`px-4 py-2 border border-gray-300 rounded ${
                    disabled 
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                        : 'hover:bg-gray-100'
                }`}
            >
                Start Audio
            </button>
            <div className="w-px h-6 bg-gray-300"></div>
            <TransportView model={transport}/>
        </div>)
}