"""
Phase 0 Discovery Document — Part B PDF Builder
Ready Game Code Migration: Laravel to Next.js + NestJS

Reuses ReportLab infrastructure from Part A. Produces PDF + Markdown.
"""

import os
import sys
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT, TA_JUSTIFY
from reportlab.platypus import (
    Paragraph, Spacer, PageBreak, Table, TableStyle,
    KeepTogether, NextPageTemplate, PageTemplate, Frame, BaseDocTemplate,
    Preformatted, HRFlowable,
)

# Import content
sys.path.insert(0, "/home/z/my-project/scripts")
from phase0b_content import (
    CORRECTIONS_HEADERS, CORRECTIONS_ROWS,
    CONTROLLER_INVENTORY_HEADERS, CONTROLLER_INVENTORY_ROWS,
    VALIDATION_HEADERS, VALIDATION_ROWS,
    MIDDLEWARE_HEADERS, MIDDLEWARE_ROWS,
    AUTH_FLOW_TEXT,
    CART_CHECKOUT_TEXT,
    PAYMENT_GATEWAY_TEXT,
    REVIEWER_WORKFLOW_TEXT,
    ADMIN_MODULES_HEADERS, ADMIN_MODULES_ROWS,
    NOTIFICATION_TEXT,
    CRON_TEXT,
    HELPERS_HEADERS, HELPERS_ROWS,
    UPDATED_SCHEMA_HEADERS, UPDATED_SCHEMA_ROWS,
    UPDATED_MODULE_HEADERS, UPDATED_MODULE_ROWS,
    QUESTIONS_ANSWERED,
    NEW_RISKS_HEADERS, NEW_RISKS_ROWS,
    MDR_HEADERS, MDR_ROWS,
)

# Reuse font + color constants from Part A
sys.path.insert(0, "/home/z/my-project/scripts")
from phase0_build import (
    FONT_BODY, FONT_BODY_BOLD, FONT_HEADING, FONT_MONO,
    BRAND_ORANGE, BRAND_ORANGE_LIGHT, BRAND_ORANGE_DARK,
    INK_900, INK_700, INK_500, INK_300, INK_100, INK_50,
    SEM_SUCCESS, SEM_WARNING, SEM_ERROR, SEM_INFO,
    TABLE_HEADER_BG, TABLE_HEADER_TEXT, TABLE_ROW_ALT, TABLE_BORDER,
    PAGE_WIDTH, PAGE_HEIGHT,
    LEFT_MARGIN, RIGHT_MARGIN, TOP_MARGIN, BOTTOM_MARGIN, CONTENT_WIDTH,
    make_styles, make_table, make_callout, make_section_header,
    _escape_for_paragraph, _wrap_text,
)


