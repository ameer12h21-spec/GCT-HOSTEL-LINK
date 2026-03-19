import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Loader2, Save, Eye, EyeOff } from "lucide-react";

export default function MessOwnerProfile() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState({ new: "", confirm: "" });

  async function changePassword() {
    if (password.new.length < 6) { toast({ title: "Password too short", variant: "destructive" }); return; }
    if (password.new !== password.confirm) { toast({ title: "Passwords don't match", variant: "destructive" }); return; }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: password.new });
    if (!error) { toast({ title: "Password Changed" }); setPassword({ new: "", confirm: "" }); }
    else toast({ title: "Error", description: error.message, variant: "destructive" });
    setSaving(false);
  }

  if (!profile) return null;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Profile & Settings</h1>
      </div>

      <div className="max-w-xl space-y-6">
        <Card className="border border-border">
          <CardHeader><CardTitle className="text-base">Account Information</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {[
              ["Name", profile.name],
              ["Email", profile.email],
              ["Role", "Mess Owner"],
              ["Secret Key", profile.secret_key],
              ["Status", profile.status],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between py-2 border-b border-border last:border-0 text-sm">
                <span className="text-muted-foreground">{k}</span>
                <span className="font-medium text-foreground capitalize">{v || "—"}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border border-border">
          <CardHeader><CardTitle className="text-base">Change Password</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>New Password</Label>
              <div className="relative mt-1.5">
                <Input type={showPassword ? "text" : "password"} placeholder="Min 6 characters" value={password.new} onChange={(e) => setPassword({ ...password, new: e.target.value })} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <Label>Confirm Password</Label>
              <Input className="mt-1.5" type="password" placeholder="Repeat password" value={password.confirm} onChange={(e) => setPassword({ ...password, confirm: e.target.value })} />
            </div>
            <Button onClick={changePassword} disabled={saving} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : <><Save className="w-4 h-4 mr-2" />Change Password</>}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
