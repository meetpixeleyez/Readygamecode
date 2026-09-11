"""
Phase 0 Discovery Document — PDF Builder
Ready Game Code Migration: Laravel -> Next.js + NestJS

Uses ReportLab to produce a production-grade PDF. Also emits a Markdown
source file so the user can edit content without touching layout.
"""

import os
import sys
import re
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm, cm
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle,
    KeepTogether, NextPageTemplate, PageTemplate, Frame, BaseDocTemplate,
    Preformatted, HRFlowable,
)
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# Import content
sys.path.insert(0, "/home/z/my-project/scripts")
from phase0_content import (
    EXEC_SUMMARY, STRATEGIC_DECISIONS_HEADERS, STRATEGIC_DECISIONS_ROWS,
    DB_DOMAIN_HEADERS, DB_DOMAIN_ROWS,
    SCHEMA_MIGRATION_HEADERS, SCHEMA_MIGRATION_ROWS,
    DB_CRITICAL_FINDINGS,
    URL_MAP_HEADERS, URL_MAP_ROWS,
    PAGE_FEATURES_HEADERS, PAGE_FEATURES_ROWS,
    CROSS_CUTTING_HEADERS, CROSS_CUTTING_ROWS,
    MODULE_BREAKDOWN_HEADERS, MODULE_BREAKDOWN_ROWS,
    AWS_TOPOLOGY_HEADERS, AWS_TOPOLOGY_ROWS,
    AWS_COST_HEADERS, AWS_COST_ROWS,
    ROADMAP_HEADERS, ROADMAP_ROWS,
    ROADMAP_RISKS_HEADERS, ROADMAP_RISKS_ROWS,
    AUTH_PLAN_TEXT,
    DATA_MIGRATION_TEXT,
    URL_REDIRECT_HEADERS, URL_REDIRECT_ROWS,
    SEO_CHECKLIST,
    SECURITY_HEADERS, SECURITY_ROWS,
    SECURITY_EXTRA,
    RISK_REGISTER_HEADERS, RISK_REGISTER_ROWS,
    OPEN_QUESTIONS,
    NEXT_STEPS_TEXT,
    APPENDIX_A_HEADERS, APPENDIX_A_ROWS,
    APPENDIX_B_HEADERS, APPENDIX_B_ROWS,
    GLOSSARY,
)

# -----------------------------------------------------------------------------
# Font Registration — Inter family for body + heading, fallback to Helvetica
# -----------------------------------------------------------------------------
FONT_BODY = "Helvetica"
FONT_BODY_BOLD = "Helvetica-Bold"
FONT_HEADING = "Helvetica-Bold"
FONT_MONO = "Courier"

# Try to register Inter if available on the system (Linux fonts paths)
try:
    font_paths = {
        "Inter": "/usr/share/fonts/truetype/inter/Inter-Regular.ttf",
        "Inter-Bold": "/usr/share/fonts/truetype/inter/Inter-Bold.ttf",
        "Inter-SemiBold": "/usr/share/fonts/truetype/inter/Inter-SemiBold.ttf",
    }
    registered = False
    for name, path in font_paths.items():
        if os.path.exists(path):
            pdfmetrics.registerFont(TTFont(name, path))
            registered = True
    if registered:
        FONT_BODY = "Inter"
        FONT_BODY_BOLD = "Inter-Bold"
        FONT_HEADING = "Inter-SemiBold"
except Exception:
    pass  # fall back to Helvetica

# -----------------------------------------------------------------------------
# Color Palette — Ready Game Code brand + enterprise neutrals
# -----------------------------------------------------------------------------
# Brand: Ready Game Code uses #FF7C31 orange (from general_settings.base_color)
BRAND_ORANGE = colors.HexColor("#FF7C31")
BRAND_ORANGE_LIGHT = colors.HexColor("#FFE8D9")
BRAND_ORANGE_DARK = colors.HexColor("#E56A1F")

# Enterprise neutrals
INK_900 = colors.HexColor("#0F172A")  # primary text
INK_700 = colors.HexColor("#334155")  # secondary text
INK_500 = colors.HexColor("#64748B")  # muted text
INK_300 = colors.HexColor("#CBD5E1")  # borders
INK_100 = colors.HexColor("#F1F5F9")  # subtle backgrounds
INK_50 = colors.HexColor("#F8FAFC")   # page bg

# Semantic
SEM_SUCCESS = colors.HexColor("#16A34A")
SEM_WARNING = colors.HexColor("#D97706")
SEM_ERROR = colors.HexColor("#DC2626")
SEM_INFO = colors.HexColor("#2563EB")

# Table colors
TABLE_HEADER_BG = INK_900
TABLE_HEADER_TEXT = colors.white
TABLE_ROW_ALT = colors.HexColor("#FAFAF9")
TABLE_BORDER = colors.HexColor("#E2E8F0")

# -----------------------------------------------------------------------------
# Page Layout
# -----------------------------------------------------------------------------
PAGE_WIDTH, PAGE_HEIGHT = A4  # 595 x 842 points
LEFT_MARGIN = 22 * mm
RIGHT_MARGIN = 22 * mm
TOP_MARGIN = 25 * mm
BOTTOM_MARGIN = 22 * mm
CONTENT_WIDTH = PAGE_WIDTH - LEFT_MARGIN - RIGHT_MARGIN