# =============================================================================
# Custom Doc Template (same as Part A but different page header)
# =============================================================================
class PartBDocTemplate(BaseDocTemplate):
    """Custom doc template for Part B."""

    def __init__(self, filename, **kwargs):
        super().__init__(filename, **kwargs)

        cover_frame = Frame(
            0, 0, PAGE_WIDTH, PAGE_HEIGHT,
            leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0,
            id="cover",
        )
        cover_template = PageTemplate(
            id="Cover", frames=[cover_frame], onPage=self._draw_cover_bg
        )

        body_frame = Frame(
            LEFT_MARGIN, BOTTOM_MARGIN,
            CONTENT_WIDTH,
            PAGE_HEIGHT - TOP_MARGIN - BOTTOM_MARGIN,
            id="body",
        )
        body_template = PageTemplate(
            id="Body", frames=[body_frame], onPage=self._draw_body_chrome
        )

        self.addPageTemplates([cover_template, body_template])

    def _draw_cover_bg(self, canvas, doc):
        canvas.saveState()
        canvas.setFillColor(colors.white)
        canvas.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, fill=1, stroke=0)
        # Different accent color for Part B (darker orange to distinguish)
        canvas.setFillColor(BRAND_ORANGE_DARK)
        canvas.rect(0, PAGE_HEIGHT - 12, PAGE_WIDTH, 12, fill=1, stroke=0)
        canvas.setFillColor(BRAND_ORANGE)
        canvas.rect(LEFT_MARGIN - 8, 200, 4, PAGE_HEIGHT - 280, fill=1, stroke=0)
        canvas.setFillColor(INK_500)
        canvas.setFont(FONT_BODY, 8)
        canvas.drawString(LEFT_MARGIN, 30, "CONFIDENTIAL — Prepared for Ready Game Code Team")
        canvas.drawRightString(PAGE_WIDTH - RIGHT_MARGIN, 30, "July 2026  |  Part B")
        canvas.restoreState()

    def _draw_body_chrome(self, canvas, doc):
        canvas.saveState()
        canvas.setFillColor(INK_500)
        canvas.setFont(FONT_BODY, 8)
        canvas.drawString(LEFT_MARGIN, PAGE_HEIGHT - 15,
                          "Phase 0 Discovery Document — Part B  |  Ready Game Code Migration")
        canvas.drawRightString(PAGE_WIDTH - RIGHT_MARGIN, PAGE_HEIGHT - 15,
                                f"Page {doc.page - 1}")
        canvas.setStrokeColor(INK_300)
        canvas.setLineWidth(0.5)
        canvas.line(LEFT_MARGIN, PAGE_HEIGHT - 18, PAGE_WIDTH - RIGHT_MARGIN, PAGE_HEIGHT - 18)
        canvas.setFillColor(INK_500)
        canvas.setFont(FONT_BODY, 8)
        canvas.drawString(LEFT_MARGIN, 15, "CONFIDENTIAL")
        canvas.drawRightString(PAGE_WIDTH - RIGHT_MARGIN, 15,
                                "Ready Game Code  |  Laravel to Next.js + NestJS Migration")
        canvas.line(LEFT_MARGIN, 25, PAGE_WIDTH - RIGHT_MARGIN, 25)
        canvas.restoreState()


# =============================================================================
# Section Builders
# =============================================================================
def build_cover(styles):
    elements = []
    elements.append(Spacer(1, 180))
    eyebrow_style = ParagraphStyle(
        "Eyebrow", parent=styles["CoverMeta"],
        fontSize=10, textColor=BRAND_ORANGE_DARK, fontName=FONT_BODY_BOLD,
    )
    elements.append(Paragraph("PRINCIPAL ARCHITECT  |  PHASE 0 PART B — SOURCE CODE ANALYSIS", eyebrow_style))
    elements.append(Spacer(1, 12))
    elements.append(Paragraph("Phase 0 Discovery Document", styles["CoverTitle"]))
    elements.append(Spacer(1, 6))
    elements.append(Paragraph(
        "Part B: Source Code Analysis & Refined Migration Plan",
        styles["CoverSubtitle"]
    ))
    elements.append(Paragraph(
        "Comprehensive analysis of 634 Laravel PHP/Blade files, documenting every controller, "
        "middleware, validation rule, payment flow, reviewer workflow, and admin module. "
        "Includes corrections to Part A, 20 answered open questions, and 20 Migration Decision Records.",
        styles["CoverTagline"]
    ))
    elements.append(Spacer(1, 80))
    meta_lines = [
        "<b>Document Version:</b>  Part B (v1.0)",
        "<b>Supersedes:</b>  Part A where corrections noted in Section 0",
        "<b>Prepared By:</b>  Principal Software Architect",
        "<b>Source:</b>  Laravel 11 + PHP 8.3 source code (634 files)",
        "<b>Lines Analyzed:</b>  ~25,000 lines of PHP + Blade",
        "<b>Date:</b>  July 2026",
    ]
    for line in meta_lines:
        elements.append(Paragraph(line, styles["CoverMeta"]))
        elements.append(Spacer(1, 2))
    elements.append(PageBreak())
    return elements


