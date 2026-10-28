import os
import shutil
import zipfile

OUTPUT_DIR = r"g:\SAI\SAI-Figma-Test\SAI_Thesis_Output"
DOCX_PATH = os.path.join(OUTPUT_DIR, "SAI_Smart_AI_Property_Finder_Thesis.docx")
PDF_PATH = os.path.join(OUTPUT_DIR, "SAI_Smart_AI_Property_Finder_Thesis.pdf")
FACTS_PATH = os.path.join(OUTPUT_DIR, "SAI_Project_Facts_and_Placeholders.md")
DIAGRAMS_DIR = os.path.join(OUTPUT_DIR, "SAI_Thesis_Diagrams")
ZIP_PATH = os.path.join(OUTPUT_DIR, "SAI_Thesis_Package.zip")

DOWNLOADS_DIR = r"C:\Users\ISHU\Downloads\SAI_Thesis_Files"
DESKTOP_DIR = r"C:\Users\ISHU\Desktop\SAI_Thesis_Files"

os.makedirs(DOWNLOADS_DIR, exist_ok=True)
os.makedirs(DESKTOP_DIR, exist_ok=True)

# 1. Create fresh ZIP package
print(f"Creating fresh ZIP package: {ZIP_PATH}...")
with zipfile.ZipFile(ZIP_PATH, 'w', zipfile.ZIP_DEFLATED) as zipf:
    zipf.write(DOCX_PATH, arcname="SAI_Smart_AI_Property_Finder_Thesis.docx")
    zipf.write(PDF_PATH, arcname="SAI_Smart_AI_Property_Finder_Thesis.pdf")
    if os.path.exists(FACTS_PATH):
        zipf.write(FACTS_PATH, arcname="SAI_Project_Facts_and_Placeholders.md")
    if os.path.exists(DIAGRAMS_DIR):
        for root, _, files in os.walk(DIAGRAMS_DIR):
            for file in files:
                file_path = os.path.join(root, file)
                rel_path = os.path.relpath(file_path, OUTPUT_DIR)
                zipf.write(file_path, arcname=rel_path)

zip_size_mb = os.path.getsize(ZIP_PATH) / (1024 * 1024)
print(f"ZIP package created: {zip_size_mb:.2f} MB")

# 2. Copy files to Downloads and Desktop
destinations = [DOWNLOADS_DIR, DESKTOP_DIR]
files_to_copy = [DOCX_PATH, PDF_PATH, FACTS_PATH, ZIP_PATH]

for dest in destinations:
    for src in files_to_copy:
        if os.path.exists(src):
            target = os.path.join(dest, os.path.basename(src))
            shutil.copyfile(src, target)
            print(f"Copied {os.path.basename(src)} -> {dest}")

print("All distribution files deployed successfully!")
