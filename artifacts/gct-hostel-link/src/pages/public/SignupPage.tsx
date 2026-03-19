import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { signUp, validateRollNumber } from "@/lib/auth";
import { Building2, Loader2, Eye, EyeOff } from "lucide-react";

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  father_name: z.string().min(2, "Father name is required"),
  roll_number: z.string().refine(validateRollNumber, {
    message: "Roll number format: 232R012 (morning) or 232S012 (evening)",
  }),
  technology: z.string().min(2, "Technology/Trade is required"),
  room_no: z.string().min(1, "Room number is required"),
  shift: z.enum(["1st", "2nd"]),
  hostel: z.enum(["Jinnah", "Iqbal"]),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Valid phone number required"),
  father_phone: z.string().min(10, "Valid father phone required"),
  address: z.string().min(5, "Address is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirm_password: z.string(),
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords do not match",
  path: ["confirm_password"],
});

type FormData = z.infer<typeof schema>;

export default function SignupPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(1);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { shift: "1st", hostel: "Jinnah" },
  });

  async function onSubmit(data: FormData) {
    setLoading(true);
    try {
      await signUp({
        name: data.name,
        father_name: data.father_name,
        roll_number: data.roll_number,
        technology: data.technology,
        room_no: data.room_no,
        shift: data.shift,
        hostel: data.hostel,
        email: data.email,
        phone: data.phone,
        father_phone: data.father_phone,
        address: data.address,
        password: data.password,
      });

      toast({
        title: "Registration Submitted!",
        description: "Your account is pending admin approval. You will be notified once approved.",
      });
      navigate("/login");
    } catch (err: any) {
      toast({
        title: "Signup Failed",
        description: err.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-4 py-8">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center mx-auto mb-3 shadow-lg">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Student Registration</h1>
            <p className="text-muted-foreground text-sm mt-1">Create your GCT Hostel Link account</p>
          </div>

          <Card className="border border-border shadow-sm">
            <CardContent className="p-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Full Name *</Label>
                    <Input placeholder="Muhammad Ali" className="mt-1.5" {...register("name")} />
                    {errors.name && <p className="text-destructive text-xs mt-1">{errors.name.message}</p>}
                  </div>
                  <div>
                    <Label>Father's Name *</Label>
                    <Input placeholder="Muhammad Khan" className="mt-1.5" {...register("father_name")} />
                    {errors.father_name && <p className="text-destructive text-xs mt-1">{errors.father_name.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>College Roll Number *</Label>
                    <Input placeholder="232R012 or 232S012" className="mt-1.5" {...register("roll_number")} />
                    {errors.roll_number && <p className="text-destructive text-xs mt-1">{errors.roll_number.message}</p>}
                    <p className="text-xs text-muted-foreground mt-1">R = Morning, S = Evening shift</p>
                  </div>
                  <div>
                    <Label>Technology / Trade *</Label>
                    <Input placeholder="e.g. Computer Science, Electrical" className="mt-1.5" {...register("technology")} />
                    {errors.technology && <p className="text-destructive text-xs mt-1">{errors.technology.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label>Room Number *</Label>
                    <Input placeholder="e.g. 101" className="mt-1.5" {...register("room_no")} />
                    {errors.room_no && <p className="text-destructive text-xs mt-1">{errors.room_no.message}</p>}
                  </div>
                  <div>
                    <Label>Shift *</Label>
                    <Select defaultValue="1st" onValueChange={(v) => setValue("shift", v as "1st" | "2nd")}>
                      <SelectTrigger className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1st">1st (Morning)</SelectItem>
                        <SelectItem value="2nd">2nd (Evening)</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.shift && <p className="text-destructive text-xs mt-1">{errors.shift.message}</p>}
                  </div>
                  <div>
                    <Label>Hostel *</Label>
                    <Select defaultValue="Jinnah" onValueChange={(v) => setValue("hostel", v as "Jinnah" | "Iqbal")}>
                      <SelectTrigger className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Jinnah">Jinnah Hostel</SelectItem>
                        <SelectItem value="Iqbal">Iqbal Hostel</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.hostel && <p className="text-destructive text-xs mt-1">{errors.hostel.message}</p>}
                  </div>
                </div>

                <div className="border-t border-border pt-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Contact Information</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label>Email Address *</Label>
                      <Input type="email" placeholder="your@email.com" className="mt-1.5" {...register("email")} />
                      {errors.email && <p className="text-destructive text-xs mt-1">{errors.email.message}</p>}
                    </div>
                    <div>
                      <Label>Phone Number *</Label>
                      <Input placeholder="03xx-xxxxxxx" className="mt-1.5" {...register("phone")} />
                      {errors.phone && <p className="text-destructive text-xs mt-1">{errors.phone.message}</p>}
                    </div>
                    <div>
                      <Label>Father's Phone *</Label>
                      <Input placeholder="03xx-xxxxxxx" className="mt-1.5" {...register("father_phone")} />
                      {errors.father_phone && <p className="text-destructive text-xs mt-1">{errors.father_phone.message}</p>}
                    </div>
                    <div>
                      <Label>Home Address *</Label>
                      <Input placeholder="City, District, Province" className="mt-1.5" {...register("address")} />
                      {errors.address && <p className="text-destructive text-xs mt-1">{errors.address.message}</p>}
                    </div>
                  </div>
                </div>

                <div className="border-t border-border pt-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Account Security</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label>Password *</Label>
                      <div className="relative mt-1.5">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Min. 6 characters"
                          {...register("password")}
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {errors.password && <p className="text-destructive text-xs mt-1">{errors.password.message}</p>}
                    </div>
                    <div>
                      <Label>Confirm Password *</Label>
                      <Input type="password" placeholder="Repeat password" className="mt-1.5" {...register("confirm_password")} />
                      {errors.confirm_password && <p className="text-destructive text-xs mt-1">{errors.confirm_password.message}</p>}
                    </div>
                  </div>
                </div>

                <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground">
                  Your account will be reviewed by the admin. You'll be able to login once approved. This prevents unauthorized account creation.
                </div>

                <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white" disabled={loading}>
                  {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Submitting...</> : "Submit Registration"}
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Link href="/login" className="text-primary font-medium hover:underline">Sign In</Link>
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
