import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = req.headers.get('x-api-key');
    
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "API key required. Include x-api-key header." }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Hash the API key and verify
    const keyHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(apiKey))
      .then(buf => Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join(''));

    const { data: keyData, error: keyError } = await supabase
      .from('api_keys')
      .select('user_id, is_active, expires_at')
      .eq('key_hash', keyHash)
      .single();

    if (keyError || !keyData) {
      return new Response(
        JSON.stringify({ error: "Invalid API key" }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!keyData.is_active) {
      return new Response(
        JSON.stringify({ error: "API key is inactive" }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (keyData.expires_at && new Date(keyData.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: "API key has expired" }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update last used
    await supabase
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('key_hash', keyHash);

    const url = new URL(req.url);
    const path = url.pathname.split('/').pop();

    // Route handling
    if (req.method === 'POST' && (path === 'scan' || path === 'api-scan')) {
      const { code, language } = await req.json();

      if (!code || !language) {
        return new Response(
          JSON.stringify({ error: "code and language are required" }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Call the analyze-code function internally
      const analyzeResponse = await fetch(`${supabaseUrl}/functions/v1/analyze-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({
          code,
          language,
          userId: keyData.user_id,
          saveToHistory: true,
          explanationLevel: 'senior'
        }),
      });

      const result = await analyzeResponse.json();

      if (!analyzeResponse.ok) {
        return new Response(
          JSON.stringify(result),
          { status: analyzeResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          data: result
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'GET' && path === 'history') {
      const limit = parseInt(url.searchParams.get('limit') || '10');
      const offset = parseInt(url.searchParams.get('offset') || '0');

      const { data: history, error: historyError } = await supabase
        .from('scan_history')
        .select('id, language, score, summary, issues_count, critical_count, high_count, medium_count, low_count, created_at')
        .eq('user_id', keyData.user_id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (historyError) {
        throw historyError;
      }

      return new Response(
        JSON.stringify({
          success: true,
          data: history,
          pagination: { limit, offset }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'GET' && path === 'report') {
      const scanId = url.searchParams.get('id');

      if (!scanId) {
        return new Response(
          JSON.stringify({ error: "Scan ID required" }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: scan, error: scanError } = await supabase
        .from('scan_history')
        .select('*')
        .eq('id', scanId)
        .eq('user_id', keyData.user_id)
        .single();

      if (scanError || !scan) {
        return new Response(
          JSON.stringify({ error: "Scan not found" }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          data: scan
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'GET' && path === 'usage') {
      const { data: usage, error: usageError } = await supabase
        .from('usage_tracking')
        .select('subscription_tier, scans_this_month, scans_limit, billing_period_start')
        .eq('user_id', keyData.user_id)
        .single();

      if (usageError) {
        throw usageError;
      }

      return new Response(
        JSON.stringify({
          success: true,
          data: usage
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        error: "Unknown endpoint",
        available_endpoints: [
          "POST /scan - Analyze code",
          "GET /history - Get scan history",
          "GET /report?id=<scan_id> - Get specific scan report",
          "GET /usage - Get usage stats"
        ]
      }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("API error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "API error" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
