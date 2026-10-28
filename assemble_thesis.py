import os
import sys
import base_builder as b
import thesis_helpers as th
from build_front_matter import build_front_matter
from build_chapter1_2 import build_chapter1_and_2
from build_chapter3_4 import build_chapter3_and_4
from build_chapter5_6_ref_app import build_chapter5_6_and_appendices

OUTPUT_DIR = r"g:\SAI\SAI-Figma-Test\SAI_Thesis_Output"
DOCX_PATH = os.path.join(OUTPUT_DIR, "SAI_Smart_AI_Property_Finder_Thesis.docx")
PDF_PATH = os.path.join(OUTPUT_DIR, "SAI_Smart_AI_Property_Finder_Thesis.pdf")

def assemble_master_thesis():
    print("="*60)
    print("Starting SAI Master B.Tech Project Thesis Generation...")
    print("="*60)

    import importlib
    importlib.reload(b)
    doc = b.doc

    # Configure Header & Footer
    for s in doc.sections:
        th.add_header_footer(doc, s)

    print("Step 1: Generating Front Matter...")
    build_front_matter(doc, b)

    print("Step 2: Generating Chapter 1 (Introduction) and Chapter 2 (Literature Survey)...")
    build_chapter1_and_2(doc, b)

    print("Step 3: Generating Chapter 3 (Proposed Work & Design) and Chapter 4 (Implementation & Testing)...")
    build_chapter3_and_4(doc, b)

    print("Step 4: Generating Chapter 5 (Results & Discussion), Chapter 6 (Conclusion), References & Appendices...")
    build_chapter5_6_and_appendices(doc, b)

    print(f"Step 5: Saving complete thesis document to: {DOCX_PATH}", flush=True)
    doc.save(DOCX_PATH)
    file_size_kb = os.path.getsize(DOCX_PATH) / 1024
    print(f"Document saved successfully! File size: {file_size_kb:.2f} KB", flush=True)

    # Step 6: Convert to PDF and get exact Page Count via Microsoft Word COM
    print("Step 6: Converting DOCX to PDF using Microsoft Word COM Automation...", flush=True)
    try:
        import win32com.client
        import pythoncom

        pythoncom.CoInitialize()
        word = win32com.client.DispatchEx("Word.Application")
        word.Visible = False
        word.DisplayAlerts = 0

        abs_docx = os.path.abspath(DOCX_PATH)
        abs_pdf = os.path.abspath(PDF_PATH)

        if os.path.exists(abs_pdf):
            try:
                os.remove(abs_pdf)
            except Exception:
                pass

        try:
            doc_com = word.Documents.Open(abs_docx)
            page_count = doc_com.ComputeStatistics(2)
            print(f">>> EXACT PAGE COUNT IN MICROSOFT WORD: {page_count} PAGES <<<", flush=True)

            doc_com.SaveAs2(FileName=abs_pdf, FileFormat=17)
            doc_com.Close(False)
        finally:
            word.Quit()

        pdf_size_kb = os.path.getsize(PDF_PATH) / 1024
        print(f"PDF exported successfully to: {PDF_PATH} ({pdf_size_kb:.2f} KB)", flush=True)
        print(f"Official College-Ready Page Count: {page_count} Pages.", flush=True)
    except Exception as e:
        print(f"Word COM conversion note: {e}")
        # Fallback to docx2pdf if direct dispatch had any issues
        try:
            from docx2pdf import convert
            convert(DOCX_PATH, PDF_PATH)
            print(f"Converted via docx2pdf fallback to: {PDF_PATH}")
        except Exception as e2:
            print(f"Fallback conversion note: {e2}")

    print("="*60)
    print("THESIS GENERATION COMPLETED SUCCESSFULLY!")
    print("="*60)

if __name__ == "__main__":
    assemble_master_thesis()
