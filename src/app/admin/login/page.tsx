import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminLoginForm } from "./admin-login-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";

export default async function AdminLoginPage() {
  const session = await getCurrentUser();
  const sessionRole = session?.role ? String(session.role).toLowerCase() : "";

  // If a session exists, handle redirection or forbidden state
  if (session) {
    if (sessionRole === "admin") {
      redirect("/admin");
    } else {
      // Normal buyer/user trying to access admin login
      return (
        <div className="container mx-auto px-4 py-24 flex items-center justify-center min-h-[calc(100vh-200px)]">
          <div className="w-full max-w-md bg-destructive/10 border border-destructive/20 rounded-lg shadow-sm p-8 text-center">
            <div className="flex justify-center mb-6">
              <ShieldAlert className="w-16 h-16 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold text-destructive mb-2">Access Denied</h1>
            <p className="text-muted-foreground mb-8">
              Invalid credentials for the admin portal. This portal is strictly for administrators. You are currently logged in as a standard user. Please return to your dashboard or logout first.
            </p>
            <Button asChild className="w-full" variant="default">
              <Link href="/dashboard">Return to Dashboard</Link>
            </Button>
          </div>
        </div>
      );
    }
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AdminLoginForm />
    </Suspense>
  );
}
