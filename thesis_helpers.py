import os
import sys
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import qn, nsdecls

# Paths
OUTPUT_DIR = r"g:\SAI\SAI-Figma-Test\SAI_Thesis_Output"
DIAGRAMS_DIR = os.path.join(OUTPUT_DIR, "SAI_Thesis_Diagrams")
DOCX_PATH = os.path.join(OUTPUT_DIR, "SAI_Smart_AI_Property_Finder_Thesis.docx")

os.makedirs(OUTPUT_DIR, exist_ok=True)

# Formatting Constants
FONT_NAME = "Times New Roman"
COLOR_PRIMARY = RGBColor(15, 118, 110)    # Deep Teal
COLOR_DARK = RGBColor(30, 41, 59)         # Navy
COLOR_MUTED = RGBColor(100, 116, 139)     # Slate
COLOR_BLACK = RGBColor(0, 0, 0)
COLOR_TEXT = RGBColor(15, 23, 42)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    """Sets inner padding for table cells."""
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def set_cell_shading(cell, color_hex):
    """Sets background fill color for table cells."""
    shading_xml = f'<w:shd {nsdecls("w")} w:fill="{color_hex}"/>'
    cell._tc.get_or_add_tcPr().append(parse_xml(shading_xml))

def set_cell_border(cell, **kwargs):
    """Sets custom borders for a table cell."""
    tcPr = cell._tc.get_or_add_tcPr()
    tcBorders = OxmlElement('w:tcBorders')
    for edge in ('top', 'left', 'bottom', 'right', 'insideH', 'insideV'):
        edge_data = kwargs.get(edge)
        if edge_data:
            tag = f'w:{edge}'
            element = OxmlElement(tag)
            element.set(qn('w:val'), edge_data.get('val', 'single'))
            element.set(qn('w:sz'), str(edge_data.get('sz', 4)))
            element.set(qn('w:space'), str(edge_data.get('space', 0)))
            element.set(qn('w:color'), edge_data.get('color', 'CBD5E1'))
            tcBorders.append(element)
    tcPr.append(tcBorders)

def add_page_border(section):
    """Adds formal double line border to the page section."""
    sectPr = section._sectPr
    pgBorders = sectPr.find(qn('w:pgBorders'))
    if pgBorders is None:
        pgBorders = OxmlElement('w:pgBorders')
        pgBorders.set(qn('w:offsetFrom'), 'page')
        sectPr.append(pgBorders)
    for border_name in ['top', 'left', 'bottom', 'right']:
        border = OxmlElement(f'w:{border_name}')
        border.set(qn('w:val'), 'double')  # Double-line border like PRISMORA
        border.set(qn('w:sz'), '12')       # 1.5 pt
        border.set(qn('w:space'), '20')    # Margin offset
        border.set(qn('w:color'), '000000')
        pgBorders.append(border)

def add_header_footer(doc, section, is_prelim=False):
    """Configures headers and footers with bottom/top rules and page numbers."""
    section.different_first_page_header_footer = False
    header = section.header
    footer = section.footer

    # Header Paragraph
    hp = header.paragraphs[0]
    hp.text = "SAI – Smart AI Property Finder"
    hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    if hp.runs:
        r = hp.runs[0]
        r.font.name = FONT_NAME
        r.font.size = Pt(8.5)
        r.font.color.rgb = COLOR_MUTED
        r.font.italic = True
    
    # Add bottom border line to header via XML
    pPr = hp._p.get_or_add_pPr()
    pBdr = OxmlElement('w:pBdr')
    bottom = OxmlElement('w:bottom')
    bottom.set(qn('w:val'), 'single')
    bottom.set(qn('w:sz'), '6')
    bottom.set(qn('w:space'), '4')
    bottom.set(qn('w:color'), '000000')
    pBdr.append(bottom)
    pPr.append(pBdr)

    # Footer Paragraph: Table with 2 cells (left dept, right page number)
    fp = footer.paragraphs[0]
    fp.text = "" # Clear default
    
    # Footer table for perfect two-column alignment
    ftbl = footer.add_table(1, 2, Inches(6.5))
    ftbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    c_left = ftbl.cell(0, 0)
    c_right = ftbl.cell(0, 1)

    c_left.width = Inches(5.2)
    c_right.width = Inches(1.3)

    p_left = c_left.paragraphs[0]
    p_left.text = "Department of Artificial Intelligence & Data Science, PRPCEM, Amravati"
    r_l = p_left.runs[0]
    r_l.font.name = FONT_NAME
    r_l.font.size = Pt(8.5)
    r_l.font.color.rgb = COLOR_MUTED

    p_right = c_right.paragraphs[0]
    p_right.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    r_r = p_right.add_run()
    r_r.font.name = FONT_NAME
    r_r.font.size = Pt(9.5)
    r_r.font.color.rgb = COLOR_BLACK
    r_r.font.bold = True

    # Word field code for dynamic PAGE
    fldSimple = OxmlElement('w:fldSimple')
    fldSimple.set(qn('w:instr'), 'PAGE')
    r_r._r.append(fldSimple)

    # Top border on footer
    fpPr = p_left._p.get_or_add_pPr()
    fpBdr = OxmlElement('w:pBdr')
    top = OxmlElement('w:top')
    top.set(qn('w:val'), 'single')
    top.set(qn('w:sz'), '6')
    top.set(qn('w:space'), '4')
    top.set(qn('w:color'), '000000')
    fpBdr.append(top)
    fpPr.append(fpBdr)

print("Thesis helper utilities loaded.")
