import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Shield,
  LogOut,
  Play,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Loader2,
  Code2,
  History,
  Settings,
  CreditCard,
  Zap,
} from "lucide-react";

interface Issue {
  type: string;
  severity: string;
  title: string;
  line?: number;
  description: string;
  fix: string;
  source?: string;
}

interface AnalysisResult {
  summary: string;
  issues: Issue[];
  fixed_code?: string;
  score: number;
  severity_counts?: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

interface UsageData {
  scans_this_month: number;
  scans_limit: number;
  subscription_tier: string;
}

const LANGUAGES = [
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "php", label: "PHP" },
];

const SAMPLE_CODE = `function login(username, password) {
  const query = "SELECT * FROM users WHERE username='" + username + "' AND password='" + password + "'";
  const result = db.execute(query);
  if (result.length > 0) {
    document.cookie = "session=" + result[0].id;
    return true;
  }
  return false;
}`;

const Dashboard = () => {
  const [code, setCode] = useState(SAMPLE_CODE);
  const [language, setLanguage] = useState("javascript");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [explanationLevel, setExplanationLevel] = useState<string>("senior");
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchUsage();
      fetchProfile();
    }
  }, [user]);

  const fetchUsage = async () => {
    const { data } = await supabase
      .from("usage_tracking")
      .select("scans_this_month, scans_limit, subscription_tier")
      .eq("user_id", user?.id)
      .single();
    
    if (data) {
      setUsage(data);
    }
  };

  const fetchProfile = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("explanation_level")
      .eq("user_id", user?.id)
      .single();
    
    if (data?.explanation_level) {
      setExplanationLevel(data.explanation_level);
    }
  };

  const handleAnalyze = async () => {
    if (!code.trim()) {
      toast({
        title: "No Code",
        description: "Please enter some code to analyze.",
        variant: "destructive",
      });
      return;
    }

    if (usage && usage.scans_this_month >= usage.scans_limit) {
      toast({
        title: "Limit Reached",
        description: "You've reached your monthly scan limit. Upgrade for more scans.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("analyze-code", {
        body: { 
          code, 
          language, 
          userId: user?.id,
          saveToHistory: true,
          explanationLevel 
        },
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setResult(data);
      fetchUsage(); // Refresh usage count
      
      toast({
        title: "Analysis Complete",
        description: `Found ${data.issues?.length || 0} issues. Score: ${data.score}/100`,
      });
    } catch (error) {
      console.error("Analysis error:", error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to analyze code",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <XCircle className="w-5 h-5 text-destructive" />;
      case "high":
        return <AlertTriangle className="w-5 h-5 text-warning" />;
      case "medium":
        return <Info className="w-5 h-5 text-primary" />;
      default:
        return <CheckCircle className="w-5 h-5 text-success" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-success";
    if (score >= 50) return "text-warning";
    return "text-destructive";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="font-bold text-lg">CodeGuard AI</h1>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </Link>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Usage indicator */}
            {usage && (
              <Badge variant="outline" className="hidden sm:flex gap-1">
                <Zap className="h-3 w-3" />
                {usage.scans_this_month}/{usage.scans_limit} scans
              </Badge>
            )}
            
            <Link to="/history">
              <Button variant="ghost" size="icon" title="Scan History">
                <History className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/settings">
              <Button variant="ghost" size="icon" title="Settings">
                <Settings className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/pricing">
              <Button variant="ghost" size="icon" title="Pricing">
                <CreditCard className="w-4 h-4" />
              </Button>
            </Link>
            <Button variant="ghost" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Code Input */}
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Code2 className="w-5 h-5 text-primary" />
                Code Input
              </h2>
              <div className="flex items-center gap-2">
                <Select value={explanationLevel} onValueChange={setExplanationLevel}>
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="junior">Junior</SelectItem>
                    <SelectItem value="senior">Senior</SelectItem>
                    <SelectItem value="lead">Lead</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((lang) => (
                      <SelectItem key={lang.value} value={lang.value}>
                        {lang.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="gradient-border rounded-xl overflow-hidden">
              <div className="terminal-header">
                <div className="terminal-dot bg-destructive" />
                <div className="terminal-dot bg-warning" />
                <div className="terminal-dot bg-success" />
                <span className="text-xs text-muted-foreground ml-2">
                  {language}.code
                </span>
              </div>
              <Textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Paste your code here..."
                className="min-h-[400px] font-mono text-sm border-0 rounded-none bg-muted/30 resize-none focus-visible:ring-0"
              />
            </div>

            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing || (usage !== null && usage.scans_this_month >= usage.scans_limit)}
              className="w-full bg-primary hover:bg-primary/90"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Analyze Code
                </>
              )}
            </Button>
            
            {usage && usage.scans_this_month >= usage.scans_limit && (
              <p className="text-sm text-destructive text-center">
                Monthly limit reached. <Link to="/pricing" className="underline">Upgrade</Link> for more scans.
              </p>
            )}
          </div>

          {/* Results */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Analysis Results
            </h2>

            {!result && !isAnalyzing && (
              <div className="gradient-border rounded-xl bg-card p-12 text-center">
                <Shield className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Click "Analyze Code" to scan for vulnerabilities
                </p>
              </div>
            )}

            {isAnalyzing && (
              <div className="gradient-border rounded-xl bg-card p-12 text-center">
                <Loader2 className="w-16 h-16 text-primary mx-auto mb-4 animate-spin" />
                <p className="text-muted-foreground">
                  AI is analyzing your code...
                </p>
              </div>
            )}

            {result && (
              <div className="space-y-4">
                {/* Score */}
                <div className="gradient-border rounded-xl bg-card p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-muted-foreground">Security Score</span>
                    <span className={`text-4xl font-bold ${getScoreColor(result.score)}`}>
                      {result.score}/100
                    </span>
                  </div>
                  
                  {/* Severity breakdown */}
                  {result.severity_counts && (
                    <div className="grid grid-cols-4 gap-2 mb-4">
                      <div className="text-center p-2 bg-destructive/10 rounded">
                        <p className="text-lg font-bold text-destructive">{result.severity_counts.critical}</p>
                        <p className="text-xs text-muted-foreground">Critical</p>
                      </div>
                      <div className="text-center p-2 bg-warning/10 rounded">
                        <p className="text-lg font-bold text-warning">{result.severity_counts.high}</p>
                        <p className="text-xs text-muted-foreground">High</p>
                      </div>
                      <div className="text-center p-2 bg-primary/10 rounded">
                        <p className="text-lg font-bold text-primary">{result.severity_counts.medium}</p>
                        <p className="text-xs text-muted-foreground">Medium</p>
                      </div>
                      <div className="text-center p-2 bg-muted rounded">
                        <p className="text-lg font-bold text-muted-foreground">{result.severity_counts.low}</p>
                        <p className="text-xs text-muted-foreground">Low</p>
                      </div>
                    </div>
                  )}
                  
                  <p className="text-sm text-muted-foreground">{result.summary}</p>
                </div>

                {/* Issues */}
                {result.issues?.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                      Issues Found ({result.issues.length})
                    </h3>
                    {result.issues.map((issue, index) => (
                      <div
                        key={index}
                        className="gradient-border rounded-xl bg-card p-4 space-y-3"
                      >
                        <div className="flex items-start gap-3">
                          {getSeverityIcon(issue.severity)}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold">{issue.title}</span>
                              <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                                {issue.type}
                              </span>
                              {issue.source === 'static' && (
                                <Badge variant="outline" className="text-xs">Static</Badge>
                              )}
                              {issue.line && (
                                <span className="text-xs text-muted-foreground">
                                  Line {issue.line}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {issue.description}
                            </p>
                          </div>
                        </div>
                        {issue.fix && (
                          <div className="bg-muted/30 rounded-lg p-3">
                            <p className="text-xs text-muted-foreground mb-1">
                              Recommended Fix:
                            </p>
                            <pre className="text-sm font-mono whitespace-pre-wrap text-success">
                              {issue.fix}
                            </pre>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Fixed Code */}
                {result.fixed_code && (
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                      Corrected Code
                    </h3>
                    <div className="gradient-border rounded-xl overflow-hidden">
                      <div className="terminal-header">
                        <div className="terminal-dot bg-destructive" />
                        <div className="terminal-dot bg-warning" />
                        <div className="terminal-dot bg-success" />
                        <span className="text-xs text-muted-foreground ml-2">
                          fixed.{language}
                        </span>
                      </div>
                      <pre className="p-4 bg-muted/30 font-mono text-sm overflow-x-auto">
                        {result.fixed_code}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
