// This file is no longer used - SongPlayer component doesn't use Chakra UI or next-themes
// Keeping minimal imports to prevent build errors
"use client"

import * as React from "react"

// This file is no longer used - SongPlayer component doesn't use Chakra UI or next-themes
// Stub exports to prevent import errors
export interface ColorModeProviderProps {}

export function ColorModeProvider() {
  return null
}

export function useColorMode() {
  return {
    colorMode: "light",
    setColorMode: () => {},
    toggleColorMode: () => {},
  }
}

export function useColorModeValue<T>(light: T, dark: T) {
  return light
}

export function ColorModeIcon() {
  return null
}

interface ColorModeButtonProps {}

export const ColorModeButton = React.forwardRef<
  HTMLButtonElement,
  ColorModeButtonProps
>(function ColorModeButton() {
  return null
})
