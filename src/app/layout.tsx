"use client"
import {AppRouterCacheProvider} from "@mui/material-nextjs/v13-appRouter";
import "./globals.css"
import {useEffect, useState} from "react";
export default function RootLayout({children}: { children: React.ReactNode }) {
    const [mounted, setMounted] = useState(false)
    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <html><body>{children}</body></html>; // Render children without ThemeProvider during SSR
    }

    return (
        <html lang="en">
        <body className=" bg-white text-neutral-800">
        <AppRouterCacheProvider>
            {/*<ThemeProvider theme={theme}>*/}
                {children}
            {/*</ThemeProvider>*/}
        </AppRouterCacheProvider>
        </body>
        </html>)
}