# -----------------------------------------------------------------------------
# Styles
# -----------------------------------------------------------------------------
def make_styles():
    ss = getSampleStyleSheet()
    styles = {}

    # Cover
    styles["CoverTitle"] = ParagraphStyle(
        "CoverTitle", parent=ss["Title"],
        fontName=FONT_HEADING, fontSize=36, leading=42,
        textColor=INK_900, alignment=TA_LEFT, spaceAfter=8,
    )
    styles["CoverSubtitle"] = ParagraphStyle(
        "CoverSubtitle", parent=ss["Normal"],
        fontName=FONT_BODY, fontSize=18, leading=24,
        textColor=BRAND_ORANGE_DARK, alignment=TA_LEFT, spaceAfter=24,
    )
    styles["CoverTagline"] = ParagraphStyle(
        "CoverTagline", parent=ss["Normal"],
        fontName=FONT_BODY, fontSize=12, leading=18,
        textColor=INK_700, alignment=TA_LEFT, spaceAfter=24,
    )
    styles["CoverMeta"] = ParagraphStyle(
        "CoverMeta", parent=ss["Normal"],
        fontName=FONT_BODY, fontSize=10, leading=14,
        textColor=INK_500, alignment=TA_LEFT,
    )

    # H1 (section title)
    styles["H1"] = ParagraphStyle(
        "H1", parent=ss["Heading1"],
        fontName=FONT_HEADING, fontSize=22, leading=28,
        textColor=INK_900, alignment=TA_LEFT,
        spaceBefore=18, spaceAfter=14,
        keepWithNext=True,
    )
    # H2 (subsection)
    styles["H2"] = ParagraphStyle(
        "H2", parent=ss["Heading2"],
        fontName=FONT_HEADING, fontSize=15, leading=20,
        textColor=BRAND_ORANGE_DARK, alignment=TA_LEFT,
        spaceBefore=14, spaceAfter=8,
        keepWithNext=True,
    )
    # H3 (sub-subsection)
    styles["H3"] = ParagraphStyle(
        "H3", parent=ss["Heading3"],
        fontName=FONT_HEADING, fontSize=12, leading=16,
        textColor=INK_900, alignment=TA_LEFT,
        spaceBefore=10, spaceAfter=6,
        keepWithNext=True,
    )

    # Body
    styles["Body"] = ParagraphStyle(
        "Body", parent=ss["BodyText"],
        fontName=FONT_BODY, fontSize=10, leading=15,
        textColor=INK_700, alignment=TA_JUSTIFY,
        spaceAfter=8,
    )
    styles["BodyBold"] = ParagraphStyle(
        "BodyBold", parent=styles["Body"],
        fontName=FONT_BODY_BOLD, textColor=INK_900,
    )
    # Bulleted
    styles["Bullet"] = ParagraphStyle(
        "Bullet", parent=styles["Body"],
        leftIndent=18, bulletIndent=4, spaceAfter=4,
        alignment=TA_LEFT,
    )

    # Table cell
    styles["Cell"] = ParagraphStyle(
        "Cell", parent=ss["Normal"],
        fontName=FONT_BODY, fontSize=8.5, leading=11,
        textColor=INK_700, alignment=TA_LEFT,
    )
    styles["CellHeader"] = ParagraphStyle(
        "CellHeader", parent=styles["Cell"],
        fontName=FONT_BODY_BOLD, textColor=colors.white, fontSize=9,
    )
    styles["CellSmall"] = ParagraphStyle(
        "CellSmall", parent=styles["Cell"],
        fontSize=7.5, leading=10,
    )
    styles["CellSmallHeader"] = ParagraphStyle(
        "CellSmallHeader", parent=styles["CellHeader"],
        fontSize=8,
    )

    # Code
    styles["Code"] = ParagraphStyle(
        "Code", parent=ss["Code"],
        fontName=FONT_MONO, fontSize=8, leading=11,
        textColor=INK_900, backColor=INK_100,
        leftIndent=8, rightIndent=8, spaceBefore=4, spaceAfter=8,
    )

    # Callout
    styles["Callout"] = ParagraphStyle(
        "Callout", parent=styles["Body"],
        fontSize=10, leading=14,
        textColor=INK_900, backColor=BRAND_ORANGE_LIGHT,
        leftIndent=10, rightIndent=10, spaceBefore=8, spaceAfter=8,
        borderColor=BRAND_ORANGE, borderWidth=0, borderPadding=10,
    )

    # TOC entry
    styles["TOCEntry1"] = ParagraphStyle(
        "TOCEntry1", parent=ss["Normal"],
        fontName=FONT_BODY_BOLD, fontSize=11, leading=16,
        textColor=INK_900, leftIndent=0, spaceBefore=4,
    )
    styles["TOCEntry2"] = ParagraphStyle(
        "TOCEntry2", parent=ss["Normal"],
        fontName=FONT_BODY, fontSize=10, leading=14,
        textColor=INK_700, leftIndent=18, spaceBefore=2,
    )

    # Section number tag
    styles["SectionTag"] = ParagraphStyle(
        "SectionTag", parent=ss["Normal"],
        fontName=FONT_BODY_BOLD, fontSize=9, leading=12,
        textColor=BRAND_ORANGE_DARK, alignment=TA_LEFT,
        spaceAfter=2,
    )

    return styles


# -----------------------------------------------------------------------------
# Helpers
# -----------------------------------------------------------------------------
def _escape_for_paragraph(text: str) -> str:
    """Escape XML special chars for ReportLab Paragraph."""
    text = text.replace("&", "&amp;")
    text = text.replace("<", "&lt;")
    text = text.replace(">", "&gt;")
    return text


def _wrap_text(text: str, width_chars: int = 90) -> str:
    """Wrap long text without breaking words (for narrow table cells)."""
    if len(text) <= width_chars:
        return text
    words = text.split()
    lines = []
    current = ""
    for word in words:
        if len(current) + len(word) + 1 <= width_chars:
            current = (current + " " + word).strip()
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return "\n".join(lines)


def make_table(headers, rows, styles, col_widths=None, small=False,
               header_bg=None, alt_row=True):
    """Build a styled Table flowable from headers + rows."""
    cell_style = styles["CellSmall"] if small else styles["Cell"]
    header_style = styles["CellSmallHeader"] if small else styles["CellHeader"]

    if header_bg is None:
        header_bg = TABLE_HEADER_BG

    # Build header row
    header_row = [Paragraph(str(h), header_style) for h in headers]
    data = [header_row]

    # Build data rows
    for row in rows:
        wrapped_row = []
        for cell in row:
            cell_str = str(cell) if cell is not None else ""
            # Wrap long text in cells using <br/> for line breaks
            wrapped = _wrap_text(cell_str, width_chars=55 if small else 70)
            wrapped = _escape_for_paragraph(wrapped).replace("\n", "<br/>")
            wrapped_row.append(Paragraph(wrapped, cell_style))
        data.append(wrapped_row)

    if col_widths is None:
        # Equal distribution
        n = len(headers)
        col_widths = [CONTENT_WIDTH / n] * n
    else:
        # Normalize col_widths to sum to CONTENT_WIDTH
        total = sum(col_widths)
        col_widths = [w * CONTENT_WIDTH / total for w in col_widths]

    tbl = Table(data, colWidths=col_widths, repeatRows=1)

    style_cmds = [
        # Header
        ("BACKGROUND", (0, 0), (-1, 0), header_bg),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), FONT_BODY_BOLD),
        ("FONTSIZE", (0, 0), (-1, 0), 9 if not small else 8),
        ("ALIGN", (0, 0), (-1, 0), "LEFT"),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, 0), 8),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 8),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 1), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 1), (-1, -1), 6),
        # Borders
        ("LINEBELOW", (0, 0), (-1, 0), 0.5, INK_900),
        ("LINEBELOW", (0, -1), (-1, -1), 0.5, INK_300),
        ("LINEBEFORE", (0, 0), (0, -1), 0, INK_300),
        ("LINEAFTER", (-1, 0), (-1, -1), 0, INK_300),
    ]
    if alt_row:
        for i in range(1, len(data)):
            if i % 2 == 0:
                style_cmds.append(("BACKGROUND", (0, i), (-1, i), TABLE_ROW_ALT))
        # Add light gridlines between rows
        for i in range(1, len(data) - 1):
            style_cmds.append(("LINEBELOW", (0, i), (-1, i), 0.25, INK_300))

    tbl.setStyle(TableStyle(style_cmds))
    return tbl


def make_callout(text: str, styles, color=BRAND_ORANGE):
    """Make a colored callout box."""
    style = ParagraphStyle(
        "CalloutInline", parent=styles["Body"],
        textColor=INK_900, backColor=BRAND_ORANGE_LIGHT,
        leftIndent=12, rightIndent=12, spaceBefore=8, spaceAfter=8,
        borderColor=color, borderWidth=0, borderPadding=10,
    )
    return Paragraph(_escape_for_paragraph(text), style)


