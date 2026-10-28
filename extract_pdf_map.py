import os
import fitz  # PyMuPDF

def extract_pdf_map():
    pdf_path = r"g:\SAI\SAI-Figma-Test\SAI_Thesis_Output\SAI_Smart_AI_Property_Finder_Thesis.pdf"
    doc = fitz.open(pdf_path)
    print(f"Total PDF Pages: {len(doc)}")
    
    sections = [
        "1.1 Background", "1.2 Motivation", "1.3 Problem Statement",
        "1.4 Objectives", "1.5 Scope", "1.6 Significance", "1.7 Limitations of Existing Systems",
        "1.8 Overview of the Proposed", "1.9 Team Member Contribution",
        "2.1 Introduction", "2.2 Existing Real Estate", "2.3 Traditional Property",
        "2.4 Digital Real Estate", "2.5 Artificial Intelligence in Real Estate",
        "2.6 Recommendation Systems", "2.7 Conversational AI", "2.8 Database-Driven Property",
        "2.9 Property Document Verification", "2.10 Detailed Review", "2.11 Comparative Analysis",
        "2.12 Research Gap", "2.13 Need for the Proposed", "2.14 Chapter Summary",
        "3.1 Introduction & Core Philosophy", "3.2 Proposed System Overview",
        "3.3 Multi-Tier System Architecture", "3.4 Functional Requirements", "3.5 Non-Functional Requirements",
        "3.6 Hardware Requirements", "3.7 Software Requirements", "3.8 Technology Stack Justification",
        "3.9 User Roles and Role-Based Access", "3.10 System Workflow", "3.11 UML Use Case Analysis",
        "3.12 Data Flow Diagrams", "3.13 Sequence Diagram", "3.14 Entity-Relationship",
        "3.15 Relational Database Schema", "3.16 RESTful API Architectural", "3.17 AI Chatbot and Grounded",
        "3.18 Statistical Valuation", "3.19 Security, Cryptography", "3.20 Chapter Summary",
        "4.1 Introduction", "4.2 Development Environment Configuration",
        "4.3 Frontend Implementation", "4.4 Backend Implementation", "4.5 Database Implementation",
        "4.6 Authentication & Authorization", "4.7 Buyer Dashboard Implementation",
        "4.8 Owner / Seller Dashboard", "4.9 Agent Dashboard", "4.10 Builder Multi-Tower",
        "4.11 Property Listing & Search Engine Implementation", "4.12 Property Filtering & Side-by-Side",
        "4.13 AI Chatbot Integration with Local", "4.14 Property Document & Verification Workflows",
        "4.15 Interactive Leaflet Map", "4.16 Three.js 3D Property Walkthrough",
        "4.17 Super Admin Dedicated Gateway", "4.18 API Integration and Middleware",
        "4.19 Robust Error Handling", "4.20 Testing Strategy", "4.21 Unit Testing Suites",
        "4.22 Integration Testing Suites", "4.23 End-to-End System Testing",
        "4.24 User Interface & Responsiveness", "4.25 REST API Testing with Automated",
        "4.26 Comprehensive Test Cases and Empirical", "4.27 Chapter Summary",
        "5.1 Introduction", "5.2 Implemented Features & Operational",
        "5.3 Home Page & Conversational", "5.4 Role-Based Dashboards Evaluation",
        "5.5 Search and Filtering Benchmark", "5.6 Property Comparison Matrix Output",
        "5.7 AI Chatbot Evaluation across 8", "5.8 Document Verification & RERA",
        "5.9 Geospatial Leaflet Map & Facility", "5.10 Three.js 3D Walkthrough & Building",
        "5.11 Performance Evaluation & System", "5.12 Comparative Benchmark against Commercial",
        "5.13 Key Advantages of the SAI", "5.14 Limitations of the Current",
        "5.15 Discussion & Engineering Insights", "5.16 Chapter Summary",
        "6.1 Introduction", "6.2 Summary of the Project Work",
        "6.3 Objectives Achieved", "6.4 Key Technical Contributions",
        "6.5 Current System Limitations", "6.6 Future Scope and Enhancements",
        "6.7 Final Conclusion",
        "Appendix A", "Appendix B", "Appendix C", "Appendix D", "Appendix E", "Appendix F", "Appendix G",
        # Figures
        "Figure 3.1", "Figure 3.2", "Figure 3.3", "Figure 3.4", "Figure 3.5", "Figure 3.6", "Figure 3.7", "Figure 3.8",
        # Screenshots
        "Screenshot 4.1", "Screenshot 4.2", "Screenshot 4.3", "Screenshot 4.4", "Screenshot 4.5", "Screenshot 4.6",
        "Screenshot 4.7", "Screenshot 4.8", "Screenshot 5.1", "Screenshot 5.2", "Screenshot 5.3", "Screenshot 5.4",
        "Screenshot 5.5", "Screenshot 5.6", "Screenshot 5.7", "Screenshot A.1",
        # Tables
        "Table 2.1", "Table 3.1", "Table 3.2", "Table 3.3", "Table 3.4", "Table 4.1", "Table 5.1",
        "Table A.1", "Table B.1", "Table D.1"
    ]
    
    # Check each page from 14 to 60 (1-indexed)
    page_texts = {pno + 1: doc[pno].get_text() for pno in range(13, len(doc))}
    
    results = {}
    for s in sections:
        for pno, text in page_texts.items():
            if s in text:
                results[s] = pno
                break
                
    print("RESULTS = {")
    for k, v in results.items():
        print(f"    '{k}': '{v}',")
    print("}")

if __name__ == "__main__":
    extract_pdf_map()