def build_toc(styles):
    elements = []
    elements.append(Paragraph("Table of Contents (Part B)", styles["H1"]))
    elements.append(HRFlowable(width="100%", thickness=2, color=BRAND_ORANGE,
                                spaceBefore=4, spaceAfter=14))
    toc_items = [
        ("0. Corrections to Part A", 1),
        ("1. Controller Business Logic Inventory", 1),
        ("2. Validation Rules Catalog", 1),
        ("3. Middleware Stack Documentation", 1),
        ("4. Auth Flow Deep Dive", 1),
        ("5. Cart & Checkout Flow", 1),
        ("6. Payment Gateway Deep Dive", 1),
        ("7. Reviewer Workflow", 1),
        ("8. Admin Panel Flow", 1),
        ("9. Notification System", 1),
        ("10. Cron Jobs & Scheduled Tasks", 1),
        ("11. Helpers & Utilities", 1),
        ("12. Updated Schema Decision Record", 1),
        ("13. Updated NestJS Module Map", 1),
        ("14. 20 Open Questions — Answered", 1),
        ("15. Updated Risk Register (New Risks)", 1),
        ("16. Migration Decision Records (20 MDRs)", 1),
    ]
    for title, level in toc_items:
        style = styles["TOCEntry1"] if level == 1 else styles["TOCEntry2"]
        elements.append(Paragraph(title, style))
    elements.append(Spacer(1, 24))
    elements.append(make_callout(
        "Part B is best read alongside Part A. Part A covers: database analysis (67 tables), "
        "public surface audit, AWS architecture, 30-week roadmap, data migration plan, URL/SEO "
        "preservation, OWASP security checklist. Part B covers: business logic, validation, "
        "middleware, auth flows, payment flows, reviewer workflow, admin panel, notifications, "
        "cron, helpers, and 20 formal Migration Decision Records.",
        styles
    ))
    elements.append(PageBreak())
    return elements


def build_corrections(styles):
    elements = []
    elements.extend(make_section_header("0", "Corrections to Part A", styles))
    elements.append(Paragraph(
        "After receiving the Laravel source code, several assumptions in Part A were proven incorrect. "
        "This section catalogs all corrections. Part B supersedes Part A where conflicts exist. "
        "Part A remains as a historical snapshot of the initial analysis based on SQL dump + live site audit only.",
        styles["Body"]
    ))
    elements.append(Paragraph("0.1  Corrections Matrix", styles["H2"]))
    elements.append(make_table(
        CORRECTIONS_HEADERS, CORRECTIONS_ROWS, styles,
        col_widths=[0.16, 0.20, 0.64], small=True,
    ))
    elements.append(PageBreak())
    return elements


def build_controller_inventory(styles):
    elements = []
    elements.extend(make_section_header("1", "Controller Business Logic Inventory", styles))
    elements.append(Paragraph(
        "Every controller method with its route, business logic summary, and side effects. "
        "Organized by controller class. This is the authoritative reference for NestJS service extraction.",
        styles["Body"]
    ))
    elements.append(Paragraph("1.1  Controller Method Inventory", styles["H2"]))
    elements.append(make_table(
        CONTROLLER_INVENTORY_HEADERS, CONTROLLER_INVENTORY_ROWS, styles,
        col_widths=[0.14, 0.18, 0.22, 0.46], small=True,
    ))
    elements.append(PageBreak())
    return elements


def build_validation_rules(styles):
    elements = []
    elements.extend(make_section_header("2", "Validation Rules Catalog", styles))
    elements.append(Paragraph(
        "All validation rules extracted from controller methods (inline $request->validate() calls) "
        "and FormRequest classes. NestJS migration should replicate these as Zod schemas in DTOs. "
        "Note: most validation is inline (not FormRequest) — this is a code quality issue in the "
        "original Laravel app that the NestJS migration should fix by centralizing validation in DTOs.",
        styles["Body"]
    ))
    elements.append(Paragraph("2.1  Validation Rules by Endpoint", styles["H2"]))
    elements.append(make_table(
        VALIDATION_HEADERS, VALIDATION_ROWS, styles,
        col_widths=[0.22, 0.22, 0.30, 0.26], small=True,
    ))
    elements.append(PageBreak())
    return elements


