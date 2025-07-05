// This file is no longer used - SongPlayer component is used instead
// Keeping minimal imports to prevent build errors
import {createRoot} from "react-dom/client"
import React from 'react'

const r = document.getElementById('app')

// This file is no longer used - SongPlayer component is used instead

if (r) {
    const root = createRoot(r)
    root.render(
        <div>
            <p>This app is no longer used. Please use the SongPlayer component instead.</p>
        </div>
    )
} else {
    console.error(`Can't find id="app".`)
}

