"use client";

import { useEffect, useState, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, User, Mail, Phone, Globe, Shield, KeyRound, ArrowRight } from "lucide-react";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Badge } from "@/components/ui/badge";
import { COUNTRIES, STATES_AND_CITIES } from "@/lib/countries";

interface UserData {
  id: string;
  firstname: string | null;
  lastname: string | null;
  username: string | null;
  email: string;
  dialCode: string | null;
  mobile: string | null;
  countryName: string | null;
  state: string | null;
  city: string | null;
}

export default function ProfilePage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const [form, setForm] = useState<Partial<UserData>>({});

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.user) {
          // Fetch full profile
          fetch("/api/profile")
            .then((r) => r.json())
            .then((profileData) => {
              if (profileData.user) {
                setUser(profileData.user);
                setForm(profileData.user);
              }
            });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({
          title: "Update failed",
          description: data.error,
          variant: "destructive",
        });
        return;
      }
      toast({ title: "Profile updated", description: "Changes saved successfully." });
      setUser(data.user);
    } catch {
      toast({ title: "Network error", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <p className="text-sm text-muted-foreground">Could not load profile.</p>;
  }

  const dialCodeOptions = COUNTRIES.map((c) => ({
    value: c.dialCode,
    label: `${c.flag} ${c.dialCode} (${c.name})`,
  }));

  const countryOptions = COUNTRIES.map((c) => ({
    value: c.name,
    label: c.name,
  }));

  const initials = (form.firstname || form.username || form.email || "U").charAt(0).toUpperCase();

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header Profile Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-background border p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 shadow-sm">
        <div className="w-20 h-20 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-3xl font-bold shadow-md shrink-0 ring-4 ring-background">
          {initials}
        </div>
        <div className="text-center sm:text-left space-y-1">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {form.firstname || form.lastname
                ? `${form.firstname || ''} ${form.lastname || ''}`.trim()
                : form.username || "My Account"}
            </h1>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs">
              Verified
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{form.email}</p>
          <p className="text-xs text-muted-foreground/80 flex items-center justify-center sm:justify-start gap-1 pt-1">
            <Globe className="h-3.5 w-3.5" />
            {[form.city, form.state, form.countryName].filter(Boolean).join(", ") || "Location not set"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Info */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstname" className="text-xs font-medium uppercase text-muted-foreground tracking-wider">First Name</Label>
                <Input
                  id="firstname"
                  placeholder="John"
                  value={form.firstname || ""}
                  onChange={(e) => setForm({ ...form, firstname: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastname" className="text-xs font-medium uppercase text-muted-foreground tracking-wider">Last Name</Label>
                <Input
                  id="lastname"
                  placeholder="Doe"
                  value={form.lastname || ""}
                  onChange={(e) => setForm({ ...form, lastname: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="username" className="text-xs font-medium uppercase text-muted-foreground tracking-wider">Username</Label>
              <Input
                id="username"
                placeholder="johndoe"
                value={form.username || ""}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Your username appears on your public author profile and product comments.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Contact Info */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-medium uppercase text-muted-foreground tracking-wider">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={form.email || ""}
                disabled
                className="bg-muted/50 cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground">
                Email address is verified and cannot be changed.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobile" className="text-xs font-medium uppercase text-muted-foreground tracking-wider">Phone Number *</Label>
              <div className="flex items-center gap-2">
                <div className="w-[130px] sm:w-[150px] shrink-0">
                  <SearchableSelect
                    options={dialCodeOptions}
                    value={form.dialCode || "+91"}
                    onValueChange={(val) => {
                      const selected = COUNTRIES.find((c) => c.dialCode === val);
                      setForm({
                        ...form,
                        dialCode: val,
                        countryName: selected ? selected.name : form.countryName,
                      });
                    }}
                    placeholder="Dial code"
                    searchPlaceholder="Search country code..."
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <Input
                    id="mobile"
                    type="tel"
                    placeholder="9876543210"
                    value={form.mobile || ""}
                    onChange={(e) => setForm({ ...form, mobile: e.target.value.replace(/[^0-9]/g, "") })}
                    className="h-10"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="countryName" className="text-xs font-medium uppercase text-muted-foreground tracking-wider">Country *</Label>
              <SearchableSelect
                id="countryName"
                options={countryOptions}
                value={form.countryName || "India"}
                onValueChange={(val) => {
                  const selected = COUNTRIES.find((c) => c.name === val);
                  setForm({
                    ...form,
                    countryName: val,
                    dialCode: selected ? selected.dialCode : form.dialCode,
                  });
                }}
                placeholder="Select Country"
                searchPlaceholder="Search country..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="state" className="text-xs font-medium uppercase text-muted-foreground tracking-wider">State *</Label>
                <Input
                  id="state"
                  placeholder="e.g. California / Gujarat"
                  value={form.state || ""}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city" className="text-xs font-medium uppercase text-muted-foreground tracking-wider">City *</Label>
                <Input
                  id="city"
                  placeholder="e.g. Los Angeles / Surat"
                  value={form.city || ""}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card className="border-border/60 shadow-sm overflow-hidden bg-card/60 backdrop-blur-xs relative group">
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-orange-500 to-amber-500" />
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
              <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500 border border-orange-500/20">
                <Shield className="h-5 w-5" />
              </div>
              <span>Security Settings</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-muted/60 border border-border/50 text-muted-foreground shrink-0 mt-0.5 sm:mt-0">
                <KeyRound className="h-4 w-4 text-orange-500" />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-semibold text-foreground">Password Management</p>
                <p className="text-xs text-muted-foreground">Change your account password securely anytime to keep your account safe.</p>
              </div>
            </div>
            <Button variant="outline" size="sm" asChild className="rounded-xl border-orange-500/30 hover:border-orange-500 hover:bg-orange-500/10 text-xs font-semibold shadow-2xs shrink-0 transition-all">
              <a href="/forgot-password" className="flex items-center gap-1.5">
                <KeyRound className="h-3.5 w-3.5 text-orange-500" />
                <span>Change Password</span>
                <ArrowRight className="h-3.5 w-3.5 opacity-70" />
              </a>
            </Button>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="outline" type="button" onClick={() => setForm(user)}>
            Reset Changes
          </Button>
          <Button type="submit" disabled={saving} className="px-6 min-w-[140px]">
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Profile
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
