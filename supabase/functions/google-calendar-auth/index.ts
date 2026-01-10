// Google Calendar OAuth Edge Function
// Handles OAuth URL generation, token exchange, refresh, and revocation
// Requirements: 1.2, 1.3, 5.3, 5.4

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
};

// Google OAuth configuration
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';
const GOOGLE_REVOKE_URL = 'https://oauth2.googleapis.com/revoke';
const GOOGLE_CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/userinfo.email';

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

interface UserInfo {
  email: string;
  id: string;
}

// Helper to get environment variables
function getEnvVar(name: string): string {
  const value = Deno.env.get(name);
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

// Create Supabase client with service role for admin operations
function createSupabaseAdmin() {
  const supabaseUrl = getEnvVar('SUPABASE_URL');
  const supabaseServiceKey = getEnvVar('SUPABASE_SERVICE_ROLE_KEY');
  return createClient(supabaseUrl, supabaseServiceKey);
}

// Create Supabase client with user's JWT for authenticated operations
function createSupabaseClient(authHeader: string) {
  const supabaseUrl = getEnvVar('SUPABASE_URL');
  const supabaseAnonKey = getEnvVar('SUPABASE_ANON_KEY');
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: { Authorization: authHeader },
    },
  });
}

// Extract user ID from JWT token
async function getUserIdFromAuth(authHeader: string): Promise<string> {
  const supabase = createSupabaseClient(authHeader);
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    throw new Error('Unauthorized: Invalid or expired token');
  }
  
  return user.id;
}

// GET /auth-url - Generate OAuth URL for Google Calendar authorization
async function handleGetAuthUrl(redirectUri: string): Promise<Response> {
  const clientId = getEnvVar('GOOGLE_CLIENT_ID');
  
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: GOOGLE_CALENDAR_SCOPE,
    access_type: 'offline',
    prompt: 'consent', // Force consent to get refresh token
    include_granted_scopes: 'true',
  });

  const authUrl = `${GOOGLE_AUTH_URL}?${params.toString()}`;

  return new Response(
    JSON.stringify({ authUrl }),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}