def build_middleware(styles):
    elements = []
    elements.extend(make_section_header("3", "Middleware Stack Documentation", styles))
    elements.append(Paragraph(
        "14 middleware classes enforce cross-cutting concerns: maintenance mode, language, template, "
        "authentication, authorization (3 roles), KYC, author status, profile completion, CSRF, demo mode. "
        "NestJS migration should replicate via guards, interceptors, and middleware. Note: VerifyCsrfToken "
        "excludes /ipn/* routes (payment webhooks) — NestJS should use raw body verification for webhooks instead.",
        styles["Body"]
    ))
    elements.append(Paragraph("3.1  Middleware Inventory", styles["H2"]))
    elements.append(make_table(
        MIDDLEWARE_HEADERS, MIDDLEWARE_ROWS, styles,
        col_widths=[0.20, 0.18, 0.34, 0.28], small=True,
    ))
    elements.append(PageBreak())
    return elements


def build_auth_flow(styles):
    elements = []
    elements.extend(make_section_header("4", "Auth Flow Deep Dive", styles))
    elements.append(Paragraph(
        "Three-guard architecture (user, admin, reviewer) with cart transfer, email/mobile/2FA verification, "
        "KYC, OAuth (Google), password reset, and admin impersonation. This section documents every auth "
        "flow end-to-end for faithful NestJS replication.",
        styles["Body"]
    ))
    for heading, body in AUTH_FLOW_TEXT:
        elements.append(Paragraph(_escape_for_paragraph(heading), styles["H3"]))
        elements.append(Paragraph(_escape_for_paragraph(body), styles["Body"]))
    elements.append(PageBreak())
    return elements


def build_cart_checkout(styles):
    elements = []
    elements.extend(make_section_header("5", "Cart & Checkout Flow", styles))
    elements.append(Paragraph(
        "Cart is intentionally per-item (no parent Cart entity). Checkout is 6-step flow with cart transfer, "
        "coupon, order creation, gateway routing. Two code paths for order creation (CheckoutController vs "
        "PaymentController) — must be unified in NestJS.",
        styles["Body"]
    ))
    for heading, body in CART_CHECKOUT_TEXT:
        elements.append(Paragraph(_escape_for_paragraph(heading), styles["H3"]))
        elements.append(Paragraph(_escape_for_paragraph(body), styles["Body"]))
    elements.append(PageBreak())
    return elements


def build_payment_gateways(styles):
    elements = []
    elements.extend(make_section_header("6", "Payment Gateway Deep Dive", styles))
    elements.append(Paragraph(
        "Three active payment paths: Razorpay (INR, checkout modal + webhook), PayPal (USD, redirect + "
        "deprecated IPN), Manual UPI (QR + admin approval). Plus wallet payment path (code exists, UI "
        "doesn't expose). Webhook security analysis included.",
        styles["Body"]
    ))
    for heading, body in PAYMENT_GATEWAY_TEXT:
        elements.append(Paragraph(_escape_for_paragraph(heading), styles["H3"]))
        elements.append(Paragraph(_escape_for_paragraph(body), styles["Body"]))
    elements.append(PageBreak())
    return elements


def build_reviewer_workflow(styles):
    elements = []
    elements.extend(make_section_header("7", "Reviewer Workflow", styles))
    elements.append(Paragraph(
        "Reviewer is a distinct role with subcategory-scoped permissions. 8 product queues, 4 rejection "
        "types, 2 update review types, atomic file swap on approval, activity log for audit trail. "
        "Critical workflow to replicate faithfully in NestJS.",
        styles["Body"]
    ))
    for heading, body in REVIEWER_WORKFLOW_TEXT:
        elements.append(Paragraph(_escape_for_paragraph(heading), styles["H3"]))
        elements.append(Paragraph(_escape_for_paragraph(body), styles["Body"]))
    elements.append(PageBreak())
    return elements


def build_admin_panel(styles):
    elements = []
    elements.extend(make_section_header("8", "Admin Panel Flow", styles))
    elements.append(Paragraph(
        "Admin panel has 30+ modules with 200+ routes (508 lines of admin routes). Single admin role "
        "(no granular permissions) with impersonation capability. This section provides module-level "
        "inventory — full route documentation is in routes/admin.php.",
        styles["Body"]
    ))
    elements.append(Paragraph("8.1  Admin Module Inventory", styles["H2"]))
    elements.append(make_table(
        ADMIN_MODULES_HEADERS, ADMIN_MODULES_ROWS, styles,
        col_widths=[0.22, 0.10, 0.28, 0.40], small=True,
    ))
    elements.append(PageBreak())
    return elements


