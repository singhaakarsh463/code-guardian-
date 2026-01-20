import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Shield, Save, Plus, Trash2 } from "lucide-react";

interface Policy {
  id: string;
  name: string;
  max_critical: number;
  max_high: number;
  max_medium: number;
  max_low: number | null;
  ignore_paths: string[];
  is_active: boolean;
}

export default function PolicyManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [newIgnorePath, setNewIgnorePath] = useState("");
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null);

  useEffect(() => {
    if (user) fetchPolicies();
  }, [user]);

  const fetchPolicies = async () => {
    const { data, error } = await supabase
      .from("security_policies")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setPolicies(data.map(p => ({
        ...p,
        ignore_paths: Array.isArray(p.ignore_paths) ? p.ignore_paths : []
      })));
    }
    setLoading(false);
  };

  const createPolicy = async () => {
    const { data, error } = await supabase
      .from("security_policies")
      .insert({ user_id: user?.id, name: "New Policy" })
      .select()
      .single();

    if (error) {
      toast({ title: "Error", description: "Failed to create policy", variant: "destructive" });
    } else if (data) {
      setPolicies([{ ...data, ignore_paths: [] }, ...policies]);
      setEditingPolicy({ ...data, ignore_paths: [] });
      toast({ title: "Created", description: "New policy created" });
    }
  };

  const updatePolicy = async (policy: Policy) => {
    const { error } = await supabase
      .from("security_policies")
      .update({
        name: policy.name,
        max_critical: policy.max_critical,
        max_high: policy.max_high,
        max_medium: policy.max_medium,
        max_low: policy.max_low,
        ignore_paths: policy.ignore_paths,
        is_active: policy.is_active
      })
      .eq("id", policy.id);

    if (error) {
      toast({ title: "Error", description: "Failed to update policy", variant: "destructive" });
    } else {
      setPolicies(policies.map(p => p.id === policy.id ? policy : p));
      toast({ title: "Saved", description: "Policy updated" });
    }
  };

  const deletePolicy = async (id: string) => {
    const { error } = await supabase.from("security_policies").delete().eq("id", id);
    if (!error) {
      setPolicies(policies.filter(p => p.id !== id));
      if (editingPolicy?.id === id) setEditingPolicy(null);
      toast({ title: "Deleted", description: "Policy removed" });
    }
  };

  const addIgnorePath = () => {
    if (editingPolicy && newIgnorePath.trim()) {
      setEditingPolicy({
        ...editingPolicy,
        ignore_paths: [...editingPolicy.ignore_paths, newIgnorePath.trim()]
      });
      setNewIgnorePath("");
    }
  };

  const removeIgnorePath = (path: string) => {
    if (editingPolicy) {
      setEditingPolicy({
        ...editingPolicy,
        ignore_paths: editingPolicy.ignore_paths.filter(p => p !== path)
      });
    }
  };

  if (loading) return <div className="animate-pulse h-48 bg-muted rounded-lg" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Security Policies
          </h2>
          <p className="text-sm text-muted-foreground">Define severity thresholds for pass/fail evaluation</p>
        </div>
        <Button onClick={createPolicy} size="sm">
          <Plus className="h-4 w-4 mr-2" /> New Policy
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Policy List */}
        <div className="space-y-3">
          {policies.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No policies yet. Create one to define severity thresholds.
              </CardContent>
            </Card>
          ) : (
            policies.map(policy => (
              <Card
                key={policy.id}
                className={`cursor-pointer transition-all ${editingPolicy?.id === policy.id ? "border-primary" : ""}`}
                onClick={() => setEditingPolicy(policy)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{policy.name}</span>
                        {policy.is_active && <Badge variant="secondary" className="text-xs">Active</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Critical: {policy.max_critical} | High: {policy.max_high} | Medium: {policy.max_medium}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={(e) => { e.stopPropagation(); deletePolicy(policy.id); }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Policy Editor */}
        {editingPolicy && (
          <Card>
            <CardHeader>
              <CardTitle>Edit Policy</CardTitle>
              <CardDescription>Configure severity limits and ignored paths</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Policy Name</Label>
                <Input
                  value={editingPolicy.name}
                  onChange={(e) => setEditingPolicy({ ...editingPolicy, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Max Critical</Label>
                  <Input
                    type="number"
                    min={0}
                    value={editingPolicy.max_critical}
                    onChange={(e) => setEditingPolicy({ ...editingPolicy, max_critical: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label>Max High</Label>
                  <Input
                    type="number"
                    min={0}
                    value={editingPolicy.max_high}
                    onChange={(e) => setEditingPolicy({ ...editingPolicy, max_high: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label>Max Medium</Label>
                  <Input
                    type="number"
                    min={0}
                    value={editingPolicy.max_medium}
                    onChange={(e) => setEditingPolicy({ ...editingPolicy, max_medium: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label>Max Low (empty = unlimited)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={editingPolicy.max_low ?? ""}
                    onChange={(e) => setEditingPolicy({ ...editingPolicy, max_low: e.target.value ? parseInt(e.target.value) : null })}
                  />
                </div>
              </div>

              <div>
                <Label>Ignore Paths</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    placeholder="tests/, docs/"
                    value={newIgnorePath}
                    onChange={(e) => setNewIgnorePath(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addIgnorePath()}
                  />
                  <Button onClick={addIgnorePath} size="sm">Add</Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {editingPolicy.ignore_paths.map(path => (
                    <Badge key={path} variant="outline" className="cursor-pointer" onClick={() => removeIgnorePath(path)}>
                      {path} ×
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editingPolicy.is_active}
                    onCheckedChange={(checked) => setEditingPolicy({ ...editingPolicy, is_active: checked })}
                  />
                  <Label>Active</Label>
                </div>
                <Button onClick={() => updatePolicy(editingPolicy)}>
                  <Save className="h-4 w-4 mr-2" /> Save Policy
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
