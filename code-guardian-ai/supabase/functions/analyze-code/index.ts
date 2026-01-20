import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// OWASP Top 10 2021 mapping
const OWASP_MAPPING: Record<string, { id: string; name: string }> = {
  'sql_injection': { id: 'A03', name: 'Injection' },
  'command_injection': { id: 'A03', name: 'Injection' },
  'xss': { id: 'A03', name: 'Injection' },
  'hardcoded_secret': { id: 'A07', name: 'Identification and Authentication Failures' },
  'weak_crypto': { id: 'A02', name: 'Cryptographic Failures' },
  'ssl_disabled': { id: 'A02', name: 'Cryptographic Failures' },
  'eval': { id: 'A03', name: 'Injection' },
  'sensitive_data_logging': { id: 'A09', name: 'Security Logging and Monitoring Failures' },
  'default': { id: 'A05', name: 'Security Misconfiguration' }
};

// Secret risk classification
interface SecretRiskContext {
  risk_level: 'critical' | 'high' | 'medium' | 'low';
  is_test_key: boolean;
  is_live_key: boolean;
  is_high_privilege: boolean;
  key_type: string;
  rotation_steps: string[];
}

function classifySecretRisk(code: string, line: string): SecretRiskContext {
  const lowerLine = line.toLowerCase();
  const lowerCode = code.toLowerCase();
  
  // Check if it's a test key
  const isTestKey = /test|demo|sample|example|fake|mock|dummy|sandbox|dev/i.test(lowerLine) ||
                    /test|demo|sample|example|fake|mock|dummy|sandbox|dev/i.test(lowerCode.slice(0, 500));
  
  // Check key type
  let keyType = 'unknown';
  let isHighPrivilege = false;
  let rotationSteps: string[] = [];
  
  if (/stripe/i.test(lowerLine)) {
    keyType = 'Stripe API Key';
    isHighPrivilege = /sk_live/i.test(lowerLine);
    rotationSteps = ['1. Go to Stripe Dashboard → Developers → API Keys', '2. Roll the compromised key', '3. Update all services using the old key', '4. Monitor for unauthorized transactions'];
  } else if (/aws|amazon/i.test(lowerLine)) {
    keyType = 'AWS Credentials';
    isHighPrivilege = true;
    rotationSteps = ['1. Immediately deactivate the key in AWS IAM', '2. Create a new key pair', '3. Update all applications', '4. Review CloudTrail for unauthorized access'];
  } else if (/github/i.test(lowerLine)) {
    keyType = 'GitHub Token';
    isHighPrivilege = /ghp_|gho_/i.test(lowerLine);
    rotationSteps = ['1. Revoke token in GitHub Settings → Developer Settings', '2. Generate new token with minimal scopes', '3. Update CI/CD configurations'];
  } else if (/openai|anthropic|gemini/i.test(lowerLine)) {
    keyType = 'AI API Key';
    isHighPrivilege = true;
    rotationSteps = ['1. Revoke key in provider dashboard', '2. Generate new key', '3. Update environment variables', '4. Check usage for unauthorized calls'];
  } else if (/password|passwd|pwd/i.test(lowerLine)) {
    keyType = 'Password';
    isHighPrivilege = /admin|root|master|super/i.test(lowerLine);
    rotationSteps = ['1. Change the password immediately', '2. Review access logs', '3. Enable MFA if available', '4. Audit affected accounts'];
  } else if (/database|db_|mongodb|postgres|mysql/i.test(lowerLine)) {
    keyType = 'Database Credentials';
    isHighPrivilege = true;
    rotationSteps = ['1. Rotate database credentials', '2. Update connection strings', '3. Review database access logs', '4. Consider IP whitelisting'];
  } else {
    keyType = 'Generic Secret';
    rotationSteps = ['1. Identify the service this key belongs to', '2. Revoke and regenerate the key', '3. Update all dependent services'];
  }
  
  const isLiveKey = !isTestKey && (isHighPrivilege || /live|prod|production/i.test(lowerLine));
  
  let riskLevel: 'critical' | 'high' | 'medium' | 'low' = 'medium';
  if (isLiveKey && isHighPrivilege) riskLevel = 'critical';
  else if (isLiveKey) riskLevel = 'high';
  else if (isTestKey) riskLevel = 'low';
  
  return {
    risk_level: riskLevel,
    is_test_key: isTestKey,
    is_live_key: isLiveKey,
    is_high_privilege: isHighPrivilege,
    key_type: keyType,
    rotation_steps: rotationSteps
  };
}