def build_notifications(styles):
    elements = []
    elements.extend(make_section_header("9", "Notification System", styles))
    elements.append(Paragraph(
        "Multi-channel notification system (email + SMS + push) via centralized notify() helper. "
        "20+ templates with shortcode substitution. Author email settings control per-notification opt-in. "
        "NestJS migration should use a NotificationService with pluggable channel providers.",
        styles["Body"]
    ))
    for heading, body in NOTIFICATION_TEXT:
        elements.append(Paragraph(_escape_for_paragraph(heading), styles["H3"]))
        elements.append(Paragraph(_escape_for_paragraph(body), styles["Body"]))
    elements.append(PageBreak())
    return elements


def build_cron(styles):
    elements = []
    elements.extend(make_section_header("10", "Cron Jobs & Scheduled Tasks", styles))
    elements.append(Paragraph(
        "DB-driven cron system with admin UI. Master /cron endpoint hit every minute by system crontab. "
        "Two job types: internal controller methods (is_default=1) and external URLs (is_default=0). "
        "Currently only campaignExpired is explicitly defined in source code.",
        styles["Body"]
    ))
    for heading, body in CRON_TEXT:
        elements.append(Paragraph(_escape_for_paragraph(heading), styles["H3"]))
        elements.append(Paragraph(_escape_for_paragraph(body), styles["Body"]))
    elements.append(PageBreak())
    return elements


def build_helpers(styles):
    elements = []
    elements.extend(make_section_header("11", "Helpers & Utilities", styles))
    elements.append(Paragraph(
        "766-line helpers.php file contains 35+ utility functions used throughout the application. "
        "These must be replicated as NestJS services/utilities. Key helpers: notify(), fileUploader(), "
        "getTrx(), getRealIP(), showAmount(), showDateTime(), verifyG2fa().",
        styles["Body"]
    ))
    elements.append(Paragraph("11.1  Helper Function Inventory", styles["H2"]))
    elements.append(make_table(
        HELPERS_HEADERS, HELPERS_ROWS, styles,
        col_widths=[0.22, 0.48, 0.30], small=True,
    ))
    elements.append(PageBreak())
    return elements


def build_updated_schema(styles):
    elements = []
    elements.extend(make_section_header("12", "Updated Schema Decision Record", styles))
    elements.append(Paragraph(
        "Refined schema decisions based on source code analysis. Where Part A and Part B differ, "
        "Part B is authoritative. Key changes: carts kept as-is (no parent entity), general_settings "
        "split into 7 typed tables, activities get action_type enum, deposits get webhook_event_id "
        "for idempotency.",
        styles["Body"]
    ))
    elements.append(Paragraph("12.1  Refined Schema Decisions", styles["H2"]))
    elements.append(make_table(
        UPDATED_SCHEMA_HEADERS, UPDATED_SCHEMA_ROWS, styles,
        col_widths=[0.14, 0.26, 0.30, 0.30], small=True,
    ))
    elements.append(PageBreak())
    return elements


def build_updated_modules(styles):
    elements = []
    elements.extend(make_section_header("13", "Updated NestJS Module Map", styles))
    elements.append(Paragraph(
        "Refined NestJS module map with source controllers mapped to target services. 20 modules total "
        "(2 more than Part A — CronModule and SupportModule split out for clarity). Each module lists "
        "the Laravel controllers it absorbs and the key services to extract.",
        styles["Body"]
    ))
    elements.append(Paragraph("13.1  Module → Controller → Service Mapping", styles["H2"]))
    elements.append(make_table(
        UPDATED_MODULE_HEADERS, UPDATED_MODULE_ROWS, styles,
        col_widths=[0.18, 0.42, 0.40], small=True,
    ))
    elements.append(PageBreak())
    return elements


