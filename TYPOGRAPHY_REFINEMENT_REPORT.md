# BLUEPRINT — TYPOGRAPHY REFINEMENT REPORT
## Custom Indic-Inspired Latin Display Letterforms // Sheet 01 System Cover

**Document ID:** `SAHA-BP-TYPO-REFINE-01`  
**Target Identity:** `SANCHAYAN SAHA` (Preserved English Latin Spelling)  
**Target Component:** [`#dossier-title`](file:///home/sanchayan/Projects/BLUEPRINT/docs/index.html#L157-L185) on Sheet 01 System Cover  
**Visual Reference:** *Tukda — A Devanagari Typeface* by Aarohi Wabale (`references/tukda-reference.jpg`)  
**Status:** IMPLEMENTED & VERIFIED LOCALLY // PENDING USER REVIEW  

---

> [!IMPORTANT]
> **TASK ISOLATION COMPLIANCE**  
> This design refinement was executed strictly within the boundaries of Sheet 01 title typography.  
> - **Phase 4 implementation is NOT started**; `PHASE_4_2_IMPLEMENTATION_PLAN.md` remains unchanged.  
> - No remote commits, pushes, repository creations, or deployments were performed.  
> - The live local preview server on `http://localhost:8088` runs the verified prototype.

---

## 1. Executive Summary

The title on Sheet 01 (System Cover) has been transformed from standard sans-serif system typography into a bespoke, architectural, Indic-inspired Latin display design. The letterforms honor the visual anatomy of the supplied reference (**Tukda** by Aarohi Wabale) — featuring massive geometric stroke weights, sharp 45° chiseled terminals, faceted trapezoidal and triangular counters, bold horizontal headline (Shiro Rekha) anchors, and Devanagari-inspired Matra cuts.

To guarantee **100% offline autonomy**, zero network latency, and millimeter-precise geometric execution, the 13 characters across the 6 unique glyphs (`S`, `A`, `N`, `C`, `H`, `Y`) were engineered as custom vector SVG display letterforms on a unified 100-unit architectural grid.

```
       [45° Chisel Chamfer]
          ┌─────────────┐  ◄─── [Bold Shiro Rekha Headline Anchor]
          │             │
          │    ▲        │  ◄─── [Triangular Geometric Counter]
          │   / \       │
          │  /   \      │
          │ /=====\     │  ◄─── [45° Faceted Matra Notch Crossbar]
         / /       \ \
        /_/         \_\    ◄─── [45° Beveled Architectural Ground Foot]
```

---

## 2. Visual Reference & Anatomical Deconstruction

The visual reference (*Tukda - A Devanagri Typeface*) exhibits distinctive geometric characteristics derived from carved stone, architectural steel, and Devanagari modular calligraphy.

![Tukda Devanagari Reference](/home/sanchayan/.gemini/antigravity-cli/brain/ba104f24-3512-447a-94f4-28ebcde27861/tukda-reference.jpg)

### Anatomical Translation Matrix: Devanagari to Latin

| Devanagari Tukda Feature | Geometric Mechanism in Reference | Latin Adaptation in `SANCHAYAN SAHA` | Applied In Glyphs |
| :--- | :--- | :--- | :--- |
| **Shiro Rekha (सिरोरेखा)** | Continuous horizontal headline bar anchoring letterforms from above | Flat, heavy horizontal headstrokes with 45° corner bevels | `A`, `C`, `S`, `N`, `H` |
| **Matra Notch (मात्रा खांच)** | Triangular cuts where vowel signs connect to consonant stems | 45° upward faceted chevron cutouts in internal crossbars | `A`, `H` |
| **Angular Terminal (कोणीय सिरा)** | Sharp 45°/60° chiseled cuts terminating open strokes | Beveled chamfers terminating arms and stems instead of blunt 90° or rounded cuts | `S`, `C`, `N`, `Y` |
| **Polygonal Counter (बहुभुज आंतरिक)** | Sharp triangular and trapezoidal negative spaces inside loops | Faceted inner counters created with compound paths | `A`, `C`, `S` |
| **Massive Stem Weight (भारी स्तंभ)** | Monolithic vertical pillars with high stroke-to-counter ratio | Heavy structural pillars (22–24 units wide on 100-unit grid) | All Glyphs (`S, A, N, C, H, Y`) |
| **Beveled Foot (छिन्न पाद)** | 45° chamfers where vertical strokes meet the baseline | Angled ground bevels creating a chiseled architectural footing | `N`, `H`, `Y` |

---

## 3. Typographic Evaluation & Technical Rationale

Before committing to custom vector lettering, candidate Latin display typefaces were evaluated for visual congruence with the Tukda reference and offline resilience:

![Font Candidate Evaluation](/home/sanchayan/.gemini/antigravity-cli/brain/ba104f24-3512-447a-94f4-28ebcde27861/font-eval-comparison.png)

### Candidate Comparison Matrix

| Approach | Aesthetic Congruence | 45° Carved Facets & Counters | Offline Resilience | Latency / Dependencies | Verdict |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Bungee** | Medium (Heavy industrial) | ❌ Softened rounded corners; standard 90° cuts | Requires local TTF embedding | ~110 KB font binary | **Rejected**: Lacks Tukda's sharp carved chiseled essence |
| **Bowlby One SC** | Low (Wood-type display) | ❌ Chubby, bulbous silhouettes; zero geometric facets | Requires local TTF embedding | ~120 KB font binary | **Rejected**: Too soft and bulbous; contradicts technical aesthetic |
| **Unbounded Black 900** | Medium-High (Wide geometric) | ❌ Smooth continuous circular arcs; no Shiro Rekha anchors | Requires local TTF embedding | ~95 KB font binary | **Rejected**: Ultra-modern techno, but lacks Indic carved calligraphy |
| **Yatra One** | Medium-Low (Devanagari Latin) | ❌ 19th-century bracketed slab serifs; thin strokes | Requires local TTF embedding | ~85 KB font binary | **Rejected**: Victorian railway slab, not Tukda's monolithic stone cuts |
| **Custom Vector SVG** *(Selected)* | **100% Perfect Match** | **Full vertex control** over every 45° chamfer, Matra notch, and Shiro Rekha | **100% Offline** (Zero external dependencies) | **0 KB HTTP requests**; embedded directly in DOM | **ACCEPTED**: Millimeter precision, zero layout shift, fully accessible |

---

## 4. Glyph Anatomy & Coordinate Specifications

All 6 unique glyphs were engineered on a standardized 100-unit vertical coordinate space ($y = 0$ to $y = 100$). Letter spacing is uniformly calibrated to 14 units.

### 1. Glyph `S` (Width: 68 units)
- **Top Arm:** Horizontal Shiro Rekha cap with top-left 45° chamfer `(16,0) -> (68,0)`.
- **Upper Spine:** Inward horizontal notch `(68,34) -> (50,34) -> (50,22) -> (24,22)`.
- **Center Diagonal:** Massive diagonal spine connecting upper and lower chambers `(24,38) -> (52,48) -> (68,58)`.
- **Bottom Terminal:** 45° upward chisel terminal at `(0,66) -> (18,66) -> (18,78) -> (44,78) -> (44,62)`.
- **Path:** `M 16,0 L 68,0 L 68,34 L 50,34 L 50,22 L 24,22 L 24,38 L 52,48 L 68,58 L 68,84 L 52,100 L 0,100 L 0,66 L 18,66 L 18,78 L 44,78 L 44,62 L 16,52 L 0,42 L 0,16 Z`

### 2. Glyph `A` (Width: 74 units)
- **Headline Anchor:** Solid horizontal Shiro Rekha roof `(22,0) -> (52,0)`.
- **Triangular Outer Form:** Monolithic diagonal legs tapering from head to ground `(74,100)` and `(0,100)`.
- **Upper Counter:** Sharp triangular negative space `(37,20) L (45,54) L (29,54) Z`.
- **Tukda Matra Notch:** 45° upward faceted chevron cut out of crossbar `(32,74) L (37,64) L (42,74) Z`.
- **Path (`fill-rule="evenodd"`):** `M 22,0 L 52,0 L 74,100 L 48,100 L 42,74 L 32,74 L 26,100 L 0,100 Z M 37,20 L 45,54 L 29,54 Z M 32,74 L 37,64 L 42,74 Z`

### 3. Glyph `N` (Width: 72 units)
- **Left Pillar:** Vertical stem with top-left 45° chamfer `(0,10) -> (10,0)`.
- **Diagonal Bar:** Monolithic diagonal slash descending from `(22,0)` to `(50,62)`.
- **Right Pillar:** Ascending vertical pillar meeting top at `(72,0)`.
- **Beveled Ground Foot:** 45° beveled chamfer at baseline `(72,88) -> (62,100) -> (50,100)`.
- **Path:** `M 10,0 L 22,0 L 50,62 L 50,0 L 72,0 L 72,88 L 62,100 L 50,100 L 22,38 L 22,100 L 0,100 L 0,10 Z`

### 4. Glyph `C` (Width: 68 units)
- **Top Terminal:** 45° chisel terminal cut `(68,22) -> (54,0)`.
- **Top Anchor:** Horizontal headstroke `(54,0) -> (16,0)` with chamfer to `(0,16)`.
- **Massive Spine:** 22-unit monolithic vertical back `(0,16) -> (0,84)`.
- **Bottom Terminal:** Symmetrical 45° upward chisel terminal `(54,100) -> (68,78)`.
- **Internal Facets:** 45° inner chamfer transitions at `(22,20) -> (40,20)` and `(40,80) -> (22,80)`.
- **Path:** `M 68,22 L 54,0 L 16,0 L 0,16 L 0,84 L 16,100 L 54,100 L 68,78 L 46,78 L 40,80 L 22,80 L 22,20 L 40,20 L 46,22 Z`

### 5. Glyph `H` (Width: 72 units)
- **Twin Monolithic Pillars:** Left and right vertical structural pillars with 45° outer chamfers at all 4 exterior corners.
- **Crossbar Bracket Notches:** Central crossbar between $y=38$ and $y=62$, featuring 45° faceted bracket cuts at top `(32,38) -> (36,44) -> (40,38)` and bottom `(40,62) -> (36,56) -> (32,62)`.
- **Path:** `M 10,0 L 22,0 L 22,38 L 32,38 L 36,44 L 40,38 L 50,38 L 50,0 L 62,0 L 72,10 L 72,88 L 62,100 L 50,100 L 50,62 L 40,62 L 36,56 L 32,62 L 22,62 L 22,88 L 10,100 L 0,100 L 0,10 Z`

### 6. Glyph `Y` (Width: 70 units)
- **Diagonal Arms:** Angled upper branches meeting at central junction `(35,38)` and `(47,54)` with 45° faceted cuts.
- **Vertical Base Stem:** Monolithic center trunk descending from $y=54$ to $y=100$.
- **Beveled Base Foot:** 45° chiseled corner at `(47,88) -> (37,100)`.
- **Path:** `M 12,0 L 24,0 L 35,38 L 46,0 L 58,0 L 70,12 L 47,54 L 47,88 L 37,100 L 23,100 L 23,54 L 0,12 Z`

---

## 5. Responsive Architecture & Accessibility

### Two-Word Partitioning
The title is partitioned into two responsive SVG components:
1. `SANCHAYAN` (viewBox: `0 0 756 100`, Aspect Ratio: 7.56 : 1)
2. `SAHA` (viewBox: `0 0 330 100`, Aspect Ratio: 3.30 : 1)

Because both SVGs share the identical 100-unit cap-height coordinate grid, setting identical CSS heights guarantees that letterforms in both words render at the **exact same stroke weight and optical scale**.

### Accessibility Tree & WAI-ARIA
```html
<h1 class="dossier-title" id="dossier-title" aria-label="SANCHAYAN SAHA">
  <span class="sr-only">SANCHAYAN SAHA</span>
  <span class="indic-title-display" aria-hidden="true">
    <!-- SVG letterforms hidden from accessibility tree -->
  </span>
</h1>
```
- **Screen Readers**: Read standard string `"SANCHAYAN SAHA"` via both `aria-label` and the `.sr-only` span.
- **Search Engines**: Index pure semantic text with zero SVG path confusion.
- **Clipboard Selection**: Clean text selection supported without SVG node fragmentation.

---

## 6. Verification Results & Viewport Performance

### Automated Verification Metrics

| Viewport Mode | Resolution | Title Width | SANCHAYAN (W×H) | SAHA (W×H) | Doc Overflow | Scroll Delta |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Desktop Large** | 1920 × 1080 | 746 px | 746 × 67 px | 328 × 67 px | **0 px (False)** | 0.0 px |
| **Desktop Standard** | 1440 × 900 | 532 px | 532 × 67 px | 234 × 67 px | **0 px (False)** | 0.0 px |
| **Tablet** | 768 × 1024 | 689 px | 689 × 40 px | 303 × 40 px | **0 px (False)** | 0.0 px |
| **Mobile Standard** | 390 × 844 | 326 px | 326 × 43 px | 143 × 43 px | **0 px (False)** | 0.0 px |
| **Mobile Ultracompact** | 320 × 700 | 268 px | 268 × 35 px | 118 × 36 px | **0 px (False)** | 0.0 px |

### Regression Suite Health
- **Phase 3.2 Automated Audit:** `16 / 16 PASSED (0 FAILS)`
- **Console Health:** `0 uncaught errors`
- **Modal Accessibility:** Preserved with focus trapping and Escape restoration.

---

## 7. Visual Progression: Before vs After

````carousel
![Desktop 1440 Before](/home/sanchayan/.gemini/antigravity-cli/brain/ba104f24-3512-447a-94f4-28ebcde27861/screenshot-sheet01-before-desktop.png)
<!-- slide -->
![Desktop 1440 After (Indic-Inspired)](/home/sanchayan/.gemini/antigravity-cli/brain/ba104f24-3512-447a-94f4-28ebcde27861/screenshot-sheet01-after-desktop-1440.png)
<!-- slide -->
![Mobile 390 Before](/home/sanchayan/.gemini/antigravity-cli/brain/ba104f24-3512-447a-94f4-28ebcde27861/screenshot-sheet01-before-mobile.png)
<!-- slide -->
![Mobile 390 After (Indic-Inspired)](/home/sanchayan/.gemini/antigravity-cli/brain/ba104f24-3512-447a-94f4-28ebcde27861/screenshot-sheet01-after-mobile-390.png)
<!-- slide -->
![Tablet 768 After (Indic-Inspired)](/home/sanchayan/.gemini/antigravity-cli/brain/ba104f24-3512-447a-94f4-28ebcde27861/screenshot-sheet01-after-tablet-768.png)
<!-- slide -->
![Mobile 320 Ultracompact After](/home/sanchayan/.gemini/antigravity-cli/brain/ba104f24-3512-447a-94f4-28ebcde27861/screenshot-sheet01-after-mobile-320.png)
````

---

## 8. Modified Codebase Files

1. [`docs/index.html`](file:///home/sanchayan/Projects/BLUEPRINT/docs/index.html#L157-L185):
   - Replaced plain text in `#dossier-title` with accessible dual-word SVG vector lettering and `.sr-only` fallback.
2. [`docs/css/sheet-01.css`](file:///home/sanchayan/Projects/BLUEPRINT/docs/css/sheet-01.css#L76-L135):
   - Configured `.dossier-title`, `.indic-title-display`, `.title-word`, `.word-sanchayan`, `.word-saha`, and `.sr-only`.
3. `references/tukda-reference.jpg`:
   - Visual inspiration reference image preserved in repository.

---

## 9. Conclusion & Review Status

The typography refinement has been successfully deployed and verified locally on the Forge Runtime. The title now possesses the chiseled, architectural presence of the Tukda Devanagari reference while preserving 100% offline autonomy and strict accessibility standards.

**Awaiting user inspection and authorization.**
