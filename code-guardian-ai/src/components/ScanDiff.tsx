import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle, ArrowRight } from "lucide-react";

interface DiffData {
  new_issues: number;
  fixed_issues: number;
  new_issue_details?: any[];
  fixed_issue_hashes?: string[];
}

interface ScanDiffProps {
  diff: DiffData;
  previousScore?: number;
  currentScore: number;
}

export default function ScanDiff({ diff, previousScore, currentScore }: ScanDiffProps) {
  const scoreDelta = previousScore !== undefined ? currentScore - previousScore : 0;
  const hasChanges = diff.new_issues > 0 || diff.fixed_issues > 0;

  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <ArrowRight className="h-4 w-4" />
          Changes Since Last Scan
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!hasChanges ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Minus className="h-4 w-4" />
            <span>No changes detected</span>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Score Change */}
            {previousScore !== undefined && (
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <span className="text-sm text-muted-foreground">Score Change</span>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">{previousScore}</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <span className={scoreDelta > 0 ? "text-success" : scoreDelta < 0 ? "text-destructive" : ""}>
                    {currentScore}
                  </span>
                  {scoreDelta !== 0 && (
                    <Badge variant={scoreDelta > 0 ? "default" : "destructive"} className="ml-2">
                      {scoreDelta > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                      {scoreDelta > 0 ? "+" : ""}{scoreDelta}
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Summary Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className={`p-4 rounded-lg ${diff.new_issues > 0 ? "bg-destructive/10" : "bg-muted/30"}`}>
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className={`h-4 w-4 ${diff.new_issues > 0 ? "text-destructive" : "text-muted-foreground"}`} />
                  <span className="text-sm font-medium">New Issues</span>
                </div>
                <p className={`text-2xl font-bold ${diff.new_issues > 0 ? "text-destructive" : "text-muted-foreground"}`}>
                  {diff.new_issues > 0 ? `+${diff.new_issues}` : "0"}
                </p>
              </div>
              <div className={`p-4 rounded-lg ${diff.fixed_issues > 0 ? "bg-success/10" : "bg-muted/30"}`}>
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className={`h-4 w-4 ${diff.fixed_issues > 0 ? "text-success" : "text-muted-foreground"}`} />
                  <span className="text-sm font-medium">Fixed Issues</span>
                </div>
                <p className={`text-2xl font-bold ${diff.fixed_issues > 0 ? "text-success" : "text-muted-foreground"}`}>
                  {diff.fixed_issues > 0 ? `-${diff.fixed_issues}` : "0"}
                </p>
              </div>
            </div>

            {/* New Issue Details */}
            {diff.new_issue_details && diff.new_issue_details.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">New Vulnerabilities</h4>
                <div className="space-y-2">
                  {diff.new_issue_details.slice(0, 5).map((issue, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-destructive/5 rounded border border-destructive/20">
                      <Badge variant={issue.severity === "critical" ? "destructive" : "outline"} className="text-xs">
                        {issue.severity}
                      </Badge>
                      <span className="text-sm">{issue.title}</span>
                      {issue.owasp_id && (
                        <Badge variant="secondary" className="text-xs ml-auto">
                          {issue.owasp_id}
                        </Badge>
                      )}
                    </div>
                  ))}
                  {diff.new_issue_details.length > 5 && (
                    <p className="text-xs text-muted-foreground">+{diff.new_issue_details.length - 5} more</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