def make_section_header(number: str, title: str, styles):
    """Make a section header with section tag + H1."""
    elements = []
    if number:
        elements.append(Paragraph(f"SECTION {number}", styles["SectionTag"]))
    elements.append(Paragraph(_escape_for_paragraph(title), styles["H1"]))
    elements.append(HRFlowable(width="100%", thickness=2, color=BRAND_ORANGE,
                                spaceBefore=4, spaceAfter=10))
    return elements


# -----------------------------------------------------------------------------
# Page Templates
# -----------------------------------------------------------------------------
class PhaseZeroDocTemplate(BaseDocTemplate):
    """Custom doc template with cover + body templates."""

    def __init__(self, filename, **kwargs):
        super().__init__(filename, **kwargs)
        self._toc_entries = []

        # Cover frame — full bleed, no margins
        cover_frame = Frame(
            0, 0, PAGE_WIDTH, PAGE_HEIGHT,
            leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0,
            id="cover",
        )
        cover_template = PageTemplate(
            id="Cover", frames=[cover_frame], onPage=self._draw_cover_bg
        )

        # Body frame
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
        """Draw the cover page background and decorative elements."""
        canvas.saveState()
        # Background: clean white
        canvas.setFillColor(colors.white)
        canvas.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, fill=1, stroke=0)

        # Top brand bar (orange)
        canvas.setFillColor(BRAND_ORANGE)
        canvas.rect(0, PAGE_HEIGHT - 12, PAGE_WIDTH, 12, fill=1, stroke=0)

        # Left vertical accent bar
        canvas.setFillColor(BRAND_ORANGE)
        canvas.rect(LEFT_MARGIN - 8, 200, 4, PAGE_HEIGHT - 280, fill=1, stroke=0)

        # Footer: confidentiality notice
        canvas.setFillColor(INK_500)
        canvas.setFont(FONT_BODY, 8)
        canvas.drawString(LEFT_MARGIN, 30, "CONFIDENTIAL — Prepared for Ready Game Code Team")
        canvas.drawRightString(PAGE_WIDTH - RIGHT_MARGIN, 30, "July 2026")

        canvas.restoreState()

    def _draw_body_chrome(self, canvas, doc):
        """Draw header + footer on every body page."""
        canvas.saveState()

        # Header — title left, page number right
        canvas.setFillColor(INK_500)
        canvas.setFont(FONT_BODY, 8)
        canvas.drawString(LEFT_MARGIN, PAGE_HEIGHT - 15,
                          "Phase 0 Discovery Document  |  Ready Game Code Migration")
        canvas.drawRightString(PAGE_WIDTH - RIGHT_MARGIN, PAGE_HEIGHT - 15,
                                f"Page {doc.page - 1}")  # -1 because cover is page 1

        # Header rule
        canvas.setStrokeColor(INK_300)
        canvas.setLineWidth(0.5)
        canvas.line(LEFT_MARGIN, PAGE_HEIGHT - 18, PAGE_WIDTH - RIGHT_MARGIN, PAGE_HEIGHT - 18)

        # Footer — section + confidential
        canvas.setFillColor(INK_500)
        canvas.setFont(FONT_BODY, 8)
        canvas.drawString(LEFT_MARGIN, 15, "CONFIDENTIAL")
        canvas.drawRightString(PAGE_WIDTH - RIGHT_MARGIN, 15,
                                "Ready Game Code  |  Laravel to Next.js + NestJS Migration")

        # Footer rule
        canvas.line(LEFT_MARGIN, 25, PAGE_WIDTH - RIGHT_MARGIN, 25)

        canvas.restoreState()


# -----------------------------------------------------------------------------
# Content Builders — one function per major section
# -----------------------------------------------------------------------------
def build_cover(styles):
    """Build cover page content."""
    elements = []
    # Push content down
    elements.append(Spacer(1, 180))

    # Eyebrow tag
    eyebrow_style = ParagraphStyle(
        "Eyebrow", parent=styles["CoverMeta"],
        fontSize=10, textColor=BRAND_ORANGE_DARK,
        fontName=FONT_BODY_BOLD,
    )
    elements.append(Spacer(1, 0))
    elements.append(Paragraph("PRINCIPAL ARCHITECT  |  ENTERPRISE MIGRATION PLAN", eyebrow_style))
    elements.append(Spacer(1, 12))

    # Title
    elements.append(Paragraph("Phase 0 Discovery Document", styles["CoverTitle"]))
    elements.append(Spacer(1, 6))

    # Subtitle
    elements.append(Paragraph(
        "Ready Game Code Migration: Laravel to Next.js + NestJS",
        styles["CoverSubtitle"]
    ))

    # Tagline
    elements.append(Paragraph(
        "A production-grade migration blueprint preserving 100% feature parity "
        "with the existing Unity source-code marketplace, designed for 10,000+ "
        "concurrent users on AWS.",
        styles["CoverTagline"]
    ))

    # Metadata block
    elements.append(Spacer(1, 100))
    meta_lines = [
        "<b>Document Version:</b>  Part A (v1.0)",
        "<b>Prepared By:</b>  Principal Software Architect",
        "<b>Prepared For:</b>  Ready Game Code Engineering Team",
        "<b>Date:</b>  July 2026",
        "<b>Source:</b>  Production SQL dump + live site audit",
        "<b>Status:</b>  Awaiting sign-off",
    ]
    for line in meta_lines:
        elements.append(Paragraph(line, styles["CoverMeta"]))
        elements.append(Spacer(1, 2))

    elements.append(PageBreak())
    return elements


def build_toc(styles):
    """Build table of contents page."""
    elements = []
    elements.append(Paragraph("Table of Contents", styles["H1"]))
    elements.append(HRFlowable(width="100%", thickness=2, color=BRAND_ORANGE,
                                spaceBefore=4, spaceAfter=14))

    toc_items = [
        ("Executive Summary", 1),
        ("1. Strategic Decisions Locked", 1),
        ("2. Database Analysis & Schema Decision Record", 1),
        ("3. Public Surface Feature Audit", 1),
        ("4. Architecture Recommendations", 1),
        ("5. AWS Deployment Topology", 1),
        ("6. Strangler-Fig Migration Roadmap", 1),
        ("7. Auth Migration Plan", 1),
        ("8. Data Migration Script Plan", 1),
        ("9. URL/SEO Preservation Plan", 1),
        ("10. Security Checklist", 1),
        ("11. Risk Register & Open Questions", 1),
        ("12. Next Steps & Sign-off", 1),
        ("Appendix A: Complete 67-Table Inventory", 1),
        ("Appendix B: Active Payment Gateway Configuration", 1),
        ("Appendix C: Glossary", 1),
    ]

    for title, level in toc_items:
        style = styles["TOCEntry1"] if level == 1 else styles["TOCEntry2"]
        elements.append(Paragraph(title, style))

    elements.append(Spacer(1, 24))
    elements.append(make_callout(
        "This document is Part A of Phase 0 Discovery. Part B (controller logic, admin flows, "
        "validation rules, email templates) will follow upon receipt of the Laravel source code.",
        styles
    ))

    elements.append(PageBreak())
    return elements


