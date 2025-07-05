import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, params }) => {
    const platform = params.platform;
    const { code } = await request.json();

    if (!code) {
        return new Response(JSON.stringify({ error: 'Authorization code is required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        let authData;

        switch (platform) {
            case 'instagram':
                authData = await handleInstagramCallback(code);
                break;
            case 'youtube':
                authData = await handleYouTubeCallback(code);
                break;
            case 'twitter':
                authData = await handleTwitterCallback(code);
                break;
            default:
                return new Response(JSON.stringify({ error: 'Unsupported platform' }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
        }

        return new Response(JSON.stringify(authData), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error(`OAuth callback error for ${platform}:`, error);
        return new Response(JSON.stringify({ error: 'Authentication failed' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};

async function handleInstagramCallback(code: string) {
    const clientId = import.meta.env.INSTAGRAM_CLIENT_ID;
    const clientSecret = import.meta.env.INSTAGRAM_CLIENT_SECRET;
    const redirectUri = `${import.meta.env.SITE_URL}/auth/instagram/callback`;

    const response = await fetch('https://api.instagram.com/oauth/access_token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: 'authorization_code',
            redirect_uri: redirectUri,
            code: code
        })
    });

    const data = await response.json();

    if (data.error) {
        throw new Error(data.error_message || 'Instagram authentication failed');
    }

    return {
        accessToken: data.access_token,
        expiresAt: Date.now() + (data.expires_in * 1000)
    };
}

async function handleYouTubeCallback(code: string) {
    const clientId = import.meta.env.YOUTUBE_CLIENT_ID;
    const clientSecret = import.meta.env.YOUTUBE_CLIENT_SECRET;
    const redirectUri = `${import.meta.env.SITE_URL}/auth/youtube/callback`;

    const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: 'authorization_code',
            redirect_uri: redirectUri,
            code: code
        })
    });

    const data = await response.json();

    if (data.error) {
        throw new Error(data.error_description || 'YouTube authentication failed');
    }

    return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: Date.now() + (data.expires_in * 1000)
    };
}

async function handleTwitterCallback(code: string) {
    const clientId = import.meta.env.TWITTER_CLIENT_ID;
    const clientSecret = import.meta.env.TWITTER_CLIENT_SECRET;
    const redirectUri = `${import.meta.env.SITE_URL}/auth/twitter/callback`;

    const response = await fetch('https://api.twitter.com/2/oauth2/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`
        },
        body: new URLSearchParams({
            grant_type: 'authorization_code',
            redirect_uri: redirectUri,
            code: code,
            code_verifier: 'challenge' // In production, this should be stored securely
        })
    });

    const data = await response.json();

    if (data.error) {
        throw new Error(data.error_description || 'Twitter authentication failed');
    }

    return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: Date.now() + (data.expires_in * 1000)
    };
} 