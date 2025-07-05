// Platform API configurations and authentication
export interface PlatformAuth {
    accessToken: string;
    refreshToken?: string;
    expiresAt?: number;
}

export interface UploadProgress {
    platform: string;
    progress: number; // 0-100
    status: 'preparing' | 'uploading' | 'processing' | 'complete' | 'error';
    message: string;
}

// Instagram API (via Facebook Graph API)
export class InstagramAPI {
    private static readonly API_BASE = 'https://graph.facebook.com/v18.0';
    private static readonly INSTAGRAM_BUSINESS_ACCOUNT_ID = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
    
    static async uploadVideo(videoBlob: Blob, caption: string, auth: PlatformAuth): Promise<UploadProgress> {
        try {
            // Step 1: Create container
            const containerResponse = await fetch(`${this.API_BASE}/${this.INSTAGRAM_BUSINESS_ACCOUNT_ID}/media`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${auth.accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    media_type: 'REELS',
                    video_url: await this.uploadToTemporaryURL(videoBlob),
                    caption: caption,
                    access_token: auth.accessToken
                })
            });
            
            const containerData = await containerResponse.json();
            
            if (!containerData.id) {
                throw new Error('Failed to create Instagram container');
            }
            
            // Step 2: Publish the container
            const publishResponse = await fetch(`${this.API_BASE}/${this.INSTAGRAM_BUSINESS_ACCOUNT_ID}/media_publish`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${auth.accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    creation_id: containerData.id,
                    access_token: auth.accessToken
                })
            });
            
            const publishData = await publishResponse.json();
            
            return {
                platform: 'Instagram',
                progress: 100,
                status: 'complete',
                message: 'Video uploaded successfully to Instagram!'
            };
            
        } catch (error) {
            return {
                platform: 'Instagram',
                progress: 0,
                status: 'error',
                message: `Instagram upload failed: ${error.message}`
            };
        }
    }
    
    private static async uploadToTemporaryURL(videoBlob: Blob): Promise<string> {
        // This would typically upload to a cloud storage service
        // For now, we'll return a placeholder
        return 'https://example.com/temp-video-url';
    }
}

// YouTube Data API v3
export class YouTubeAPI {
    private static readonly API_BASE = 'https://www.googleapis.com/upload/youtube/v3';
    
    static async uploadVideo(videoBlob: Blob, title: string, description: string, auth: PlatformAuth): Promise<UploadProgress> {
        try {
            const metadata = {
                snippet: {
                    title: title,
                    description: description,
                    tags: ['music', 'visualization', 'art', 'audio', 'creative'],
                    categoryId: '10' // Music category
                },
                status: {
                    privacyStatus: 'private' // Start as private, user can change later
                }
            };
            
            const formData = new FormData();
            formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
            formData.append('video', videoBlob, 'video.webm');
            
            const response = await fetch(`${this.API_BASE}/videos?part=snippet,status&uploadType=multipart`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${auth.accessToken}`,
                },
                body: formData
            });
            
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error.message);
            }
            
            return {
                platform: 'YouTube',
                progress: 100,
                status: 'complete',
                message: `Video uploaded successfully to YouTube! Video ID: ${data.id}`
            };
            
        } catch (error) {
            return {
                platform: 'YouTube',
                progress: 0,
                status: 'error',
                message: `YouTube upload failed: ${error.message}`
            };
        }
    }
}

// Twitter API v2
export class TwitterAPI {
    private static readonly API_BASE = 'https://upload.twitter.com/1.1';
    
    static async uploadVideo(videoBlob: Blob, text: string, auth: PlatformAuth): Promise<UploadProgress> {
        try {
            // Step 1: Initialize upload
            const initResponse = await fetch(`${this.API_BASE}/media/upload.json`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${auth.accessToken}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    command: 'INIT',
                    total_bytes: videoBlob.size.toString(),
                    media_type: 'video/webm',
                    media_category: 'tweet_video'
                })
            });
            
            const initData = await initResponse.json();
            
            if (!initData.media_id_string) {
                throw new Error('Failed to initialize Twitter upload');
            }
            
            // Step 2: Upload video in chunks
            const chunkSize = 1024 * 1024; // 1MB chunks
            const mediaId = initData.media_id_string;
            
            for (let i = 0; i < videoBlob.size; i += chunkSize) {
                const chunk = videoBlob.slice(i, i + chunkSize);
                const chunkData = new FormData();
                chunkData.append('command', 'APPEND');
                chunkData.append('media_id', mediaId);
                chunkData.append('segment_index', Math.floor(i / chunkSize).toString());
                chunkData.append('media', chunk);
                
                await fetch(`${this.API_BASE}/media/upload.json`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${auth.accessToken}`,
                    },
                    body: chunkData
                });
            }
            
            // Step 3: Finalize upload
            await fetch(`${this.API_BASE}/media/upload.json`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${auth.accessToken}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    command: 'FINALIZE',
                    media_id: mediaId
                })
            });
            
            // Step 4: Post tweet with video
            const tweetResponse = await fetch('https://api.twitter.com/2/tweets', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${auth.accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: text,
                    media: {
                        media_ids: [mediaId]
                    }
                })
            });
            
            const tweetData = await tweetResponse.json();
            
            return {
                platform: 'Twitter',
                progress: 100,
                status: 'complete',
                message: 'Video uploaded successfully to Twitter!'
            };
            
        } catch (error) {
            return {
                platform: 'Twitter',
                progress: 0,
                status: 'error',
                message: `Twitter upload failed: ${error.message}`
            };
        }
    }
}

// Authentication helpers
export class AuthManager {
    static async authenticateInstagram(): Promise<PlatformAuth | null> {
        // Redirect to Instagram OAuth
        const clientId = process.env.INSTAGRAM_CLIENT_ID;
        const redirectUri = `${window.location.origin}/auth/instagram/callback`;
        const scope = 'instagram_basic,instagram_content_publish';
        
        const authUrl = `https://api.instagram.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code`;
        
        window.location.href = authUrl;
        return null; // Will be handled by callback
    }
    
    static async authenticateYouTube(): Promise<PlatformAuth | null> {
        // Redirect to YouTube OAuth
        const clientId = process.env.YOUTUBE_CLIENT_ID;
        const redirectUri = `${window.location.origin}/auth/youtube/callback`;
        const scope = 'https://www.googleapis.com/auth/youtube.upload';
        
        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code&access_type=offline`;
        
        window.location.href = authUrl;
        return null; // Will be handled by callback
    }
    
    static async authenticateTwitter(): Promise<PlatformAuth | null> {
        // Redirect to Twitter OAuth
        const clientId = process.env.TWITTER_CLIENT_ID;
        const redirectUri = `${window.location.origin}/auth/twitter/callback`;
        const scope = 'tweet.read,tweet.write,users.read,offline.access';
        
        const authUrl = `https://twitter.com/i/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code&state=state&code_challenge=challenge&code_challenge_method=plain`;
        
        window.location.href = authUrl;
        return null; // Will be handled by callback
    }
    
    static async handleCallback(platform: string, code: string): Promise<PlatformAuth> {
        // Exchange authorization code for access token
        const response = await fetch(`/api/auth/${platform}/callback`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code })
        });
        
        const data = await response.json();
        return data;
    }
} 