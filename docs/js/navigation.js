/**
 * BLUEPRINT / FORGE RUNTIME — UNIFIED DOSSIER NAVIGATION CONTROLLER
 * Document ID: BP-JS-NAV-REV01
 * Specification: BLUEPRINT_MASTER_PROMPT.md
 */

(function () {
  'use strict';

  const SHEETS = [
    { num: '01', id: 'sheet-01', title: 'SYSTEM COVER', docId: 'SAHA-BP-2026-01' },
    { num: '02', id: 'sheet-02', title: 'BIOGRAPHICAL DATA', docId: 'SAHA-BP-2026-02' },
    { num: '03', id: 'sheet-03', title: 'DEVELOPMENT STACK', docId: 'SAHA-BP-2026-03' },
    { num: '04', id: 'sheet-04', title: 'PROJECT ARCHITECTURE', docId: 'SAHA-BP-2026-04' },
    { num: '05', id: 'sheet-05', title: 'LIVE GITHUB ACTIVITY', docId: 'SAHA-BP-2026-05' },
    { num: '06', id: 'sheet-06', title: 'CONTRIBUTION ANALYSIS', docId: 'SAHA-BP-2026-06' },
    { num: '07', id: 'sheet-07', title: 'RESEARCH LABORATORY', docId: 'SAHA-BP-2026-07' },
    { num: '08', id: 'sheet-08', title: 'SYSTEM ARCHITECTURE', docId: 'SAHA-BP-2026-08' },
    { num: '09', id: 'sheet-09', title: 'LEARNING ROADMAP', docId: 'SAHA-BP-2026-09' },
    { num: '10', id: 'sheet-10', title: 'ENGINEERING LOGBOOK', docId: 'SAHA-BP-2026-10' },
    { num: '11', id: 'sheet-11', title: 'CONTACT & CONNECTIONS', docId: 'SAHA-BP-2026-11' },
    { num: '12', id: 'sheet-12', title: 'DOCUMENT INDEX', docId: 'SAHA-BP-2026-12' }
  ];

  let currentSheetIndex = 0; // 0-indexed (0 = Sheet 01)

  function updateSheetUI(index) {
    const sheet = SHEETS[index];
    if (!sheet) return;

    currentSheetIndex = index;

    // 1. Activate Sheet Container
    const allSheets = document.querySelectorAll('.sheet-container');
    allSheets.forEach(el => {
      if (el.id === sheet.id) {
        el.classList.add('active-sheet');
        el.setAttribute('aria-hidden', 'false');
      } else {
        el.classList.remove('active-sheet');
        el.setAttribute('aria-hidden', 'true');
      }
    });

    // 2. Update Navigation Tab Highlights
    const tabButtons = document.querySelectorAll('.sheet-tab-btn');
    tabButtons.forEach(btn => {
      const targetId = btn.getAttribute('data-target');
      if (targetId === sheet.id) {
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
      } else {
        btn.classList.remove('active');
        btn.setAttribute('aria-selected', 'false');
      }
    });

    // 3. Update Mobile Dropdown
    const mobileSelect = document.getElementById('mobile-sheet-select');
    if (mobileSelect && mobileSelect.value !== sheet.id) {
      mobileSelect.value = sheet.id;
    }

    // 4. Update Header Badge and Doc ID
    const headerSheetBadge = document.querySelector('.sheet-badge');
    if (headerSheetBadge) {
      headerSheetBadge.textContent = `SHEET: ${sheet.num} / 12`;
      headerSheetBadge.setAttribute('aria-label', `Sheet ${parseInt(sheet.num, 10)} of 12`);
    }

    const headerDocId = document.querySelector('.meta-val');
    if (headerDocId) {
      headerDocId.textContent = sheet.docId;
    }

    // 5. Update Navigation Bar Status Label
    const activeNavLabel = document.getElementById('nav-active-sheet-name');
    if (activeNavLabel) {
      activeNavLabel.innerHTML = `SHEET ${sheet.num} // <strong>${sheet.title}</strong>`;
    }

    // 6. Update Footer Sheet Number & Bottom Margin Checksum
    const footerSheetLabel = document.getElementById('footer-sheet-label');
    if (footerSheetLabel) {
      footerSheetLabel.textContent = `SHEET ${sheet.num} OF 12`;
    }

    const bottomMarginSheet = document.getElementById('bottom-margin-sheet');
    if (bottomMarginSheet) {
      bottomMarginSheet.textContent = `[END OF SHEET ${sheet.num} / 12]`;
    }

    // 7. Update Prev/Next Buttons
    const prevBtn = document.getElementById('nav-btn-prev');
    const nextBtn = document.getElementById('nav-btn-next');
    if (prevBtn) prevBtn.disabled = index === 0;
    if (nextBtn) nextBtn.disabled = index === SHEETS.length - 1;

    // 8. Highlight Active Row in Sheet 12 Master Index Table
    const indexRows = document.querySelectorAll('.master-index-table tbody tr');
    indexRows.forEach((row, i) => {
      if (i === index) {
        row.classList.add('active-index-row');
      } else {
        row.classList.remove('active-index-row');
      }
    });

    // Reset scroll position to top instantly
    window.scrollTo(0, 0);
  }

  function goToSheet(index, pushToHistory = true) {
    if (index < 0 || index >= SHEETS.length) return;
    const sheet = SHEETS[index];

    if (pushToHistory && window.location.hash !== `#${sheet.id}`) {
      window.history.pushState({ sheetIndex: index }, '', `#${sheet.id}`);
    } else if (!pushToHistory && window.location.hash !== `#${sheet.id}`) {
      window.history.replaceState({ sheetIndex: index }, '', `#${sheet.id}`);
    }

    updateSheetUI(index);
  }

  function nextSheet() {
    if (currentSheetIndex < SHEETS.length - 1) {
      goToSheet(currentSheetIndex + 1);
    }
  }

  function prevSheet() {
    if (currentSheetIndex > 0) {
      goToSheet(currentSheetIndex - 1);
    }
  }

  function parseHash() {
    const hash = window.location.hash.replace('#', '');
    const foundIndex = SHEETS.findIndex(s => s.id === hash);
    return foundIndex !== -1 ? foundIndex : 0;
  }

  function initNavigation() {
    const prevBtn = document.getElementById('nav-btn-prev');
    const nextBtn = document.getElementById('nav-btn-next');
    const mobileSelect = document.getElementById('mobile-sheet-select');
    const tabButtons = document.querySelectorAll('.sheet-tab-btn');

    if (prevBtn) {
      prevBtn.addEventListener('click', prevSheet);
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', nextSheet);
    }

    if (mobileSelect) {
      mobileSelect.addEventListener('change', (e) => {
        const targetId = e.target.value;
        const index = SHEETS.findIndex(s => s.id === targetId);
        if (index !== -1) goToSheet(index);
      });
    }

    tabButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = btn.getAttribute('data-target');
        const index = SHEETS.findIndex(s => s.id === targetId);
        if (index !== -1) goToSheet(index);
      });
    });

    // Quick direct links anywhere on the page (e.g. from Sheet 12 Document Index or Sheet 01 buttons)
    document.addEventListener('click', (e) => {
      const jumpLink = e.target.closest('[data-jump-sheet]');
      if (jumpLink) {
        e.preventDefault();
        const sheetNum = jumpLink.getAttribute('data-jump-sheet');
        const index = SHEETS.findIndex(s => s.num === sheetNum || s.id === sheetNum);
        if (index !== -1) goToSheet(index);
      }
    });

    // Browser back/forward navigation (popstate)
    window.addEventListener('popstate', (e) => {
      const targetIdx = (e.state && typeof e.state.sheetIndex === 'number') ? e.state.sheetIndex : parseHash();
      goToSheet(targetIdx, false);
    });

    // Hash change handler
    window.addEventListener('hashchange', () => {
      goToSheet(parseHash(), false);
    });

    // Ensure instant top alignment on initial load with hash
    if (window.location.hash) {
      window.scrollTo(0, 0);
      window.addEventListener('load', () => {
        setTimeout(() => window.scrollTo(0, 0), 20);
      });
    }

    // Keyboard navigation (ArrowLeft/ArrowRight, Home, End)
    window.addEventListener('keydown', (e) => {
      // Do not intercept if user is typing in an input/select/textarea, inspecting SVG nodes, or modal is open
      const modal = document.getElementById('project-modal');
      if (modal && modal.classList.contains('open')) {
        return;
      }
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'SELECT' || activeEl.isContentEditable)) {
        return;
      }
      if (activeEl && activeEl.classList.contains('schematic-node')) {
        return;
      }

      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        nextSheet();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        prevSheet();
      } else if (e.key === 'Home') {
        goToSheet(0);
      } else if (e.key === 'End') {
        goToSheet(SHEETS.length - 1);
      }
    });

    // Boot with initial sheet
    goToSheet(parseHash(), false);
  }

  // Expose global controller
  window.BlueprintNavigation = {
    goToSheet,
    nextSheet,
    prevSheet,
    getSheets: () => [...SHEETS],
    getCurrentIndex: () => currentSheetIndex
  };

  document.addEventListener('DOMContentLoaded', initNavigation);
})();
