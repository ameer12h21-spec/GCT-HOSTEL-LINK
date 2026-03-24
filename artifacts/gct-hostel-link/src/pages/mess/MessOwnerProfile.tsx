import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Loader2, Camera, Save, Eye, EyeOff } from "lucide-react";

export default function MessOwnerProfile() {
  const { profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [editForm, setEditForm] = useState({
    name: profile?.name || "",
    phone: profile?.phone || "",
    address: profile?.address || "",
  });

  const [passwordForm, setPasswordForm] = useState({ newPassword: "", confirmPassword: "" });

  async function saveProfile() {
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      name: editForm.name,
      phone: editForm.phone,
      address: editForm.address,
    }).eq("id", profile!.id);
    if (!error) {
      toast({ title: "Profile Updated" });
      refreshProfile();
    } else {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
    setSaving(false);
  }

  async function changePassword() {
    if (passwordForm.newPassword.length < 6) {
      toast({ title: "Password too short", description: "Min 6 characters", variant: "destructive" });
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: passwordForm.newPassword });
    if (!error) {
      toast({ title: "Password Changed" });
      setPasswordForm({ newPassword: "", confirmPassword: "" });
    } else {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
    setSaving(false);
  }

  async function uploadPhoto(file: File) {
    if (file.size > 3 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 3MB", variant: "destructive" });
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${profile!.id}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("profile-photos").upload(path, file, { upsert: true });
    if (uploadError) {
      toast({ title: "Upload Failed", description: uploadError.message, variant: "destructive" });
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from("profile-photos").getPublicUrl(path);
    await supabase.from("profiles").update({ profile_photo_url: data.publicUrl }).eq("id", profile!.id);
    toast({ title: "Photo Updated" });
    refreshProfile();
    setUploading(false);
  }

  if (!profile) return null;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Profile & Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your account information</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border border-border lg:col-span-1">
          <CardContent className="p-6 flex flex-col items-center text-center">
            <div className="relative mb-4">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white text-3xl font-bold overflow-hidden">
                {profile.profile_photo_url ? (
                  <img src={profile.profile_photo_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  profile.name.charAt(0)
                )}
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shadow-md hover:bg-primary/90"
                disabled={uploading}
              >
                {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadPhoto(e.target.files[0])} />
            </div>
            <div className="font-bold text-foreground text-lg">{profile.name}</div>
            <div className="text-sm text-muted-foreground">Mess Owner</div>
            <div className="text-xs text-primary mt-1">{profile.secret_key}</div>
            <p className="text-xs text-muted-foreground mt-3">Upload profile photo (max 3MB)</p>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          <Card className="border border-border">
            <CardHeader><CardTitle className="text-base">Personal Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mb-4">
                {[
                  ["Email", profile.email],
                  ["Role", "Mess Owner"],
                  ["Status", profile.status],
                  ["Secret Key", profile.secret_key || "—"],
                ].map(([k, v]) => (
                  <div key={k}>
                    <Label className="text-xs text-muted-foreground">{k}</Label>
                    <div className="mt-1 font-medium text-foreground capitalize">{v || "—"}</div>
                  </div>
                ))}
              </div>
              <div className="border-t border-border pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Label>Full Name</Label>
                  <Input className="mt-1.5" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                </div>
                <div>
                  <Label>Phone Number</Label>
                  <Input className="mt-1.5" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
                </div>
                <div>
                  <Label>Address</Label>
                  <Input className="mt-1.5" value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} />
                </div>
              </div>
              <Button onClick={saveProfile} className="bg-gradient-to-r from-orange-500 to-pink-600 text-white" disabled={saving}>
                {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : <><Save className="w-4 h-4 mr-2" />Save Profile</>}
              </Button>
            </CardContent>
          </Card>

          <Card className="border border-border">
            <CardHeader><CardTitle className="text-base">Change Password</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>New Password</Label>
                <div className="relative mt-1.5">
                  <Input type={showPassword ? "text" : "password"} placeholder="Min 6 characters" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <Label>Confirm Password</Label>
                <Input className="mt-1.5" type="password" placeholder="Repeat new password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} />
              </div>
              <Button onClick={changePassword} variant="outline" disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}Change Password
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