def build_executive_summary(styles):
    elements = []
    elements.extend(make_section_header("", "Executive Summary", styles))

    for heading, body in EXEC_SUMMARY:
        elements.append(Paragraph(_escape_for_paragraph(heading), styles["H3"]))
        elements.append(Paragraph(_escape_for_paragraph(body), styles["Body"]))

    elements.append(Spacer(1, 8))
    elements.append(make_callout(
        "Top finding: The deposits table contains an is_web field that indicates the existing Laravel "
        "backend is already API-enabled for a Next.js frontend. Existing API contracts can be reused, "
        "significantly de-risking the migration. The user should share any existing Next.js code and "
        "the Laravel routes/api.php file.",
        styles
    ))
    elements.append(PageBreak())
    return elements


def build_strategic_decisions(styles):
    elements = []
    elements.extend(make_section_header("1", "Strategic Decisions Locked", styles))

    elements.append(Paragraph(
        "All ten strategic questions raised in the migration prompt have been answered and locked. "
        "These decisions form the foundation of every subsequent section in this document and the "
        "implementation roadmap. Any change to these decisions after sign-off requires a formal "
        "Migration Decision Record (MDR) approval.",
        styles["Body"]
    ))

    elements.append(Paragraph("Locked Decisions Matrix", styles["H2"]))
    elements.append(make_table(
        STRATEGIC_DECISIONS_HEADERS, STRATEGIC_DECISIONS_ROWS, styles,
        col_widths=[0.05, 0.18, 0.27, 0.50],
    ))

    elements.append(PageBreak())
    return elements


def build_database_analysis(styles):
    elements = []
    elements.extend(make_section_header("2", "Database Analysis & Schema Decision Record", styles))

    elements.append(Paragraph(
        "The existing MySQL database contains 67 tables organized across nine functional domains. "
        "This section provides: (a) a domain-grouped table inventory, (b) a Schema Migration "
        "Decision Record for the highest-priority tables, and (c) ten critical findings that "
        "materially affect the migration strategy.",
        styles["Body"]
    ))

    # 2.1 Domain grouping
    elements.append(Paragraph("2.1  Table Inventory by Domain", styles["H2"]))
    elements.append(make_table(
        DB_DOMAIN_HEADERS, DB_DOMAIN_ROWS, styles,
        col_widths=[0.16, 0.40, 0.07, 0.37],
    ))

    # 2.2 Schema Migration Decision Record
    elements.append(Paragraph("2.2  Schema Migration Decision Record (Priority Tables)", styles["H2"]))
    elements.append(Paragraph(
        "Decision values: <b>KEEP</b> = preserve table as-is in new schema. <b>KEEP + ADD COLUMN</b> = "
        "preserve and add new fields. <b>REFACTOR</b> = restructure (e.g., split into multiple tables, "
        "introduce parent entity). <b>RENAME</b> = same structure, new name for clarity. "
        "<b>EVALUATE</b> = pending source code review. <b>DEPRECATE</b> = drop in new schema.",
        styles["Body"]
    ))
    elements.append(make_table(
        SCHEMA_MIGRATION_HEADERS, SCHEMA_MIGRATION_ROWS, styles,
        col_widths=[0.14, 0.16, 0.14, 0.56], small=True,
    ))

    # 2.3 Critical findings
    elements.append(Paragraph("2.3  Critical Database Findings", styles["H2"]))
    elements.append(Paragraph(
        "Ten findings materially affect migration strategy, security posture, or feature scope. "
        "Each finding includes the impact and recommended action.",
        styles["Body"]
    ))

    for i, (title, body) in enumerate(DB_CRITICAL_FINDINGS, start=1):
        elements.append(Paragraph(_escape_for_paragraph(title), styles["H3"]))
        elements.append(Paragraph(_escape_for_paragraph(body), styles["Body"]))

    elements.append(PageBreak())
    return elements


def build_feature_audit(styles):
    elements = []
    elements.extend(make_section_header("3", "Public Surface Feature Audit", styles))

    elements.append(Paragraph(
        "Every public-facing URL was audited via a headless browser session against the live production "
        "site (https://readygamecode.com). This section catalogs: (a) the complete URL map with auth "
        "requirements, (b) page-by-page feature breakdown, and (c) cross-cutting features present on "
        "every page. Admin-internal pages were not directly auditable without source code access and "
        "are listed as TBD.",
        styles["Body"]
    ))

    elements.append(Paragraph("3.1  URL Map", styles["H2"]))
    elements.append(make_table(
        URL_MAP_HEADERS, URL_MAP_ROWS, styles,
        col_widths=[0.30, 0.20, 0.15, 0.35], small=True,
    ))

    elements.append(Paragraph("3.2  Page-by-Page Feature Breakdown", styles["H2"]))
    elements.append(make_table(
        PAGE_FEATURES_HEADERS, PAGE_FEATURES_ROWS, styles,
        col_widths=[0.16, 0.30, 0.54], small=True,
    ))

    elements.append(Paragraph("3.3  Cross-Cutting Features", styles["H2"]))
    elements.append(make_table(
        CROSS_CUTTING_HEADERS, CROSS_CUTTING_ROWS, styles,
        col_widths=[0.20, 0.20, 0.60], small=True,
    ))

    elements.append(PageBreak())
    return elements


