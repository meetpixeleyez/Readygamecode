"use client";

import React, { useRef, useEffect, useState } from "react";
import { 
  Bold, 
  Italic, 
  Underline, 
  Heading1, 
  Heading2, 
  Heading3, 
  List, 
  ListOrdered, 
  Code, 
  Quote, 
  Eye, 
  FileCode, 
  Edit3, 
  Sparkles,
  Link as LinkIcon,
  Table,
  CheckCircle2,
  Copy
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  productTitle?: string;
  categoryName?: string;
  subcategoryName?: string;
  tags?: string[];
}

const SAMPLE_CHATGPT_TEMPLATE = `<h2>Overview</h2>
<p>Insert a brief, engaging overview of your game or source code here. Explain what makes it unique and exciting for buyers.</p>

<h2>Key Features</h2>
<ul>
  <li><strong>Ultra-Realistic Gameplay:</strong> Smooth controls and high-quality graphics optimized for performance.</li>
  <li><strong>Cross-Platform Ready:</strong> Fully supported on Android, iOS, and PC platforms.</li>
  <li><strong>Monetization Integrated:</strong> Includes AdMob (Banner, Interstitial, Rewarded) and In-App Purchases.</li>
  <li><strong>Easy Customization:</strong> Clean C# code architecture, easy to reskin and replace graphics.</li>
  <li><strong>Level System:</strong> Includes 50+ pre-built levels with progressive difficulty.</li>
</ul>

<h2>Tech Stack & Requirements</h2>
<ul>
  <li>Unity 2022.3 LTS or higher</li>
  <li>C# Source Code</li>
  <li>Android Studio / Xcode for publishing</li>
</ul>

<h2>What You Get in the Package</h2>
<ul>
  <li>Complete Unity Project Source Code</li>
  <li>Step-by-step Setup Documentation (PDF/HTML)</li>
  <li>3D Assets, Textures, Sound Effects, and UI Graphics</li>
</ul>`;

