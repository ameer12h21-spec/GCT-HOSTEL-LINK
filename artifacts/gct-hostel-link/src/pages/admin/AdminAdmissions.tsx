import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Loader2, ExternalLink, BookOpen, Save } from "lucide-react";

interface AdmissionSettings {
  id: string;
  is_open: boolean;
  apply_link: string;
  message: string;
}

export default function AdminAdmissions() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<AdmissionSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ is_open: false, apply_link: "", message: "" });

  async function loadSettings() {
    const { data } = await supabase.from("admission_settings").select("*").single();
    if (data) {
      setSettings(data);
      setForm({ is_open: data.is_open, apply_link: data.apply_link || "", message: data.message || "" });
    }
    setLoading(false);
  }

  useEffect(() => { loadSettings(); }, []);

  async function save() {
    setSaving(true);
    if (settings) {
      await supabase.from("admission_settings").update(form).eq("id", settings.id);
    } else {
      await supabase.from("admission_settings").insert(form);
    }
    toast({ title: "Admissions Settings Saved", description: `Admissions are now ${form.is_open ? "OPEN" : "CLOSED"}` });
    setSaving(false);
    loadSettings();
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Admissions Control</h1>
        <p className="text-sm text-muted-foreground">Control whether new admissions are open and set the external application link</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="max-w-2xl space-y-6">
          <Card className="border border-border">
            <CardHeader><CardTitle className="text-base">Current Status</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                {form.is_open ? (
                  <Badge className="bg-green-500/15 text-green-600 border-green-500/30 text-base px-4 py-1">Admissions OPEN</Badge>
                ) : (
                  <Badge className="bg-red-500/15 text-red-600 border-red-500/30 text-base px-4 py-1">Admissions CLOSED</Badge>
                )}
              </div>
              {form.apply_link && (
                <div className="mt-3">
                  <p className="text-xs text-muted-foreground mb-1">Apply Now Link:</p>
                  <a href={form.apply_link} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">
                    {form.apply_link} <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border border-border">
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><BookOpen className="w-4 h-4" />Admissions Settings</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Admissions Status</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">Toggle to open or close admissions on the public page</p>
                </div>
                <Switch
                  checked={form.is_open}
                  onCheckedChange={(v) => setForm({ ...form, is_open: v })}
                />
              </div>

              <div>
                <Label>Application Link *</Label>
                <Input
                  className="mt-1.5"
                  placeholder="https://forms.google.com/... or any external form link"
                  value={form.apply_link}
                  onChange={(e) => setForm({ ...form, apply_link: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">This URL will be the "Apply Now" button on the public admissions page</p>
              </div>

              <div>
                <Label>Message to Students (Optional)</Label>
                <Textarea
                  className="mt-1.5"
                  placeholder="e.g. Admissions for 2026 batch are now open. Last date to apply is March 31, 2026."
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  rows={3}
                />
              </div>

              <Button onClick={save} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white" disabled={saving}>
                {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : <><Save className="w-4 h-4 mr-2" />Save Settings</>}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
