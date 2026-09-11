"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface PoliciesFormProps {
  initialData: {
    privacy: string;
    terms: string;
    refund: string;
  };
}

export function PoliciesForm({ initialData }: PoliciesFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState(initialData);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/policies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        throw new Error("Failed to update policies");
      }
      toast.success("Policies updated successfully");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <Tabs defaultValue="privacy" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="privacy">Privacy Policy</TabsTrigger>
          <TabsTrigger value="terms">Terms & Conditions</TabsTrigger>
          <TabsTrigger value="refund">Refund Policy</TabsTrigger>
        </TabsList>
        
        <TabsContent value="privacy">
          <Card>
            <CardHeader>
              <CardTitle>Privacy Policy</CardTitle>
              <CardDescription>
                Update your privacy policy. You can use HTML to format your text.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                className="min-h-[500px] font-mono text-sm"
                value={formData.privacy}
                onChange={(e) => setFormData({ ...formData, privacy: e.target.value })}
                placeholder="<h1>Privacy Policy</h1><p>Content goes here...</p>"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="terms">
          <Card>
            <CardHeader>
              <CardTitle>Terms & Conditions</CardTitle>
              <CardDescription>
                Update your terms and conditions. You can use HTML to format your text.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                className="min-h-[500px] font-mono text-sm"
                value={formData.terms}
                onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                placeholder="<h1>Terms & Conditions</h1><p>Content goes here...</p>"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="refund">
          <Card>
            <CardHeader>
              <CardTitle>Refund Policy</CardTitle>
              <CardDescription>
                Update your refund policy. You can use HTML to format your text.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                className="min-h-[500px] font-mono text-sm"
                value={formData.refund}
                onChange={(e) => setFormData({ ...formData, refund: e.target.value })}
                placeholder="<h1>Refund Policy</h1><p>Content goes here...</p>"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSaving}>
          {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : "Save All Policies"}
        </Button>
      </div>
    </form>
  );
}
