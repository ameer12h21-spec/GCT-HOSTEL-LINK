import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";

import LandingPage from "@/pages/public/LandingPage";
import LoginPage from "@/pages/public/LoginPage";
import SignupPage from "@/pages/public/SignupPage";
import AdmissionsPage from "@/pages/public/AdmissionsPage";
import AboutPage from "@/pages/public/AboutPage";
import FacilitiesPage from "@/pages/public/FacilitiesPage";
import HowItWorksPage from "@/pages/public/HowItWorksPage";
import SupportPage from "@/pages/public/SupportPage";
import PrivacyPage from "@/pages/public/PrivacyPage";
import TermsPage from "@/pages/public/TermsPage";

import AdminLayout from "@/pages/admin/AdminLayout";
import AdminHome from "@/pages/admin/AdminHome";
import AdminStudents from "@/pages/admin/AdminStudents";
import AdminAttendance from "@/pages/admin/AdminAttendance";
import AdminComplaints from "@/pages/admin/AdminComplaints";
import AdminMessFees from "@/pages/admin/AdminMessFees";
import AdminStaff from "@/pages/admin/AdminStaff";
import AdminAdmissions from "@/pages/admin/AdminAdmissions";
import AdminTrash from "@/pages/admin/AdminTrash";

import StudentLayout from "@/pages/student/StudentLayout";
import StudentHome from "@/pages/student/StudentHome";
import StudentProfile from "@/pages/student/StudentProfile";
import StudentAttendance from "@/pages/student/StudentAttendance";
import StudentMessFees from "@/pages/student/StudentMessFees";
import StudentElectricity from "@/pages/student/StudentElectricity";
import StudentComplaints from "@/pages/student/StudentComplaints";

import TeacherLayout from "@/pages/teacher/TeacherLayout";
import TeacherHome from "@/pages/teacher/TeacherHome";
import TeacherStudents from "@/pages/teacher/TeacherStudents";
import TeacherAttendance from "@/pages/teacher/TeacherAttendance";
import TeacherElectricity from "@/pages/teacher/TeacherElectricity";
import TeacherComplaints from "@/pages/teacher/TeacherComplaints";
import TeacherMessFees from "@/pages/teacher/TeacherMessFees";

import MessOwnerLayout from "@/pages/mess/MessOwnerLayout";
import MessOwnerHome from "@/pages/mess/MessOwnerHome";
import MessOwnerStudents from "@/pages/mess/MessOwnerStudents";
import MessOwnerFees from "@/pages/mess/MessOwnerFees";
import MessOwnerPaymentHistory from "@/pages/mess/MessOwnerPaymentHistory";
import MessOwnerProfile from "@/pages/mess/MessOwnerProfile";

import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles: string[];
}) {
  const { profile, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  if (!profile) return <Redirect to="/login" />;
  if (!allowedRoles.includes(profile.role)) return <Redirect to="/login" />;
  if (profile.status === "pending") return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center p-8 max-w-md">
        <div className="text-6xl mb-4">⏳</div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Account Pending Approval</h1>
        <p className="text-muted-foreground">Your account is awaiting admin approval. You will be able to login once approved.</p>
      </div>
    </div>
  );
  return <>{children}</>;
}