// POST /callback - Exchange authorization code for tokens and store them
async function handleCallback(
  code: string,
  redirectUri: string,
  userId: string
): Promise<Response> {
  const clientId = getEnvVar('GOOGLE_CLIENT_ID');
  const clientSecret = getEnvVar('GOOGLE_CLIENT_SECRET');

  // Exchange code for tokens
  const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!tokenResponse.ok) {
    const errorData = await tokenResponse.text();
    console.error('Token exchange failed:', errorData);
    return new Response(
      JSON.stringify({ error: 'Failed to exchange authorization code', details: errorData }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  const tokens: TokenResponse = await tokenResponse.json();

  // Get user's Google email
  const userInfoResponse = await fetch(GOOGLE_USERINFO_URL, {
    headers: {
      Authorization: `Bearer ${tokens.access_token}`,
    },
  });

  let googleEmail: string | null = null;
  if (userInfoResponse.ok) {
    const userInfo: UserInfo = await userInfoResponse.json();
    googleEmail = userInfo.email;
  }

  // Calculate token expiry
  const tokenExpiry = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

  // Store tokens in database
  const supabase = createSupabaseAdmin();
  
  const { error: upsertError } = await supabase
    .from('google_calendar_tokens')
    .upsert({
      user_id: userId,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || '',
      token_expiry: tokenExpiry,
      google_email: googleEmail,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id',
    });

  if (upsertError) {
    console.error('Failed to store tokens:', upsertError);
    return new Response(
      JSON.stringify({ error: 'Failed to store tokens', details: upsertError.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  // Initialize sync status
  await supabase
    .from('calendar_sync_status')
    .upsert({
      user_id: userId,
      sync_status: 'idle',
      last_sync_at: null,
      error_message: null,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id',
    });

  return new Response(
    JSON.stringify({
      success: true,
      googleEmail,
      message: 'Google Calendar connected successfully',
    }),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}


// POST /refresh - Refresh expired access token
async function handleRefresh(userId: string): Promise<Response> {
  const clientId = getEnvVar('GOOGLE_CLIENT_ID');
  const clientSecret = getEnvVar('GOOGLE_CLIENT_SECRET');
  const supabase = createSupabaseAdmin();

  // Get current tokens
  const { data: tokenData, error: fetchError } = await supabase
    .from('google_calendar_tokens')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (fetchError || !tokenData) {
    return new Response(
      JSON.stringify({ error: 'No Google Calendar connection found' }),
      {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  if (!tokenData.refresh_token) {
    return new Response(
      JSON.stringify({ error: 'No refresh token available. Please reconnect Google Calendar.' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  // Refresh the token
  const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: tokenData.refresh_token,
      grant_type: 'refresh_token',
    }),
  });

  if (!tokenResponse.ok) {
    const errorData = await tokenResponse.text();
    console.error('Token refresh failed:', errorData);
    
    // Update sync status to error
    await supabase
      .from('calendar_sync_status')
      .upsert({
        user_id: userId,
        sync_status: 'error',
        error_message: 'Token refresh failed. Please reconnect Google Calendar.',
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      });

    return new Response(
      JSON.stringify({ error: 'Failed to refresh token', details: errorData }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  const tokens: TokenResponse = await tokenResponse.json();
  const tokenExpiry = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

  // Update tokens in database
  const { error: updateError } = await supabase
    .from('google_calendar_tokens')
    .update({
      access_token: tokens.access_token,
      token_expiry: tokenExpiry,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (updateError) {
    console.error('Failed to update tokens:', updateError);
    return new Response(
      JSON.stringify({ error: 'Failed to update tokens', details: updateError.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  return new Response(
    JSON.stringify({
      success: true,
      accessToken: tokens.access_token,
      expiresAt: tokenExpiry,
    }),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}


// DELETE /revoke - Revoke access and clean up all data
async function handleRevoke(userId: string): Promise<Response> {
  const supabase = createSupabaseAdmin();

  // Get current tokens
  const { data: tokenData, error: fetchError } = await supabase
    .from('google_calendar_tokens')
    .select('access_token')
    .eq('user_id', userId)
    .single();

  // Revoke token at Google (best effort - continue even if this fails)
  if (tokenData?.access_token) {
    try {
      await fetch(`${GOOGLE_REVOKE_URL}?token=${tokenData.access_token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
    } catch (error) {
      console.warn('Failed to revoke token at Google:', error);
      // Continue with local cleanup
    }
  }

  // Delete all calendar event mappings for this user
  const { error: mappingsError } = await supabase
    .from('calendar_event_mappings')
    .delete()
    .eq('user_id', userId);

  if (mappingsError) {
    console.error('Failed to delete event mappings:', mappingsError);
  }

  // Delete sync status
  const { error: syncStatusError } = await supabase
    .from('calendar_sync_status')
    .delete()
    .eq('user_id', userId);

  if (syncStatusError) {
    console.error('Failed to delete sync status:', syncStatusError);
  }

  // Delete tokens
  const { error: tokensError } = await supabase
    .from('google_calendar_tokens')
    .delete()
    .eq('user_id', userId);

  if (tokensError) {
    console.error('Failed to delete tokens:', tokensError);
    return new Response(
      JSON.stringify({ error: 'Failed to revoke access', details: tokensError.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  return new Response(
    JSON.stringify({
      success: true,
      message: 'Google Calendar disconnected successfully',
    }),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

// GET /status - Get current connection status
async function handleGetStatus(userId: string): Promise<Response> {
  const supabase = createSupabaseAdmin();

  // Get token info
  const { data: tokenData, error: tokenError } = await supabase
    .from('google_calendar_tokens')
    .select('google_email, token_expiry')
    .eq('user_id', userId)
    .single();

  // Get sync status
  const { data: syncData } = await supabase
    .from('calendar_sync_status')
    .select('last_sync_at, sync_status, error_message')
    .eq('user_id', userId)
    .single();

  const isConnected = !!tokenData && !tokenError;
  const isTokenExpired = tokenData ? new Date(tokenData.token_expiry) < new Date() : false;

  return new Response(
    JSON.stringify({
      isConnected,
      googleEmail: tokenData?.google_email || null,
      isTokenExpired,
      lastSyncAt: syncData?.last_sync_at || null,
      syncStatus: syncData?.sync_status || 'idle',
      errorMessage: syncData?.error_message || null,
    }),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}


// Main request handler
serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.split('/').pop() || '';
    
    // Parse request body for POST requests
    let body: Record<string, string> = {};
    if (req.method === 'POST' || req.method === 'DELETE') {
      try {
        body = await req.json();
      } catch {
        // Body might be empty for some requests
      }
    }

    // Get authorization header
    const authHeader = req.headers.get('Authorization');

    // Route: GET /auth-url - No auth required, just generates URL
    if (req.method === 'GET' && path === 'auth-url') {
      const redirectUri = url.searchParams.get('redirect_uri');
      if (!redirectUri) {
        return new Response(
          JSON.stringify({ error: 'Missing redirect_uri parameter' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      return handleGetAuthUrl(redirectUri);
    }

    // All other routes require authentication
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const userId = await getUserIdFromAuth(authHeader);

    // Route: POST /callback - Exchange code for tokens
    if (req.method === 'POST' && path === 'callback') {
      const { code, redirect_uri } = body;
      if (!code || !redirect_uri) {
        return new Response(
          JSON.stringify({ error: 'Missing code or redirect_uri in request body' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      return handleCallback(code, redirect_uri, userId);
    }

    // Route: POST /refresh - Refresh access token
    if (req.method === 'POST' && path === 'refresh') {
      return handleRefresh(userId);
    }

    // Route: DELETE /revoke - Disconnect Google Calendar
    if (req.method === 'DELETE' && path === 'revoke') {
      return handleRevoke(userId);
    }

    // Route: GET /status - Get connection status
    if (req.method === 'GET' && path === 'status') {
      return handleGetStatus(userId);
    }

    // Unknown route
    return new Response(
      JSON.stringify({ error: 'Not found', path }),
      {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Edge function error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    const status = errorMessage.includes('Unauthorized') ? 401 : 500;

    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
