# Platform API Setup Guide

This guide explains how to set up the required API credentials for automatic video uploads to Instagram, YouTube, and Twitter.

## Prerequisites

- Developer accounts for each platform
- A web server with HTTPS (required for OAuth callbacks)
- Environment variables configured

## Environment Variables

Add these to your `.env` file:

```env
# Site Configuration
SITE_URL=https://your-domain.com

# Instagram API (Facebook Developer)
INSTAGRAM_CLIENT_ID=your_instagram_client_id
INSTAGRAM_CLIENT_SECRET=your_instagram_client_secret
INSTAGRAM_BUSINESS_ACCOUNT_ID=your_instagram_business_account_id

# YouTube API (Google Cloud Console)
YOUTUBE_CLIENT_ID=your_youtube_client_id
YOUTUBE_CLIENT_SECRET=your_youtube_client_secret

# Twitter API (Twitter Developer Portal)
TWITTER_CLIENT_ID=your_twitter_client_id
TWITTER_CLIENT_SECRET=your_twitter_client_secret
```

## Platform-Specific Setup

### Instagram Setup

1. **Create Facebook App**
   - Go to [Facebook Developers](https://developers.facebook.com/)
   - Create a new app or use existing one
   - Add Instagram Basic Display product

2. **Configure Instagram Basic Display**
   - Add your domain to Valid OAuth Redirect URIs
   - Set redirect URI: `https://your-domain.com/auth/instagram/callback`
   - Get Client ID and Client Secret

3. **Get Instagram Business Account ID**
   - Connect your Instagram account to Facebook Page
   - Use Facebook Graph API Explorer to get business account ID
   - Query: `GET /me/accounts` then `GET /{page-id}/instagram_business_account`

4. **Required Permissions**
   - `instagram_basic`
   - `instagram_content_publish`

### YouTube Setup

1. **Create Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create new project or select existing
   - Enable YouTube Data API v3

2. **Create OAuth 2.0 Credentials**
   - Go to APIs & Services > Credentials
   - Create OAuth 2.0 Client ID
   - Set authorized redirect URIs: `https://your-domain.com/auth/youtube/callback`
   - Get Client ID and Client Secret

3. **Required Scopes**
   - `https://www.googleapis.com/auth/youtube.upload`

### Twitter Setup

1. **Create Twitter App**
   - Go to [Twitter Developer Portal](https://developer.twitter.com/)
   - Create new app
   - Enable OAuth 2.0

2. **Configure OAuth 2.0**
   - Set callback URL: `https://your-domain.com/auth/twitter/callback`
   - Get Client ID and Client Secret
   - Enable required permissions: Read and Write

3. **Required Scopes**
   - `tweet.read`
   - `tweet.write`
   - `users.read`
   - `offline.access`

## Security Considerations

### Production Deployment

1. **Environment Variables**
   - Never commit API keys to version control
   - Use secure environment variable management
   - Rotate keys regularly

2. **OAuth Security**
   - Implement PKCE (Proof Key for Code Exchange) for Twitter
   - Store state parameters securely
   - Validate redirect URIs

3. **Rate Limiting**
   - Implement rate limiting for API calls
   - Handle API quota exhaustion gracefully
   - Monitor API usage

### Development Setup

For local development, you can use:
- ngrok for HTTPS tunneling
- Local environment variables
- Test accounts for each platform

## Usage

Once configured, users can:

1. **Connect Accounts**
   - Click "Connect & Upload" buttons
   - Complete OAuth flow for each platform
   - Grant required permissions

2. **Automatic Uploads**
   - Record videos with platform-optimized settings
   - Click upload buttons to automatically post
   - Monitor upload progress in real-time

3. **Fallback Options**
   - Manual download if automatic upload fails
   - Platform-specific sharing guides
   - Error handling and retry mechanisms

## Troubleshooting

### Common Issues

1. **OAuth Redirect Errors**
   - Verify redirect URIs match exactly
   - Check HTTPS requirement
   - Ensure domain is whitelisted

2. **API Quota Exceeded**
   - Monitor usage in platform dashboards
   - Implement exponential backoff
   - Consider upgrading API tiers

3. **Authentication Failures**
   - Check token expiration
   - Verify app permissions
   - Test with platform API explorers

### Debug Mode

Enable debug logging by setting:
```env
DEBUG_PLATFORM_APIS=true
```

## API Limits

### Instagram
- 200 API calls per hour per user
- Video upload size: 100MB max
- Supported formats: MP4, MOV

### YouTube
- 10,000 units per day (quota)
- Video upload size: 128GB max
- Supported formats: MP4, MOV, AVI, WMV

### Twitter
- 300 uploads per 15 minutes
- Video upload size: 512MB max
- Supported formats: MP4, MOV

## Support

For platform-specific issues:
- [Instagram API Documentation](https://developers.facebook.com/docs/instagram-api/)
- [YouTube API Documentation](https://developers.google.com/youtube/v3)
- [Twitter API Documentation](https://developer.twitter.com/en/docs) 