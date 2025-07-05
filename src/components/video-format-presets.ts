export enum VideoFormat {
    Instagram = "Instagram",
    YouTube = "YouTube",
    Custom = "Custom"
}

export interface VideoPreset {
    name: string;
    width: number;
    height: number;
    aspectRatio: string;
    description: string;
    recommendedUse: string;
}

export const VIDEO_PRESETS: Record<VideoFormat, VideoPreset> = {
    [VideoFormat.Instagram]: {
        name: "Instagram",
        width: 1080,
        height: 1080,
        aspectRatio: "1:1",
        description: "Square format for Instagram posts",
        recommendedUse: "Instagram feed posts, Stories, and Reels"
    },
    [VideoFormat.YouTube]: {
        name: "YouTube",
        width: 1920,
        height: 1080,
        aspectRatio: "16:9",
        description: "Widescreen format for YouTube videos",
        recommendedUse: "YouTube videos, desktop viewing"
    },
    [VideoFormat.Custom]: {
        name: "Custom",
        width: 1000,
        height: 500,
        aspectRatio: "2:1",
        description: "Custom dimensions",
        recommendedUse: "Custom requirements"
    }
};

export function getPresetByFormat(format: VideoFormat): VideoPreset {
    return VIDEO_PRESETS[format];
}

export function getPresetByDimensions(width: number, height: number): VideoFormat {
    const aspectRatio = width / height;
    
    if (Math.abs(aspectRatio - 1) < 0.1) {
        return VideoFormat.Instagram; // 1:1 (square)
    } else if (Math.abs(aspectRatio - 16/9) < 0.1) {
        return VideoFormat.YouTube; // 16:9 (widescreen)
    } else {
        return VideoFormat.Custom;
    }
} 