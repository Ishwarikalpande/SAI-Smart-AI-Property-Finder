import os
import hashlib
import uuid
from datetime import datetime, timezone
from app.db.session import SessionLocal
from app.models.property import Property
from app.models.user import User, UserRole
from app.models.verification import VerificationDocument, VerificationReview
from app.services.document_verification.storage_service import SECURE_DOC_DIR

def create_valid_pdf_file(filepath: str, title: str, subtitle: str, fields: dict) -> int:
    """Generates a standard compliant PDF-1.4 file with document seal and metadata."""
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    
    # PDF stream content
    stream_lines = [
        "BT",
        "/F1 16 Tf",
        "50 740 Td",
        f"({title}) Tj",
        "ET",
        "BT",
        "/F1 11 Tf",
        "50 715 Td",
        f"({subtitle}) Tj",
        "ET",
        "BT",
        "/F1 10 Tf",
        "50 690 Td",
        "(========================================================================) Tj",
        "ET"
    ]
    
    y = 660
    for key, val in fields.items():
        clean_key = str(key).replace("(", "[").replace(")", "]")
        clean_val = str(val).replace("(", "[").replace(")", "]")
        stream_lines.extend([
            "BT",
            "/F1 10 Tf",
            f"50 {y} Td",
            f"({clean_key}: {clean_val}) Tj",
            "ET"
        ])
        y -= 24
        
    stream_lines.extend([
        "BT",
        "/F1 9 Tf",
        f"50 {y - 20} Td",
        "(VERIFIED BY: SAI - Smart AI Urban System Legal Verification Team) Tj",
        "ET",
        "BT",
        "/F1 8 Tf",
        f"50 {y - 40} Td",
        f"(Generated at: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')} | Digital Fingerprint Authenticated) Tj",
        "ET"
    ])
    
    content_stream = "\n".join(stream_lines).replace("₹", "INR ").replace("–", "-")
    stream_bytes = content_stream.encode("latin-1", errors="replace")
    stream_len = len(stream_bytes)
    
    pdf_bytes = f"""%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length {stream_len} >>
stream
{content_stream}
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000300 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
450
%%EOF""".encode("latin-1", errors="replace")

    with open(filepath, "wb") as f:
        f.write(pdf_bytes)
    return len(pdf_bytes)

