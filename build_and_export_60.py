import os
import shutil
import win32com.client
import pythoncom
import pymupdf

import base_builder as b
import thesis_helpers as th
from build_front_matter import build_front_matter
from build_chapter1_2 import build_chapter1_and_2
from build_chapter3_4 import build_chapter3_and_4
from build_chapter5_6_ref_app import build_chapter5_6_and_appendices

OUTPUT_DIR = r"g:\SAI\SAI-Figma-Test\SAI_Thesis_Output"
FINAL_DOCX = os.path.join(OUTPUT_DIR, "SAI_Smart_AI_Property_Finder_Thesis.docx")
FINAL_PDF = os.path.join(OUTPUT_DIR, "SAI_Smart_AI_Property_Finder_Thesis.pdf")

TEMP_DOCX = os.path.abspath("temp_thesis_60pages.docx")
TEMP_PDF = os.path.abspath("temp_thesis_60pages.pdf")

def run():
    print("Generating 60-page thesis...")
    import importlib
    importlib.reload(b)
    doc = b.doc
    for s in doc.sections:
        th.add_header_footer(doc, s)

    print("1. Front Matter...")
    build_front_matter(doc, b)
    print("2. Chapters 1 & 2...")
    build_chapter1_and_2(doc, b)
    print("3. Chapters 3 & 4...")
    build_chapter3_and_4(doc, b)
    print("4. Chapters 5 & 6, References & Appendices...")
    build_chapter5_6_and_appendices(doc, b)

    if os.path.exists(TEMP_DOCX):
        try: os.remove(TEMP_DOCX)
        except: pass
    if os.path.exists(TEMP_PDF):
        try: os.remove(TEMP_PDF)
        except: pass

    print(f"Saving temporary docx to: {TEMP_DOCX}")
    doc.save(TEMP_DOCX)

    print("Opening in Word COM...")
    pythoncom.CoInitialize()
    word = win32com.client.DispatchEx("Word.Application")
    word.Visible = False
    word.DisplayAlerts = 0

    try:
        wdoc = word.Documents.Open(TEMP_DOCX)
        pages = wdoc.ComputeStatistics(2)
        print(f">>> OFFICIAL PAGE COUNT IN MICROSOFT WORD: {pages} PAGES <<<")
        print(f"Exporting PDF to: {TEMP_PDF}...")
        wdoc.SaveAs2(FileName=TEMP_PDF, FileFormat=17)
        wdoc.Close(False)
    finally:
        word.Quit()

    # Verify with PyMuPDF
    pdf = pymupdf.open(TEMP_PDF)
    pdf_pages = len(pdf)
    print(f">>> PYMUPDF VERIFIED PDF PAGES: {pdf_pages} <<<")

    # Copy to official final destinations
    print(f"Copying to {FINAL_DOCX}...")
    shutil.copyfile(TEMP_DOCX, FINAL_DOCX)
    print(f"Copying to {FINAL_PDF}...")
    shutil.copyfile(TEMP_PDF, FINAL_PDF)

    # Cleanup temp files
    try: os.remove(TEMP_DOCX)
    except: pass
    try: os.remove(TEMP_PDF)
    except: pass

    print("All done successfully!")

if __name__ == "__main__":
    run()
