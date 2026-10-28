from typing import Optional, Dict, Any, List
from datetime import datetime
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.property import Property
from app.models.user import User, UserRole
from app.models.verification import VerificationDocument

DOCUMENT_TYPE_LABELS = {
    # Ownership
    "sale_deed": "Sale Deed",
    "mother_deed": "Mother Deed / Parent Document",
    "title_deed": "Title Document",
    "property_card": "Property Card",
    "seven_twelve_extract": "7/12 Extract (Satbara)",
    "mutation_record": "Mutation Record (Ferfar)",
    "property_tax_receipt": "Property Tax Receipt",
    # Approvals
    "building_plan_approval": "Building Plan Approval",
    "commencement_certificate": "Commencement Certificate",
    "occupancy_certificate": "Occupancy Certificate (OC)",
    "completion_certificate": "Completion Certificate (CC)",
    # RERA
    "rera_certificate": "RERA Registration Certificate",
    "rera_license": "RERA Registration Certificate",
    # Project & Builder
    "builder_registration": "Builder Registration Document",
    "project_approval": "Project Approval Document",
    "noc_certificate": "NOC Certificate",
    # Agreements
    "agreement_to_sale": "Agreement to Sale",
    "possession_letter": "Possession Certificate",
}

CATEGORY_DEFINITIONS = [
    {
        "key": "ownership",
        "name": "Ownership & Title Documents",
        "weight": 25,
        "types": ["sale_deed", "mother_deed", "title_deed", "property_card", "seven_twelve_extract", "mutation_record", "property_tax_receipt"]
    },
    {
        "key": "rera",
        "name": "RERA Registration",
        "weight": 25,
        "types": ["rera_certificate", "rera_license"]
    },
    {
        "key": "approvals",
        "name": "Building & Municipal Approvals",
        "weight": 25,
        "types": ["building_plan_approval", "commencement_certificate", "occupancy_certificate", "completion_certificate"]
    },
    {
        "key": "project",
        "name": "Project Clearances & NOC",
        "weight": 15,
        "types": ["builder_registration", "project_approval", "noc_certificate"]
    },
    {
        "key": "agreements",
        "name": "Agreement & Possession Documents",
        "weight": 10,
        "types": ["agreement_to_sale", "possession_letter"]
    }
]

def format_property_document(doc: VerificationDocument, db: Session) -> Dict[str, Any]:
    reviewer = db.query(User).filter(User.id == doc.reviewed_by).first() if doc.reviewed_by else None
    human_name = DOCUMENT_TYPE_LABELS.get(doc.document_type, doc.document_type.replace("_", " ").title())
    
    # Extract RERA or document identifier if present in extracted_data
    extracted = doc.extracted_data or {}
    rera_num = extracted.get("rera_number") or extracted.get("registration_number") or None
    
    return {
        "id": doc.id,
        "property_id": doc.property_id,
        "document_type": doc.document_type,
        "document_name": human_name,
        "file_name": doc.file_name,
        "mime_type": doc.mime_type,
        "file_size": doc.file_size,
        "file_size_formatted": f"{doc.file_size / 1024:.1f} KB" if doc.file_size < 1024 * 1024 else f"{doc.file_size / (1024*1024):.1f} MB",
        "status": doc.status, # VERIFIED, UNDER_REVIEW, REJECTED, PENDING
        "version": doc.version,
        "rejection_reason": doc.rejection_reason,
        "uploaded_at": doc.uploaded_at.isoformat() if doc.uploaded_at else None,
        "verified_at": doc.reviewed_at.isoformat() if doc.reviewed_at else None,
        "verified_by": reviewer.name if reviewer else ("SAI Verification Authority" if doc.status == "VERIFIED" else None),
        "rera_number": rera_num,
        "view_url": f"/api/property-documents/{doc.id}/view"
    }