function AppRoutes() {
  const { profile } = useAuth();

  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/signup" component={SignupPage} />
      <Route path="/admissions" component={AdmissionsPage} />
      <Route path="/about" component={AboutPage} />
      <Route path="/facilities" component={FacilitiesPage} />
      <Route path="/how-it-works" component={HowItWorksPage} />
      <Route path="/support" component={SupportPage} />
      <Route path="/privacy" component={PrivacyPage} />
      <Route path="/terms" component={TermsPage} />

      <Route path="/admin">
        {() => (
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminLayout><AdminHome /></AdminLayout>
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/admin/students">
        {() => (
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminLayout><AdminStudents /></AdminLayout>
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/admin/attendance">
        {() => (
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminLayout><AdminAttendance /></AdminLayout>
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/admin/complaints">
        {() => (
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminLayout><AdminComplaints /></AdminLayout>
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/admin/mess-fees">
        {() => (
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminLayout><AdminMessFees /></AdminLayout>
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/admin/staff">
        {() => (
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminLayout><AdminStaff /></AdminLayout>
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/admin/admissions">
        {() => (
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminLayout><AdminAdmissions /></AdminLayout>
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/admin/trash">
        {() => (
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminLayout><AdminTrash /></AdminLayout>
          </ProtectedRoute>
        )}
      </Route>

      <Route path="/student">
        {() => (
          <ProtectedRoute allowedRoles={["student"]}>
            <StudentLayout><StudentHome /></StudentLayout>
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/student/profile">
        {() => (
          <ProtectedRoute allowedRoles={["student"]}>
            <StudentLayout><StudentProfile /></StudentLayout>
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/student/attendance">
        {() => (
          <ProtectedRoute allowedRoles={["student"]}>
            <StudentLayout><StudentAttendance /></StudentLayout>
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/student/mess-fees">
        {() => (
          <ProtectedRoute allowedRoles={["student"]}>
            <StudentLayout><StudentMessFees /></StudentLayout>
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/student/electricity">
        {() => (
          <ProtectedRoute allowedRoles={["student"]}>
            <StudentLayout><StudentElectricity /></StudentLayout>
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/student/complaints">
        {() => (
          <ProtectedRoute allowedRoles={["student"]}>
            <StudentLayout><StudentComplaints /></StudentLayout>
          </ProtectedRoute>
        )}
      </Route>

      <Route path="/teacher">
        {() => (
          <ProtectedRoute allowedRoles={["teacher"]}>
            <TeacherLayout><TeacherHome /></TeacherLayout>
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/teacher/students">
        {() => (
          <ProtectedRoute allowedRoles={["teacher"]}>
            <TeacherLayout><TeacherStudents /></TeacherLayout>
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/teacher/attendance">
        {() => (
          <ProtectedRoute allowedRoles={["teacher"]}>
            <TeacherLayout><TeacherAttendance /></TeacherLayout>
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/teacher/electricity">
        {() => (
          <ProtectedRoute allowedRoles={["teacher"]}>
            <TeacherLayout><TeacherElectricity /></TeacherLayout>
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/teacher/complaints">
        {() => (
          <ProtectedRoute allowedRoles={["teacher"]}>
            <TeacherLayout><TeacherComplaints /></TeacherLayout>
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/teacher/mess-fees">
        {() => (
          <ProtectedRoute allowedRoles={["teacher"]}>
            <TeacherLayout><TeacherMessFees /></TeacherLayout>
          </ProtectedRoute>
        )}
      </Route>

      <Route path="/mess">
        {() => (
          <ProtectedRoute allowedRoles={["mess_owner"]}>
            <MessOwnerLayout><MessOwnerHome /></MessOwnerLayout>
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/mess/students">
        {() => (
          <ProtectedRoute allowedRoles={["mess_owner"]}>
            <MessOwnerLayout><MessOwnerStudents /></MessOwnerLayout>
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/mess/fees">
        {() => (
          <ProtectedRoute allowedRoles={["mess_owner"]}>
            <MessOwnerLayout><MessOwnerFees /></MessOwnerLayout>
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/mess/payments">
        {() => (
          <ProtectedRoute allowedRoles={["mess_owner"]}>
            <MessOwnerLayout><MessOwnerPaymentHistory /></MessOwnerLayout>
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/mess/profile">
        {() => (
          <ProtectedRoute allowedRoles={["mess_owner"]}>
            <MessOwnerLayout><MessOwnerProfile /></MessOwnerLayout>
          </ProtectedRoute>
        )}
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider>
          <AuthProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <AppRoutes />
            </WouterRouter>
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