def build_architecture(styles):
    elements = []
    elements.extend(make_section_header("4", "Architecture Recommendations", styles))

    elements.append(Paragraph(
        "The target architecture is a modular monolith NestJS backend with a Next.js App Router frontend, "
        "deployed on AWS, sized for 10,000+ concurrent users. The system uses Prisma as ORM, JWT in "
        "httpOnly cookies for auth, Meilisearch for search, and Redis for caching. The 18 NestJS modules "
        "below correspond directly to the database domains identified in Section 2.",
        styles["Body"]
    ))

    elements.append(Paragraph("4.1  NestJS Module Breakdown", styles["H2"]))
    elements.append(Paragraph(
        "Each module is a bounded context containing controllers, services, repositories (Prisma), "
        "DTOs, entities, guards, and module-scoped providers. Shared infrastructure (Prisma, Redis, "
        "Queue, Logger) is centralized in a SharedModule imported by all feature modules.",
        styles["Body"]
    ))
    elements.append(make_table(
        MODULE_BREAKDOWN_HEADERS, MODULE_BREAKDOWN_ROWS, styles,
        col_widths=[0.10, 0.20, 0.22, 0.18, 0.30], small=True,
    ))

    elements.append(Paragraph("4.2  Frontend Structure (Next.js App Router)", styles["H2"]))
    elements.append(Paragraph(
        "Next.js uses feature-based folder structure under /app. Server Components by default, "
        "Client Components only where interactivity is required ('use client'). React Query (TanStack "
        "Query) for server state, Axios for API calls, Zod for runtime validation. OpenAPI client "
        "auto-generated from NestJS Swagger spec for end-to-end type safety.",
        styles["Body"]
    ))

    frontend_structure = """app/
  (public)/              # public route group
    page.tsx              # homepage
    products/
      page.tsx            # product listing
      [slug]/page.tsx     # product detail
    blog/
      page.tsx
      [slug]/page.tsx
    about/page.tsx
    contact/page.tsx
    privacy-policy/page.tsx
    terms-conditions/page.tsx
    refund-policy/page.tsx
  (auth)/                # auth route group
    login/page.tsx
    register/page.tsx
    forgot-password/page.tsx
  (user)/                # authenticated user
    dashboard/page.tsx
    dashboard/purchases/page.tsx
    dashboard/downloads/page.tsx
    dashboard/refunds/page.tsx
    dashboard/settings/page.tsx
  (seller)/              # seller role
    seller/page.tsx
    seller/products/page.tsx
    seller/products/new/page.tsx
    seller/earnings/page.tsx
    seller/withdrawals/page.tsx
  (admin)/               # admin role
    admin/login/page.tsx
    admin/dashboard/page.tsx
    admin/products/page.tsx
    admin/users/page.tsx
    admin/orders/page.tsx
    admin/refunds/page.tsx
    admin/settings/page.tsx
  cart/page.tsx
  checkout/page.tsx
  checkout/thank-you/page.tsx
  hire-us/page.tsx
  authors/[username]/page.tsx
components/
  ui/                    # buttons, inputs, cards (shadcn/ui)
  product/               # product-specific components
  cart/                  # cart components
  admin/                 # admin components
  layout/                # header, footer, navigation
lib/
  api/                   # generated API client
  hooks/                 # React Query hooks
  utils/                 # utilities
  validations/           # Zod schemas"""
    elements.append(Preformatted(_escape_for_paragraph(frontend_structure), styles["Code"]))

    elements.append(Paragraph("4.3  API Design Principles", styles["H2"]))
    api_principles = [
        "RESTful endpoints under <b>/api/v1/*</b> — versioned from day 1 for future evolution.",
        "OpenAPI 3.1 spec auto-generated from NestJS Swagger decorators, consumed by Next.js for type-safe client code.",
        "Idempotency keys required on all POST /payments, POST /orders, POST /refunds — prevents double-charge on retry.",
        "Pagination: cursor-based (not offset) for performance on large tables. Default page size 20, max 100.",
        "Filtering: RFC 3986-style query params (<code>?filter[status]=paid&amp;sort=-created_at</code>).",
        "Error format: RFC 7807 Problem Details — <code>{ type, title, status, detail, instance }</code>.",
        "Rate limiting: 100 req/min/user, 1000 req/min/IP. 429 response with Retry-After header.",
        "Response envelope: <code>{ data, meta: { pagination, request_id } }</code>. Errors use Problem Details.",
        "All write endpoints accept JSON only. Multipart for file uploads. No XML anywhere.",
        "Webhook endpoints (Razorpay, PayPal) accept raw body, verify HMAC signature, return 200 immediately and process async.",
    ]
    for principle in api_principles:
        elements.append(Paragraph("• " + principle, styles["Bullet"]))

    elements.append(Paragraph("4.4  Auth Flow (Password Rehash Strategy)", styles["H2"]))
    elements.append(Paragraph(
        "On the first NestJS login attempt, the system receives the plaintext password, verifies it "
        "against the stored Laravel bcrypt $2y$ hash, and on success immediately re-hashes with $2b$ "
        "at cost 12 and updates the user record. The user is then issued JWT access (15min) + refresh "
        "(7d) tokens in httpOnly cookies. Subsequent logins use the modern $2b$ hash directly. No "
        "session invalidation is required — users experience zero disruption.",
        styles["Body"]
    ))

    elements.append(Paragraph("4.5  Shared Module Split", styles["H2"]))
    elements.append(Paragraph(
        "The SharedModule is split into three sub-modules to maintain separation of concerns: "
        "(1) KernelModule — domain primitives, types, enums, constants. (2) InfrastructureModule — "
        "Prisma, Redis, S3, SQS, SES clients. (3) CommonModule — DTOs, decorators, interceptors, "
        "filters, guards. Each feature module imports only what it needs.",
        styles["Body"]
    ))

    elements.append(PageBreak())
    return elements


def build_aws_topology(styles):
    elements = []
    elements.extend(make_section_header("5", "AWS Deployment Topology", styles))

    elements.append(Paragraph(
        "The AWS architecture is designed for 10,000+ concurrent users with Multi-AZ high availability, "
        "horizontal auto-scaling, and cost optimization. The total monthly cost is estimated at "
        "approximately USD 2,898, dominated by RDS MySQL (Multi-AZ + read replica). All resources are "
        "provisioned via Terraform (Infrastructure as Code) and deployed via GitHub Actions CI/CD.",
        styles["Body"]
    ))

    elements.append(Paragraph("5.1  Topology Components", styles["H2"]))
    elements.append(make_table(
        AWS_TOPOLOGY_HEADERS, AWS_TOPOLOGY_ROWS, styles,
        col_widths=[0.15, 0.22, 0.36, 0.27], small=True,
    ))

    elements.append(Paragraph("5.2  Monthly Cost Estimate", styles["H2"]))
    elements.append(Paragraph(
        "Costs are estimated for steady-state production traffic. Burst traffic (e.g., product launch, "
        "marketing campaign) may add 20-40% to compute and egress costs. Reserved Instances (1-year, "
        "no upfront) for RDS and ElastiCache can reduce those line items by 25-35%.",
        styles["Body"]
    ))
    elements.append(make_table(
        AWS_COST_HEADERS, AWS_COST_ROWS, styles,
        col_widths=[0.32, 0.48, 0.20], small=True,
    ))

    elements.append(Paragraph("5.3  High Availability & DR", styles["H2"]))
    elements.append(Paragraph(
        "Multi-AZ deployment for RDS (synchronous standby) and ElastiCache (replica). ECS Fargate "
        "tasks distributed across 3 AZs. ALB routes traffic with health checks. Meilisearch on a "
        "single EC2 instance (warm standby in second AZ for manual failover). S3 is inherently "
        "11-nines durable. RPO: 5 minutes (RDS point-in-time recovery). RTO: 30 minutes. Full DR "
        "runbook documented in a separate Disaster Recovery Plan.",
        styles["Body"]
    ))

    elements.append(PageBreak())
    return elements


def build_roadmap(styles):
    elements = []
    elements.extend(make_section_header("6", "Strangler-Fig Migration Roadmap", styles))

    elements.append(Paragraph(
        "Migration follows the strangler-fig pattern: the new Next.js + NestJS system grows around the "
        "existing Laravel application, replacing it page-by-page over 30 weeks. Both systems run in "
        "parallel during the transition, with Route 53 weighted routing controlling traffic split. "
        "Each phase has clear scope, deliverables, acceptance criteria, and per-phase rollback. "
        "The Laravel application remains warm for 7 days post-cutover as a fallback.",
        styles["Body"]
    ))

    elements.append(Paragraph("6.1  Six-Phase Roadmap", styles["H2"]))
    elements.append(make_table(
        ROADMAP_HEADERS, ROADMAP_ROWS, styles,
        col_widths=[0.14, 0.08, 0.22, 0.28, 0.28], small=True,
    ))

    elements.append(Paragraph("6.2  Per-Phase Top Risk & Mitigation", styles["H2"]))
    elements.append(make_table(
        ROADMAP_RISKS_HEADERS, ROADMAP_RISKS_ROWS, styles,
        col_widths=[0.15, 0.35, 0.50], small=True,
    ))

    elements.append(Paragraph("6.3  Parallel-Run Strategy", styles["H2"]))
    elements.append(Paragraph(
        "During Phases 2-5, both Laravel and Next.js serve traffic. Route 53 weighted routing controls "
        "the split: 5% Next.js / 95% Laravel for the first 24 hours of each phase, expanding to 50/50 "
        "after 72 hours, and 100/0 after 1 week of error-free operation. Auto-rollback triggers: "
        "error rate > 1% on Next.js route, p95 latency > 500ms, or any critical user flow regression. "
        "Rollback is automatic via CloudWatch alarm -> Lambda -> Route 53 weight change.",
        styles["Body"]
    ))

    elements.append(PageBreak())
    return elements


