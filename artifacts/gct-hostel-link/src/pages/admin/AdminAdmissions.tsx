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
import { Loader2, ExternalLink, BookOpen, Save, CheckCircle, XCircle, RefreshCw } from "lucide-react";

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
    setLoading(true);
    const { data, error } = await supabase
      .from("admission_settings")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      toast({ title: "Load Error", description: "Could not load admissions settings. " + error.message, variant: "destructive" });
    } else if (data) {
      setSettings(data);
      setForm({ is_open: data.is_open, apply_link: data.apply_link || "", message: data.message || "" });
    }
    setLoading(false);
  }

  useEffect(() => { loadSettings(); }, []);

  async function save() {
    if (!form.apply_link && form.is_open) {
      toast({ title: "Missing Link", description: "Please add an application link before opening admissions.", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    let error;

    if (settings?.id) {
      const res = await supabase.from("admission_settings").update({
        is_open: form.is_open,
        apply_link: form.apply_link.trim(),
        message: form.message.trim(),
        updated_by: user?.id,
      }).eq("id", settings.id);
      error = res.error;
    } else {
      const res = await supabase.from("admission_settings").insert({
        is_open: form.is_open,
        apply_link: form.apply_link.trim(),
        message: form.message.trim(),
        updated_by: user?.id,
      });
      error = res.error;
    }

    if (error) {
      toast({ title: "Save Failed", description: "Could not save settings. " + error.message, variant: "destructive" });
    } else {
      toast({
        title: "Admissions Settings Saved",
        description: `Admissions are now ${form.is_open ? "OPEN ✓" : "CLOSED"}`
      });
      loadSettings();
    }
    setSaving(false);
  }

  async function quickToggle() {
    if (!settings) return;
    const newStatus = !settings.is_open;
    if (newStatus && !form.apply_link) {
      toast({ title: "Missing Link", description: "Add an application link before opening admissions.", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("admission_settings").update({
      is_open: newStatus,
    }).eq("id", settings.id);
    if (error) {
      toast({ title: "Toggle Failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Admissions ${newStatus ? "OPENED" : "CLOSED"}`, description: newStatus ? "Students can now see the Apply button." : "Apply button is now hidden." });
      loadSettings();
    }
    setSaving(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admissions Control</h1>
          <p className="text-sm text-muted-foreground">Open or close admissions and set the application link</p>
        </div>
        <Button variant="ghost" size="icon" onClick={loadSettings} disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="max-w-2xl space-y-6">

          {/* Live Status Card */}
          <Card className={`border-2 ${form.is_open ? "border-green-500/40 bg-green-500/5" : "border-red-500/30 bg-red-500/5"}`}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${form.is_open ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
                  <div>
                    <div className="font-semibold text-foreground">
                      {form.is_open ? "Admissions are OPEN" : "Admissions are CLOSED"}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {form.is_open ? "The Apply Now button is visible to the public." : "No apply button is shown to public visitors."}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {form.is_open
                    ? <CheckCircle className="w-6 h-6 text-green-500" />
                    : <XCircle className="w-6 h-6 text-red-500" />}
                  {settings && (
                    <Button
                      size="sm"
                      onClick={quickToggle}
                      disabled={saving}
                      className={form.is_open ? "bg-red-600 hover:bg-red-700 text-white" : "bg-green-600 hover:bg-green-700 text-white"}>
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : form.is_open ? "Close Now" : "Open Now"}
                    </Button>
                  )}
                </div>
              </div>
              {form.apply_link && (
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-1">Application Link:</p>
                  <a href={form.apply_link} target="_blank" rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline flex items-center gap-1 break-all">
                    {form.apply_link} <ExternalLink className="w-3 h-3 flex-shrink-0" />
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Settings Form */}
          <Card className="border border-border">
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><BookOpen className="w-4 h-4" />Admissions Settings</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center justify-between p-3 bg-muted/40 rounded-lg">
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
                <Label>Application Link <span className="text-red-500">*</span></Label>
                <Input
                  className="mt-1.5"
                  placeholder="https://forms.google.com/... or any online form link"
                  value={form.apply_link}
                  onChange={(e) => setForm({ ...form, apply_link: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  This becomes the "Apply Now" button on the public Admissions page. Required if admissions are open.
                </p>
              </div>

              <div>
                <Label>Message to Students</Label>
                <Textarea
                  className="mt-1.5"
                  placeholder="e.g. Admissions for 2026 batch are now open. Last date to apply is March 31, 2026."
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground mt-1">This message appears on the public admissions page below the status badge.</p>
              </div>

              <Button onClick={save} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white w-full sm:w-auto" disabled={saving}>
                {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : <><Save className="w-4 h-4 mr-2" />Save All Settings</>}
              </Button>
            </CardContent>
          </Card>

          <Card className="border border-blue-500/30 bg-blue-500/5">
            <CardContent className="p-4 text-xs text-blue-600 space-y-1">
              <p className="font-medium">How it works:</p>
              <p>• Toggle the switch and click "Save All Settings" to update the public page.</p>
              <p>• Or use the "Open Now" / "Close Now" button for instant status change.</p>
              <p>• The public Admissions page automatically shows/hides the Apply button based on this setting.</p>
              <p>• If admissions are open but no link is set, the Apply button will not appear.</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