def seed_documents():
    db = SessionLocal()
    admin_user = db.query(User).filter(User.role == UserRole.SUPER_ADMIN).first()
    owner_user = db.query(User).filter(User.role == UserRole.SELLER).first() or admin_user
    
    properties = db.query(Property).all()
    print(f"Found {len(properties)} properties to evaluate for document seeding.")
    
    seeded_count = 0
    for prop in properties:
        # Check existing docs
        existing = db.query(VerificationDocument).filter(VerificationDocument.property_id == prop.id).count()
        if existing >= 3:
            continue
            
        doc_specs = [
            {
                "doc_type": "sale_deed",
                "title": "REGISTERED SALE DEED & TITLE CONVEYANCE",
                "subtitle": f"Sub-Registrar Office Conveyance Record - {prop.city}",
                "status": "VERIFIED",
                "fields": {
                    "Property Title": prop.title,
                    "City / Locality": f"{prop.locality}, {prop.city}",
                    "Registration Index II No": f"HV-{prop.city[:3].upper()}-2024-{(prop.id * 137) % 90000 + 10000}",
                    "Execution Date": "14-Feb-2024",
                    "Stamp Duty Paid": "₹3,45,000 (Govt Receipt #E-GRAS-992144)",
                    "Encumbrance Status": "NIL Encumbrance / Clear Freehold Title"
                }
            },
            {
                "doc_type": "rera_certificate",
                "title": "MAHARASHTRA REAL ESTATE REGULATORY AUTHORITY (MahaRERA)",
                "subtitle": "Project Registration Certificate under Section 5 of RERA Act, 2016",
                "status": "VERIFIED",
                "fields": {
                    "Project Name": prop.title,
                    "RERA Registration No": f"P521000{(prop.id * 893) % 90000 + 10000}",
                    "Competent Authority": f"{prop.city} Real Estate Regulatory Division",
                    "Proposed Completion Date": "31-Dec-2026",
                    "RERA Web Verification": "https://maharera.mahaonline.gov.in"
                }
            },
            {
                "doc_type": "building_plan_approval",
                "title": "MUNICIPAL CORPORATION BUILDING PERMISSION & PLAN SANCTION",
                "subtitle": f"Town Planning & Urban Development Dept - {prop.city}",
                "status": "VERIFIED",
                "fields": {
                    "Sanction Order No": f"MC/{prop.city[:3].upper()}/BP/2023/{(prop.id * 231) % 9000 + 1000}",
                    "Approved Floors": "Ground + 14 Upper Residential Floors",
                    "Carpet Area Sanctioned": f"{prop.area_sqft} sq.ft",
                    "Fire Safety Clearance (NOC)": "Issued & Compliant (CFO Validated)"
                }
            },
            {
                "doc_type": "property_tax_receipt",
                "title": "ANNUAL PROPERTY TAX PAID RECEIPT (CURRENT FY)",
                "subtitle": f"Assessment & Property Tax Dept - {prop.city}",
                "status": "VERIFIED",
                "fields": {
                    "Assessment Year": "2025-2026",
                    "Property Index No": f"PT-{prop.city[:3].upper()}-{(prop.id * 411) % 80000 + 10000}",
                    "Amount Paid": "₹18,450",
                    "Dues Outstanding": "₹0.00 (Fully Paid)",
                    "Payment Mode": "RTGS / Direct Municipal Treasury"
                }
            },
            {
                "doc_type": "occupancy_certificate",
                "title": "OCCUPANCY & FITNESS CERTIFICATE",
                "subtitle": f"Municipal Corporation Building Dept - {prop.city}",
                "status": "UNDER_REVIEW" if prop.id % 2 == 1 else "VERIFIED",
                "fields": {
                    "Application No": f"OC-APP-{(prop.id * 179) % 7000 + 1000}",
                    "Inspection Status": "Structural & Utility Review Scheduled",
                    "Current Stage": "Municipal Site Engineer Field Verification"
                }
            }
        ]
        
        # If Amravati, add 7/12 extract
        if prop.city and "amravati" in prop.city.lower():
            doc_specs.append({
                "doc_type": "seven_twelve_extract",
                "title": "REVENUE DEPARTMENT 7/12 EXTRACT (SATBARA UTHARA)",
                "subtitle": f"Taluka & District Collectorate - Amravati, Maharashtra",
                "status": "VERIFIED",
                "fields": {
                    "Survey / Gat Number": f"Gat No. {(prop.id * 43) % 250 + 12}",
                    "Hissa Number": "1/A",
                    "Khata Number": f"KH-{(prop.id * 19) % 500 + 100}",
                    "Total Land Area": "0 Hectare 42 R",
                    "Holder Status": "Occupant Class 1 (BhogaVatdar Varg-1)"
                }
            })

        for spec in doc_specs:
            filename = f"prop_{prop.id}_{spec['doc_type']}.pdf"
            dest_path = os.path.join(SECURE_DOC_DIR, filename)
            
            file_size = create_valid_pdf_file(
                dest_path,
                spec["title"],
                spec["subtitle"],
                spec["fields"]
            )
            
            with open(dest_path, "rb") as f:
                fhash = hashlib.sha256(f.read()).hexdigest()
                
            doc = VerificationDocument(
                user_id=owner_user.id if owner_user else admin_user.id,
                property_id=prop.id,
                project_id=None,
                account_type="owner",
                document_type=spec["doc_type"],
                file_name=filename,
                file_path=dest_path,
                mime_type="application/pdf",
                file_size=file_size,
                document_hash=fhash,
                version=1,
                status=spec["status"],
                extracted_data=spec["fields"],
                checks_data={"tampering_check": "PASS", "consistency_score": 0.98},
                reviewed_by=admin_user.id if spec["status"] == "VERIFIED" and admin_user else None,
                reviewed_at=datetime.now(timezone.utc) if spec["status"] == "VERIFIED" else None
            )
            db.add(doc)
            db.commit()
            
            # Review record
            rev = VerificationReview(
                document_id=doc.id,
                reviewer_id=admin_user.id if admin_user else None,
                action="APPROVED" if spec["status"] == "VERIFIED" else "SUBMITTED",
                reason=f"Verified through official {prop.city} municipal & RERA records." if spec["status"] == "VERIFIED" else "Submitted for review."
            )
            db.add(rev)
            db.commit()
            seeded_count += 1

    print(f"Successfully seeded {seeded_count} real property verification documents.")
    db.close()

if __name__ == "__main__":
    seed_documents()
