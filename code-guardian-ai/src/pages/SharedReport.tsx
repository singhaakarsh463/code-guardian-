import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, AlertTriangle, Bug, Code, Zap, ExternalLink } from "lucide-react";

interface ScanData {
  id: string;
  language: string;
  score: number;
  summary: string;
  issues_count: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  created_at: string;
  issues: any[];
  fixed_code: string | null;
}

export default function SharedReport() {
  const { token } = useParams<{ token: string }>();
  const [scan, setScan] = useState<ScanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) fetchSharedReport();
  }, [token]);

  const fetchSharedReport = async () => {
    // First get the shared report record
    const { data: sharedData, error: sharedError } = await supabase
      .from("shared_reports")
      .select("scan_id, expires_at")
      .eq("share_token", token)
      .single();

    if (sharedError || !sharedData) {
      setError("Report not found or link expired");
      setLoading(false);
      return;
    }

    // Check expiration
    if (sharedData.expires_at && new Date(sharedData.expires_at) < new Date()) {
      setError("This share link has expired");
      setLoading(false);
      return;
    }

    // Fetch the actual scan data
    const { data: scanData, error: scanError } = await supabase
      .from("scan_history")
      .select("*")
      .eq("id", sharedData.scan_id)
      .single();

    if (scanError || !scanData) {
      setError("Scan data not found");
      setLoading(false);
      return;
    }

    setScan({
      ...scanData,
      issues: Array.isArray(scanData.issues) ? scanData.issues : []
    });
    
    setLoading(false);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-success";
    if (score >= 50) return "text-warning";
    return "text-destructive";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading report...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="py-12 text-center">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!scan) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-lg">CodeGuard AI Report</h1>
              <p className="text-xs text-muted-foreground">Read-only shared report</p>
            </div>
          </div>
          <Badge variant="outline" className="flex items-center gap-1">
            <ExternalLink className="h-3 w-3" />
            Shared View
          </Badge>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5 text-primary" />
                  {scan.language.toUpperCase()} Analysis
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {new Date(scan.created_at).toLocaleString()}
                </p>
              </div>
              <div className={`text-4xl font-bold ${getScoreColor(scan.score)}`}>
                {scan.score}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-foreground mb-6">{scan.summary}</p>
            
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-destructive/10 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-destructive">{scan.critical_count}</p>
                <p className="text-xs text-muted-foreground">Critical</p>
              </div>
              <div className="bg-warning/10 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-warning">{scan.high_count}</p>
                <p className="text-xs text-muted-foreground">High</p>
              </div>
              <div className="bg-primary/10 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-primary">{scan.medium_count}</p>
                <p className="text-xs text-muted-foreground">Medium</p>
              </div>
              <div className="bg-muted rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-muted-foreground">{scan.low_count}</p>
                <p className="text-xs text-muted-foreground">Low</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Issues */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Issues ({scan.issues.length})</h2>
          {scan.issues.map((issue: any, index: number) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {issue.severity === "critical" && <AlertTriangle className="h-4 w-4 text-destructive" />}
                    {issue.severity === "high" && <Bug className="h-4 w-4 text-warning" />}
                    {issue.severity === "medium" && <Code className="h-4 w-4 text-primary" />}
                    {issue.severity === "low" && <Zap className="h-4 w-4 text-muted-foreground" />}
                    <span className="font-medium">{issue.title}</span>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={issue.severity === "critical" ? "destructive" : issue.severity === "high" ? "default" : "secondary"}>
                      {issue.severity}
                    </Badge>
                    {issue.owasp_id && (
                      <Badge variant="outline">{issue.owasp_id}</Badge>
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{issue.description}</p>
                {issue.fix && (
                  <div className="bg-success/10 border border-success/20 rounded p-2 mt-2">
                    <p className="text-xs font-medium text-success mb-1">Recommended Fix</p>
                    <p className="text-sm text-foreground">{issue.fix}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Fixed Code */}
        {scan.fixed_code && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold mb-4">Corrected Code</h2>
            <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm font-mono">
              {scan.fixed_code}
            </pre>
          </div>
        )}
      </main>
    </div>
  );
}