def build_auth_plan(styles):
    elements = []
    elements.extend(make_section_header("7", "Auth Migration Plan", styles))

    for heading, body in AUTH_PLAN_TEXT:
        elements.append(Paragraph(_escape_for_paragraph(heading), styles["H3"]))
        elements.append(Paragraph(_escape_for_paragraph(body), styles["Body"]))

    elements.append(Paragraph("7.1  Auth Migration Sequence Diagram (Textual)", styles["H2"]))
    seq = """User -> Next.js login form: enters email + password
Next.js -> NestJS /api/v1/auth/login: POST { email, password }
NestJS AuthService:
  1. Find user by email in users table
  2. Read stored password hash (e.g., '$2y$12$xfd2U...')
  3. bcrypt.compare(plaintext, hash) -- Node bcrypt supports $2y$
  4. If match: re-hash with bcrypt.hash(plaintext, 12) -> '$2b$12$...'
  5. UPDATE users SET password = $2b_hash, password_algo = 'bcrypt-2b' WHERE id = ?
  6. Generate JWT access (15min) + refresh (7d)
  7. Set httpOnly + Secure + SameSite=Lax cookies
  8. Return { user: { id, email, name, role } }
Next.js -> User: dashboard rendered"""
    elements.append(Preformatted(_escape_for_paragraph(seq), styles["Code"]))

    elements.append(PageBreak())
    return elements


def build_data_migration(styles):
    elements = []
    elements.extend(make_section_header("8", "Data Migration Script Plan", styles))

    for heading, body in DATA_MIGRATION_TEXT:
        elements.append(Paragraph(_escape_for_paragraph(heading), styles["H3"]))
        elements.append(Paragraph(_escape_for_paragraph(body), styles["Body"]))

    elements.append(PageBreak())
    return elements


def build_seo_plan(styles):
    elements = []
    elements.extend(make_section_header("9", "URL/SEO Preservation Plan", styles))

    elements.append(Paragraph(
        "SEO preservation is a first-class migration concern. The current Laravel site has established "
        "search engine rankings that must be preserved through cutover. This section provides the URL "
        "mapping (old to new), the 301 redirect plan for changed URLs, and the SEO parity checklist.",
        styles["Body"]
    ))

    elements.append(Paragraph("9.1  URL Mapping & Redirects", styles["H2"]))
    elements.append(make_table(
        URL_REDIRECT_HEADERS, URL_REDIRECT_ROWS, styles,
        col_widths=[0.27, 0.27, 0.16, 0.30], small=True,
    ))

    elements.append(Paragraph("9.2  SEO Parity Checklist", styles["H2"]))
    elements.append(Paragraph(
        "Every public page in the new Next.js application must satisfy the following checklist before "
        "cutover. The checklist is enforced in CI via Lighthouse CI + Playwright SEO assertions.",
        styles["Body"]
    ))
    for item in SEO_CHECKLIST:
        elements.append(Paragraph("• " + _escape_for_paragraph(item), styles["Bullet"]))

    elements.append(PageBreak())
    return elements


def build_security(styles):
    elements = []
    elements.extend(make_section_header("10", "Security Checklist", styles))

    elements.append(Paragraph(
        "Security is designed in from day 1, mapped against the OWASP Top 10 (2021). This section "
        "covers the ten standard OWASP risks plus three project-specific security concerns: APK "
        "download URL signing, payment webhook verification, and PCI-DSS scope minimization.",
        styles["Body"]
    ))

    elements.append(Paragraph("10.1  OWASP Top 10 Controls", styles["H2"]))
    elements.append(make_table(
        SECURITY_HEADERS, SECURITY_ROWS, styles,
        col_widths=[0.22, 0.33, 0.45], small=True,
    ))

    for heading, body in SECURITY_EXTRA:
        elements.append(Paragraph(_escape_for_paragraph(heading), styles["H3"]))
        elements.append(Paragraph(_escape_for_paragraph(body), styles["Body"]))

    elements.append(PageBreak())
    return elements


def build_risks(styles):
    elements = []
    elements.extend(make_section_header("11", "Risk Register & Open Questions", styles))

    elements.append(Paragraph(
        "Twelve risks have been identified and ranked by likelihood and impact. The most critical "
        "risk (R1) is the exposure of payment gateway credentials in the SQL dump — this is a P0 "
        "security incident that must be remediated before any code is written. Twenty open questions "
        "remain blocked on receipt of the Laravel source code; these will be answered in Phase 0 Part B.",
        styles["Body"]
    ))

    elements.append(Paragraph("11.1  Risk Register", styles["H2"]))
    elements.append(make_table(
        RISK_REGISTER_HEADERS, RISK_REGISTER_ROWS, styles,
        col_widths=[0.04, 0.36, 0.10, 0.10, 0.40], small=True,
    ))

    elements.append(Paragraph("11.2  Open Questions (Blocked on Laravel Source)", styles["H2"]))
    elements.append(Paragraph(
        "The following twenty questions cannot be definitively answered from the SQL schema alone. "
        "Each will be resolved in Phase 0 Part B once the Laravel source code (controllers, FormRequest "
        "validators, Blade templates, Jobs, Console commands) is shared.",
        styles["Body"]
    ))
    for i, q in enumerate(OPEN_QUESTIONS, start=1):
        elements.append(Paragraph(f"{i}. {_escape_for_paragraph(q)}", styles["Bullet"]))

    elements.append(PageBreak())
    return elements


def build_next_steps(styles):
    elements = []
    elements.extend(make_section_header("12", "Next Steps & Sign-off", styles))

    for heading, body in NEXT_STEPS_TEXT:
        elements.append(Paragraph(_escape_for_paragraph(heading), styles["H3"]))
        elements.append(Paragraph(_escape_for_paragraph(body), styles["Body"]))

    # Sign-off block
    elements.append(Spacer(1, 24))
    elements.append(Paragraph("Sign-off", styles["H2"]))
    signoff_data = [
        ["Role", "Name", "Signature", "Date"],
        ["Principal Architect (Author)", "", "", ""],
        ["Product Owner / Business Stakeholder", "", "", ""],
        ["Engineering Lead", "", "", ""],
    ]
    signoff_table = Table(signoff_data, colWidths=[CONTENT_WIDTH * w for w in [0.35, 0.25, 0.25, 0.15]])
    signoff_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), INK_900),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), FONT_BODY_BOLD),
        ("FONTSIZE", (0, 0), (-1, 0), 9),
        ("FONTNAME", (0, 1), (-1, -1), FONT_BODY),
        ("FONTSIZE", (0, 1), (-1, -1), 9),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN", (0, 0), (-1, -1), "LEFT"),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("LINEBELOW", (0, 0), (-1, 0), 0.5, INK_900),
        ("LINEBELOW", (0, 1), (-1, -1), 0.5, INK_300),
        ("ROWHEIGHTS", (0, 1), (-1, -1), [50, 50, 50, 50]),
    ]))
    elements.append(signoff_table)

    elements.append(PageBreak())
    return elements