def build_questions_answered(styles):
    elements = []
    elements.extend(make_section_header("14", "20 Open Questions — Answered", styles))
    elements.append(Paragraph(
        "All 20 open questions from Part A Section 11.2 are now answered using the Laravel source code. "
        "These answers inform the NestJS implementation and supersede any assumptions in Part A.",
        styles["Body"]
    ))
    for question, answer in QUESTIONS_ANSWERED:
        elements.append(Paragraph(_escape_for_paragraph(question), styles["H3"]))
        elements.append(Paragraph(_escape_for_paragraph(answer), styles["Body"]))
    elements.append(PageBreak())
    return elements


def build_new_risks(styles):
    elements = []
    elements.extend(make_section_header("15", "Updated Risk Register (New Risks)", styles))
    elements.append(Paragraph(
        "14 new risks discovered during source code analysis (R13-R26). These are added to the 12 risks "
        "from Part A (R1-R12) for a total of 26 risks. The most critical new risks: R13 (seller earning "
        "formula inconsistency), R14 (no queued jobs), R20 (PayPal IPN deprecated).",
        styles["Body"]
    ))
    elements.append(Paragraph("15.1  New Risks (R13-R26)", styles["H2"]))
    elements.append(make_table(
        NEW_RISKS_HEADERS, NEW_RISKS_ROWS, styles,
        col_widths=[0.05, 0.30, 0.10, 0.10, 0.45], small=True,
    ))
    elements.append(PageBreak())
    return elements


def build_mdrs(styles):
    elements = []
    elements.extend(make_section_header("16", "Migration Decision Records (20 MDRs)", styles))
    elements.append(Paragraph(
        "Formal decision records for every architectural choice that differs from Part A or that requires "
        "explicit approval. Each MDR has a number, decision, rationale, and approver. MDRs are immutable "
        "once approved — changes require a new MDR that supersedes the prior one.",
        styles["Body"]
    ))
    elements.append(Paragraph("16.1  Migration Decision Records", styles["H2"]))
    elements.append(make_table(
        MDR_HEADERS, MDR_ROWS, styles,
        col_widths=[0.08, 0.32, 0.45, 0.15], small=True,
    ))

    elements.append(Spacer(1, 24))
    elements.append(Paragraph("End of Phase 0 Discovery Document — Part B", styles["H2"]))
    elements.append(Paragraph(
        "Part B is now complete. Combined with Part A, this constitutes the full Phase 0 Discovery "
        "Document. Next step: approve Phase 0 (Part A + Part B), rotate exposed payment credentials, "
        "and proceed to Phase 1 (Foundation) — monorepo scaffolding, design system, auth module.",
        styles["Body"]
    ))
    return elements


