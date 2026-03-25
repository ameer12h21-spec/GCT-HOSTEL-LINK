import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { ExternalLink, BookOpen, CheckCircle, XCircle, Loader2 } from "lucide-react";

interface AdmissionSettings {
  is_open: boolean;
  apply_link: string | null;
  message: string | null;
}

export default function AdmissionsPage() {
  const [settings, setSettings] = useState<AdmissionSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("admission_settings")
      .select("*")
      .maybeSingle()
      .then(({ data }) => {
        setSettings(data);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
        <div className="text-center mb-12">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">Hostel Admissions</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            GCT TEVTA Hostel, Taxila — New student admissions for Jinnah Hostel and Iqbal Hostel.
          </p>
        </div>

        <Card className="border border-border shadow-sm mb-8">
          <CardContent className="p-8">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="text-center">
                <div className="mb-6">
                  {settings?.is_open ? (
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-4 h-4 rounded-full bg-green-500 animate-pulse" />
                      <Badge className="bg-green-500/15 text-green-600 border-green-500/30 text-lg px-4 py-2">
                        Admissions Open
                      </Badge>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-4 h-4 rounded-full bg-red-500" />
                      <Badge className="bg-red-500/15 text-red-600 border-red-500/30 text-lg px-4 py-2">
                        Admissions Closed
                      </Badge>
                    </div>
                  )}
                </div>

                {settings?.message && (
                  <p className="text-muted-foreground text-base mb-6 max-w-xl mx-auto">{settings.message}</p>
                )}

                {settings?.is_open && settings?.apply_link ? (
                  <div>
                    <p className="text-muted-foreground mb-6">
                      Click the button below to access the admissions application form. Complete all required information accurately.
                    </p>
                    <a href={settings.apply_link} target="_blank" rel="noopener noreferrer">
                      <Button size="lg" className="bg-gradient-to-r from-orange-500 to-pink-600 text-white border-none font-semibold px-8">
                        Apply Now <ExternalLink className="ml-2 w-4 h-4" />
                      </Button>
                    </a>
                  </div>
                ) : settings?.is_open && !settings?.apply_link ? (
                  <p className="text-muted-foreground">Admissions are open — application form link coming soon.</p>
                ) : (
                  <div className="text-muted-foreground">
                    <XCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground/40" />
                    <p>Admissions are currently closed. Please check back later or contact the hostel administration.</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Card className="border border-border">
            <CardContent className="p-6">
              <h3 className="font-semibold text-foreground mb-3">Eligibility Requirements</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />Enrolled student at GCT TEVTA Taxila</li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />Valid college roll number</li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />Must provide father/guardian contact</li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />Home address required for records</li>
              </ul>
            </CardContent>
          </Card>
          <Card className="border border-border">
            <CardContent className="p-6">
              <h3 className="font-semibold text-foreground mb-3">After Admission</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />Admin manually reviews your application</li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />Register on this portal with your roll number</li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />Account activated after admin approval</li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />Access your dashboard to track fees & attendance</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
}
