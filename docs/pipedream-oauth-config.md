# Pipedream OAuth Integration Configuration

This document contains the OAuth configuration for integrating the multi-agent collaboration platform with Pipedream.

## OAuth Client Details

**Application Name:** app

**Base URL:** https://app--swarm-os-b5215637.base44.app

**Client Credentials:**
- **Client ID:** `d76MK0ooJVBBZEfKG9N6HZbAI43kUbUJkwDO9VvYw5c`
- **Client Secret:** `avIA0PYg1HOBo0k_5JaEWFURQl7jATv8NWljMRuYItk`

## Integration Setup

### Environment Variables

Add the following environment variables to your `.env` file:

```env
# Pipedream OAuth Configuration
PIPEDREAM_CLIENT_ID=d76MK0ooJVBBZEfKG9N6HZbAI43kUbUJkwDO9VvYw5c
PIPEDREAM_CLIENT_SECRET=avIA0PYg1HOBo0k_5JaEWFURQl7jATv8NWljMRuYItk
PIPEDREAM_BASE_URL=https://app--swarm-os-b5215637.base44.app
```

### OAuth Flow Endpoints

- **Authorization URL:** `https://app--swarm-os-b5215637.base44.app/oauth/authorize`
- **Token URL:** `https://app--swarm-os-b5215637.base44.app/oauth/token`
- **Redirect URI:** Configure based on your application's callback URL

### Scopes

The following scopes may be available for the multi-agent collaboration platform:
- `agents:read` - Read agent information
- `agents:write` - Create and modify agents
- `workflows:read` - Read workflow information
- `workflows:write` - Create and execute workflows
- `collaboration:read` - Read collaboration sessions
- `collaboration:write` - Create and manage collaboration sessions

### Integration Use Cases

1. **Workflow Automation**: Trigger Pipedream workflows when collaboration sessions are created or completed
2. **Agent Notifications**: Send notifications to external services when agents complete tasks
3. **Data Synchronization**: Sync collaboration data with external CRM or project management tools
4. **Approval Workflows**: Route approval requests to external approval systems

### Security Considerations

- Store client credentials securely using environment variables
- Use HTTPS for all OAuth communications
- Implement proper token refresh mechanisms
- Validate all incoming webhook payloads
- Use appropriate scopes to limit access

### Example Integration Code

```javascript
// Example OAuth client configuration for Node.js
const oauth2 = {
  clientId: process.env.PIPEDREAM_CLIENT_ID,
  clientSecret: process.env.PIPEDREAM_CLIENT_SECRET,
  authorizeUrl: 'https://app--swarm-os-b5215637.base44.app/oauth/authorize',
  tokenUrl: 'https://app--swarm-os-b5215637.base44.app/oauth/token',
  redirectUri: 'https://your-app.com/oauth/callback'
};

// Authorization URL generation
const authUrl = `${oauth2.authorizeUrl}?` +
  `client_id=${oauth2.clientId}&` +
  `redirect_uri=${encodeURIComponent(oauth2.redirectUri)}&` +
  `response_type=code&` +
  `scope=agents:read workflows:read collaboration:read`;

// Token exchange
const tokenResponse = await fetch(oauth2.tokenUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  body: new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: oauth2.clientId,
    client_secret: oauth2.clientSecret,
    code: authorizationCode,
    redirect_uri: oauth2.redirectUri
  })
});
```

## Testing the Integration

1. Verify the OAuth endpoints are accessible
2. Test the authorization flow with appropriate scopes
3. Validate token refresh mechanisms
4. Test webhook delivery and signature verification
5. Ensure proper error handling for failed requests

## Support

For integration support or questions about the OAuth configuration, please refer to:
- Platform API documentation
- Pipedream integration guides
- Contact the development team for specific implementation questions