# =============================================================================
# Markdown Builder
# =============================================================================
def build_markdown(output_path: str):
    md = []
    md.append("# Phase 0 Discovery Document — Part B\n")
    md.append("## Ready Game Code Migration: Laravel to Next.js + NestJS\n")
    md.append("**Document Version:** Part B (v1.0)  ")
    md.append("**Supersedes:** Part A where corrections noted in Section 0  ")
    md.append("**Source:** Laravel 11 + PHP 8.3 source code (634 files)  ")
    md.append("**Date:** July 2026\n")
    md.append("---\n")

    # Section 0: Corrections
    md.append("## 0. Corrections to Part A\n")
    md.append("| " + " | ".join(CORRECTIONS_HEADERS) + " |\n")
    md.append("| " + " | ".join(["---"] * len(CORRECTIONS_HEADERS)) + " |\n")
    for row in CORRECTIONS_ROWS:
        md.append("| " + " | ".join(str(c).replace("\n", " ").replace("|", "\\|") for c in row) + " |\n")
    md.append("\n---\n")

    # Section 1: Controllers
    md.append("## 1. Controller Business Logic Inventory\n")
    md.append("| " + " | ".join(CONTROLLER_INVENTORY_HEADERS) + " |\n")
    md.append("| " + " | ".join(["---"] * len(CONTROLLER_INVENTORY_HEADERS)) + " |\n")
    for row in CONTROLLER_INVENTORY_ROWS:
        md.append("| " + " | ".join(str(c).replace("\n", " ").replace("|", "\\|") for c in row) + " |\n")
    md.append("\n---\n")

    # Section 2: Validation
    md.append("## 2. Validation Rules Catalog\n")
    md.append("| " + " | ".join(VALIDATION_HEADERS) + " |\n")
    md.append("| " + " | ".join(["---"] * len(VALIDATION_HEADERS)) + " |\n")
    for row in VALIDATION_ROWS:
        md.append("| " + " | ".join(str(c).replace("\n", " ").replace("|", "\\|") for c in row) + " |\n")
    md.append("\n---\n")

    # Section 3: Middleware
    md.append("## 3. Middleware Stack Documentation\n")
    md.append("| " + " | ".join(MIDDLEWARE_HEADERS) + " |\n")
    md.append("| " + " | ".join(["---"] * len(MIDDLEWARE_HEADERS)) + " |\n")
    for row in MIDDLEWARE_ROWS:
        md.append("| " + " | ".join(str(c).replace("\n", " ").replace("|", "\\|") for c in row) + " |\n")
    md.append("\n---\n")

    # Section 4: Auth Flow
    md.append("## 4. Auth Flow Deep Dive\n")
    for heading, body in AUTH_FLOW_TEXT:
        md.append(f"### {heading}\n{body}\n")
    md.append("\n---\n")

    # Section 5: Cart & Checkout
    md.append("## 5. Cart & Checkout Flow\n")
    for heading, body in CART_CHECKOUT_TEXT:
        md.append(f"### {heading}\n{body}\n")
    md.append("\n---\n")

    # Section 6: Payment Gateways
    md.append("## 6. Payment Gateway Deep Dive\n")
    for heading, body in PAYMENT_GATEWAY_TEXT:
        md.append(f"### {heading}\n{body}\n")
    md.append("\n---\n")

    # Section 7: Reviewer Workflow
    md.append("## 7. Reviewer Workflow\n")
    for heading, body in REVIEWER_WORKFLOW_TEXT:
        md.append(f"### {heading}\n{body}\n")
    md.append("\n---\n")

    # Section 8: Admin Panel
    md.append("## 8. Admin Panel Flow\n")
    md.append("| " + " | ".join(ADMIN_MODULES_HEADERS) + " |\n")
    md.append("| " + " | ".join(["---"] * len(ADMIN_MODULES_HEADERS)) + " |\n")
    for row in ADMIN_MODULES_ROWS:
        md.append("| " + " | ".join(str(c).replace("\n", " ").replace("|", "\\|") for c in row) + " |\n")
    md.append("\n---\n")

    # Section 9: Notifications
    md.append("## 9. Notification System\n")
    for heading, body in NOTIFICATION_TEXT:
        md.append(f"### {heading}\n{body}\n")
    md.append("\n---\n")

    # Section 10: Cron
    md.append("## 10. Cron Jobs & Scheduled Tasks\n")
    for heading, body in CRON_TEXT:
        md.append(f"### {heading}\n{body}\n")
    md.append("\n---\n")

    # Section 11: Helpers
    md.append("## 11. Helpers & Utilities\n")
    md.append("| " + " | ".join(HELPERS_HEADERS) + " |\n")
    md.append("| " + " | ".join(["---"] * len(HELPERS_HEADERS)) + " |\n")
    for row in HELPERS_ROWS:
        md.append("| " + " | ".join(str(c).replace("\n", " ").replace("|", "\\|") for c in row) + " |\n")
    md.append("\n---\n")

    # Section 12: Updated Schema
    md.append("## 12. Updated Schema Decision Record\n")
    md.append("| " + " | ".join(UPDATED_SCHEMA_HEADERS) + " |\n")
    md.append("| " + " | ".join(["---"] * len(UPDATED_SCHEMA_HEADERS)) + " |\n")
    for row in UPDATED_SCHEMA_ROWS:
        md.append("| " + " | ".join(str(c).replace("\n", " ").replace("|", "\\|") for c in row) + " |\n")
    md.append("\n---\n")

    # Section 13: Updated Modules
    md.append("## 13. Updated NestJS Module Map\n")
    md.append("| " + " | ".join(UPDATED_MODULE_HEADERS) + " |\n")
    md.append("| " + " | ".join(["---"] * len(UPDATED_MODULE_HEADERS)) + " |\n")
    for row in UPDATED_MODULE_ROWS:
        md.append("| " + " | ".join(str(c).replace("\n", " ").replace("|", "\\|") for c in row) + " |\n")
    md.append("\n---\n")

    # Section 14: Questions Answered
    md.append("## 14. 20 Open Questions — Answered\n")
    for question, answer in QUESTIONS_ANSWERED:
        md.append(f"### {question}\n{answer}\n")
    md.append("\n---\n")

    # Section 15: New Risks
    md.append("## 15. Updated Risk Register (New Risks)\n")
    md.append("| " + " | ".join(NEW_RISKS_HEADERS) + " |\n")
    md.append("| " + " | ".join(["---"] * len(NEW_RISKS_HEADERS)) + " |\n")
    for row in NEW_RISKS_ROWS:
        md.append("| " + " | ".join(str(c).replace("\n", " ").replace("|", "\\|") for c in row) + " |\n")
    md.append("\n---\n")

    # Section 16: MDRs
    md.append("## 16. Migration Decision Records (20 MDRs)\n")
    md.append("| " + " | ".join(MDR_HEADERS) + " |\n")
    md.append("| " + " | ".join(["---"] * len(MDR_HEADERS)) + " |\n")
    for row in MDR_ROWS:
        md.append("| " + " | ".join(str(c).replace("\n", " ").replace("|", "\\|") for c in row) + " |\n")
    md.append("\n---\n")
    md.append("*End of Phase 0 Discovery Document — Part B*\n")

    with open(output_path, "w", encoding="utf-8") as f:
        f.write("\n".join(md))


