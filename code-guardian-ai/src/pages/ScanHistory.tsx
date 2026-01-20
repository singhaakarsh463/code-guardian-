import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, History, AlertTriangle, Bug, Code, Zap, ChevronRight, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

export default function ScanHistory() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [loadingScans, setLoadingScans] = useState(true);
  const [selectedScan, setSelectedScan] = useState<ScanRecord | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchScans();
    }
  }, [user]);

  const fetchScans = async () => {
    const { data, error } = await supabase
      .from("scan_history")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load scan history",
        variant: "destructive",
      });
    } else {
      setScans((data || []).map(d => ({
        ...d,
        issues: Array.isArray(d.issues) ? d.issues : [],
        fixed_code: d.fixed_code || null
      })) as ScanRecord[]);
    }
    setLoadingScans(false);
  };

  const deleteScan = async (id: string) => {
    const { error } = await supabase
      .from("scan_history")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete scan",
        variant: "destructive",
      });
    } else {
      setScans(scans.filter((s) => s.id !== id));
      if (selectedScan?.id === id) {
        setSelectedScan(null);
      }
      toast({
        title: "Deleted",
        description: "Scan removed from history",
      });
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-success";
    if (score >= 50) return "text-warning";
    return "text-destructive";
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-semibold">Scan History</h1>
            </div>
          </div>
          <Badge variant="outline" className="text-muted-foreground">
            {scans.length} scans
          </Badge>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Scan List */}
          <div className="lg:col-span-1 space-y-3">
            {loadingScans ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 bg-card animate-pulse rounded-lg" />
                ))}
              </div>
            ) : scans.length === 0 ? (
              <Card className="border-border bg-card">
                <CardContent className="py-12 text-center">
                  <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No scans yet</p>
                  <Link to="/dashboard">
                    <Button className="mt-4" size="sm">
                      Run your first scan
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              scans.map((scan) => (
                <Card
                  key={scan.id}
                  className={`border-border bg-card cursor-pointer transition-all hover:border-primary/50 ${
                    selectedScan?.id === scan.id ? "border-primary ring-1 ring-primary/20" : ""
                  }`}
                  onClick={() => setSelectedScan(scan)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="secondary" className="uppercase text-xs">
                        {scan.language}
                      </Badge>
                      <span className={`text-lg font-bold ${getScoreColor(scan.score)}`}>
                        {scan.score}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                      {scan.critical_count > 0 && (
                        <span className="flex items-center gap-1 text-destructive">
                          <AlertTriangle className="h-3 w-3" /> {scan.critical_count}
                        </span>
                      )}
                      {scan.high_count > 0 && (
                        <span className="flex items-center gap-1 text-warning">
                          <Bug className="h-3 w-3" /> {scan.high_count}
                        </span>
                      )}
                      <span>{scan.issues_count} issues</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{formatDate(scan.created_at)}</p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Scan Details */}
          <div className="lg:col-span-2">
            {selectedScan ? (
              <Card className="border-border bg-card">
                <CardHeader className="border-b border-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Code className="h-5 w-5 text-primary" />
                        {selectedScan.language.toUpperCase()} Analysis
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {formatDate(selectedScan.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className={`text-3xl font-bold ${getScoreColor(selectedScan.score)}`}
                      >
                        {selectedScan.score}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteScan(selectedScan.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {/* Summary */}
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Summary</h3>
                    <p className="text-foreground">{selectedScan.summary}</p>
                  </div>

                  {/* Severity breakdown */}
                  <div className="grid grid-cols-4 gap-4 mb-6">
                    <div className="bg-destructive/10 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-destructive">{selectedScan.critical_count}</p>
                      <p className="text-xs text-muted-foreground">Critical</p>
                    </div>
                    <div className="bg-warning/10 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-warning">{selectedScan.high_count}</p>
                      <p className="text-xs text-muted-foreground">High</p>
                    </div>
                    <div className="bg-primary/10 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-primary">{selectedScan.medium_count}</p>
                      <p className="text-xs text-muted-foreground">Medium</p>
                    </div>
                    <div className="bg-muted rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-muted-foreground">{selectedScan.low_count}</p>
                      <p className="text-xs text-muted-foreground">Low</p>
                    </div>
                  </div>

                  {/* Issues */}
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">Issues</h3>
                    <div className="space-y-3">
                      {selectedScan.issues?.map((issue: any, index: number) => (
                        <div
                          key={index}
                          className="border border-border rounded-lg p-4 bg-muted/30"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {issue.severity === "critical" && (
                                <AlertTriangle className="h-4 w-4 text-destructive" />
                              )}
                              {issue.severity === "high" && (
                                <Bug className="h-4 w-4 text-warning" />
                              )}
                              {issue.severity === "medium" && (
                                <Code className="h-4 w-4 text-primary" />
                              )}
                              {issue.severity === "low" && (
                                <Zap className="h-4 w-4 text-muted-foreground" />
                              )}
                              <span className="font-medium">{issue.title}</span>
                            </div>
                            <Badge
                              variant={
                                issue.severity === "critical"
                                  ? "destructive"
                                  : issue.severity === "high"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {issue.severity}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{issue.description}</p>
                          {issue.fix && (
                            <div className="bg-success/10 border border-success/20 rounded p-2 mt-2">
                              <p className="text-xs font-medium text-success mb-1">Recommended Fix</p>
                              <p className="text-sm text-foreground">{issue.fix}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Fixed code */}
                  {selectedScan.fixed_code && (
                    <div className="mt-6">
                      <h3 className="text-sm font-medium text-muted-foreground mb-3">Fixed Code</h3>
                      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm font-mono">
                        {selectedScan.fixed_code}
                      </pre>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="border-border bg-card h-full min-h-[400px] flex items-center justify-center">
                <CardContent className="text-center">
                  <ChevronRight className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Select a scan to view details</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
