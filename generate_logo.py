import os
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as patches
import numpy as np

output_dir = r"g:\SAI\SAI-Figma-Test\SAI_Thesis_Output\SAI_Thesis_Diagrams"

def generate_college_logo():
    fig, ax = plt.subplots(figsize=(4.5, 4.5), dpi=300)
    fig.patch.set_alpha(0)
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 10)
    ax.axis('off')

    # Circular crest outer ring
    outer_circle = patches.Circle((5, 5), 4.6, facecolor="#F8FAFC", edgecolor="#D97706", linewidth=4)
    ax.add_patch(outer_circle)

    inner_circle = patches.Circle((5, 5), 4.3, facecolor="#FEF3C7", edgecolor="#1E3A8A", linewidth=2.5)
    ax.add_patch(inner_circle)

    # Core emblem shield/circle
    core_circle = patches.Circle((5, 5), 3.0, facecolor="#EA580C", edgecolor="#B45309", linewidth=2)
    ax.add_patch(core_circle)

    # Sunburst rays in center
    for angle in np.linspace(0, 2*np.pi, 16, endpoint=False):
        x1 = 5 + 1.2 * np.cos(angle)
        y1 = 5 + 1.2 * np.sin(angle)
        x2 = 5 + 2.5 * np.cos(angle)
        y2 = 5 + 2.5 * np.sin(angle)
        ax.plot([x1, x2], [y1, y2], color="#FDE047", lw=2)

    # Central Diya / Torch of Knowledge
    diya_base = patches.Ellipse((5, 4.3), 1.8, 0.6, facecolor="#78350F", edgecolor="#451A03", lw=1.5)
    ax.add_patch(diya_base)
    flame = patches.Polygon([[4.6, 4.6], [5.0, 5.8], [5.4, 4.6]], closed=True, facecolor="#FBBF24", edgecolor="#D97706", lw=1.2)
    ax.add_patch(flame)

    # College text circular / arc
    ax.text(5, 8.5, "P. R. POTE PATIL", fontsize=11, fontweight='black', color="#1E3A8A", ha='center', va='center')
    ax.text(5, 7.8, "GROUP OF INSTITUTIONS", fontsize=7.5, fontweight='bold', color="#1E3A8A", ha='center', va='center')
    ax.text(5, 2.1, "AMRAVATI (M.S.)", fontsize=8.5, fontweight='bold', color="#1E3A8A", ha='center', va='center')

    # Ribbon at bottom
    ribbon = patches.FancyBboxPatch((1.5, 0.4), 7.0, 1.1, boxstyle="sawtooth,pad=0.1",
                                   facecolor="#1E3A8A", edgecolor="#D97706", lw=1.5)
    ax.add_patch(ribbon)
    ax.text(5, 0.95, "VIDYA PARAM DAIVATAM", fontsize=8, fontweight='black', color="#FDE047", ha='center', va='center')

    plt.tight_layout()
    path = os.path.join(output_dir, "prpcem_logo.png")
    plt.savefig(path, bbox_inches='tight', transparent=True, dpi=300)
    plt.close()
    print("College logo generated at:", path)

if __name__ == "__main__":
    generate_college_logo()