# =============================================================================
# Main Build
# =============================================================================
def build_pdf(output_path: str):
    styles = make_styles()
    doc = PartBDocTemplate(
        output_path,
        pagesize=A4,
        leftMargin=LEFT_MARGIN, rightMargin=RIGHT_MARGIN,
        topMargin=TOP_MARGIN, bottomMargin=BOTTOM_MARGIN,
        title="Phase 0 Discovery Document Part B — Ready Game Code Migration",
        author="Principal Architect",
        subject="Laravel to Next.js + NestJS Migration — Source Code Analysis",
        creator="Z.ai PDF Skill",
    )
    story = []
    story.extend(build_cover(styles))
    story.append(NextPageTemplate("Body"))
    story.append(PageBreak())
    story.extend(build_toc(styles))
    story.extend(build_corrections(styles))
    story.extend(build_controller_inventory(styles))
    story.extend(build_validation_rules(styles))
    story.extend(build_middleware(styles))
    story.extend(build_auth_flow(styles))
    story.extend(build_cart_checkout(styles))
    story.extend(build_payment_gateways(styles))
    story.extend(build_reviewer_workflow(styles))
    story.extend(build_admin_panel(styles))
    story.extend(build_notifications(styles))
    story.extend(build_cron(styles))
    story.extend(build_helpers(styles))
    story.extend(build_updated_schema(styles))
    story.extend(build_updated_modules(styles))
    story.extend(build_questions_answered(styles))
    story.extend(build_new_risks(styles))
    story.extend(build_mdrs(styles))
    doc.build(story)


if __name__ == "__main__":
    pdf_output = "/home/z/my-project/download/Phase0_PartB_SourceCode_Analysis.pdf"
    md_output = "/home/z/my-project/download/Phase0_PartB_SourceCode_Analysis.md"
    print(f"Building PDF -> {pdf_output}")
    build_pdf(pdf_output)
    print(f"Building Markdown -> {md_output}")
    build_markdown(md_output)
    print("\nDone.")
    print(f"PDF size: {os.path.getsize(pdf_output):,} bytes")
    print(f"MD size:  {os.path.getsize(md_output):,} bytes")
