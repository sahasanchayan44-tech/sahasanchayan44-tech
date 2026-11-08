/**
 * BLUEPRINT / FORGE RUNTIME — SHARED HEADING TYPOGRAPHY COMPONENT
 * Document ID: BP-JS-TYPO-REV01
 * 
 * Authoritative geometric display typography renderer for Sheets 02–12.
 * Reuses the exact custom Latin glyph construction from Sheet 01 (S, A, N, C, H, Y)
 * on a standardized 100-unit cap-height coordinate grid.
 */

(function () {
  'use strict';

  // ============================================================================
  // 1. CANONICAL GLYPH REGISTRY (100-Unit Cap-Height Grid)
  // ============================================================================

  const GLYPHS = {
    // AUTHORITATIVE SHEET 01 MASTER GLYPHS (IMMUTABLE, REUSED VERBATIM)
    'S': {
      width: 56,
      path: "M 22,0 L 56,0 L 56,30 L 38,30 L 38,16 L 18,16 L 18,36 L 44,48 L 56,58 L 56,86 L 42,100 L 0,100 L 0,70 L 16,70 L 16,84 L 38,84 L 38,62 L 12,50 L 0,38 L 0,22 Z"
    },
    'A': {
      width: 62,
      path: "M 18,0 L 36,0 L 44,8 L 62,100 L 44,100 L 39,74 L 23,74 L 18,100 L 0,100 Z M 30,18 L 39,58 L 21,58 Z M 23,74 L 31,64 L 39,74 Z"
    },
    'N': {
      width: 56,
      path: "M 12,0 L 20,0 L 40,70 L 40,0 L 56,0 L 56,88 L 44,100 L 36,100 L 16,30 L 16,100 L 0,100 L 0,12 Z"
    },
    'C': {
      width: 54,
      path: "M 54,18 L 38,0 L 12,0 L 0,12 L 0,88 L 12,100 L 38,100 L 54,82 L 40,72 L 32,84 L 16,84 L 16,16 L 32,16 L 40,28 Z"
    },
    'H': {
      width: 56,
      path: "M 12,0 L 20,0 L 20,44 L 36,44 L 36,0 L 44,0 L 56,12 L 56,88 L 44,100 L 36,100 L 36,60 L 28,52 L 20,60 L 20,100 L 12,100 L 0,88 L 0,12 Z"
    },
    'Y': {
      width: 58,
      path: "M 12,0 L 24,0 L 30,36 L 46,0 L 58,10 L 40,48 L 40,88 L 30,100 L 18,100 L 18,48 L 0,10 Z"
    },

    // EXTENDED GEOMETRIC DISPLAY FAMILY (Anatomically Coherent)
    'B': {
      width: 56,
      path: (
        "M 0,0 L 42,0 L 56,14 L 56,36 L 42,48 L 56,60 L 56,86 L 42,100 L 0,100 Z " +
        "M 18,16 L 36,16 L 40,20 L 40,34 L 36,38 L 18,38 Z " +
        "M 18,58 L 36,58 L 40,62 L 40,80 L 36,84 L 18,84 Z"
      )
    },
    'D': {
      width: 56,
      path: (
        "M 0,0 L 38,0 L 56,18 L 56,82 L 38,100 L 0,100 Z " +
        "M 18,18 L 34,18 L 40,24 L 40,76 L 34,82 L 18,82 Z"
      )
    },
    'E': {
      width: 52,
      path: (
        "M 12,0 L 52,0 L 52,18 L 38,18 L 38,16 L 18,16 L 18,42 L 44,42 " +
        "L 44,58 L 18,58 L 18,84 L 38,84 L 38,82 L 52,82 L 52,100 L 12,100 " +
        "L 0,88 L 0,12 Z"
      )
    },
    'F': {
      width: 50,
      path: (
        "M 12,0 L 50,0 L 50,18 L 36,18 L 36,16 L 18,16 L 18,42 L 42,42 " +
        "L 42,58 L 18,58 L 18,88 L 10,100 L 0,100 L 0,12 Z"
      )
    },
    'G': {
      width: 56,
      path: (
        "M 56,20 L 40,0 L 12,0 L 0,12 L 0,88 L 12,100 L 42,100 L 56,86 " +
        "L 56,50 L 32,50 L 32,66 L 40,66 L 40,82 L 34,84 L 16,84 L 16,16 " +
        "L 34,16 L 40,24 Z"
      )
    },
    'I': {
      width: 22,
      path: "M 10,0 L 22,0 L 22,88 L 12,100 L 0,100 L 0,12 Z"
    },
    'J': {
      width: 44,
      path: (
        "M 16,0 L 44,0 L 44,86 L 32,100 L 12,100 L 0,88 L 0,60 L 16,60 " +
        "L 16,82 L 28,82 L 28,16 L 16,16 Z"
      )
    },
    'K': {
      width: 56,
      path: (
        "M 12,0 L 20,0 L 20,44 L 36,24 L 46,0 L 56,10 L 34,48 L 56,88 " +
        "L 46,100 L 20,60 L 20,88 L 12,100 L 0,100 L 0,12 Z"
      )
    },
    'L': {
      width: 48,
      path: (
        "M 12,0 L 20,0 L 20,84 L 48,84 L 48,100 L 12,100 L 0,88 L 0,12 Z"
      )
    },
    'M': {
      width: 66,
      path: (
        "M 12,0 L 20,0 L 33,62 L 46,0 L 54,0 L 66,12 L 66,88 L 54,100 " +
        "L 48,100 L 48,34 L 38,76 L 28,76 L 18,34 L 18,100 L 12,100 L 0,88 L 0,12 Z"
      )
    },
    'O': {
      width: 58,
      path: (
        "M 14,0 L 44,0 L 58,14 L 58,86 L 44,100 L 14,100 L 0,86 L 0,14 Z " +
        "M 18,18 L 40,18 L 44,22 L 44,78 L 40,82 L 18,82 L 14,78 L 14,22 Z"
      )
    },
    'P': {
      width: 54,
      path: (
        "M 12,0 L 42,0 L 54,12 L 54,48 L 42,60 L 18,60 L 18,88 L 10,100 " +
        "L 0,100 L 0,12 Z " +
        "M 18,16 L 38,16 L 42,20 L 42,40 L 38,44 L 18,44 Z"
      )
    },
    'R': {
      width: 56,
      path: (
        "M 12,0 L 42,0 L 56,12 L 56,48 L 44,60 L 56,90 L 44,100 L 30,60 " +
        "L 18,60 L 18,88 L 10,100 L 0,100 L 0,12 Z " +
        "M 18,16 L 38,16 L 42,20 L 42,40 L 38,44 L 18,44 Z"
      )
    },
    'T': {
      width: 52,
      path: (
        "M 0,0 L 52,0 L 52,18 L 35,18 L 35,88 L 27,100 L 17,100 L 17,18 " +
        "L 0,18 Z"
      )
    },
    'U': {
      width: 56,
      path: (
        "M 12,0 L 20,0 L 20,80 L 24,84 L 32,84 L 36,80 L 36,0 L 56,0 " +
        "L 56,86 L 42,100 L 14,100 L 0,86 L 0,12 Z"
      )
    },
    'V': {
      width: 58,
      path: (
        "M 12,0 L 22,0 L 29,74 L 36,0 L 46,0 L 58,12 L 38,100 L 20,100 L 0,12 Z"
      )
    },
    'X': {
      width: 56,
      path: (
        "M 12,0 L 20,0 L 28,40 L 36,0 L 44,0 L 56,12 L 38,50 L 56,88 " +
        "L 44,100 L 28,60 L 20,100 L 12,100 L 0,88 L 18,50 L 0,12 Z"
      )
    },
    'Z': {
      width: 52,
      path: (
        "M 12,0 L 52,0 L 52,18 L 22,78 L 52,78 L 52,100 L 12,100 L 0,88 " +
        "L 30,22 L 0,22 L 0,12 Z"
      )
    },

    // DIGITS
    '0': {
      width: 54,
      path: (
        "M 14,0 L 40,0 L 54,14 L 54,86 L 40,100 L 14,100 L 0,86 L 0,14 Z " +
        "M 16,18 L 38,18 L 40,22 L 40,78 L 38,82 L 16,82 L 14,78 L 14,22 Z"
      )
    },
    '1': {
      width: 32,
      path: "M 0,18 L 12,0 L 24,0 L 24,88 L 14,100 L 2,100 L 2,18 Z"
    },
    '2': {
      width: 52,
      path: (
        "M 12,0 L 42,0 L 52,10 L 52,36 L 22,78 L 52,78 L 52,100 L 12,100 " +
        "L 0,88 L 30,36 L 30,20 L 16,20 L 0,20 L 0,12 Z"
      )
    },
    '3': {
      width: 52,
      path: (
        "M 12,0 L 42,0 L 52,10 L 52,38 L 40,48 L 52,58 L 52,88 L 42,100 " +
        "L 12,100 L 0,88 L 0,72 L 16,72 L 16,82 L 36,82 L 36,60 L 22,60 " +
        "L 22,44 L 36,44 L 36,18 L 16,18 L 16,24 L 0,24 L 0,12 Z"
      )
    },
    '4': {
      width: 54,
      path: (
        "M 34,0 L 46,0 L 46,62 L 54,62 L 54,78 L 46,78 L 46,100 L 32,100 " +
        "L 32,78 L 0,78 L 0,60 L 34,0 Z M 32,22 L 12,62 L 32,62 Z"
      )
    },
    '5': {
      width: 52,
      path: (
        "M 12,0 L 52,0 L 52,18 L 18,18 L 18,40 L 42,40 L 52,50 L 52,88 " +
        "L 42,100 L 12,100 L 0,88 L 0,72 L 16,72 L 16,82 L 36,82 L 36,58 " +
        "L 16,58 L 0,42 L 0,12 Z"
      )
    },
    '6': {
      width: 54,
      path: (
        "M 14,0 L 40,0 L 52,12 L 38,20 L 18,20 L 18,44 L 40,44 L 54,54 " +
        "L 54,86 L 40,100 L 14,100 L 0,86 L 0,14 Z " +
        "M 16,58 L 38,58 L 40,62 L 40,78 L 38,82 L 16,82 L 14,78 L 14,62 Z"
      )
    },
    '7': {
      width: 50,
      path: (
        "M 10,0 L 50,0 L 50,18 L 28,100 L 14,100 L 34,20 L 0,20 L 0,10 Z"
      )
    },
    '8': {
      width: 54,
      path: (
        "M 14,0 L 40,0 L 54,12 L 54,38 L 42,48 L 54,58 L 54,86 L 40,100 " +
        "L 14,100 L 0,86 L 0,58 L 12,48 L 0,38 L 0,14 Z " +
        "M 16,18 L 38,18 L 40,22 L 40,34 L 38,38 L 16,38 L 14,34 L 14,22 Z " +
        "M 16,58 L 38,58 L 40,62 L 40,78 L 38,82 L 16,82 L 14,78 L 14,62 Z"
      )
    },
    '9': {
      width: 54,
      path: (
        "M 14,0 L 40,0 L 54,14 L 54,86 L 40,100 L 14,100 L 2,88 L 16,80 " +
        "L 36,80 L 36,56 L 14,56 L 0,44 L 0,14 Z " +
        "M 16,18 L 38,18 L 40,22 L 40,38 L 38,42 L 16,42 L 14,38 L 14,22 Z"
      )
    },

    // SYMBOLS
    ':': {
      width: 22,
      path: (
        "M 11,20 L 19,28 L 11,36 L 3,28 Z " +
        "M 11,64 L 19,72 L 11,80 L 3,72 Z"
      )
    },
    '&': {
      width: 60,
      path: (
        "M 24,0 L 38,0 L 46,10 L 46,28 L 34,40 L 48,68 L 60,68 L 60,82 L 48,82 " +
        "L 54,100 L 38,100 L 32,82 L 20,82 L 0,62 L 0,40 L 16,24 L 6,12 Z " +
        "M 18,16 L 32,16 L 34,20 L 34,26 L 28,32 L 18,32 Z " +
        "M 16,60 L 30,60 L 36,70 L 18,70 Z"
      )
    }
  };

  // ============================================================================
  // 2. REUSABLE RENDERING ENGINE (Unified Single-SVG Architecture)
  // ============================================================================

  /**
   * Renders a single word into a self-contained inline SVG element (utility).
   */
  function renderHeadingWord(word, tracking) {
    tracking = typeof tracking === 'number' ? tracking : 10;
    const paths = [];
    let currentX = 0;

    for (let i = 0; i < word.length; i++) {
      const char = word[i];
      if (GLYPHS[char]) {
        const g = GLYPHS[char];
        paths.push(`<path class="glyph-${char}" d="${g.path}" transform="translate(${currentX}, 0)"/>`);
        currentX += g.width + tracking;
      } else {
        paths.push(`<text class="fallback-char" x="${currentX}" y="82" font-size="82" font-family="var(--font-display)" font-weight="800" fill="currentColor">${char}</text>`);
        currentX += 44 + tracking;
      }
    }
    currentX -= tracking;
    const totalW = Math.max(currentX, 10);

    return (
      `<svg class="heading-word" viewBox="0 0 ${totalW} 100" height="30" preserveAspectRatio="xMinYMid meet" role="presentation">\n` +
      `  <g fill="currentColor" fill-rule="evenodd">\n` +
      paths.map(p => '    ' + p).join('\n') + '\n' +
      `  </g>\n` +
      `</svg>`
    );
  }

  /**
   * Renders a complete heading string into a single unified accessible SVG element.
   * Matches Sheet 01 (#dossier-title) architectural pattern:
   * - Single SVG with intrinsic viewBox coordinate system
   * - Accessible role="img", aria-label and <title> (no plain-text DOM duplicates)
   * - Fallback height/width attributes for failsafe containment
   */
  function renderHeadingSvg(text, options) {
    options = options || {};
    const tracking = typeof options.tracking === 'number' ? options.tracking : 10;
    const spaceWidth = typeof options.spaceWidth === 'number' ? options.spaceWidth : 34;
    const cleanText = text.trim();
    const escapedText = cleanText.replace(/&/g, '&amp;');
    const paths = [];
    let currentX = 0;

    for (let i = 0; i < cleanText.length; i++) {
      const char = cleanText[i];
      if (char === ' ') {
        currentX += spaceWidth;
      } else if (GLYPHS[char]) {
        const g = GLYPHS[char];
        paths.push(`<path class="glyph-${char}" d="${g.path}" transform="translate(${currentX}, 0)"/>`);
        currentX += g.width + tracking;
      } else {
        paths.push(`<text class="fallback-char" x="${currentX}" y="82" font-size="82" font-family="var(--font-display)" font-weight="800" fill="currentColor">${char}</text>`);
        currentX += 44 + tracking;
      }
    }
    currentX -= tracking;
    const totalW = Math.max(currentX, 10);
    const idAttr = options.id ? ` id="${options.id}"` : '';

    return (
      `<svg${idAttr} class="sheet-heading-vector" viewBox="0 0 ${totalW} 100" height="30" preserveAspectRatio="xMinYMid meet" role="img" aria-label="${escapedText}">\n` +
      `  <title>${escapedText}</title>\n` +
      `  <g fill="currentColor" fill-rule="evenodd">\n` +
      paths.map(p => '    ' + p).join('\n') + '\n' +
      `  </g>\n` +
      `</svg>`
    );
  }

  /**
   * Primary canonical heading markup generator.
   * Produces a single unified SVG with zero plain-text DOM duplicates.
   */
  function renderHeadingMarkup(text, optionsOrTracking) {
    const opts = typeof optionsOrTracking === 'number' ? { tracking: optionsOrTracking } : optionsOrTracking;
    return renderHeadingSvg(text, opts);
  }

  // Expose global component
  window.BlueprintTypography = {
    GLYPHS,
    renderHeadingWord,
    renderHeadingSvg,
    renderHeadingMarkup
  };

})();
