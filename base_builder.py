import os
import sys
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import qn, nsdecls

import thesis_helpers as th

OUTPUT_DIR = r"g:\SAI\SAI-Figma-Test\SAI_Thesis_Output"
DIAGRAMS_DIR = os.path.join(OUTPUT_DIR, "SAI_Thesis_Diagrams")
DOCX_PATH = os.path.join(OUTPUT_DIR, "SAI_Smart_AI_Property_Finder_Thesis.docx")

doc = Document()

# Set standard page size: A4
for s in doc.sections:
    s.page_width = Inches(8.27)
    s.page_height = Inches(11.69)
    s.top_margin = Inches(1.0)
    s.bottom_margin = Inches(1.0)
    s.left_margin = Inches(1.25)
    s.right_margin = Inches(1.0)
    th.add_page_border(s)

# Styles
FONT_NAME = "Times New Roman"

def format_run(run, font_name=FONT_NAME, size_pt=12, bold=False, italic=False, color_rgb=th.COLOR_TEXT):
    run.font.name = font_name
    run.font.size = Pt(size_pt)
    run.bold = bold
    run.italic = italic
    run.font.color.rgb = color_rgb

def sanitize_xml(s):
    if not s:
        return ""
    # Filter out illegal XML control chars (codes < 32 except \t, \n, \r)
    return "".join(c for c in str(s) if c in "\t\n\r" or (ord(c) >= 32 and ord(c) != 127))

def add_p(text="", align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_before=0, space_after=1.8, line_spacing=1.10):
    p = doc.add_paragraph()
    p.alignment = align
    p.paragraph_format.space_before = Pt(space_before)
    p.paragraph_format.space_after = Pt(space_after)
    p.paragraph_format.line_spacing = line_spacing
    if text:
        r = p.add_run(sanitize_xml(text))
        format_run(r, size_pt=11)
    return p

def add_heading_1(text):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(8)
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.line_spacing = 1.15
    r = p.add_run(sanitize_xml(text))
    format_run(r, size_pt=13.5, bold=True, color_rgb=th.COLOR_BLACK)
    return p

def add_heading_2(text):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p.paragraph_format.space_before = Pt(7)
    p.paragraph_format.space_after = Pt(2.5)
    p.paragraph_format.line_spacing = 1.18
    r = p.add_run(sanitize_xml(text))
    format_run(r, size_pt=12, bold=True, color_rgb=th.COLOR_BLACK)
    return p

def add_heading_3(text):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p.paragraph_format.space_before = Pt(5)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.line_spacing = 1.18
    r = p.add_run(sanitize_xml(text))
    format_run(r, size_pt=11, bold=True, italic=True, color_rgb=th.COLOR_BLACK)
    return p

def add_bullet(bold_prefix, text):
    p = doc.add_paragraph(style='List Bullet')
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p.paragraph_format.space_before = Pt(1)
    p.paragraph_format.space_after = Pt(1.8)
    p.paragraph_format.line_spacing = 1.10
    if bold_prefix:
        r1 = p.add_run(sanitize_xml(bold_prefix) + ": ")
        format_run(r1, size_pt=11, bold=True)
    r2 = p.add_run(sanitize_xml(text))
    format_run(r2, size_pt=11)
    return p

def add_figure(filename, fig_num, caption, width_in=5.2, height_in=1.10):
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl.autofit = False

    cell = tbl.cell(0, 0)
    cell.width = Inches(width_in)

    # Set black borders on all 4 sides
    tcPr = cell._tc.get_or_add_tcPr()
    tcBorders = parse_xml(
        f'<w:tcBorders {nsdecls("w")}>'
        f'<w:top w:val="single" w:sz="12" w:space="0" w:color="000000"/>'
        f'<w:left w:val="single" w:sz="12" w:space="0" w:color="000000"/>'
        f'<w:bottom w:val="single" w:sz="12" w:space="0" w:color="000000"/>'
        f'<w:right w:val="single" w:sz="12" w:space="0" w:color="000000"/>'
        f'</w:tcBorders>'
    )
    tcPr.append(tcBorders)

    # Height of the row
    trPr = tbl.rows[0]._tr.get_or_add_trPr()
    trHeight = parse_xml(f'<w:trHeight {nsdecls("w")} w:val="{int(height_in * 1440)}" w:hRule="atLeast"/>')
    trPr.append(trHeight)

    # Shading & Margins
    th.set_cell_shading(cell, "F8FAFC")
    th.set_cell_margins(cell, top=90, bottom=90, left=130, right=130)

    p = cell.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(5)
    p.paragraph_format.space_after = Pt(2)

    r1 = p.add_run(f"[ BLANK SPACE FOR FIGURE {fig_num} ]\n")
    format_run(r1, size_pt=10, bold=True, color_rgb=th.COLOR_BLACK)

    r2 = p.add_run(f"“{caption}”\n")
    format_run(r2, size_pt=9, italic=True, color_rgb=th.COLOR_MUTED)

    r3 = p.add_run("(Click inside this bordered space to paste or insert the diagram)\n")
    format_run(r3, size_pt=8, bold=False, color_rgb=th.COLOR_PRIMARY)

    r4 = p.add_run(f"Recommended Dimensions: ~ {width_in} in × 2.6 in")
    format_run(r4, size_pt=7.5, italic=True, color_rgb=th.COLOR_MUTED)

    # Caption below table
    p_cap = doc.add_paragraph()
    p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_cap.paragraph_format.space_before = Pt(3)
    p_cap.paragraph_format.space_after = Pt(5)
    r = p_cap.add_run(sanitize_xml(f"Figure {fig_num}: {caption}"))
    format_run(r, size_pt=10, bold=True, italic=False, color_rgb=th.COLOR_BLACK)

