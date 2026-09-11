"use client";

import { useState, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { Mail, Phone, MessageCircle, Loader2, Send } from "lucide-react";

const faqs = [
  {
    question: "Are the digital products on your marketplace safe and virus-free?",
    answer:
      "Yes, absolutely. Every source code is reviewed by our team before publishing. We scan all files for malware and verify code quality. Additionally, all files are served from secure servers with SSL encryption.",
  },
  {
    question: "Can I get a refund for a digital product?",
    answer:
      "Due to the nature of digital goods, refunds are provided under specific conditions (e.g. broken source code that our team or seller cannot fix). Please read our Refund Policy for full details.",
  },
  {
    question: "Do you offer game reskinning services?",
    answer:
      "Yes! When purchasing any source code, you can opt for additional services like Reskinning, Publishing, and App Store Optimization during checkout.",
  },
  {
    question: "How do I download my purchased items?",
    answer:
      "Once payment is verified, your purchased source codes are instantly available under your Dashboard > Downloads section.",
  },
  {
    question: "Can I sell my own Unity source codes here?",
    answer:
      "Yes! Register an account and apply as a Seller. Once approved, you can upload your game source codes and start earning.",
  },
];

export default function ContactClient() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.subject || !form.message) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSubmitted(true);
        toast({
          title: "Message Sent!",
          description: "Thank you for contacting us. We'll get back to you shortly.",
        });
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to send message. Please try again.",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-12 bg-background">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Get in Touch
          </h1>
          <p className="mt-3 text-muted-foreground">
            Have questions about source codes, reskinning services, or seller partnership? Send us a message and our team will get back to you within 24 hours.
          </p>
        </div>

        {/* Top Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="border-border/60">
            <CardContent className="p-6 flex items-start gap-4">
              <div className="p-3 bg-primary/10 text-primary rounded-lg shrink-0">
                <Mail className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-base mb-1">Email Support</h3>
                <p className="text-sm text-muted-foreground mb-2">Direct email assistance for technical & billing support.</p>
                <a href="mailto:support@readygamecode.com" className="text-sm font-medium text-primary hover:underline">
                  support@readygamecode.com
                </a>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardContent className="p-6 flex items-start gap-4">
              <div className="p-3 bg-primary/10 text-primary rounded-lg shrink-0">
                <MessageCircle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-base mb-1">Live Chat Support</h3>
                <p className="text-sm text-muted-foreground mb-2">Chat directly with our support team on Telegram or WhatsApp.</p>
                <a href="https://t.me/readygamecode" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary hover:underline">
                  Telegram @readygamecode
                </a>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardContent className="p-6 flex items-start gap-4">
              <div className="p-3 bg-primary/10 text-primary rounded-lg shrink-0">
                <Phone className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-base mb-1">Business & Reskinning</h3>
                <p className="text-sm text-muted-foreground mb-2">Custom game development & bulk source code inquiries.</p>
                <span className="text-sm font-medium text-foreground">
                  Mon - Sat (9:00 AM - 6:00 PM EST)
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Form */}
          <div className="lg:col-span-7">
            <Card className="border-border/60 shadow-sm">
              <CardContent className="p-6 sm:p-8">
                <h2 className="text-xl font-bold mb-6">Send Us a Message</h2>

                {submitted ? (
                  <div className="text-center py-8 space-y-4">
                    <div className="w-16 h-16 bg-emerald-500/10 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                      <Send className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold">Thank You!</h3>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                      Your message has been received. Our support team will review your inquiry and reply via email shortly.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSubmitted(false);
                        setForm({ name: "", email: "", subject: "", message: "" });
                      }}
                    >
                      Send Another Message
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Your Name *</Label>
                        <Input
                          id="name"
                          placeholder="John Doe"
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address *</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="john@example.com"
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject *</Label>
                      <Input
                        id="subject"
                        placeholder="Inquiry about Unity source code or reskin service"
                        value={form.subject}
                        onChange={(e) => setForm({ ...form, subject: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Message *</Label>
                      <Textarea
                        id="message"
                        rows={5}
                        placeholder="Describe your question or requirements in detail..."
                        value={form.message}
                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                        required
                      />
                    </div>

                    <Button type="submit" disabled={loading} className="w-full">
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Send Message
                        </>
                      )}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>

          {/* FAQs */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <h2 className="text-xl font-bold mb-2">Frequently Asked Questions</h2>
              <p className="text-sm text-muted-foreground">
                Quick answers to common questions about buying & selling source codes.
              </p>
            </div>

            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left font-semibold text-sm">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-xs text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </div>
    </div>
  );
}
