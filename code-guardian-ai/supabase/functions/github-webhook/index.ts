import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-github-event, x-hub-signature-256',
};

async function verifySignature(payload: string, signature: string, secret: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signed = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  const expectedSignature = 'sha256=' + Array.from(new Uint8Array(signed))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  return signature === expectedSignature;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const event = req.headers.get('x-github-event');
    const signature = req.headers.get('x-hub-signature-256');
    const payload = await req.text();

    console.log(`Received GitHub webhook: ${event}`);

    if (!event || !signature) {
      return new Response(
        JSON.stringify({ error: "Missing GitHub headers" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = JSON.parse(payload);
    const repoFullName = body.repository?.full_name;

    if (!repoFullName) {
      return new Response(
        JSON.stringify({ error: "Repository information missing" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find the integration for this repo
    const { data: integration, error: integrationError } = await supabase
      .from('github_integrations')
      .select('*')
      .eq('repository_full_name', repoFullName)
      .eq('is_active', true)
      .single();

    if (integrationError || !integration) {
      console.log(`No active integration found for ${repoFullName}`);
      return new Response(
        JSON.stringify({ message: "No integration found for this repository" }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify webhook signature
    if (integration.webhook_secret) {
      const isValid = await verifySignature(payload, signature, integration.webhook_secret);
      if (!isValid) {
        return new Response(
          JSON.stringify({ error: "Invalid signature" }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Handle pull request events
    if (event === 'pull_request' && ['opened', 'synchronize'].includes(body.action)) {
      const pr = body.pull_request;
      console.log(`Processing PR #${pr.number}: ${pr.title}`);

      // Get changed files
      const filesUrl = pr.url + '/files';
      const filesResponse = await fetch(filesUrl, {
        headers: {
          'Authorization': `Bearer ${integration.access_token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (!filesResponse.ok) {
        console.error("Failed to fetch PR files");
        return new Response(
          JSON.stringify({ error: "Failed to fetch PR files" }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const files = await filesResponse.json();
      const results: any[] = [];
      let totalCritical = 0;
      let totalHigh = 0;
      let overallScore = 100;

      // Analyze each changed file
      for (const file of files) {
        if (file.status === 'removed') continue;

        const extension = file.filename.split('.').pop()?.toLowerCase();
        const languageMap: Record<string, string> = {
          'js': 'javascript',
          'ts': 'typescript',
          'jsx': 'javascript',
          'tsx': 'typescript',
          'py': 'python',
          'java': 'java',
          'go': 'go',
          'rs': 'rust',
          'php': 'php',
          'rb': 'ruby',
          'cs': 'csharp',
          'c': 'c',
          'cpp': 'cpp',
          'h': 'c',
        };

        const language = languageMap[extension || ''];
        if (!language) continue;

        // Get file content
        const contentResponse = await fetch(file.raw_url, {
          headers: {
            'Authorization': `Bearer ${integration.access_token}`,
          },
        });

        if (!contentResponse.ok) continue;

        const code = await contentResponse.text();

        // Analyze the file
        const analyzeResponse = await fetch(`${supabaseUrl}/functions/v1/analyze-code`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            code,
            language,
            userId: integration.user_id,
            saveToHistory: true,
            explanationLevel: 'senior'
          }),
        });

        if (analyzeResponse.ok) {
          const analysis = await analyzeResponse.json();
          results.push({
            file: file.filename,
            score: analysis.score,
            issues: analysis.issues,
            severity_counts: analysis.severity_counts
          });

          totalCritical += analysis.severity_counts?.critical || 0;
          totalHigh += analysis.severity_counts?.high || 0;
          overallScore = Math.min(overallScore, analysis.score);
        }
      }

      // Determine if PR should be blocked
      const shouldBlock = (integration.block_on_critical && totalCritical > 0) ||
                          (overallScore < integration.block_threshold);

      // Create PR comment
      const commentBody = createPRComment(results, totalCritical, totalHigh, overallScore, shouldBlock);

      await fetch(`${pr.url}/reviews`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${integration.access_token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          body: commentBody,
          event: shouldBlock ? 'REQUEST_CHANGES' : 'COMMENT',
        }),
      });

      // Create commit status
      await fetch(`${body.repository.url}/statuses/${pr.head.sha}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${integration.access_token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          state: shouldBlock ? 'failure' : (totalHigh > 0 ? 'pending' : 'success'),
          target_url: `https://codeguard.ai/reports/${pr.number}`,
          description: shouldBlock 
            ? `Blocked: ${totalCritical} critical issues found` 
            : `Score: ${overallScore}/100`,
          context: 'CodeGuard AI',
        }),
      });

      return new Response(
        JSON.stringify({
          message: "PR analyzed",
          files_analyzed: results.length,
          critical_issues: totalCritical,
          high_issues: totalHigh,
          overall_score: overallScore,
          blocked: shouldBlock
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ message: `Event ${event} received` }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Webhook error" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function createPRComment(results: any[], critical: number, high: number, score: number, blocked: boolean): string {
  let comment = `## 🛡️ CodeGuard AI Security Analysis\n\n`;
  
  if (blocked) {
    comment += `⛔ **This PR is blocked due to security issues**\n\n`;
  }

  comment += `### Summary\n`;
  comment += `- **Security Score:** ${score}/100 ${score >= 80 ? '✅' : score >= 50 ? '⚠️' : '❌'}\n`;
  comment += `- **Critical Issues:** ${critical} ${critical > 0 ? '🔴' : '✅'}\n`;
  comment += `- **High Issues:** ${high} ${high > 0 ? '🟠' : '✅'}\n`;
  comment += `- **Files Analyzed:** ${results.length}\n\n`;

  if (results.some(r => r.issues?.length > 0)) {
    comment += `### Issues Found\n\n`;
    
    for (const result of results) {
      if (!result.issues?.length) continue;
      
      comment += `<details>\n<summary><b>${result.file}</b> (Score: ${result.score}/100)</summary>\n\n`;
      
      for (const issue of result.issues) {
        const icon = issue.severity === 'critical' ? '🔴' : 
                     issue.severity === 'high' ? '🟠' :
                     issue.severity === 'medium' ? '🟡' : '🔵';
        
        comment += `#### ${icon} ${issue.title}\n`;
        comment += `- **Severity:** ${issue.severity}\n`;
        comment += `- **Line:** ${issue.line || 'N/A'}\n`;
        comment += `- **Description:** ${issue.description}\n`;
        comment += `- **Fix:** ${issue.fix}\n\n`;
      }
      
      comment += `</details>\n\n`;
    }
  } else {
    comment += `✅ No security issues found!\n`;
  }

  comment += `\n---\n*Powered by [CodeGuard AI](https://codeguard.ai)*`;
  
  return comment;
}
