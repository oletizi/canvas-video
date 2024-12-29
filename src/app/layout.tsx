"use client"
import {AppRouterCacheProvider} from "@mui/material-nextjs/v13-appRouter";
import theme from '../theme'
import {ThemeProvider} from "next-themes";

export default function RootLayout({children}: { children: React.ReactNode }) {
    return (
        <html lang="en">
        <body className=" bg-white text-neutral-800">
        <AppRouterCacheProvider>
            <ThemeProvider theme={theme}>
                {children}
            </ThemeProvider>
        </AppRouterCacheProvider>
        </body>
        </html>)
}