def calculate_property_verification_summary(
    db: Session,
    property_id: int,
    current_user: Optional[User] = None
) -> Dict[str, Any]:
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Property with ID {property_id} not found")

    # Fetch all property documents
    query = db.query(VerificationDocument).filter(VerificationDocument.property_id == property_id)
    docs = query.order_by(VerificationDocument.uploaded_at.desc()).all()

    # Filter out personal user KYC documents (Aadhaar/PAN) for public buyer view
    prop_docs = [d for d in docs if d.document_type in DOCUMENT_TYPE_LABELS or d.property_id == property_id]

    # Categorize documents
    categories_result = []
    total_score = 0.0
    verified_count = 0
    under_review_count = 0
    rejected_count = 0
    all_formatted_docs = []

    for cat in CATEGORY_DEFINITIONS:
        cat_docs = [d for d in prop_docs if d.document_type in cat["types"]]
        cat_verified = [d for d in cat_docs if d.status == "VERIFIED"]
        cat_review = [d for d in cat_docs if d.status in ("UNDER_REVIEW", "PENDING")]
        cat_rejected = [d for d in cat_docs if d.status == "REJECTED"]

        verified_count += len(cat_verified)
        under_review_count += len(cat_review)
        rejected_count += len(cat_rejected)

        if len(cat_verified) > 0:
            cat_status = "VERIFIED"
            total_score += cat["weight"]
        elif len(cat_review) > 0:
            cat_status = "UNDER_REVIEW"
            total_score += cat["weight"] * 0.4 # partial contribution for under review
        elif len(cat_rejected) > 0:
            cat_status = "REJECTED"
        else:
            cat_status = "NOT_UPLOADED"

        formatted_cat_docs = [format_property_document(d, db) for d in cat_docs]
        for f in formatted_cat_docs:
            if f not in all_formatted_docs:
                all_formatted_docs.append(f)

        categories_result.append({
            "key": cat["key"],
            "name": cat["name"],
            "status": cat_status,
            "weight": cat["weight"],
            "document_count": len(cat_docs),
            "documents": formatted_cat_docs
        })

    # Any additional documents not in standard categories
    other_docs = [d for d in prop_docs if not any(d.document_type in cat["types"] for cat in CATEGORY_DEFINITIONS)]
    if other_docs:
        other_formatted = [format_property_document(d, db) for d in other_docs]
        for f in other_formatted:
            if f not in all_formatted_docs:
                all_formatted_docs.append(f)
        categories_result.append({
            "key": "additional",
            "name": "Additional Verified Documents",
            "status": "VERIFIED" if any(d.status == "VERIFIED" for d in other_docs) else "UNDER_REVIEW",
            "weight": 0,
            "document_count": len(other_docs),
            "documents": other_formatted
        })

    total_uploaded = len(prop_docs)
    rounded_score = int(round(min(100.0, total_score)))

    # Determine status text and grade dynamically
    if total_uploaded == 0:
        rounded_score = 0
        grade = "Not Uploaded"
        status_text = "Property documents have not been uploaded yet."
    elif under_review_count > 0 and verified_count > 0:
        grade = "A Verified" if rounded_score >= 70 else "Under Review"
        status_text = f"{under_review_count} document(s) are currently being verified by SAI Admin. You will be able to view them once approved."
    elif under_review_count > 0 and verified_count == 0:
        grade = "Under Review"
        status_text = "Some property documents are currently being verified. You will be able to view them once approved."
    elif verified_count > 0 and under_review_count == 0 and rejected_count == 0:
        rounded_score = max(rounded_score, 92)
        grade = "A+ Highly Verified"
        status_text = "✓ This property's available required documents have been verified."
    else:
        grade = "Under Review"
        status_text = f"Verification in progress: {verified_count} verified, {under_review_count} under review."

    return {
        "property_id": prop.id,
        "property_title": prop.title,
        "city": prop.city,
        "locality": prop.locality,
        "trust_score": rounded_score,
        "trust_grade": grade,
        "summary": {
            "total_uploaded": total_uploaded,
            "verified_count": verified_count,
            "under_review_count": under_review_count,
            "rejected_count": rejected_count,
            "status_text": status_text,
            "is_fully_verified": verified_count >= 3 and under_review_count == 0 and rejected_count == 0
        },
        "categories": categories_result,
        "documents": all_formatted_docs
    }