// Static rule-based checks
interface StaticCheck {
  type: 'vulnerability' | 'bug' | 'code_smell';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  pattern: string;
  fix: string;
  owasp_category?: string;
  cwe_id?: string;
}

const staticChecks: { pattern: RegExp; check: StaticCheck; owaspKey: string }[] = [
  {
    pattern: /(?:api[_-]?key|apikey|secret|password|passwd|pwd|token|auth)[\s]*[:=][\s]*["'][\w\-]{16,}["']/gi,
    check: {
      type: 'vulnerability',
      severity: 'critical',
      title: 'Hardcoded Secret Detected',
      description: 'Credentials or API keys are hardcoded in the source code.',
      pattern: 'Hardcoded credential pattern',
      fix: 'Move secrets to environment variables or a secure secret management service.',
      cwe_id: 'CWE-798'
    },
    owaspKey: 'hardcoded_secret'
  },
  {
    pattern: /(?:execute|query|exec)\s*\(\s*["'`].*\$\{|\.query\s*\(\s*`[^`]*\$\{|["'].*\+.*(?:req|request|params|query|body)\./gi,
    check: {
      type: 'vulnerability',
      severity: 'critical',
      title: 'Potential SQL Injection',
      description: 'User input appears to be directly concatenated into SQL queries.',
      pattern: 'String concatenation in SQL query',
      fix: 'Use parameterized queries or prepared statements.',
      cwe_id: 'CWE-89'
    },
    owaspKey: 'sql_injection'
  },
  {
    pattern: /(?:exec|spawn|execSync|spawnSync|execFile)\s*\([^)]*(?:\+|`|\$\{)/gi,
    check: {
      type: 'vulnerability',
      severity: 'critical',
      title: 'Potential Command Injection',
      description: 'User input may be passed to shell commands without proper sanitization.',
      pattern: 'Dynamic command execution',
      fix: 'Avoid shell commands with user input. Use allowlists and escape all input.',
      cwe_id: 'CWE-78'
    },
    owaspKey: 'command_injection'
  },
  {
    pattern: /\.innerHTML\s*=|dangerouslySetInnerHTML/gi,
    check: {
      type: 'vulnerability',
      severity: 'high',
      title: 'Potential XSS Vulnerability',
      description: 'Direct HTML injection can lead to Cross-Site Scripting attacks.',
      pattern: 'innerHTML assignment',
      fix: 'Use textContent instead of innerHTML, or sanitize HTML with DOMPurify.',
      cwe_id: 'CWE-79'
    },
    owaspKey: 'xss'
  },
  {
    pattern: /\beval\s*\(|new\s+Function\s*\(/gi,
    check: {
      type: 'vulnerability',
      severity: 'high',
      title: 'Dangerous eval() Usage',
      description: 'eval() can execute arbitrary code and is a security risk.',
      pattern: 'eval() or Function constructor',
      fix: 'Avoid eval(). Use JSON.parse() for JSON data.',
      cwe_id: 'CWE-95'
    },
    owaspKey: 'eval'
  },
  {
    pattern: /(?:md5|sha1)\s*\(|createHash\s*\(\s*["'](?:md5|sha1)["']\)/gi,
    check: {
      type: 'vulnerability',
      severity: 'medium',
      title: 'Weak Cryptographic Hash',
      description: 'MD5 and SHA1 are cryptographically weak.',
      pattern: 'Weak hash algorithm',
      fix: 'Use SHA-256 or stronger. For passwords, use bcrypt or Argon2.',
      cwe_id: 'CWE-328'
    },
    owaspKey: 'weak_crypto'
  },
  {
    pattern: /console\.log\s*\([^)]*(?:password|secret|token|key|auth|credential)/gi,
    check: {
      type: 'code_smell',
      severity: 'medium',
      title: 'Sensitive Data in Logs',
      description: 'Logging sensitive information can expose credentials.',
      pattern: 'Sensitive data logging',
      fix: 'Remove or mask sensitive data before logging.',
      cwe_id: 'CWE-532'
    },
    owaspKey: 'sensitive_data_logging'
  },
  {
    pattern: /rejectUnauthorized\s*:\s*false|NODE_TLS_REJECT_UNAUTHORIZED\s*=\s*["']?0|verify\s*=\s*False|ssl\s*=\s*False/gi,
    check: {
      type: 'vulnerability',
      severity: 'high',
      title: 'SSL Verification Disabled',
      description: 'Disabling SSL verification makes the application vulnerable to MITM attacks.',
      pattern: 'SSL verification disabled',
      fix: 'Enable SSL verification. Fix certificate issues properly.',
      cwe_id: 'CWE-295'
    },
    owaspKey: 'ssl_disabled'
  },
  {
    pattern: /(?:\/\/|#|\/\*)\s*(?:TODO|FIXME|HACK|XXX).*(?:security|auth|password|encrypt)/gi,
    check: {
      type: 'code_smell',
      severity: 'low',
      title: 'Security-Related TODO',
      description: 'There are unresolved security-related tasks.',
      pattern: 'Security TODO comment',
      fix: 'Address the security concern before deploying.',
      cwe_id: 'CWE-546'
    },
    owaspKey: 'default'
  },
  {
    pattern: /["'](?:localhost|127\.0\.0\.1|0\.0\.0\.0):\d+["']/gi,
    check: {
      type: 'code_smell',
      severity: 'low',
      title: 'Hardcoded Localhost',
      description: 'Hardcoded localhost addresses may cause issues in production.',
      pattern: 'Localhost URL',
      fix: 'Use environment variables for host configuration.',
      cwe_id: 'CWE-1188'
    },
    owaspKey: 'default'
  }
];

function runStaticChecks(code: string): { issue: any; line: number; owaspKey: string }[] {
  const results: { issue: any; line: number; owaspKey: string }[] = [];
  const lines = code.split('\n');

  for (const { pattern, check, owaspKey } of staticChecks) {
    lines.forEach((line, index) => {
      if (pattern.test(line)) {
        const owasp = OWASP_MAPPING[owaspKey] || OWASP_MAPPING['default'];
        let enhancedCheck: any = { 
          ...check, 
          owasp_id: owasp.id,
          owasp_category: owasp.name
        };
        
        // Add secret risk context for hardcoded secrets
        if (owaspKey === 'hardcoded_secret') {
          const secretContext = classifySecretRisk(code, line);
          enhancedCheck = {
            ...enhancedCheck,
            secret_context: secretContext,
            severity: secretContext.risk_level
          };
        }
        
        results.push({ issue: enhancedCheck, line: index + 1, owaspKey });
      }
      pattern.lastIndex = 0;
    });
  }

  return results;
}

// Generate vulnerability hash for diff tracking
function generateVulnerabilityHash(issue: any, line?: number): string {
  const hashInput = `${issue.type}|${issue.title}|${line || 0}`;
  let hash = 0;
  for (let i = 0; i < hashInput.length; i++) {
    const char = hashInput.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

// Evaluate policy against issues
interface Policy {
  max_critical: number;
  max_high: number;
  max_medium: number;
  max_low: number | null;
  ignore_paths: string[];
}

function evaluatePolicy(issues: any[], policy: Policy, filePath?: string): { passed: boolean; violations: string[] } {
  const violations: string[] = [];
  
  // Check if path should be ignored
  if (filePath && policy.ignore_paths.some(p => filePath.includes(p))) {
    return { passed: true, violations: [] };
  }
  
  const counts = {
    critical: issues.filter(i => i.severity === 'critical').length,
    high: issues.filter(i => i.severity === 'high').length,
    medium: issues.filter(i => i.severity === 'medium').length,
    low: issues.filter(i => i.severity === 'low').length
  };
  
  if (counts.critical > policy.max_critical) {
    violations.push(`Critical issues: ${counts.critical} (max: ${policy.max_critical})`);
  }
  if (counts.high > policy.max_high) {
    violations.push(`High issues: ${counts.high} (max: ${policy.max_high})`);
  }
  if (counts.medium > policy.max_medium) {
    violations.push(`Medium issues: ${counts.medium} (max: ${policy.max_medium})`);
  }
  if (policy.max_low !== null && counts.low > policy.max_low) {
    violations.push(`Low issues: ${counts.low} (max: ${policy.max_low})`);
  }
  
  return { passed: violations.length === 0, violations };
}

// Check if issue is suppressed
interface Suppression {
  issue_type: string;
  issue_title: string | null;
  scope: string;
  file_path: string | null;
  is_active: boolean;
  expires_at: string | null;
}

function isIssueSuppressed(issue: any, suppressions: Suppression[], filePath?: string): boolean {
  const now = new Date();
  
  return suppressions.some(s => {
    if (!s.is_active) return false;
    if (s.expires_at && new Date(s.expires_at) < now) return false;
    
    const typeMatch = s.issue_type === issue.type || s.issue_type === '*';
    const titleMatch = !s.issue_title || issue.title?.toLowerCase().includes(s.issue_title.toLowerCase());
    
    if (s.scope === 'global') return typeMatch && titleMatch;
    if (s.scope === 'file' && filePath && s.file_path) {
      return typeMatch && titleMatch && filePath.includes(s.file_path);
    }
    return typeMatch && titleMatch;
  });
}

type ConfidenceLevel = 'High' | 'Medium' | 'Low';

function calculateConfidence(issue: any, staticIssues: any[], aiIssues: any[]): { confidence: ConfidenceLevel; reason: string; methods: string[] } {
  const issueTitle = issue.title?.toLowerCase() || '';
  const staticMatch = staticIssues.find(s => s.title?.toLowerCase().includes(issueTitle.split(' ')[0]));
  const aiMatch = aiIssues.find(a => a.title?.toLowerCase().includes(issueTitle.split(' ')[0]));
  
  const methods: string[] = [];
  if (staticMatch || issue.source === 'static') methods.push('Static Pattern Match');
  if (aiMatch || issue.source === 'ai') methods.push('AI Reasoning');
  
  if (methods.length >= 2 || (staticMatch && aiMatch)) {
    return { confidence: 'High', reason: 'Detected by both static analysis and AI.', methods: ['Static Pattern Match', 'AI Reasoning'] };
  }
  if (issue.source === 'static') {
    return { confidence: 'Medium', reason: 'Detected by static pattern matching only.', methods: ['Static Pattern Match'] };
  }
  return { confidence: 'Low', reason: 'Detected by AI reasoning only.', methods: ['AI Reasoning'] };
}

function getExplanationPrompt(level: 'junior' | 'senior' | 'lead'): string {
  switch (level) {
    case 'junior':
      return `Explain issues in simple terms for a junior developer. Use analogies.`;
    case 'senior':
      return `Provide concise, technical explanations. Include CWE references.`;
    case 'lead':
      return `Provide detailed analysis with threat modeling, compliance implications (OWASP, PCI-DSS).`;
    default:
      return '';
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code, language, explanationLevel = 'senior', userId, saveToHistory = false, filePath } = await req.json();
    
    if (!code || !language) {
      return new Response(JSON.stringify({ error: "Code and language are required" }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("AI service not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch user's policy, suppressions, and previous scan
    let policy: Policy | null = null;
    let suppressions: Suppression[] = [];
    let previousScan: any = null;
    let baselineHashes: string[] = [];

    if (userId) {
      // Check usage limits
      const { data: usage } = await supabase.from('usage_tracking').select('*').eq('user_id', userId).single();
      if (usage) {
        const billingStart = new Date(usage.billing_period_start);
        const now = new Date();
        if (now.getMonth() !== billingStart.getMonth() || now.getFullYear() !== billingStart.getFullYear()) {
          await supabase.from('usage_tracking').update({ scans_this_month: 0, billing_period_start: now.toISOString() }).eq('user_id', userId);
        } else if (usage.scans_this_month >= usage.scans_limit) {
          return new Response(JSON.stringify({ error: "Monthly scan limit reached", limit: usage.scans_limit }), 
            { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
      }

      // Fetch active policy
      const { data: policyData } = await supabase.from('security_policies').select('*').eq('user_id', userId).eq('is_active', true).single();
      if (policyData) {
        policy = { max_critical: policyData.max_critical, max_high: policyData.max_high, max_medium: policyData.max_medium, max_low: policyData.max_low, ignore_paths: policyData.ignore_paths || [] };
      }

      // Fetch suppressions
      const { data: suppressionData } = await supabase.from('suppression_rules').select('*').eq('user_id', userId).eq('is_active', true);
      if (suppressionData) suppressions = suppressionData;

      // Fetch previous scan for diff
      const { data: prevScan } = await supabase.from('scan_history').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).single();
      if (prevScan) previousScan = prevScan;

      // Fetch baseline if exists
      const { data: baseline } = await supabase.from('scan_baselines').select('issue_hashes').eq('user_id', userId).eq('is_active', true).single();
      if (baseline) baselineHashes = baseline.issue_hashes || [];
    }

    console.log(`Analyzing ${language} code (${code.length} chars) at ${explanationLevel} level`);

    // Run static checks
    const staticResults = runStaticChecks(code);
    const staticIssues = staticResults.map(r => ({ ...r.issue, line: r.line, source: 'static' }));
    console.log(`Static analysis found ${staticIssues.length} issues`);

    // Run AI analysis
    const explanationContext = getExplanationPrompt(explanationLevel as 'junior' | 'senior' | 'lead');
    const systemPrompt = `You are a security expert. ${explanationContext}

Analyze the code for security vulnerabilities, bugs, and poor practices.
${staticIssues.length > 0 ? `Already detected: ${staticIssues.map(i => i.title).join(', ')}. Don't repeat these.` : ''}

For each NEW issue, provide: type, severity (critical/high/medium/low), title, line, description, fix, owasp_id (A01-A10), cwe_id.

Respond in JSON: { "summary": "...", "issues": [...], "fixed_code": "...", "score": 0-100 }`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Analyze this ${language} code:\n\`\`\`${language}\n${code}\n\`\`\`` }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted" }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      throw new Error("AI analysis failed");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    let analysis;
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonStr = jsonMatch ? jsonMatch[1].trim() : content.trim();
      analysis = JSON.parse(jsonStr);
    } catch {
      analysis = { summary: content, issues: [], score: 50 };
    }

    // Combine issues with confidence and OWASP mapping
    const aiIssuesWithSource = (analysis.issues || []).map((i: any) => ({ ...i, source: 'ai' }));
    let allIssues = [...staticIssues, ...aiIssuesWithSource].map(issue => {
      const { confidence, reason, methods } = calculateConfidence(issue, staticIssues, aiIssuesWithSource);
      const hash = generateVulnerabilityHash(issue, issue.line);
      return { ...issue, confidence, confidence_reason: reason, detection_methods: methods, vulnerability_hash: hash };
    });

    // Apply suppressions
    const suppressedIssues = allIssues.filter(i => isIssueSuppressed(i, suppressions, filePath));
    const activeIssues = allIssues.filter(i => !isIssueSuppressed(i, suppressions, filePath));

    // Calculate diff with previous scan
    let diffResult = { new_issues: [] as any[], fixed_issues: [] as any[], unchanged_issues: [] as any[] };
    const currentHashes = activeIssues.map(i => i.vulnerability_hash);
    
    if (previousScan?.vulnerability_hashes) {
      const prevHashes = previousScan.vulnerability_hashes || [];
      diffResult.new_issues = activeIssues.filter(i => !prevHashes.includes(i.vulnerability_hash));
      diffResult.fixed_issues = prevHashes.filter((h: string) => !currentHashes.includes(h)).map((h: string) => ({ vulnerability_hash: h }));
      diffResult.unchanged_issues = activeIssues.filter(i => prevHashes.includes(i.vulnerability_hash));
    }

    // Filter baseline issues if baseline mode active
    const newSinceBaseline = baselineHashes.length > 0 
      ? activeIssues.filter(i => !baselineHashes.includes(i.vulnerability_hash))
      : activeIssues;

    // Calculate counts
    const criticalCount = activeIssues.filter(i => i.severity === 'critical').length;
    const highCount = activeIssues.filter(i => i.severity === 'high').length;
    const mediumCount = activeIssues.filter(i => i.severity === 'medium').length;
    const lowCount = activeIssues.filter(i => i.severity === 'low').length;

    // Evaluate policy
    let policyResult = { passed: true, violations: [] as string[] };
    if (policy) {
      policyResult = evaluatePolicy(activeIssues, policy, filePath);
    }

    let finalScore = analysis.score || 50;
    finalScore = Math.max(0, finalScore - (criticalCount * 20) - (highCount * 10) - (mediumCount * 5));

    const finalAnalysis = {
      summary: analysis.summary,
      issues: activeIssues,
      suppressed_issues: suppressedIssues,
      fixed_code: analysis.fixed_code,
      score: finalScore,
      severity_counts: { critical: criticalCount, high: highCount, medium: mediumCount, low: lowCount },
      confidence_distribution: {
        high: activeIssues.filter(i => i.confidence === 'High').length,
        medium: activeIssues.filter(i => i.confidence === 'Medium').length,
        low: activeIssues.filter(i => i.confidence === 'Low').length
      },
      diff: {
        new_issues: diffResult.new_issues.length,
        fixed_issues: diffResult.fixed_issues.length,
        new_issue_details: diffResult.new_issues,
        fixed_issue_hashes: diffResult.fixed_issues.map(i => i.vulnerability_hash)
      },
      new_since_baseline: newSinceBaseline.length,
      policy_evaluation: policyResult,
      vulnerability_hashes: currentHashes
    };

    // Save to history
    if (userId) {
      const { data: currentUsage } = await supabase.from('usage_tracking').select('scans_this_month').eq('user_id', userId).single();
      if (currentUsage) {
        await supabase.from('usage_tracking').update({ scans_this_month: currentUsage.scans_this_month + 1 }).eq('user_id', userId);
      }

      if (saveToHistory) {
        const codeHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(code))
          .then(buf => Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join(''));

        await supabase.from('scan_history').insert({
          user_id: userId,
          code_hash: codeHash,
          language,
          score: finalScore,
          summary: finalAnalysis.summary,
          issues_count: activeIssues.length,
          critical_count: criticalCount,
          high_count: highCount,
          medium_count: mediumCount,
          low_count: lowCount,
          issues: activeIssues,
          fixed_code: analysis.fixed_code,
          static_checks: staticIssues,
          vulnerability_hashes: currentHashes,
          previous_scan_id: previousScan?.id,
          new_issues_count: diffResult.new_issues.length,
          fixed_issues_count: diffResult.fixed_issues.length,
          policy_passed: policyResult.passed
        });
      }
    }

    console.log(`Analysis complete: ${activeIssues.length} active issues, ${suppressedIssues.length} suppressed, policy: ${policyResult.passed ? 'PASS' : 'FAIL'}`);

    return new Response(JSON.stringify(finalAnalysis), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Analysis failed" }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