def add_screenshot(filename, scr_num, caption, width_in=5.2, height_in=1.10):
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl.autofit = False

    cell = tbl.cell(0, 0)
    cell.width = Inches(width_in)

    tcPr = cell._tc.get_or_add_tcPr()
    tcBorders = parse_xml(
        f'<w:tcBorders {nsdecls("w")}>'
        f'<w:top w:val="single" w:sz="12" w:space="0" w:color="000000"/>'
        f'<w:left w:val="single" w:sz="12" w:space="0" w:color="000000"/>'
        f'<w:bottom w:val="single" w:sz="12" w:space="0" w:color="000000"/>'
        f'<w:right w:val="single" w:sz="12" w:space="0" w:color="000000"/>'
        f'</w:tcBorders>'
    )
    tcPr.append(tcBorders)

    trPr = tbl.rows[0]._tr.get_or_add_trPr()
    trHeight = parse_xml(f'<w:trHeight {nsdecls("w")} w:val="{int(height_in * 1440)}" w:hRule="atLeast"/>')
    trPr.append(trHeight)

    th.set_cell_shading(cell, "F8FAFC")
    th.set_cell_margins(cell, top=90, bottom=90, left=130, right=130)

    p = cell.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(5)
    p.paragraph_format.space_after = Pt(2)

    r1 = p.add_run(f"[ BLANK SPACE FOR SCREENSHOT {scr_num} ]\n")
    format_run(r1, size_pt=10, bold=True, color_rgb=th.COLOR_BLACK)

    r2 = p.add_run(f"“{caption}”\n")
    format_run(r2, size_pt=9, italic=True, color_rgb=th.COLOR_MUTED)

    r3 = p.add_run("(Click inside this bordered space to paste or insert the screenshot)\n")
    format_run(r3, size_pt=8, bold=False, color_rgb=th.COLOR_PRIMARY)

    r4 = p.add_run(f"Recommended Dimensions: ~ {width_in} in × 2.6 in")
    format_run(r4, size_pt=7.5, italic=True, color_rgb=th.COLOR_MUTED)

    p_cap = doc.add_paragraph()
    p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_cap.paragraph_format.space_before = Pt(3)
    p_cap.paragraph_format.space_after = Pt(5)
    r = p_cap.add_run(sanitize_xml(f"Screenshot {scr_num}: {caption}"))
    format_run(r, size_pt=10, bold=True, italic=False, color_rgb=th.COLOR_BLACK)

def add_table(headers, rows, table_num, caption, col_widths=None):
    p_cap = doc.add_paragraph()
    p_cap.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p_cap.paragraph_format.space_before = Pt(6)
    p_cap.paragraph_format.space_after = Pt(3)
    r = p_cap.add_run(sanitize_xml(f"Table {table_num}: {caption}"))
    format_run(r, size_pt=10, bold=True, color_rgb=th.COLOR_BLACK)

    tbl = doc.add_table(rows=len(rows)+1, cols=len(headers))
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    
    # Header row
    hdr_cells = tbl.rows[0].cells
    for i, title in enumerate(headers):
        hdr_cells[i].text = sanitize_xml(title)
        th.set_cell_shading(hdr_cells[i], "E2E8F0")
        th.set_cell_margins(hdr_cells[i], top=90, bottom=90, left=110, right=110)
        p = hdr_cells[i].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        for run in p.runs:
            format_run(run, size_pt=9.5, bold=True, color_rgb=th.COLOR_BLACK)

    # Data rows
    for r_idx, row in enumerate(rows):
        row_cells = tbl.rows[r_idx+1].cells
        bg = "FFFFFF" if r_idx % 2 == 0 else "F8FAFC"
        for c_idx, val in enumerate(row):
            row_cells[c_idx].text = sanitize_xml(str(val))
            th.set_cell_shading(row_cells[c_idx], bg)
            th.set_cell_margins(row_cells[c_idx], top=70, bottom=70, left=90, right=90)
            p = row_cells[c_idx].paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            for run in p.runs:
                format_run(run, size_pt=9, color_rgb=th.COLOR_TEXT)

    if col_widths:
        for row in tbl.rows:
            for i, w in enumerate(col_widths):
                row.cells[i].width = Inches(w)

    doc.add_paragraph().paragraph_format.space_after = Pt(4)

def add_chapter_divider(chap_num, chap_title):
    doc.add_page_break()
    p1 = doc.add_paragraph()
    p1.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    p1.paragraph_format.space_before = Pt(8)
    p1.paragraph_format.space_after = Pt(2)
    chap_str = f"CHAPTER {chap_num}" if str(chap_num).isdigit() else str(chap_num)
    r1 = p1.add_run(chap_str)
    format_run(r1, size_pt=13, bold=True, color_rgb=th.COLOR_PRIMARY)

    # Rule line
    p_rule = doc.add_paragraph()
    p_rule.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_rule.paragraph_format.space_before = Pt(2)
    p_rule.paragraph_format.space_after = Pt(6)
    pPr = p_rule._p.get_or_add_pPr()
    pBdr = OxmlElement('w:pBdr')
    bottom = OxmlElement('w:bottom')
    bottom.set(qn('w:val'), 'single')
    bottom.set(qn('w:sz'), '16')
    bottom.set(qn('w:color'), '1E3A8A')
    pBdr.append(bottom)
    pPr.append(pBdr)

    p2 = doc.add_paragraph()
    p2.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p2.paragraph_format.space_after = Pt(12)
    r2 = p2.add_run(chap_title.upper())
    format_run(r2, size_pt=15, bold=True, color_rgb=th.COLOR_BLACK)

print("Thesis base layout and building blocks established.")
