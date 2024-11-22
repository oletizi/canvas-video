import {createRoot} from "react-dom/client"
import React from 'react'
import {Container} from '@chakra-ui/react'
import {Provider} from "../components/chakra/provider"

const e = document.getElementById('app')

if (e) {
    const root = createRoot(e)
    root.render(
        <Provider>
            <Container>
                <h1>Hello.</h1>
            </Container>
        </Provider>
    )
} else {
    console.error(`Can't find id="app".`)
}
