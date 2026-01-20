import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { EyeOff, Plus, Trash2, Save } from "lucide-react";

interface Suppression {
  id: string;
  issue_type: string;
  issue_title: string | null;
  scope: string;
  file_path: string | null;
  reason: string | null;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

const ISSUE_TYPES = [
  { value: "vulnerability", label: "Vulnerability" },
  { value: "bug", label: "Bug" },
  { value: "code_smell", label: "Code Smell" },
  { value: "*", label: "All Types" }
];

export default function SuppressionManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [suppressions, setSuppressions] = useState<Suppression[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSuppression, setEditingSuppression] = useState<Suppression | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const emptySuppression: Partial<Suppression> = {
    issue_type: "vulnerability",
    issue_title: "",
    scope: "global",
    file_path: "",
    reason: "",
    is_active: true,
    expires_at: null
  };

  useEffect(() => {
    if (user) fetchSuppressions();
  }, [user]);

  const fetchSuppressions = async () => {
    const { data, error } = await supabase
      .from("suppression_rules")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) setSuppressions(data);
    setLoading(false);
  };

  const createSuppression = async () => {
    if (!editingSuppression) return;
    
    const { data, error } = await supabase
      .from("suppression_rules")
      .insert({
        user_id: user?.id,
        issue_type: editingSuppression.issue_type,
        issue_title: editingSuppression.issue_title || null,
        scope: editingSuppression.scope,
        file_path: editingSuppression.file_path || null,
        reason: editingSuppression.reason || null,
        is_active: editingSuppression.is_active,
        expires_at: editingSuppression.expires_at
      })
      .select()
      .single();

    if (error) {
      toast({ title: "Error", description: "Failed to create suppression", variant: "destructive" });
    } else if (data) {
      setSuppressions([data, ...suppressions]);
      setEditingSuppression(null);
      setIsCreating(false);
      toast({ title: "Created", description: "Suppression rule added" });
    }
  };

  const updateSuppression = async () => {
    if (!editingSuppression?.id) return;
    
    const { error } = await supabase
      .from("suppression_rules")
      .update({
        issue_type: editingSuppression.issue_type,
        issue_title: editingSuppression.issue_title || null,
        scope: editingSuppression.scope,
        file_path: editingSuppression.file_path || null,
        reason: editingSuppression.reason || null,
        is_active: editingSuppression.is_active,
        expires_at: editingSuppression.expires_at
      })
      .eq("id", editingSuppression.id);

    if (error) {
      toast({ title: "Error", description: "Failed to update", variant: "destructive" });
    } else {
      setSuppressions(suppressions.map(s => s.id === editingSuppression.id ? editingSuppression : s));
      toast({ title: "Updated", description: "Suppression rule saved" });
    }
  };

  const deleteSuppression = async (id: string) => {
    const { error } = await supabase.from("suppression_rules").delete().eq("id", id);
    if (!error) {
      setSuppressions(suppressions.filter(s => s.id !== id));
      if (editingSuppression?.id === id) setEditingSuppression(null);
      toast({ title: "Deleted", description: "Suppression removed" });
    }
  };

  const startCreating = () => {
    setIsCreating(true);
    setEditingSuppression(emptySuppression as Suppression);
  };

  if (loading) return <div className="animate-pulse h-48 bg-muted rounded-lg" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <EyeOff className="h-5 w-5 text-primary" />
            Suppression Rules
          </h2>
          <p className="text-sm text-muted-foreground">Mark acceptable findings to exclude from reports</p>
        </div>
        <Button onClick={startCreating} size="sm">
          <Plus className="h-4 w-4 mr-2" /> Add Rule
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Suppression List */}
        <div className="space-y-3">
          {suppressions.length === 0 && !isCreating ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No suppression rules. Add one to exclude acceptable findings.
              </CardContent>
            </Card>
          ) : (
            suppressions.map(suppression => (
              <Card
                key={suppression.id}
                className={`cursor-pointer transition-all ${editingSuppression?.id === suppression.id ? "border-primary" : ""}`}
                onClick={() => { setEditingSuppression(suppression); setIsCreating(false); }}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{suppression.issue_type}</Badge>
                        <Badge variant="secondary">{suppression.scope}</Badge>
                        {!suppression.is_active && <Badge variant="destructive">Disabled</Badge>}
                      </div>
                      {suppression.issue_title && (
                        <p className="text-sm text-muted-foreground mt-1">{suppression.issue_title}</p>
                      )}
                      {suppression.file_path && (
                        <p className="text-xs text-muted-foreground font-mono">{suppression.file_path}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={(e) => { e.stopPropagation(); deleteSuppression(suppression.id); }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Suppression Editor */}
        {(editingSuppression || isCreating) && (
          <Card>
            <CardHeader>
              <CardTitle>{isCreating ? "New Suppression Rule" : "Edit Rule"}</CardTitle>
              <CardDescription>Configure what findings to suppress</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Issue Type</Label>
                <Select
                  value={editingSuppression?.issue_type || "vulnerability"}
                  onValueChange={(v) => setEditingSuppression({ ...editingSuppression!, issue_type: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ISSUE_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Issue Title (optional, partial match)</Label>
                <Input
                  placeholder="e.g., Hardcoded Secret"
                  value={editingSuppression?.issue_title || ""}
                  onChange={(e) => setEditingSuppression({ ...editingSuppression!, issue_title: e.target.value })}
                />
              </div>

              <div>
                <Label>Scope</Label>
                <Select
                  value={editingSuppression?.scope || "global"}
                  onValueChange={(v) => setEditingSuppression({ ...editingSuppression!, scope: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="global">Global (all scans)</SelectItem>
                    <SelectItem value="file">Specific File</SelectItem>
                    <SelectItem value="repo">Repository</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {editingSuppression?.scope === "file" && (
                <div>
                  <Label>File Path</Label>
                  <Input
                    placeholder="e.g., tests/fixtures.py"
                    value={editingSuppression?.file_path || ""}
                    onChange={(e) => setEditingSuppression({ ...editingSuppression!, file_path: e.target.value })}
                  />
                </div>
              )}

              <div>
                <Label>Reason (optional)</Label>
                <Textarea
                  placeholder="Why is this finding acceptable?"
                  value={editingSuppression?.reason || ""}
                  onChange={(e) => setEditingSuppression({ ...editingSuppression!, reason: e.target.value })}
                />
              </div>

              <div>
                <Label>Expires At (optional)</Label>
                <Input
                  type="date"
                  value={editingSuppression?.expires_at?.split("T")[0] || ""}
                  onChange={(e) => setEditingSuppression({ ...editingSuppression!, expires_at: e.target.value ? new Date(e.target.value).toISOString() : null })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editingSuppression?.is_active ?? true}
                    onCheckedChange={(checked) => setEditingSuppression({ ...editingSuppression!, is_active: checked })}
                  />
                  <Label>Active</Label>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => { setEditingSuppression(null); setIsCreating(false); }}>
                    Cancel
                  </Button>
                  <Button onClick={isCreating ? createSuppression : updateSuppression}>
                    <Save className="h-4 w-4 mr-2" /> {isCreating ? "Create" : "Save"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
