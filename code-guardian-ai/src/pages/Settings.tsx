import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ArrowLeft, Settings as SettingsIcon, User, Key, Github, Shield, EyeOff,
  Copy, Plus, Trash2, Eye, AlertTriangle 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import PolicyManager from "@/components/PolicyManager";
import SuppressionManager from "@/components/SuppressionManager";

interface ApiKey {
  id: string;
  name: string;
  last_used_at: string | null;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

interface Profile {
  display_name: string | null;
  explanation_level: 'junior' | 'senior' | 'lead';
}

interface GithubIntegration {
  id: string;
  repository_full_name: string;
  block_on_critical: boolean;
  block_threshold: number;
  is_active: boolean;
}

export default function Settings() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [profile, setProfile] = useState<Profile>({ display_name: null, explanation_level: 'senior' });
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKey, setNewKey] = useState<string | null>(null);
  const [githubIntegrations, setGithubIntegrations] = useState<GithubIntegration[]>([]);
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchApiKeys();
      fetchGithubIntegrations();
    }
  }, [user]);

  const fetchProfile = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("display_name, explanation_level")
      .eq("user_id", user?.id)
      .single();
    
    if (data) {
      setProfile(data as Profile);
    }
  };

  const fetchApiKeys = async () => {
    const { data } = await supabase
      .from("api_keys")
      .select("id, name, last_used_at, expires_at, is_active, created_at")
      .order("created_at", { ascending: false });
    
    setApiKeys(data || []);
  };

  const fetchGithubIntegrations = async () => {
    const { data } = await supabase
      .from("github_integrations")
      .select("id, repository_full_name, block_on_critical, block_threshold, is_active")
      .order("created_at", { ascending: false });
    
    setGithubIntegrations(data || []);
  };

  const saveProfile = async () => {
    setSavingProfile(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: profile.display_name,
        explanation_level: profile.explanation_level
      })
      .eq("user_id", user?.id);

    setSavingProfile(false);
    
    if (error) {
      toast({ title: "Error", description: "Failed to save profile", variant: "destructive" });
    } else {
      toast({ title: "Saved", description: "Profile updated successfully" });
    }
  };

  const generateApiKey = async () => {
    if (!newKeyName.trim()) {
      toast({ title: "Error", description: "Please enter a key name", variant: "destructive" });
      return;
    }

    // Generate a random API key
    const key = `cg_${crypto.randomUUID().replace(/-/g, '')}`;
    
    // Hash it for storage
    const keyHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(key))
      .then(buf => Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join(''));

    const { error } = await supabase
      .from("api_keys")
      .insert({
        user_id: user?.id,
        name: newKeyName,
        key_hash: keyHash,
      });

    if (error) {
      toast({ title: "Error", description: "Failed to create API key", variant: "destructive" });
    } else {
      setNewKey(key);
      setNewKeyName("");
      fetchApiKeys();
      toast({ title: "Created", description: "API key created. Copy it now - you won't see it again!" });
    }
  };

  const deleteApiKey = async (id: string) => {
    const { error } = await supabase
      .from("api_keys")
      .delete()
      .eq("id", id);

    if (error) {
      toast({ title: "Error", description: "Failed to delete API key", variant: "destructive" });
    } else {
      fetchApiKeys();
      toast({ title: "Deleted", description: "API key removed" });
    }
  };

  const toggleApiKey = async (id: string, isActive: boolean) => {
    await supabase
      .from("api_keys")
      .update({ is_active: !isActive })
      .eq("id", id);
    
    fetchApiKeys();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: "Copied to clipboard" });
  };

  const formatDate = (date: string | null) => {
    if (!date) return "Never";
    return new Date(date).toLocaleDateString();
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
              <SettingsIcon className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-semibold">Settings</h1>
            </div>
          </div>
          <Button variant="outline" onClick={() => signOut()}>
            Sign Out
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Tabs defaultValue="profile">
          <TabsList className="mb-6">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" /> Profile
            </TabsTrigger>
            <TabsTrigger value="api" className="flex items-center gap-2">
              <Key className="h-4 w-4" /> API Keys
            </TabsTrigger>
            <TabsTrigger value="github" className="flex items-center gap-2">
              <Github className="h-4 w-4" /> GitHub
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
                <CardDescription>Manage your account preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={user?.email || ""} disabled className="bg-muted" />
                </div>

                <div className="space-y-2">
                  <Label>Display Name</Label>
                  <Input 
                    value={profile.display_name || ""} 
                    onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
                    placeholder="Your name"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Explanation Level</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Choose how detailed you want vulnerability explanations to be
                  </p>
                  <Select 
                    value={profile.explanation_level} 
                    onValueChange={(v) => setProfile({ ...profile, explanation_level: v as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="junior">
                        <div>
                          <p className="font-medium">Junior</p>
                          <p className="text-xs text-muted-foreground">Simple explanations with analogies</p>
                        </div>
                      </SelectItem>
                      <SelectItem value="senior">
                        <div>
                          <p className="font-medium">Senior</p>
                          <p className="text-xs text-muted-foreground">Technical, concise explanations</p>
                        </div>
                      </SelectItem>
                      <SelectItem value="lead">
                        <div>
                          <p className="font-medium">Security Lead</p>
                          <p className="text-xs text-muted-foreground">Detailed with compliance context</p>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={saveProfile} disabled={savingProfile}>
                  {savingProfile ? "Saving..." : "Save Changes"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="api">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>API Keys</CardTitle>
                <CardDescription>Manage API keys for programmatic access</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* New key display */}
                {newKey && (
                  <div className="bg-success/10 border border-success/20 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-success" />
                      <span className="font-medium text-success">New API Key Created</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Copy this key now. You won't be able to see it again!
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="bg-muted px-3 py-2 rounded flex-1 font-mono text-sm">
                        {newKey}
                      </code>
                      <Button size="icon" variant="outline" onClick={() => copyToClipboard(newKey)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="mt-2"
                      onClick={() => setNewKey(null)}
                    >
                      Dismiss
                    </Button>
                  </div>
                )}

                {/* Create new key */}
                <div className="flex gap-2">
                  <Input 
                    placeholder="Key name (e.g., CI/CD Pipeline)"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                  />
                  <Button onClick={generateApiKey}>
                    <Plus className="h-4 w-4 mr-2" /> Create Key
                  </Button>
                </div>

                {/* Existing keys */}
                <div className="space-y-3">
                  {apiKeys.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No API keys yet</p>
                  ) : (
                    apiKeys.map((key) => (
                      <div key={key.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border">
                        <div>
                          <p className="font-medium">{key.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Created {formatDate(key.created_at)} · Last used {formatDate(key.last_used_at)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={key.is_active ? "default" : "secondary"}>
                            {key.is_active ? "Active" : "Inactive"}
                          </Badge>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => toggleApiKey(key.id, key.is_active)}
                          >
                            {key.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => deleteApiKey(key.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* API Usage docs */}
                <div className="border-t border-border pt-6">
                  <h3 className="font-medium mb-3">API Usage</h3>
                  <pre className="bg-muted/50 rounded-lg p-4 text-sm font-mono overflow-x-auto">
{`curl -X POST ${window.location.origin}/functions/v1/api-scan/scan \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"code": "your code here", "language": "javascript"}'`}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="github">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>GitHub Integration</CardTitle>
                <CardDescription>Connect repositories for automatic PR scanning</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-muted/30 border border-border rounded-lg p-6 text-center">
                  <Github className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium mb-2">Connect GitHub</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Install the CodeGuard AI GitHub App to automatically scan PRs
                  </p>
                  <Button disabled>
                    <Github className="h-4 w-4 mr-2" /> Coming Soon
                  </Button>
                </div>

                {githubIntegrations.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-medium">Connected Repositories</h3>
                    {githubIntegrations.map((integration) => (
                      <div key={integration.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border">
                        <div className="flex items-center gap-3">
                          <Github className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{integration.repository_full_name}</p>
                            <p className="text-xs text-muted-foreground">
                              Block on critical: {integration.block_on_critical ? "Yes" : "No"} · 
                              Threshold: {integration.block_threshold}
                            </p>
                          </div>
                        </div>
                        <Badge variant={integration.is_active ? "default" : "secondary"}>
                          {integration.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