export function RichTextEditor({ 
  value, 
  onChange, 
  className,
  productTitle,
  categoryName,
  subcategoryName,
  tags 
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isUpdatingRef = useRef(false);
  const [mode, setMode] = useState<"visual" | "code" | "preview">("visual");
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    h1: false,
    h2: false,
    h3: false,
    ul: false,
    ol: false,
    quote: false,
    code: false,
  });

  // Dynamic Prompt Generation based on Product Details
  const dynamicPrompt = React.useMemo(() => {
    const titleText = productTitle && productTitle.trim() ? productTitle.trim() : "[Insert Product Title]";
    
    let categoryText = "[Insert Category]";
    if (categoryName && categoryName.trim()) {
      categoryText = subcategoryName && subcategoryName.trim()
        ? `${categoryName.trim()} > ${subcategoryName.trim()}`
        : categoryName.trim();
    }

    const tagsText = tags && tags.length > 0 ? tags.join(", ") : "games, unity, source code, mobile app";

    return `Write a professional, high-converting product description in clean HTML format for a digital product on a developer marketplace (like CodeCanyon or Unity Asset Store).

Product Title: ${titleText}
Product Category: ${categoryText}
Keywords/Tags: ${tagsText}

Formatting & Structure Guidelines:
1. Use <h2> for section headers:
   - <h2>Overview</h2>
   - <h2>Key Features</h2>
   - <h2>Tech Stack & Requirements</h2>
   - <h2>What You Get in the Package</h2>
2. Under <h2>Overview</h2>, write a brief, 2-3 sentence engaging intro tailored specifically for "${titleText}".
3. Under <h2>Key Features</h2>, list 5-6 bullet points using <ul> and <li> with <strong> bold feature highlights.
4. Under <h2>Tech Stack & Requirements</h2>, list required engines, versions, and setup tools.
5. Under <h2>What You Get in the Package</h2>, list included source code files, documentation, and assets.
6. Output ONLY raw HTML code (no markdown, no \`\`\`html wrapper, start directly with <h2>Overview</h2>).`;
  }, [productTitle, categoryName, subcategoryName, tags]);

  const hasDynamicData = Boolean(productTitle?.trim() || categoryName?.trim());

  const checkActiveFormats = () => {
    if (mode !== "visual") return;
    try {
      const block = (document.queryCommandValue("formatBlock") || "").toLowerCase();
      setActiveFormats({
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic"),
        underline: document.queryCommandState("underline"),
        h1: block === "h1" || block === "heading 1",
        h2: block === "h2" || block === "heading 2",
        h3: block === "h3" || block === "heading 3",
        ul: document.queryCommandState("insertUnorderedList"),
        ol: document.queryCommandState("insertOrderedList"),
        quote: block === "blockquote",
        code: block === "pre",
      });
    } catch {
      // Ignore query errors
    }
  };

  useEffect(() => {
    if (mode === "visual") {
      document.addEventListener("selectionchange", checkActiveFormats);
      return () => {
        document.removeEventListener("selectionchange", checkActiveFormats);
      };
    }
  }, [mode]);

  useEffect(() => {
    if (mode === "visual" && editorRef.current && !isUpdatingRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || "";
    }
  }, [value, mode]);

  const handleInput = () => {
    if (editorRef.current) {
      isUpdatingRef.current = true;
      onChange(editorRef.current.innerHTML);
      checkActiveFormats();
      queueMicrotask(() => {
        isUpdatingRef.current = false;
      });
    }
  };

  const execCommand = (command: string, val: string | undefined = undefined) => {
    if (mode !== "visual") setMode("visual");
    setTimeout(() => {
      document.execCommand(command, false, val);
      if (editorRef.current) {
        editorRef.current.focus();
        handleInput();
        checkActiveFormats();
      }
    }, 50);
  };

  const insertLink = () => {
    const url = prompt("Enter URL:", "https://");
    if (url) {
      execCommand("createLink", url);
    }
  };

  const insertTable = () => {
    const tableHTML = `<table border="1"><thead><tr><th>Feature</th><th>Details</th></tr></thead><tbody><tr><td>Engine</td><td>Unity 2022.3 LTS</td></tr><tr><td>Platform</td><td>Android & iOS</td></tr></tbody></table>`;
    if (mode === "code") {
      onChange(value + "\n" + tableHTML);
    } else {
      execCommand("insertHTML", tableHTML);
    }
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(dynamicPrompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const ToolbarButton = ({ onClick, children, title, active = false }: { onClick: () => void; children: React.ReactNode; title: string; active?: boolean }) => (
    <Button
      type="button"
      variant={active ? "default" : "ghost"}
      size="sm"
      className={cn(
        "h-8 w-8 p-0 transition-all duration-150 rounded",
        active
          ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md font-bold scale-105 ring-1 ring-primary/50"
          : "text-muted-foreground hover:text-foreground hover:bg-muted"
      )}
      onClick={onClick}
      title={title}
    >
      {children}
    </Button>
  );

  return (
    <div className={cn("border border-input rounded-md overflow-hidden flex flex-col focus-within:ring-1 focus-within:ring-ring bg-card", className)}>
      {/* Editor Header / Mode Selector */}
      <div className="flex items-center justify-between flex-wrap gap-2 border-b bg-muted/50 px-3 py-2 text-xs">
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant={mode === "visual" ? "default" : "ghost"}
            size="sm"
            className="h-7 text-xs gap-1.5 px-2.5"
            onClick={() => setMode("visual")}
          >
            <Edit3 className="h-3.5 w-3.5" />
            Visual Editor
          </Button>
          <Button
            type="button"
            variant={mode === "code" ? "default" : "ghost"}
            size="sm"
            className="h-7 text-xs gap-1.5 px-2.5"
            onClick={() => setMode("code")}
          >
            <FileCode className="h-3.5 w-3.5" />
            HTML Code (ChatGPT)
          </Button>
          <Button
            type="button"
            variant={mode === "preview" ? "default" : "ghost"}
            size="sm"
            className="h-7 text-xs gap-1.5 px-2.5"
            onClick={() => setMode("preview")}
          >
            <Eye className="h-3.5 w-3.5" />
            Live Preview
          </Button>
        </div>

        {/* ChatGPT Template Helper Modal */}
        <Dialog>
          <DialogTrigger asChild>
            <Button type="button" variant="outline" size="sm" className="h-7 text-xs gap-1.5 text-primary border-primary/30 hover:bg-primary/10">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              ChatGPT HTML Helper
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-4 w-4 text-primary" />
                ChatGPT HTML Description Helper
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Copy our AI prompt tailored to your product details or insert a pre-made marketplace HTML template directly.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold">Option 1: Tailored ChatGPT Prompt</label>
                  {hasDynamicData && (
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded font-medium">
                      ✓ Auto-filled with your product info
                    </span>
                  )}
                </div>
                <div className="relative bg-muted p-3 rounded-md text-xs font-mono text-muted-foreground border">
                  <pre className="whitespace-pre-wrap max-h-52 overflow-y-auto leading-relaxed">{dynamicPrompt}</pre>
                  <Button
                    type="button"
                    size="sm"
                    variant="default"
                    className="absolute top-2 right-2 h-7 text-xs gap-1 shadow-sm"
                    onClick={handleCopyPrompt}
                  >
                    {copiedPrompt ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    {copiedPrompt ? "Copied!" : "Copy Prompt"}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold">Option 2: Insert Sample CodeCanyon HTML Template</label>
                <p className="text-xs text-muted-foreground">Loads a pre-structured HTML description template into your editor.</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full text-xs gap-1.5"
                  onClick={() => {
                    const customTemplate = productTitle?.trim() 
                      ? SAMPLE_CHATGPT_TEMPLATE.replace("<h2>Overview</h2>", `<h2>Overview - ${productTitle.trim()}</h2>`)
                      : SAMPLE_CHATGPT_TEMPLATE;
                    onChange(customTemplate);
                    setMode("visual");
                  }}
                >
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  Insert Marketplace HTML Template
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Formatting Toolbar (Only in Visual Mode) */}
      {mode === "visual" && (
        <div className="flex items-center flex-wrap gap-1 border-b bg-muted/20 p-1">
          <ToolbarButton onClick={() => execCommand('bold')} title="Bold (Ctrl+B)" active={activeFormats.bold}>
            <Bold className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => execCommand('italic')} title="Italic (Ctrl+I)" active={activeFormats.italic}>
            <Italic className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => execCommand('underline')} title="Underline (Ctrl+U)" active={activeFormats.underline}>
            <Underline className="h-4 w-4" />
          </ToolbarButton>

          <div className="w-px h-4 bg-border mx-1" />

          <ToolbarButton onClick={() => execCommand('formatBlock', 'H1')} title="Heading 1" active={activeFormats.h1}>
            <Heading1 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => execCommand('formatBlock', 'H2')} title="Heading 2" active={activeFormats.h2}>
            <Heading2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => execCommand('formatBlock', 'H3')} title="Heading 3" active={activeFormats.h3}>
            <Heading3 className="h-4 w-4" />
          </ToolbarButton>

          <div className="w-px h-4 bg-border mx-1" />

          <ToolbarButton onClick={() => execCommand('insertUnorderedList')} title="Bullet List" active={activeFormats.ul}>
            <List className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => execCommand('insertOrderedList')} title="Numbered List" active={activeFormats.ol}>
            <ListOrdered className="h-4 w-4" />
          </ToolbarButton>

          <div className="w-px h-4 bg-border mx-1" />

          <ToolbarButton onClick={insertLink} title="Insert Link">
            <LinkIcon className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => execCommand('formatBlock', 'BLOCKQUOTE')} title="Quote / Callout" active={activeFormats.quote}>
            <Quote className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => execCommand('formatBlock', 'PRE')} title="Code Block" active={activeFormats.code}>
            <Code className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={insertTable} title="Insert Table">
            <Table className="h-4 w-4" />
          </ToolbarButton>
        </div>
      )}

      {/* Editor Body */}
      {mode === "visual" && (
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          className="min-h-[260px] max-h-[500px] overflow-y-auto p-4 outline-none product-description-content prose prose-sm max-w-none dark:prose-invert focus:outline-none bg-background text-foreground"
        />
      )}

      {mode === "code" && (
        <div className="relative">
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Paste your raw HTML script generated by ChatGPT here... (e.g. <h2>Overview</h2><p>...</p>)"
            className="w-full min-h-[260px] max-h-[500px] p-4 font-mono text-xs bg-slate-950 text-slate-100 dark:bg-black outline-none border-none resize-y leading-relaxed"
          />
          <div className="bg-slate-900 text-slate-400 text-[10px] px-3 py-1 border-t border-slate-800 flex justify-between items-center">
            <span>Direct HTML Editing Mode (ChatGPT Ready)</span>
            <span>{value.length} characters</span>
          </div>
        </div>
      )}

      {mode === "preview" && (
        <div className="p-4 min-h-[260px] max-h-[500px] overflow-y-auto bg-card border-t">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 border-b pb-1">
            Live Product Page Render Preview
          </div>
          <div
            className="product-description-content prose prose-sm md:prose-base max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{
              __html: value || "<p className='text-muted-foreground italic'>No description provided yet.</p>",
            }}
          />
        </div>
      )}
    </div>
  );
}
