import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileJson, FileText, Share2, Copy, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ScanRecord {
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

interface ExportReportsProps {
  scans: ScanRecord[];
}

export default function ExportReports({ scans }: ExportReportsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedScanId, setSelectedScanId] = useState<string>("");
  const [exporting, setExporting] = useState(false);
  const [shareLink, setShareLink] = useState<string>("");
  const [creating, setCreating] = useState(false);

  const selectedScan = scans.find(s => s.id === selectedScanId);

  const exportJSON = () => {
    if (!selectedScan) return;
    
    const exportData = {
      export_date: new Date().toISOString(),
      scan_date: selectedScan.created_at,
      language: selectedScan.language,
      score: selectedScan.score,
      summary: selectedScan.summary,
      severity_counts: {
        critical: selectedScan.critical_count,
        high: selectedScan.high_count,
        medium: selectedScan.medium_count,
        low: selectedScan.low_count
      },
      issues: selectedScan.issues.map((issue: any) => ({
        type: issue.type,
        severity: issue.severity,
        title: issue.title,
        description: issue.description,
        fix: issue.fix,
        line: issue.line,
        owasp_id: issue.owasp_id,
        owasp_category: issue.owasp_category,
        cwe_id: issue.cwe_id,
        confidence: issue.confidence,
        detection_methods: issue.detection_methods
      })),
      fixed_code: selectedScan.fixed_code
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `codeguard-scan-${selectedScan.id.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({ title: "Exported", description: "JSON report downloaded" });
  };

  const exportMarkdown = () => {
    if (!selectedScan) return;
    
    let md = `# CodeGuard AI Security Report\n\n`;
    md += `**Scan Date:** ${new Date(selectedScan.created_at).toLocaleString()}\n`;
    md += `**Language:** ${selectedScan.language}\n`;
    md += `**Security Score:** ${selectedScan.score}/100\n\n`;
    
    md += `## Summary\n\n${selectedScan.summary}\n\n`;
    
    md += `## Severity Breakdown\n\n`;
    md += `| Severity | Count |\n|----------|-------|\n`;
    md += `| Critical | ${selectedScan.critical_count} |\n`;
    md += `| High | ${selectedScan.high_count} |\n`;
    md += `| Medium | ${selectedScan.medium_count} |\n`;
    md += `| Low | ${selectedScan.low_count} |\n\n`;
    
    md += `## Issues\n\n`;
    selectedScan.issues.forEach((issue: any, index: number) => {
      md += `### ${index + 1}. ${issue.title}\n\n`;
      md += `- **Severity:** ${issue.severity}\n`;
      md += `- **Type:** ${issue.type}\n`;
      if (issue.line) md += `- **Line:** ${issue.line}\n`;
      if (issue.owasp_id) md += `- **OWASP:** ${issue.owasp_id} - ${issue.owasp_category}\n`;
      if (issue.cwe_id) md += `- **CWE:** ${issue.cwe_id}\n`;
      md += `\n${issue.description}\n\n`;
      if (issue.fix) md += `**Fix:** ${issue.fix}\n\n`;
      md += `---\n\n`;
    });
    
    if (selectedScan.fixed_code) {
      md += `## Corrected Code\n\n\`\`\`${selectedScan.language}\n${selectedScan.fixed_code}\n\`\`\`\n`;
    }

    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `codeguard-scan-${selectedScan.id.slice(0, 8)}.md`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({ title: "Exported", description: "Markdown report downloaded" });
  };

  const createShareLink = async () => {
    if (!selectedScan || !user) return;
    setCreating(true);

    const token = crypto.randomUUID();
    
    const { error } = await supabase
      .from("shared_reports")
      .insert({
        user_id: user.id,
        scan_id: selectedScan.id,
        share_token: token
      });

    if (error) {
      toast({ title: "Error", description: "Failed to create share link", variant: "destructive" });
    } else {
      const link = `${window.location.origin}/shared/${token}`;
      setShareLink(link);
      toast({ title: "Created", description: "Share link generated" });
    }
    setCreating(false);
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareLink);
    toast({ title: "Copied", description: "Link copied to clipboard" });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5 text-primary" />
          Export Reports
        </CardTitle>
        <CardDescription>Download scan results for audits and compliance</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Select Scan</Label>
          <Select value={selectedScanId} onValueChange={setSelectedScanId}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a scan to export" />
            </SelectTrigger>
            <SelectContent>
              {scans.map(scan => (
                <SelectItem key={scan.id} value={scan.id}>
                  {scan.language.toUpperCase()} - Score: {scan.score} - {new Date(scan.created_at).toLocaleDateString()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedScan && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Button onClick={exportJSON} variant="outline" className="w-full">
                <FileJson className="h-4 w-4 mr-2" />
                Export JSON
              </Button>
              <Button onClick={exportMarkdown} variant="outline" className="w-full">
                <FileText className="h-4 w-4 mr-2" />
                Export Markdown
              </Button>
            </div>

            <div className="border-t pt-4">
              <Label>Share Read-Only Link</Label>
              <div className="flex gap-2 mt-1">
                {shareLink ? (
                  <>
                    <Input value={shareLink} readOnly className="font-mono text-xs" />
                    <Button onClick={copyShareLink} size="icon" variant="outline">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <Button onClick={createShareLink} disabled={creating} className="w-full">
                    {creating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Share2 className="h-4 w-4 mr-2" />}
                    Generate Share Link
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
