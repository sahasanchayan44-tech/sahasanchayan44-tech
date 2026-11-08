/**
 * BLUEPRINT / FORGE RUNTIME — INTERACTIVE ENGINE
 * Document ID: SAHA-BP-2026-01
 * Specification: BLUEPRINT_MASTER_PROMPT.md
 * Revision: 0.1.0 (Design Specification)
 */

(function () {
  'use strict';

  // Architectural node specifications for interactive schematic exploration
  const nodeTelemetryData = {
    'input-mod-01': {
      name: 'INPUT 01: SENSORY & TELEMETRY INGESTION',
      status: 'SPEC: REST & GRAPHQL INGESTION',
      desc: 'Architectural specification for data ingestion from GitHub REST & GraphQL endpoints, event listeners, and repository metadata.'
    },
    'input-mod-02': {
      name: 'INPUT 02: KNOWLEDGE & LOGIC MATRIX',
      status: 'SPEC: DATA & LOGIC MODEL',
      desc: 'Architectural specification for analytical parsing, structured markdown synthesis, and repository technology categorization.'
    },
    'input-mod-03': {
      name: 'INPUT 03: DISTRIBUTED AGENT SUBSYSTEM',
      status: 'SPEC: TASK HARNESS & RUNNER',
      desc: 'Architectural specification for autonomous agent coordination, task queues, and validation scripts.'
    },
    'forge-core': {
      name: 'CENTRAL FORGE SCHEDULER // KERNEL v0.1',
      status: 'SPEC: CORE SCHEDULER MODEL',
      desc: 'Architectural core model: dependency resolution, pipeline synchronization, and deterministic state coordination.'
    },
    'output-mod': {
      name: 'OUTPUT MODULE: RENDER SURFACES',
      status: 'TARGET: STATIC DOSSIER & GH PAGES',
      desc: 'Deployment target specification: static blueprint dossier generator, vector rendering, and GitHub Pages hosting.'
    }
  };

  const nodeIds = ['input-mod-01', 'input-mod-02', 'input-mod-03', 'forge-core', 'output-mod'];

  function initSchematicInteractivity() {
    const telemetryBanner = document.getElementById('node-telemetry');
    const nodeNameEl = document.getElementById('telemetry-node-name');
    const nodeStatusEl = document.getElementById('telemetry-node-status');
    const nodeDescEl = document.getElementById('telemetry-node-desc');
    const nodes = document.querySelectorAll('.schematic-node');

    if (!telemetryBanner || !nodes.length) return;

    function updateTelemetry(nodeId) {
      const data = nodeTelemetryData[nodeId];
      if (!data) return;

      if (nodeNameEl) nodeNameEl.textContent = data.name;
      if (nodeStatusEl) nodeStatusEl.textContent = `[ ${data.status} ]`;
      if (nodeDescEl) nodeDescEl.textContent = data.desc;
      telemetryBanner.style.borderColor = 'var(--cyan-bright)';
      telemetryBanner.style.backgroundColor = 'rgba(16, 31, 59, 0.95)';
    }

    function resetTelemetry() {
      if (nodeNameEl) nodeNameEl.textContent = 'ARCHITECTURAL SCHEMATIC READY';
      if (nodeStatusEl) nodeStatusEl.textContent = '[ SELECT NODE ]';
      if (nodeDescEl) nodeDescEl.textContent = 'Select or focus on any module in the schematic to inspect its functional specification and signal pathways.';
      telemetryBanner.style.borderColor = 'var(--border)';
      telemetryBanner.style.backgroundColor = 'rgba(9, 19, 41, 0.9)';
    }

    nodes.forEach(node => {
      const nodeId = node.id || node.getAttribute('data-node-id');

      node.addEventListener('mouseenter', () => updateTelemetry(nodeId));
      node.addEventListener('focus', () => updateTelemetry(nodeId));
      node.addEventListener('mouseleave', resetTelemetry);
      node.addEventListener('blur', resetTelemetry);

      // Keyboard activation via Enter/Space
      node.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          updateTelemetry(nodeId);
        }
      });
    });

    // Arrow keys navigation across schematic nodes
    window.addEventListener('keydown', (e) => {
      const activeEl = document.activeElement;
      if (!activeEl || !activeEl.classList.contains('schematic-node')) return;

      const currentIndex = nodeIds.indexOf(activeEl.id);
      if (currentIndex === -1) return;

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        const nextIndex = (currentIndex + 1) % nodeIds.length;
        const nextNode = document.getElementById(nodeIds[nextIndex]);
        if (nextNode) {
          nextNode.focus();
          updateTelemetry(nodeIds[nextIndex]);
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        const prevIndex = (currentIndex - 1 + nodeIds.length) % nodeIds.length;
        const prevNode = document.getElementById(nodeIds[prevIndex]);
        if (prevNode) {
          prevNode.focus();
          updateTelemetry(nodeIds[prevIndex]);
        }
      } else if (e.key === 'Escape') {
        activeEl.blur();
        resetTelemetry();
      }
    });
  }

  function initActionControls() {
    const inspectBtn = document.getElementById('btn-inspect-schematic');
    const specDetailsBtn = document.getElementById('btn-spec-details');
    const coreNode = document.getElementById('forge-core');
    const telemetryBanner = document.getElementById('node-telemetry');
    const nodeNameEl = document.getElementById('telemetry-node-name');
    const nodeStatusEl = document.getElementById('telemetry-node-status');
    const nodeDescEl = document.getElementById('telemetry-node-desc');

    if (inspectBtn && coreNode) {
      inspectBtn.addEventListener('click', (e) => {
        e.preventDefault();
        coreNode.focus();
        coreNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
        coreNode.dispatchEvent(new Event('mouseenter'));
      });
    }

    if (specDetailsBtn) {
      specDetailsBtn.addEventListener('click', () => {
        const propsGrid = document.querySelector('.props-grid');
        if (propsGrid) {
          propsGrid.scrollIntoView({ behavior: 'smooth', block: 'center' });
          propsGrid.style.transition = 'box-shadow 0.3s ease, border-color 0.3s ease';
          propsGrid.style.borderColor = 'var(--cyan-bright)';
          propsGrid.style.boxShadow = '0 0 24px rgba(66, 204, 245, 0.35)';
          
          if (nodeNameEl) nodeNameEl.textContent = 'SYSTEM SPECIFICATION PARAMETERS';
          if (nodeStatusEl) nodeStatusEl.textContent = '[ 8 VERIFIED METRICS ]';
          if (nodeDescEl) nodeDescEl.textContent = 'Active ecosystem, GitHub identity, repository count, and structural engineering principles highlighted.';
          if (telemetryBanner) {
            telemetryBanner.style.borderColor = 'var(--cyan-bright)';
            telemetryBanner.style.backgroundColor = 'rgba(16, 31, 59, 0.95)';
          }

          setTimeout(() => {
            propsGrid.style.borderColor = 'var(--border)';
            propsGrid.style.boxShadow = 'none';
          }, 1800);
        }
      });
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    initSchematicInteractivity();
    initActionControls();
  });
})();