def build_appendix_a(styles):
    elements = []
    elements.extend(make_section_header("A", "Appendix A: Complete 67-Table Inventory", styles))

    elements.append(Paragraph(
        "All 67 tables in the existing MySQL database, grouped by domain and mapped to the target "
        "NestJS module. Decision values: KEEP / KEEP + ADD COLUMN / REFACTOR / RENAME / EVALUATE / "
        "DEPRECATE. Tables marked EVALUATE require source code review to confirm purpose.",
        styles["Body"]
    ))

    elements.append(make_table(
        APPENDIX_A_HEADERS, APPENDIX_A_ROWS, styles,
        col_widths=[0.04, 0.30, 0.20, 0.22, 0.24], small=True,
    ))
    elements.append(PageBreak())
    return elements


def build_appendix_b(styles):
    elements = []
    elements.extend(make_section_header("B", "Appendix B: Active Payment Gateway Configuration", styles))

    elements.append(Paragraph(
        "All payment gateway entries in the gateways table. Only 3 are currently active (status=1): "
        "Razorpay for INR, PayPal for USD, and Google Pay for manual UPI. The remaining 16 are "
        "disabled but schema-preserved for future activation. Sensitive credentials (key_secret, "
        "client_secret) are redacted in this document.",
        styles["Body"]
    ))

    elements.append(make_callout(
        "P0 SECURITY INCIDENT: The original SQL dump contains live production credentials for Razorpay "
        "(rzp_live_*), PayPal (live client_id + client_secret), and Google OAuth (live client_secret). "
        "All three MUST be rotated immediately before any further action. Treat the SQL dump file as "
        "compromised and delete all copies once rotation is complete.",
        styles, color=SEM_ERROR
    ))

    elements.append(make_table(
        APPENDIX_B_HEADERS, APPENDIX_B_ROWS, styles,
        col_widths=[0.05, 0.20, 0.08, 0.22, 0.10, 0.35], small=True,
    ))
    elements.append(PageBreak())
    return elements


def build_appendix_c(styles):
    elements = []
    elements.extend(make_section_header("C", "Appendix C: Glossary", styles))

    elements.append(Paragraph(
        "Key terms used throughout this document. Definitions are intentionally brief and tailored "
        "to the Ready Game Code migration context.",
        styles["Body"]
    ))

    glossary_data = [["Term", "Definition"]]
    for term, definition in GLOSSARY:
        glossary_data.append([term, definition])

    elements.append(make_table(
        glossary_data[0], glossary_data[1:], styles,
        col_widths=[0.22, 0.78], small=True,
    ))

    # No PageBreak at end — final section
    return elements


