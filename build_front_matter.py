import os
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
import thesis_helpers as th

def build_front_matter(doc, b):
    # -------------------------------------------------------------
    # 1. Title Page (Unnumbered)
    # -------------------------------------------------------------
    p1 = doc.add_paragraph()
    p1.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p1.paragraph_format.space_before = Pt(12)
    p1.paragraph_format.space_after = Pt(4)
    r = p1.add_run("PROJECT REPORT")
    b.format_run(r, size_pt=16, bold=True, color_rgb=th.COLOR_BLACK)

    p2 = doc.add_paragraph()
    p2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p2.paragraph_format.space_before = Pt(2)
    p2.paragraph_format.space_after = Pt(12)
    r = p2.add_run("ON")
    b.format_run(r, size_pt=13, bold=True, color_rgb=th.COLOR_BLACK)

    p3 = doc.add_paragraph()
    p3.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p3.paragraph_format.space_before = Pt(8)
    p3.paragraph_format.space_after = Pt(16)
    r = p3.add_run("SAI – SMART AI PROPERTY FINDER:\nA Grounded Multilingual Conversational Framework and Geospatial Intelligence Engine for Real Estate Discovery")
    b.format_run(r, size_pt=15, bold=True, color_rgb=th.COLOR_PRIMARY)

    p4 = doc.add_paragraph()
    p4.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p4.paragraph_format.space_before = Pt(8)
    p4.paragraph_format.space_after = Pt(4)
    r = p4.add_run("THIS PROJECT REPORT IS SUBMITTED TO SANT GADGE BABA AMRAVATI UNIVERSITY")
    b.format_run(r, size_pt=10.5, bold=True, color_rgb=th.COLOR_BLACK)

    p5 = doc.add_paragraph()
    p5.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p5.paragraph_format.space_after = Pt(4)
    r = p5.add_run("IN THE PARTIAL FULFILLMENT OF THE REQUIREMENTS FOR THE DEGREE OF")
    b.format_run(r, size_pt=10, bold=False, color_rgb=th.COLOR_BLACK)

    p6 = doc.add_paragraph()
    p6.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p6.paragraph_format.space_after = Pt(2)
    r = p6.add_run("BACHELOR OF TECHNOLOGY\nIN\nARTIFICIAL INTELLIGENCE & DATA SCIENCE")
    b.format_run(r, size_pt=13, bold=True, color_rgb=th.COLOR_BLACK)

    p7 = doc.add_paragraph()
    p7.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p7.paragraph_format.space_before = Pt(8)
    p7.paragraph_format.space_after = Pt(6)
    r = p7.add_run("SUBMITTED BY")
    b.format_run(r, size_pt=11, bold=True, color_rgb=th.COLOR_BLACK)

    # Student Names Grid Table
    st_tbl = doc.add_table(rows=2, cols=2)
    st_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    students = [
        ("[NAME OF STUDENT 1]", "[ROLL NO 1]"),
        ("[NAME OF STUDENT 2]", "[ROLL NO 2]"),
        ("[NAME OF STUDENT 3]", "[ROLL NO 3]"),
        ("[NAME OF STUDENT 4]", "[ROLL NO 4]"),
    ]
    st_tbl.rows[0].cells[0].paragraphs[0].text = f"Mr. {students[0][0]}\n(Roll No: {students[0][1]})"
    st_tbl.rows[0].cells[1].paragraphs[0].text = f"Mr. {students[1][0]}\n(Roll No: {students[1][1]})"
    st_tbl.rows[1].cells[0].paragraphs[0].text = f"Mr. {students[2][0]}\n(Roll No: {students[2][1]})"
    st_tbl.rows[1].cells[1].paragraphs[0].text = f"Mr. {students[3][0]}\n(Roll No: {students[3][1]})"

    for row in st_tbl.rows:
        for cell in row.cells:
            cell.width = Inches(3.2)
            p = cell.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p.paragraph_format.line_spacing = 1.15
            for run in p.runs:
                b.format_run(run, size_pt=10.5, bold=True)

    p_guide = doc.add_paragraph()
    p_guide.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_guide.paragraph_format.space_before = Pt(10)
    p_guide.paragraph_format.space_after = Pt(2)
    r = p_guide.add_run("GUIDED BY")
    b.format_run(r, size_pt=11, bold=True, color_rgb=th.COLOR_BLACK)

    p_gname = doc.add_paragraph()
    p_gname.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_gname.paragraph_format.space_after = Pt(8)
    r = p_gname.add_run("[NAME OF PROJECT GUIDE]\n[GUIDE DESIGNATION]")
    b.format_run(r, size_pt=11.5, bold=True, color_rgb=th.COLOR_BLACK)

    # College Logo
    logo_path = os.path.join(b.DIAGRAMS_DIR, "prpcem_logo.png")
    if os.path.exists(logo_path):
        p_logo = doc.add_paragraph()
        p_logo.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_logo.paragraph_format.space_after = Pt(4)
        run = p_logo.add_run()
        run.add_picture(logo_path, width=Inches(1.25))

    p_dept = doc.add_paragraph()
    p_dept.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_dept.paragraph_format.space_after = Pt(2)
    r = p_dept.add_run("DEPARTMENT OF ARTIFICIAL INTELLIGENCE & DATA SCIENCE")
    b.format_run(r, size_pt=11, bold=True, color_rgb=th.COLOR_BLACK)

    p_col = doc.add_paragraph()
    p_col.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_col.paragraph_format.space_after = Pt(2)
    r = p_col.add_run("P. R. POTE PATIL COLLEGE OF ENGINEERING & MANAGEMENT,\nAMRAVATI, MAHARASHTRA STATE, INDIA – 444602\n(An Autonomous Institute Affiliated to SGBAU Amravati)")
    b.format_run(r, size_pt=10, bold=True, color_rgb=th.COLOR_BLACK)

    p_yr = doc.add_paragraph()
    p_yr.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_yr.paragraph_format.space_before = Pt(6)
    r = p_yr.add_run("ACADEMIC YEAR: 2025–2026")
    b.format_run(r, size_pt=11, bold=True, color_rgb=th.COLOR_BLACK)

    # -------------------------------------------------------------
    # 2. Copyright / Inner Title Page
    # -------------------------------------------------------------
    doc.add_page_break()
    p_c1 = doc.add_paragraph()
    p_c1.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_c1.paragraph_format.space_before = Pt(80)
    r = p_c1.add_run("SAI – SMART AI PROPERTY FINDER")
    b.format_run(r, size_pt=16, bold=True, color_rgb=th.COLOR_PRIMARY)

    p_c2 = doc.add_paragraph()
    p_c2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_c2.paragraph_format.space_after = Pt(240)
    r = p_c2.add_run("A College-Ready Final-Year Project Report\nDepartment of Artificial Intelligence & Data Science\nP. R. Pote Patil College of Engineering & Management, Amravati")
    b.format_run(r, size_pt=11, italic=True)

    p_copy = doc.add_paragraph()
    p_copy.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p_copy.add_run("© 2026 [STUDENT 1], [STUDENT 2], [STUDENT 3], [STUDENT 4]\nDepartment of Artificial Intelligence & Data Science, PRPCEM Amravati.\nAll Rights Reserved.")
    b.format_run(r, size_pt=10, bold=True)

    # -------------------------------------------------------------
    # 3. Certificate (Page i)
    # -------------------------------------------------------------
    doc.add_page_break()
    p_h = doc.add_paragraph()
    p_h.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_h.paragraph_format.space_after = Pt(2)
    r = p_h.add_run("Department of Artificial Intelligence & Data Science\nP. R. Pote Patil College of Engineering & Management\nAmravati – 444602 (M.S.)")
    b.format_run(r, size_pt=11, bold=True)

    p_yr = doc.add_paragraph()
    p_yr.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_yr.paragraph_format.space_after = Pt(8)
    r = p_yr.add_run("2025 – 2026")
    b.format_run(r, size_pt=11, bold=True)

    if os.path.exists(logo_path):
        p_logo = doc.add_paragraph()
        p_logo.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_logo.paragraph_format.space_after = Pt(6)
        run = p_logo.add_run()
        run.add_picture(logo_path, width=Inches(1.1))

    b.add_heading_1("CERTIFICATE")

    b.add_p("This is to certify that the project report entitled:")
    p_tit = doc.add_paragraph()
    p_tit.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_tit.paragraph_format.space_before = Pt(6)
    p_tit.paragraph_format.space_after = Pt(8)
    r = p_tit.add_run("“SAI – SMART AI PROPERTY FINDER:\nA Grounded Multilingual Conversational Framework and Geospatial Intelligence Engine for Real Estate Discovery”")
    b.format_run(r, size_pt=12.5, bold=True, color_rgb=th.COLOR_PRIMARY)

    b.add_p("Submitted by:")
    p_slist = doc.add_paragraph()
    p_slist.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_slist.paragraph_format.line_spacing = 1.3
    p_slist.paragraph_format.space_after = Pt(10)
    r = p_slist.add_run("Mr. [NAME OF STUDENT 1] (Roll No: [ROLL NO 1])\nMr. [NAME OF STUDENT 2] (Roll No: [ROLL NO 2])\nMr. [NAME OF STUDENT 3] (Roll No: [ROLL NO 3])\nMr. [NAME OF STUDENT 4] (Roll No: [ROLL NO 4])")
    b.format_run(r, size_pt=11, bold=True)

    b.add_p("is a bonafide work carried out by them in partial fulfillment of the requirements for the award of the Degree of Bachelor of Technology in Artificial Intelligence & Data Science by Sant Gadge Baba Amravati University, Amravati, during the academic session 2025–2026. The project has been completed under direct academic supervision and satisfies the academic requirements of this Autonomous Institute.")

    # Signatures Table
    sig_tbl = doc.add_table(rows=1, cols=3)
    sig_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    sig_tbl.rows[0].cells[0].width = Inches(2.1)
    sig_tbl.rows[0].cells[1].width = Inches(2.1)
    sig_tbl.rows[0].cells[2].width = Inches(2.1)

    sig_tbl.rows[0].cells[0].paragraphs[0].text = "\n\n____________________\n[NAME OF GUIDE]\nProject Guide\nDept. of AI&DS"
    sig_tbl.rows[0].cells[1].paragraphs[0].text = "\n\n____________________\n[NAME OF HOD]\nHead of the Department\nDept. of AI&DS"
    sig_tbl.rows[0].cells[2].paragraphs[0].text = "\n\n____________________\nDr. P. M. Jawandhiya\nPrincipal\nPRPCEM, Amravati"

    for cell in sig_tbl.rows[0].cells:
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.line_spacing = 1.15
        for run in p.runs:
            b.format_run(run, size_pt=9.5, bold=True)

    # -------------------------------------------------------------
    # 4. Project Approval Sheet (Page ii)
    # -------------------------------------------------------------
    doc.add_page_break()
    b.add_heading_1("PROJECT APPROVAL SHEET")
    
    p_ap1 = doc.add_paragraph()
    p_ap1.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_ap1.paragraph_format.space_before = Pt(8)
    r = p_ap1.add_run("Project Entitled:")
    b.format_run(r, size_pt=11, italic=True)

    p_aptit = doc.add_paragraph()
    p_aptit.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_aptit.paragraph_format.space_after = Pt(12)
    r = p_aptit.add_run("SAI – SMART AI PROPERTY FINDER")
    b.format_run(r, size_pt=14, bold=True, color_rgb=th.COLOR_PRIMARY)

    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_sub.paragraph_format.space_after = Pt(8)
    r = p_sub.add_run("Submitted by:")
    b.format_run(r, size_pt=11, bold=True)

    p_subnames = doc.add_paragraph()
    p_subnames.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_subnames.paragraph_format.line_spacing = 1.3
    p_subnames.paragraph_format.space_after = Pt(16)
    r = p_subnames.add_run("Mr. [NAME OF STUDENT 1]\t\tMr. [NAME OF STUDENT 2]\nMr. [NAME OF STUDENT 3]\t\tMr. [NAME OF STUDENT 4]")
    b.format_run(r, size_pt=11, bold=True)

    b.add_p("is hereby examined, presented, and officially approved for the award of the degree of:")

    p_deg = doc.add_paragraph()
    p_deg.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_deg.paragraph_format.space_before = Pt(8)
    p_deg.paragraph_format.space_after = Pt(8)
    r = p_deg.add_run("BACHELOR OF TECHNOLOGY\n(Artificial Intelligence & Data Science)\nof\nSant Gadge Baba Amravati University, Amravati.")
    b.format_run(r, size_pt=12.5, bold=True)

    p_place = doc.add_paragraph()
    p_place.paragraph_format.space_before = Pt(20)
    p_place.paragraph_format.space_after = Pt(24)
    r = p_place.add_run("Place: Amravati, Maharashtra\nDate: [SUBMISSION DATE, e.g., May 2026]")
    b.format_run(r, size_pt=10.5, bold=True)

    # Examiners Table
    ex_tbl = doc.add_table(rows=1, cols=2)
    ex_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    ex_tbl.rows[0].cells[0].width = Inches(3.2)
    ex_tbl.rows[0].cells[1].width = Inches(3.2)

    ex_tbl.rows[0].cells[0].paragraphs[0].text = "Internal Examiner:\n\n\n____________________________\nName: [NAME OF INTERNAL EXAMINER]\nDesignation: [DESIGNATION]\nDate: [DATE]"
    ex_tbl.rows[0].cells[1].paragraphs[0].text = "External Examiner:\n\n\n____________________________\nName: [NAME OF EXTERNAL EXAMINER]\nDesignation: [DESIGNATION]\nDate: [DATE]"

    for cell in ex_tbl.rows[0].cells:
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.line_spacing = 1.2
        for run in p.runs:
            b.format_run(run, size_pt=10, bold=True)

    # -------------------------------------------------------------
    # 5. Acknowledgement (Page iii)
    # -------------------------------------------------------------
    doc.add_page_break()
    b.add_heading_1("ACKNOWLEDGEMENT")
    
    b.add_p("It is our privilege and sincere duty to express our deepest sense of gratitude to all those who have been our guiding lights and extended their invaluable support throughout the conceptualization, system architecture design, and empirical implementation of our final year project report.")

    b.add_p("First and foremost, we extend our profound gratitude to our esteemed Principal, Dr. P. M. Jawandhiya, whose visionary leadership, encouragement, and institutional support have been instrumental in providing world-class laboratory infrastructure, high-performance computing facilities, and an intellectually stimulating academic atmosphere.")

    b.add_p("We express our heartfelt gratitude to our respected Head of the Department, [NAME OF HOD], Department of Artificial Intelligence & Data Science, for their consistent encouragement, academic backing, and continuous monitoring of our technical progress throughout the semester.")

    b.add_p("We are especially indebted to our project guide, [NAME OF PROJECT GUIDE], [GUIDE DESIGNATION], Department of Artificial Intelligence & Data Science, for providing invaluable technical direction, insightful critiques, resolving complex architectural bottlenecks, and demonstrating unfailing patience throughout the project lifecycle. Their rigorous academic standards and deep expertise in software engineering and artificial intelligence have shaped this thesis into a comprehensive engineering contribution.")

    b.add_p("We also extend our sincere appreciation to all faculty members and technical staff of the Department of Artificial Intelligence & Data Science for their constant technical guidance, constructive feedback during seminar presentations, and timely assistance.")

    b.add_p("Last but by no means least, we express our heartfelt appreciation to our parents, family members, and peers for their unconditional moral support, motivation, and belief in our aspirations, without which the successful culmination of this project would not have been possible.")

    p_ack_sign = doc.add_paragraph()
    p_ack_sign.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    p_ack_sign.paragraph_format.space_before = Pt(16)
    p_ack_sign.paragraph_format.line_spacing = 1.2
    r = p_ack_sign.add_run("Mr. [NAME OF STUDENT 1]\nMr. [NAME OF STUDENT 2]\nMr. [NAME OF STUDENT 3]\nMr. [NAME OF STUDENT 4]\n\nFinal Year B.Tech (AI & DS)\nDepartment of Artificial Intelligence & Data Science\nPRPCEM, Amravati")
    b.format_run(r, size_pt=10.5, bold=True)

    # -------------------------------------------------------------
    # 6. Student Declaration (Page iv)
    # -------------------------------------------------------------
    doc.add_page_break()
    b.add_heading_1("DECLARATION")

    b.add_p("We, the undersigned students of the Department of Artificial Intelligence & Data Science, P. R. Pote Patil College of Engineering & Management, Amravati, hereby declare that the work presented in this final year B.Tech project report entitled “SAI – SMART AI PROPERTY FINDER: A Grounded Multilingual Conversational Framework and Geospatial Intelligence Engine for Real Estate Discovery” is authentic, original, and carried out by us under the supervision of our project guide, [NAME OF PROJECT GUIDE].")

    b.add_p("We solemnly confirm and declare that:")
    b.add_bullet("a. Degree Requirement", "The work submitted in this project report has not been submitted previously to any other university, institute, or board for the award of any degree, diploma, fellowship, or other academic distinction.")
    b.add_bullet("b. Guidelines Compliance", "We have strictly adhered to the academic formatting, structure, and documentation guidelines stipulated by Sant Gadge Baba Amravati University and PRPCEM Autonomous Institute.")
    b.add_bullet("c. Ethical Code of Conduct", "We have conformed to the norms, standards, and ethical codes of conduct prescribed by the institute regarding software engineering honesty and academic integrity.")
    b.add_bullet("d. Citations and Permissions", "Whenever materials (text, theoretical models, algorithms, dataset structures, or figures) have been derived from external academic sources, proper academic citations have been provided in accordance with IEEE formatting standards. All proprietary rights, open-source licenses, and copyright principles have been fully respected.")

    p_dec_sign = doc.add_paragraph()
    p_dec_sign.paragraph_format.space_before = Pt(24)
    r = p_dec_sign.add_run("Place: Amravati\nDate: [SUBMISSION DATE, 2026]")
    b.format_run(r, size_pt=10.5, bold=True)

    p_dec_names = doc.add_paragraph()
    p_dec_names.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    p_dec_names.paragraph_format.space_before = Pt(10)
    p_dec_names.paragraph_format.line_spacing = 1.2
    r = p_dec_names.add_run("_______________________________\nMr. [NAME OF STUDENT 1]\n\n_______________________________\nMr. [NAME OF STUDENT 2]\n\n_______________________________\nMr. [NAME OF STUDENT 3]\n\n_______________________________\nMr. [NAME OF STUDENT 4]\n\nFinal Year Students\nDept. of Artificial Intelligence & Data Science")
    b.format_run(r, size_pt=10, bold=True)

    # -------------------------------------------------------------
    # 7. Abstract
    # -------------------------------------------------------------
    doc.add_page_break()
    b.add_heading_1("ABSTRACT")

    p_a1 = doc.add_paragraph()
    p_a1.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p_a1.paragraph_format.space_before = Pt(0)
    p_a1.paragraph_format.space_after = Pt(3)
    p_a1.paragraph_format.line_spacing = 1.12
    r_a1 = p_a1.add_run(
        "The contemporary residential and commercial real estate sector in India is experiencing unprecedented digital disruption, characterized by surging transaction volumes and expanding urban corridors. However, prospective buyers, retail investors, and real estate professionals encounter systemic frictions, including information asymmetry, unverified and duplicate listings, prohibitive language barriers across regional demographics, and the cognitive overhead of parsing complex property documentation and faceted search filters. Traditional search portals rely primarily on rigid keyword queries and static relational filters, failing to interpret complex, natural language intents and lacking verified localized domain grounding. Conversely, emerging general-purpose Large Language Models (LLMs) frequently suffer from severe factual hallucinations when querying dynamic real estate databases, fabricating non-existent property records, amenities, and market prices."
    )
    b.format_run(r_a1, size_pt=10.5)

    p_a2 = doc.add_paragraph()
    p_a2.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p_a2.paragraph_format.space_before = Pt(0)
    p_a2.paragraph_format.space_after = Pt(3)
    p_a2.paragraph_format.line_spacing = 1.12
    r_a2 = p_a2.add_run(
        "To overcome these fundamental limitations, this thesis presents SAI – Smart AI Property Finder, an enterprise-grade, domain-grounded artificial intelligence real estate platform. SAI integrates asynchronous high-performance backend microservices built with Python FastAPI, a modern, highly responsive frontend developed with React 18, TypeScript, and Tailwind CSS, and a specialized conversational AI pipeline powered by the Qwen3 language model operating through local Ollama inference. The system introduces a strict Zero-Hallucination Function Calling Architecture that converts multi-intent natural language queries into deterministic, parameterized database operations executed against indexed PostgreSQL and SQLite spatial databases. To bridge critical demographic divides, SAI incorporates a dedicated Unicode script and lexical language processing service providing native conversational search across exactly eight Indian languages: English, Hindi, Marathi, Bengali, Gujarati, Tamil, Telugu, and Kannada."
    )
    b.format_run(r_a2, size_pt=10.5)

    p_a3 = doc.add_paragraph()
    p_a3.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p_a3.paragraph_format.space_before = Pt(0)
    p_a3.paragraph_format.space_after = Pt(3)
    p_a3.paragraph_format.line_spacing = 1.12
    r_a3 = p_a3.add_run(
        "Beyond conversational discovery, SAI incorporates a Leaflet-based geospatial mapping engine leveraging OpenStreetMap tiles and Haversine spherical distance calculations; a statistical investment valuation model providing 3-year and 5-year CAGR projections, rental yields, and transit impact scores; an end-to-end legal document verification pipeline enforcing cryptographic SHA-256 integrity and MahaRERA registry cross-validation; a Three.js interactive 3D floorplan and room walkthrough engine; and enterprise Role-Based Access Control (RBAC) spanning five distinct user roles secured via JWT and RFC 6238 TOTP two-factor authentication. The system was validated through an automated test suite comprising 147 test cases, achieving a 99.3% pass rate (146 passed tests), demonstrating high robustness, fault tolerance, and production readiness for next-generation PropTech platforms across regional India."
    )
    b.format_run(r_a3, size_pt=10.5)

    p_kw = doc.add_paragraph()
    p_kw.paragraph_format.space_before = Pt(6)
    p_kw.paragraph_format.space_after = Pt(4)
    r1 = p_kw.add_run("Keywords: ")
    b.format_run(r1, size_pt=10, bold=True, color_rgb=th.COLOR_PRIMARY)
    r2 = p_kw.add_run("PropTech, Real Estate Discovery, Conversational AI, Large Language Models (LLMs), Qwen3, Function Tool Calling, Zero Hallucination, Multilingual NLP, Indic Languages, Geospatial Search, Haversine Distance, RERA Document Verification, FastAPI, React.js, PostgreSQL.")
    b.format_run(r2, size_pt=9.5, italic=True)

    # -------------------------------------------------------------
    # 8. Table of Contents (Pages v - vii style)
    # -------------------------------------------------------------
    doc.add_page_break()
    b.add_heading_1("TABLE OF CONTENTS")

    toc_data = [
        ("Certificate", "i"),
        ("Project Approval Sheet", "ii"),
        ("Acknowledgement", "iii"),
        ("Declaration", "iv"),
        ("Abstract", "v"),
        ("List of Figures", "vi"),
        ("List of Screenshots", "vii"),
        ("List of Tables", "viii"),
        ("List of Abbreviations", "ix"),
        ("", ""),
        ("CHAPTER 1: INTRODUCTION", "14"),
        ("    1.1 Background of the Study", "14"),
        ("    1.2 Motivation of the Project", "15"),
        ("    1.3 Problem Statement", "16"),
        ("    1.4 Objectives of the Project", "16"),
        ("    1.5 Scope of the Project", "17"),
        ("    1.6 Significance of the Project", "18"),
        ("    1.7 Limitations of Existing Systems", "18"),
        ("    1.8 Overview of the Proposed SAI System", "19"),
        ("    1.9 Team Member Contribution", "19"),
        ("", ""),
        ("CHAPTER 2: LITERATURE SURVEY", "20"),
        ("    2.1 Introduction", "20"),
        ("    2.2 Existing Real Estate Information Systems", "20"),
        ("    2.3 Traditional Property Search Methods", "20"),
        ("    2.4 Digital Real Estate Platforms & Faceted Search", "20"),
        ("    2.5 Artificial Intelligence in Real Estate & Hedonic Valuation", "21"),
        ("    2.6 Recommendation Systems in PropTech", "21"),
        ("    2.7 Conversational AI and Large Language Models", "21"),
        ("    2.8 Database-Driven Property Search & Spatial Indexing", "22"),
        ("    2.9 Property Document Verification & RERA Compliance", "22"),
        ("    2.10 Detailed Review of Existing Research Papers", "22"),
        ("    2.11 Comparative Analysis of Existing Approaches", "24"),
        ("    2.12 Research Gap Identified", "25"),
        ("    2.13 Need for the Proposed System (Engineering Justification)", "25"),
        ("    2.14 Chapter Summary", "26"),
        ("", ""),
        ("CHAPTER 3: PROPOSED WORK AND SYSTEM DESIGN", "27"),
        ("    3.1 Introduction & Core Philosophy", "27"),
        ("    3.2 Proposed System Overview", "27"),
        ("    3.3 Multi-Tier System Architecture", "27"),
        ("    3.4 Functional Requirements Specification", "28"),
        ("    3.5 Non-Functional Requirements Specification", "29"),
        ("    3.6 Hardware Requirements", "29"),
        ("    3.7 Software Requirements & Environment", "30"),
        ("    3.8 Technology Stack Justification", "30"),
        ("    3.9 User Roles and Role-Based Access Control (RBAC)", "30"),
        ("    3.10 System Workflow", "31"),
        ("    3.11 UML Use Case Analysis", "31"),
        ("    3.12 Data Flow Diagrams (Level 0 and Level 1)", "32"),
        ("    3.13 Sequence Diagram: Multilingual Grounded Search", "32"),
        ("    3.14 Entity-Relationship (ER) Schema Design", "32"),
        ("    3.15 Relational Database Schema Specifications", "33"),
        ("    3.16 RESTful API Architectural Design", "34"),
        ("    3.17 AI Chatbot and Grounded Tool Calling Pipeline", "34"),
        ("    3.18 Statistical Valuation & Investment Analytics Engine", "34"),
        ("    3.19 Security, Cryptography & Privacy Considerations", "35"),
        ("    3.20 Chapter Summary", "35"),
        ("", ""),
        ("CHAPTER 4: IMPLEMENTATION AND TESTING", "36"),
        ("    4.1 Introduction", "36"),
        ("    4.2 Development Environment Configuration", "36"),
        ("    4.3 Frontend Implementation (React 18 + TypeScript + Vite)", "36"),
        ("    4.4 Backend Implementation (FastAPI Asynchronous Gateway)", "36"),
        ("    4.5 Database Implementation & Alembic Migrations", "37"),
        ("    4.6 Authentication & Authorization Implementation", "37"),
        ("    4.7 Buyer Dashboard Implementation", "37"),
        ("    4.8 Owner / Seller Dashboard Implementation", "38"),
        ("    4.9 Agent Dashboard Implementation", "38"),
        ("    4.10 Builder Multi-Tower Project Dashboard Implementation", "38"),
        ("    4.11 Property Listing & Search Engine Implementation", "38"),
        ("    4.12 Property Filtering & Side-by-Side Comparison Matrix", "39"),
        ("    4.13 AI Chatbot Integration with Local Qwen3 Ollama Server", "39"),
        ("    4.14 Property Document & Verification Workflows", "39"),
        ("    4.15 Interactive Leaflet Map & Nearby Facility Engine", "39"),
        ("    4.16 Three.js 3D Property Walkthrough Module", "39"),
        ("    4.17 Super Admin Dedicated Gateway (Port 8001 Microservice)", "39"),
        ("    4.18 API Integration and Middleware Execution", "39"),
        ("    4.19 Robust Error Handling & Exception Translation", "40"),
        ("    4.20 Testing Strategy & Methodology", "40"),
        ("    4.21 Unit Testing Suites", "40"),
        ("    4.22 Integration Testing Suites", "40"),
        ("    4.23 End-to-End System Testing", "40"),
        ("    4.24 User Interface & Responsiveness Testing", "40"),
        ("    4.25 REST API Testing with Automated Fixtures", "40"),
        ("    4.26 Comprehensive Test Cases and Empirical Results", "40"),
        ("    4.27 Chapter Summary", "43"),
        ("", ""),
        ("CHAPTER 5: RESULTS AND DISCUSSION", "44"),
        ("    5.1 Introduction", "44"),
        ("    5.2 Implemented Features & Operational Capabilities", "44"),
        ("    5.3 Home Page & Conversational Discovery Evaluation", "44"),
        ("    5.4 Role-Based Dashboards Evaluation", "44"),
        ("    5.5 Search and Filtering Benchmark Analysis", "45"),
        ("    5.6 Property Comparison Matrix Output", "45"),
        ("    5.7 AI Chatbot Evaluation across 8 Indian Languages", "45"),
        ("    5.8 Document Verification & RERA Validation Workflow", "46"),
        ("    5.9 Geospatial Leaflet Map & Facility Distance Evaluation", "46"),
        ("    5.10 Three.js 3D Walkthrough & Building Inspection Output", "46"),
        ("    5.11 Super Admin Audit Log & System Telemetry Output", "47"),
        ("    5.12 Performance Evaluation & System Latency", "47"),
        ("    5.13 Comparative Benchmark against Commercial Platforms", "47"),
        ("    5.14 Key Advantages of the SAI Platform", "48"),
        ("    5.15 Limitations of the Current Implementation", "48"),
        ("    5.16 Discussion & Engineering Insights", "49"),
        ("    5.17 Chapter Summary", "49"),
        ("", ""),
        ("CHAPTER 6: CONCLUSION AND FUTURE SCOPE", "50"),
        ("    6.1 Introduction", "50"),
        ("    6.2 Summary of the Project Work", "50"),
        ("    6.3 Objectives Achieved", "50"),
        ("    6.4 Key Technical Contributions", "51"),
        ("    6.5 Current System Limitations", "51"),
        ("    6.6 Future Scope and Enhancements", "51"),
        ("    6.7 Final Conclusion", "51"),
        ("", ""),
        ("REFERENCES", "53"),
        ("", ""),
        ("APPENDICES", "56"),
        ("    Appendix A: Sample Property Data Structure", "56"),
        ("    Appendix B: Hardware and Software Specifications", "56"),
        ("    Appendix C: Selected Source-Code Snippets", "57"),
        ("    Appendix D: RESTful API Endpoint Documentation", "58"),
        ("    Appendix E: Database Migrations & Deployment Configuration", "59"),
        ("    Appendix F: Automated Pytest Suite Execution Logs", "59"),
        ("    Appendix G: Research Paper Publication & Certifications", "59")
    ]

    clean_toc_data = [item for item in toc_data if item[0].strip()]

    toc_tbl = doc.add_table(rows=len(clean_toc_data), cols=2)
    toc_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    toc_tbl.autofit = False

    for idx, (title, pg) in enumerate(clean_toc_data):
        c_title = toc_tbl.rows[idx].cells[0]
        c_pg = toc_tbl.rows[idx].cells[1]
        c_title.width = Inches(5.5)
        c_pg.width = Inches(1.0)

        is_major = "CHAPTER" in title or "REFERENCES" in title or "APPENDICES" in title
        th.set_cell_margins(c_title, top=20 if not is_major else 28, bottom=20, left=35, right=35)
        th.set_cell_margins(c_pg, top=20 if not is_major else 28, bottom=20, left=35, right=35)

        p1 = c_title.paragraphs[0]
        p1.paragraph_format.space_before = Pt(0 if not is_major else 1.0)
        p1.paragraph_format.space_after = Pt(0)
        p1.paragraph_format.line_spacing = 0.95
        p1.text = title
        for r in p1.runs:
            b.format_run(r, size_pt=8.0 if not is_major else 8.5, bold=is_major, color_rgb=th.COLOR_BLACK if not is_major else th.COLOR_PRIMARY)

        p2 = c_pg.paragraphs[0]
        p2.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        p2.paragraph_format.space_before = Pt(0 if not is_major else 1.0)
        p2.paragraph_format.space_after = Pt(0)
        p2.paragraph_format.line_spacing = 0.95
        p2.text = pg
        for r in p2.runs:
            b.format_run(r, size_pt=8.0 if not is_major else 8.5, bold=is_major)

    # -------------------------------------------------------------
    # 9. List of Figures (Page vi)
    # -------------------------------------------------------------
    doc.add_page_break()
    b.add_heading_1("LIST OF FIGURES")

    figures_data = [
        ("3.1", "SAI – Multi-Tier System Architecture Diagram", "28"),
        ("3.2", "Data Flow Diagram (DFD Level 0 – Context Level)", "32"),
        ("3.3", "Data Flow Diagram (DFD Level 1 – Subsystem Deconstruction)", "32"),
        ("3.4", "Comprehensive UML Use Case Diagram", "31"),
        ("3.5", "Sequence Diagram: Multilingual Grounded Conversational Search", "32"),
        ("3.6", "Relational Database Entity-Relationship (ER) Schema", "32"),
        ("3.7", "Grounded AI Chatbot & Function Tool-Calling Pipeline", "34"),
        ("3.8", "Document Upload, OCR & Verification Workflow", "35")
    ]

    fig_tbl = doc.add_table(rows=len(figures_data)+1, cols=3)
    fig_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    fig_tbl.rows[0].cells[0].text = "Figure No."
    fig_tbl.rows[0].cells[1].text = "Figure Title"
    fig_tbl.rows[0].cells[2].text = "Page No."
    fig_tbl.rows[0].cells[0].width = Inches(1.2)
    fig_tbl.rows[0].cells[1].width = Inches(4.3)
    fig_tbl.rows[0].cells[2].width = Inches(1.0)

    for i in range(3):
        th.set_cell_shading(fig_tbl.rows[0].cells[i], "E2E8F0")
        p = fig_tbl.rows[0].cells[i].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        for r in p.runs:
            b.format_run(r, size_pt=10, bold=True)

    for idx, (f_num, f_title, f_pg) in enumerate(figures_data):
        row = fig_tbl.rows[idx+1]
        row.cells[0].text = f_num
        row.cells[1].text = f_title
        row.cells[2].text = f_pg
        row.cells[0].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
        row.cells[2].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.RIGHT
        for c in row.cells:
            th.set_cell_margins(c, top=20, bottom=20, left=40, right=40)
            p = c.paragraphs[0]
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(0.5)
            p.paragraph_format.line_spacing = 1.0
            for r in p.runs:
                b.format_run(r, size_pt=9.0)

    # -------------------------------------------------------------
    # 10. List of Screenshots (Page vii)
    # -------------------------------------------------------------
    doc.add_page_break()
    b.add_heading_1("LIST OF SCREENSHOTS")

    screenshots_data = [
        ("4.1", "Home Page & Conversational Property Discovery Interface", "36"),
        ("4.2", "Multilingual User Registration & Role Selection Portal", "37"),
        ("4.3", "Secure Authentication with JWT & TOTP 2FA Login", "37"),
        ("4.4", "Buyer Dashboard & Saved Favorites Console", "38"),
        ("4.5", "Property Owner / Seller Listing Management Portal", "38"),
        ("4.6", "Real Estate Agent Lead & Portfolio Console", "38"),
        ("4.7", "Builder Multi-Tower Project & Unit Allocation Interface", "38"),
        ("4.8", "Super Admin Dedicated Gateway & Telemetry Console", "39"),
        ("5.1", "Interactive Leaflet Geospatial Property Map with Clustered Pins", "46"),
        ("5.2", "Side-by-Side Property Comparison Matrix", "45"),
        ("5.3", "Multilingual Conversational AI Assistant (Qwen3 Grounded Engine)", "45"),
        ("5.4", "Document Verification Workflow & OCR Inspector Pane", "46"),
        ("5.5", "Three.js 3D Interactive Floorplan & Room Walkthrough", "46"),
        ("5.6", "Nearby Facilities & Transit Proximity Visualization", "46"),
        ("5.7", "Super Admin Audit Log & System Telemetry Queue", "47"),
        ("A.1", "Sample Property Data Structure & Schema Representation", "56")
    ]

    scr_tbl = doc.add_table(rows=len(screenshots_data)+1, cols=3)
    scr_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    scr_tbl.rows[0].cells[0].text = "Screenshot No."
    scr_tbl.rows[0].cells[1].text = "Screenshot Title"
    scr_tbl.rows[0].cells[2].text = "Page No."
    scr_tbl.rows[0].cells[0].width = Inches(1.4)
    scr_tbl.rows[0].cells[1].width = Inches(4.1)
    scr_tbl.rows[0].cells[2].width = Inches(1.0)

    for i in range(3):
        th.set_cell_shading(scr_tbl.rows[0].cells[i], "E2E8F0")
        p = scr_tbl.rows[0].cells[i].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        for r in p.runs:
            b.format_run(r, size_pt=10, bold=True)

    for idx, (s_num, s_title, s_pg) in enumerate(screenshots_data):
        row = scr_tbl.rows[idx+1]
        row.cells[0].text = s_num
        row.cells[1].text = s_title
        row.cells[2].text = s_pg
        row.cells[0].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
        row.cells[2].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.RIGHT
        for c in row.cells:
            th.set_cell_margins(c, top=16, bottom=16, left=35, right=35)
            p = c.paragraphs[0]
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(0.5)
            p.paragraph_format.line_spacing = 1.0
            for r in p.runs:
                b.format_run(r, size_pt=9.0)

    # -------------------------------------------------------------
    # 11. List of Tables (Page viii)
    # -------------------------------------------------------------
    doc.add_page_break()
    b.add_heading_1("LIST OF TABLES")

    tables_data = [
        ("2.1", "Comparative Analysis of Existing Real Estate Systems and Literature", "24"),
        ("3.1", "Role-Based Access Control (RBAC) Permission Matrix across 5 Roles", "30"),
        ("3.2", "Primary Use Case Actor Specifications and Operational Triggers", "31"),
        ("3.3", "Database Relational Table Schema Specifications and Cardinalities", "33"),
        ("3.4", "Statistical Locality Capital Appreciation CAGR & Rental Yield Benchmarks", "34"),
        ("4.1", "Comprehensive Automated Pytest Execution Results (147 Test Cases)", "40"),
        ("5.1", "Comparative Feature and Technical Benchmark (SAI vs Commercial Portals)", "47"),
        ("B.1", "Hardware and Development Workstation Specifications", "56"),
        ("D.1", "Selected RESTful API Endpoints and Authorization Matrix", "58")
    ]

    tbl_tbl = doc.add_table(rows=len(tables_data)+1, cols=3)
    tbl_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl_tbl.rows[0].cells[0].text = "Table No."
    tbl_tbl.rows[0].cells[1].text = "Table Title"
    tbl_tbl.rows[0].cells[2].text = "Page No."
    tbl_tbl.rows[0].cells[0].width = Inches(1.2)
    tbl_tbl.rows[0].cells[1].width = Inches(4.3)
    tbl_tbl.rows[0].cells[2].width = Inches(1.0)

    for i in range(3):
        th.set_cell_shading(tbl_tbl.rows[0].cells[i], "E2E8F0")
        p = tbl_tbl.rows[0].cells[i].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        for r in p.runs:
            b.format_run(r, size_pt=10, bold=True)

    for idx, (t_num, t_title, t_pg) in enumerate(tables_data):
        row = tbl_tbl.rows[idx+1]
        row.cells[0].text = t_num
        row.cells[1].text = t_title
        row.cells[2].text = t_pg
        row.cells[0].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
        row.cells[2].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.RIGHT
        for c in row.cells:
            th.set_cell_margins(c, top=20, bottom=20, left=40, right=40)
            p = c.paragraphs[0]
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(0.5)
            p.paragraph_format.line_spacing = 1.0
            for r in p.runs:
                b.format_run(r, size_pt=9.0)

    # -------------------------------------------------------------
    # 12. List of Abbreviations (Page xi)
    # -------------------------------------------------------------
    doc.add_page_break()
    b.add_heading_1("LIST OF ABBREVIATIONS")

    abbr_data = [
        ("AI", "Artificial Intelligence"),
        ("ML", "Machine Learning"),
        ("NLP", "Natural Language Processing"),
        ("LLM", "Large Language Model"),
        ("RAG", "Retrieval-Augmented Generation"),
        ("API", "Application Programming Interface"),
        ("REST", "Representational State Transfer"),
        ("JWT", "JSON Web Token"),
        ("TOTP", "Time-based One-Time Password (RFC 6238)"),
        ("2FA", "Two-Factor Authentication"),
        ("RBAC", "Role-Based Access Control"),
        ("CRUD", "Create, Read, Update, Delete"),
        ("ORM", "Object Relational Mapping"),
        ("DFD", "Data Flow Diagram"),
        ("ER", "Entity Relationship"),
        ("RERA", "Real Estate Regulatory Authority (RERA Act 2016)"),
        ("MahaRERA", "Maharashtra Real Estate Regulatory Authority"),
        ("CAGR", "Compound Annual Growth Rate"),
        ("ROI", "Return on Investment"),
        ("OCR", "Optical Character Recognition"),
        ("STT", "Speech to Text"),
        ("TTS", "Text to Speech"),
        ("GIS", "Geographic Information System"),
        ("OSM", "OpenStreetMap"),
        ("BHK", "Bedroom, Hall, Kitchen"),
        ("SPA", "Single Page Application"),
        ("CSS", "Cascading Style Sheets"),
        ("HTML", "HyperText Markup Language"),
        ("HTTP", "HyperText Transfer Protocol"),
        ("HTTPS", "HyperText Transfer Protocol Secure"),
        ("JSON", "JavaScript Object Notation"),
        ("MIME", "Multipurpose Internet Mail Extensions"),
        ("SHA", "Secure Hash Algorithm (SHA-256)"),
        ("CORS", "Cross-Origin Resource Sharing"),
        ("SQL", "Structured Query Language"),
        ("ACID", "Atomicity, Consistency, Isolation, Durability"),
        ("UI / UX", "User Interface / User Experience")
    ]

    abbr_tbl = doc.add_table(rows=len(abbr_data)+1, cols=2)
    abbr_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    abbr_tbl.rows[0].cells[0].text = "Abbreviation"
    abbr_tbl.rows[0].cells[1].text = "Full Form / Definition"
    abbr_tbl.rows[0].cells[0].width = Inches(1.8)
    abbr_tbl.rows[0].cells[1].width = Inches(4.7)

    for i in range(2):
        th.set_cell_shading(abbr_tbl.rows[0].cells[i], "E2E8F0")
        p = abbr_tbl.rows[0].cells[i].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        for r in p.runs:
            b.format_run(r, size_pt=10, bold=True)

    for idx, (abbr, full) in enumerate(abbr_data):
        row = abbr_tbl.rows[idx+1]
        row.cells[0].text = abbr
        row.cells[1].text = full
        row.cells[0].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
        for c in row.cells:
            th.set_cell_margins(c, top=20, bottom=20, left=40, right=40)
            p = c.paragraphs[0]
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(0.5)
            p.paragraph_format.line_spacing = 1.0
            for r in p.runs:
                b.format_run(r, size_pt=9.0)

    print("Front matter generated successfully.")