# -----------------------------------------------------------------------------
# Markdown Builder — produces a parallel .md file
# -----------------------------------------------------------------------------
def build_markdown(output_path: str):
    """Build a comprehensive Markdown version of the document."""
    md = []
    md.append("# Phase 0 Discovery Document\n")
    md.append("## Ready Game Code Migration: Laravel to Next.js + NestJS\n")
    md.append("**Document Version:** Part A (v1.0)  ")
    md.append("**Prepared By:** Principal Software Architect  ")
    md.append("**Date:** July 2026  ")
    md.append("**Source:** Production SQL dump + live site audit\n")
    md.append("---\n")

    # Executive Summary
    md.append("## Executive Summary\n")
    for heading, body in EXEC_SUMMARY:
        md.append(f"### {heading}\n")
        md.append(body + "\n")
    md.append("---\n")

    # Section 1
    md.append("## 1. Strategic Decisions Locked\n")
    md.append("| " + " | ".join(STRATEGIC_DECISIONS_HEADERS) + " |\n")
    md.append("| " + " | ".join(["---"] * len(STRATEGIC_DECISIONS_HEADERS)) + " |\n")
    for row in STRATEGIC_DECISIONS_ROWS:
        md.append("| " + " | ".join(str(c) for c in row) + " |\n")
    md.append("\n---\n")

    # Section 2
    md.append("## 2. Database Analysis & Schema Decision Record\n")
    md.append("### 2.1 Table Inventory by Domain\n")
    md.append("| " + " | ".join(DB_DOMAIN_HEADERS) + " |\n")
    md.append("| " + " | ".join(["---"] * len(DB_DOMAIN_HEADERS)) + " |\n")
    for row in DB_DOMAIN_ROWS:
        md.append("| " + " | ".join(str(c).replace("\n", " ") for c in row) + " |\n")
    md.append("\n### 2.2 Schema Migration Decision Record\n")
    md.append("| " + " | ".join(SCHEMA_MIGRATION_HEADERS) + " |\n")
    md.append("| " + " | ".join(["---"] * len(SCHEMA_MIGRATION_HEADERS)) + " |\n")
    for row in SCHEMA_MIGRATION_ROWS:
        md.append("| " + " | ".join(str(c).replace("\n", " ") for c in row) + " |\n")
    md.append("\n### 2.3 Critical Database Findings\n")
    for title, body in DB_CRITICAL_FINDINGS:
        md.append(f"#### {title}\n{body}\n")
    md.append("\n---\n")

    # Section 3
    md.append("## 3. Public Surface Feature Audit\n")
    md.append("### 3.1 URL Map\n")
    md.append("| " + " | ".join(URL_MAP_HEADERS) + " |\n")
    md.append("| " + " | ".join(["---"] * len(URL_MAP_HEADERS)) + " |\n")
    for row in URL_MAP_ROWS:
        md.append("| " + " | ".join(str(c).replace("\n", " ") for c in row) + " |\n")
    md.append("\n### 3.2 Page-by-Page Feature Breakdown\n")
    md.append("| " + " | ".join(PAGE_FEATURES_HEADERS) + " |\n")
    md.append("| " + " | ".join(["---"] * len(PAGE_FEATURES_HEADERS)) + " |\n")
    for row in PAGE_FEATURES_ROWS:
        md.append("| " + " | ".join(str(c).replace("\n", " ") for c in row) + " |\n")
    md.append("\n---\n")

    # Section 4
    md.append("## 4. Architecture Recommendations\n")
    md.append("### 4.1 NestJS Module Breakdown\n")
    md.append("| " + " | ".join(MODULE_BREAKDOWN_HEADERS) + " |\n")
    md.append("| " + " | ".join(["---"] * len(MODULE_BREAKDOWN_HEADERS)) + " |\n")
    for row in MODULE_BREAKDOWN_ROWS:
        md.append("| " + " | ".join(str(c).replace("\n", " ") for c in row) + " |\n")
    md.append("\n---\n")

    # Section 5
    md.append("## 5. AWS Deployment Topology\n")
    md.append("### 5.1 Topology Components\n")
    md.append("| " + " | ".join(AWS_TOPOLOGY_HEADERS) + " |\n")
    md.append("| " + " | ".join(["---"] * len(AWS_TOPOLOGY_HEADERS)) + " |\n")
    for row in AWS_TOPOLOGY_ROWS:
        md.append("| " + " | ".join(str(c).replace("\n", " ") for c in row) + " |\n")
    md.append("\n### 5.2 Monthly Cost Estimate\n")
    md.append("| " + " | ".join(AWS_COST_HEADERS) + " |\n")
    md.append("| " + " | ".join(["---"] * len(AWS_COST_HEADERS)) + " |\n")
    for row in AWS_COST_ROWS:
        md.append("| " + " | ".join(str(c).replace("\n", " ") for c in row) + " |\n")
    md.append("\n---\n")

    # Section 6
    md.append("## 6. Strangler-Fig Migration Roadmap\n")
    md.append("### 6.1 Six-Phase Roadmap\n")
    md.append("| " + " | ".join(ROADMAP_HEADERS) + " |\n")
    md.append("| " + " | ".join(["---"] * len(ROADMAP_HEADERS)) + " |\n")
    for row in ROADMAP_ROWS:
        md.append("| " + " | ".join(str(c).replace("\n", " ") for c in row) + " |\n")
    md.append("\n---\n")

    # Section 7
    md.append("## 7. Auth Migration Plan\n")
    for heading, body in AUTH_PLAN_TEXT:
        md.append(f"### {heading}\n{body}\n")
    md.append("\n---\n")

    # Section 8
    md.append("## 8. Data Migration Script Plan\n")
    for heading, body in DATA_MIGRATION_TEXT:
        md.append(f"### {heading}\n{body}\n")
    md.append("\n---\n")

    # Section 9
    md.append("## 9. URL/SEO Preservation Plan\n")
    md.append("### 9.1 URL Mapping & Redirects\n")
    md.append("| " + " | ".join(URL_REDIRECT_HEADERS) + " |\n")
    md.append("| " + " | ".join(["---"] * len(URL_REDIRECT_HEADERS)) + " |\n")
    for row in URL_REDIRECT_ROWS:
        md.append("| " + " | ".join(str(c).replace("\n", " ") for c in row) + " |\n")
    md.append("\n### 9.2 SEO Parity Checklist\n")
    for item in SEO_CHECKLIST:
        md.append(f"- {item}")
    md.append("\n---\n")

    # Section 10
    md.append("## 10. Security Checklist\n")
    md.append("### 10.1 OWASP Top 10 Controls\n")
    md.append("| " + " | ".join(SECURITY_HEADERS) + " |\n")
    md.append("| " + " | ".join(["---"] * len(SECURITY_HEADERS)) + " |\n")
    for row in SECURITY_ROWS:
        md.append("| " + " | ".join(str(c).replace("\n", " ") for c in row) + " |\n")
    for heading, body in SECURITY_EXTRA:
        md.append(f"\n### {heading}\n{body}\n")
    md.append("\n---\n")

    # Section 11
    md.append("## 11. Risk Register & Open Questions\n")
    md.append("### 11.1 Risk Register\n")
    md.append("| " + " | ".join(RISK_REGISTER_HEADERS) + " |\n")
    md.append("| " + " | ".join(["---"] * len(RISK_REGISTER_HEADERS)) + " |\n")
    for row in RISK_REGISTER_ROWS:
        md.append("| " + " | ".join(str(c).replace("\n", " ") for c in row) + " |\n")
    md.append("\n### 11.2 Open Questions (Blocked on Laravel Source)\n")
    for i, q in enumerate(OPEN_QUESTIONS, start=1):
        md.append(f"{i}. {q}")
    md.append("\n---\n")

    # Section 12
    md.append("## 12. Next Steps & Sign-off\n")
    for heading, body in NEXT_STEPS_TEXT:
        md.append(f"### {heading}\n{body}\n")
    md.append("\n---\n")

    # Appendix A
    md.append("## Appendix A: Complete 67-Table Inventory\n")
    md.append("| " + " | ".join(APPENDIX_A_HEADERS) + " |\n")
    md.append("| " + " | ".join(["---"] * len(APPENDIX_A_HEADERS)) + " |\n")
    for row in APPENDIX_A_ROWS:
        md.append("| " + " | ".join(str(c) for c in row) + " |\n")
    md.append("\n---\n")

    # Appendix B
    md.append("## Appendix B: Active Payment Gateway Configuration\n")
    md.append("> **P0 SECURITY INCIDENT**: Rotate ALL exposed payment credentials immediately. "
              "Treat the SQL dump as compromised.\n")
    md.append("| " + " | ".join(APPENDIX_B_HEADERS) + " |\n")
    md.append("| " + " | ".join(["---"] * len(APPENDIX_B_HEADERS)) + " |\n")
    for row in APPENDIX_B_ROWS:
        md.append("| " + " | ".join(str(c).replace("\n", " ") for c in row) + " |\n")
    md.append("\n---\n")

    # Appendix C
    md.append("## Appendix C: Glossary\n")
    md.append("| Term | Definition |\n| --- | --- |\n")
    for term, definition in GLOSSARY:
        md.append(f"| {term} | {definition} |")

    with open(output_path, "w", encoding="utf-8") as f:
        f.write("\n".join(md))


# -----------------------------------------------------------------------------
# Main Build
# -----------------------------------------------------------------------------
def build_pdf(output_path: str):
    """Build the complete Phase 0 PDF."""
    styles = make_styles()
    doc = PhaseZeroDocTemplate(
        output_path,
        pagesize=A4,
        leftMargin=LEFT_MARGIN, rightMargin=RIGHT_MARGIN,
        topMargin=TOP_MARGIN, bottomMargin=BOTTOM_MARGIN,
        title="Phase 0 Discovery Document — Ready Game Code Migration",
        author="Principal Architect",
        subject="Laravel to Next.js + NestJS Migration Plan",
        creator="Z.ai PDF Skill",
    )

    story = []

    # Cover (uses Cover template)
    story.extend(build_cover(styles))

    # Switch to Body template for the rest
    story.append(NextPageTemplate("Body"))
    story.append(PageBreak())  # ensure template switch

    # TOC
    story.extend(build_toc(styles))

    # Main sections
    story.extend(build_executive_summary(styles))
    story.extend(build_strategic_decisions(styles))
    story.extend(build_database_analysis(styles))
    story.extend(build_feature_audit(styles))
    story.extend(build_architecture(styles))
    story.extend(build_aws_topology(styles))
    story.extend(build_roadmap(styles))
    story.extend(build_auth_plan(styles))
    story.extend(build_data_migration(styles))
    story.extend(build_seo_plan(styles))
    story.extend(build_security(styles))
    story.extend(build_risks(styles))
    story.extend(build_next_steps(styles))

    # Appendices
    story.extend(build_appendix_a(styles))
    story.extend(build_appendix_b(styles))
    story.extend(build_appendix_c(styles))

    doc.build(story)


if __name__ == "__main__":
    pdf_output = "/home/z/my-project/download/Phase0_Discovery_ReadyGameCode_Migration.pdf"
    md_output = "/home/z/my-project/download/Phase0_Discovery_ReadyGameCode_Migration.md"

    print(f"Building PDF -> {pdf_output}")
    build_pdf(pdf_output)
    print(f"Building Markdown -> {md_output}")
    build_markdown(md_output)
    print("\nDone.")
    print(f"PDF size: {os.path.getsize(pdf_output):,} bytes")
    print(f"MD size:  {os.path.getsize(md_output):,} bytes")
