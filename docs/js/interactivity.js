/**
 * BLUEPRINT / FORGE RUNTIME — ADVANCED INTERACTIVITY CONTROLLER (PHASE 3)
 * Specification: BLUEPRINT_MASTER_PROMPT.md
 */

(function () {
  'use strict';

  // ========================================================================
  // 1. SHEET 04: PROJECT EXPLORER (SEARCH, FILTER & MODAL INSPECTOR)
  // ========================================================================

  const PROJECT_DATA = {
    'portfolio': {
      title: 'portfolio',
      id: 'PRJ-01',
      lang: 'JavaScript',
      category: 'Spatial 3D',
      repoUrl: 'https://github.com/sahasanchayan44-tech/portfolio',
      updated: '2026-11-01',
      desc: 'Swiss-minimalist portfolio core and 2D/3D Cultural Archive. Integrates Three.js 3D world with raycasting collision detection, 8 interactive spatial zones, and structured static JSON content manifests.',
      architecture: 'Static JSON CMS + Three.js WebGL Spatial Canvas + CSS Custom Properties',
      keyComponents: [
        'Three.js scene graph with custom GLSL lighting shaders',
        '2D cultural archive coordinate browser with modal raycaster',
        'Multi-threaded static preview HTTP server integration',
        'Zero-dependency vanilla asset loader with cache busting'
      ]
    },
    'exam-oracle-ai': {
      title: 'exam-oracle-ai',
      id: 'PRJ-02',
      lang: 'Python',
      category: 'AI / ML',
      repoUrl: 'https://github.com/sahasanchayan44-tech/exam-oracle-ai',
      updated: '2026-07-29',
      desc: 'Statistical machine learning platform for examination distribution analysis, automated item generation, and score regression modeling. Structured as a Turborepo monorepo with containerized microservices.',
      architecture: 'Turborepo Monorepo + Python FastAPI ML Engines + Docker Compose + TypeScript UI',
      keyComponents: [
        'Statistical distribution curves and percentile rank models in Python',
        'Turborepo build pipeline managing cross-package dependencies',
        'Containerized execution environment with multi-stage Dockerfiles',
        'Interactive neural node-edge canvas visualizer'
      ]
    },
    'neuroverse': {
      title: 'neuroverse',
      id: 'PRJ-03',
      lang: 'TypeScript',
      category: 'Spatial 3D',
      repoUrl: 'https://github.com/sahasanchayan44-tech/neuroverse',
      updated: '2026-07-25',
      desc: 'Interactive 3D cortical mesh visualizer synthesized with Google Gemini multimodal reasoning. Enables spatial inspection of anatomical brain regions with localized contextual queries.',
      architecture: 'Next.js 14 + Three.js Mesh BVH + Express.js API + Google Gemini Multimodal API',
      keyComponents: [
        'High-density 3D cortical geometry loader with bounding-volume hierarchy (BVH)',
        'Node-specific contextual prompting via Google Gemini multimodal backend',
        'Express.js middleware routing with structured JSON validation',
        'Tactile camera orbit controls with anatomical coordinate bounding'
      ]
    },
    'chandrayaan-4.0': {
      title: 'chandrayaan-4.0',
      id: 'PRJ-04',
      lang: 'JavaScript',
      category: 'Space & Systems',
      repoUrl: 'https://github.com/sahasanchayan44-tech/chandrayaan-4.0',
      updated: '2026-07-16',
      desc: 'Lunar exploration trajectory simulation interface exploring real-time telemetry rendering and mission tracking ideas. Implements low-latency UI updates using Next.js 16 and Firebase real-time document listeners.',
      architecture: 'Next.js 16 + React 19 Concurrent Primitives + Firebase Firestore + Tailwind CSS v4',
      keyComponents: [
        'Real-time Firestore listeners tracking simulated lunar coordinates',
        'Hopper trajectory breadcrumbs and orbital velocity telemetry indicators',
        'Native dashboard styling with responsive spatial telemetry meters',
        'Next.js 16 App Router interface architecture'
      ]
    },
    'sunapse-android': {
      title: 'sunapse-android',
      id: 'PRJ-05',
      lang: 'Kotlin',
      category: 'Mobile',
      repoUrl: 'https://github.com/sahasanchayan44-tech/sunapse-android',
      updated: '2026-04-05',
      desc: 'Native Android client codebase written in Kotlin for the Synapse ecosystem. Implements mobile client interfaces, task delegation specifications, and background service synchronization for local agent coordination.',
      architecture: 'Android Jetpack + Kotlin Coroutines + Room SQLite DB + OkHttp REST Client',
      keyComponents: [
        'Kotlin Coroutines and Flow for asynchronous agent state streaming',
        'Local SQLite persistence with Room DB for cached telemetry logs',
        'Background work manager for deterministic local sync',
        'Material 3 design system with dark engineering color palette'
      ]
    },
    'synapse': {
      title: 'synapse',
      id: 'PRJ-06',
      lang: 'TypeScript',
      category: 'AI / ML',
      repoUrl: 'https://github.com/sahasanchayan44-tech/synapse',
      updated: '2026-03-27',
      desc: 'Local developer AI assistant engineering platform. Orchestrates local open-weight neural models via Ollama and provides high-speed streaming REST microservices through FastAPI and a React frontend.',
      architecture: 'Ollama Local Runtime + Python FastAPI + React Monorepo + WebSocket Streams',
      keyComponents: [
        'Local model quantization execution via Ollama CLI wrapper',
        'FastAPI asynchronous streaming endpoints for token-by-token generation',
        'Modular monorepo coordinating backend agents and web frontend',
        'Zero external cloud API dependency for air-gapped security'
      ]
    },
    'study-manager': {
      title: 'study-manager',
      id: 'PRJ-07',
      lang: 'TypeScript',
      category: 'Frontend',
      repoUrl: 'https://github.com/sahasanchayan44-tech/study-manager',
      updated: '2026-03-28',
      desc: 'Academic productivity and study session management tool. Structures subject curricula, tracking intervals, and animated motivational milestone rewards.',
      architecture: 'TypeScript + Next.js App Router + Local Storage / Firebase + CSS Modules',
      keyComponents: [
        'Curriculum hierarchy manager (Subjects -> Topics -> Study Blocks)',
        'Animated focus timer with interactive token state animations',
        'Local persistent storage caching for offline academic planning',
        'Responsive layout scaling for mobile and desktop environments'
      ]
    },
    'admin-panel': {
      title: 'admin-panel',
      id: 'PRJ-08',
      lang: 'TypeScript',
      category: 'Frontend',
      repoUrl: 'https://github.com/sahasanchayan44-tech/admin-panel',
      updated: '2026-03-31',
      desc: 'Comprehensive administration and telemetry dashboard. Implements role-based access control patterns, nested collections manager, and system performance telemetry panels.',
      architecture: 'Next.js App Router + Firebase Firestore + Dynamic Route Slugs + Tailwind CSS',
      keyComponents: [
        'Dynamic nested collection routing with slug conflict prevention',
        'Firebase authentication and security rule validation hooks',
        'Telemetry data visualization with real-time state meters',
        'Responsive administration panel with collapsible side navigation'
      ]
    },
    'aria': {
      title: 'aria',
      id: 'PRJ-09',
      lang: 'Shell',
      category: 'Space & Systems',
      repoUrl: 'https://github.com/sahasanchayan44-tech/aria',
      updated: '2026-03-18',
      desc: 'Autonomous Reasoning & Intelligent Agent prototype scripts. Explores automated zero-dependency provisioning of local AI runtimes and POSIX execution primitives on Linux.',
      architecture: 'POSIX Bash + Linux Container Primitives + Ollama Setup Automation',
      keyComponents: [
        'Deterministic shell automation for local model pulling and initialization',
        'Hardware inference capability probe (VRAM, CPU thread affinity)',
        'Zero-dependency portable deployment script for Linux workstations',
        'Standard input/output agent runner loop prototype'
      ]
    }
  };

  let activeLangFilter = 'ALL';
  let activeCatFilter = 'ALL';
  let activeSearchTerm = '';

  function applyProjectFilters() {
    const cards = document.querySelectorAll('#sheet-04 .project-card');
    let visibleCount = 0;

    cards.forEach(card => {
      const titleEl = card.querySelector('.project-title');
      if (!titleEl) return;
      const repoName = titleEl.textContent.trim().toLowerCase();
      const data = PROJECT_DATA[repoName];
      if (!data) return;

      const matchesSearch = !activeSearchTerm || 
        repoName.includes(activeSearchTerm) ||
        data.desc.toLowerCase().includes(activeSearchTerm) ||
        data.lang.toLowerCase().includes(activeSearchTerm) ||
        data.category.toLowerCase().includes(activeSearchTerm);

      const matchesLang = activeLangFilter === 'ALL' || data.lang.toUpperCase() === activeLangFilter.toUpperCase();
      const matchesCat = activeCatFilter === 'ALL' || data.category.toUpperCase() === activeCatFilter.toUpperCase();

      if (matchesSearch && matchesLang && matchesCat) {
        card.classList.remove('hidden-by-filter');
        visibleCount++;
      } else {
        card.classList.add('hidden-by-filter');
      }
    });

    const badge = document.getElementById('project-filter-count');
    if (badge) {
      badge.textContent = `SHOWING ${visibleCount} OF 9 REPOSITORIES`;
    }
  }

  let modalOriginatingElement = null;

  function openProjectModal(repoName, triggeringElement) {
    const data = PROJECT_DATA[repoName];
    if (!data) return;

    const modal = document.getElementById('project-modal');
    if (!modal) return;

    // Store originating element safely for focus restoration
    modalOriginatingElement = triggeringElement || document.activeElement;

    document.getElementById('modal-repo-title').textContent = data.title;
    document.getElementById('modal-repo-id').textContent = `${data.id} // ${data.category.toUpperCase()}`;
    document.getElementById('modal-repo-desc').textContent = data.desc;
    document.getElementById('modal-repo-lang').textContent = data.lang;
    document.getElementById('modal-repo-updated').textContent = data.updated;
    document.getElementById('modal-repo-arch').textContent = data.architecture;
    document.getElementById('modal-repo-link').setAttribute('href', data.repoUrl);

    const compList = document.getElementById('modal-repo-components');
    if (compList) {
      compList.innerHTML = '';
      data.keyComponents.forEach(comp => {
        const li = document.createElement('li');
        li.textContent = comp;
        compList.appendChild(li);
      });
    }

    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-hidden', 'false');
    modal.classList.add('open');

    // Move keyboard focus into the modal on opening
    const closeBtn = document.getElementById('modal-close-btn');
    if (closeBtn) closeBtn.focus();
  }

  function closeProjectModal() {
    const modal = document.getElementById('project-modal');
    if (modal) {
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
    }

    // Safely restore focus to the originating project card
    if (modalOriginatingElement && typeof modalOriginatingElement.focus === 'function' && document.body.contains(modalOriginatingElement)) {
      try {
        modalOriginatingElement.focus();
      } catch (e) {
        // Safe focus fallback
      }
    }
    modalOriginatingElement = null;
  }

  function handleModalKeydown(e) {
    const modal = document.getElementById('project-modal');
    if (!modal || !modal.classList.contains('open')) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      closeProjectModal();
      return;
    }

    if (e.key === 'Tab') {
      const focusableSelectors = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
      const modalWindow = modal.querySelector('.cad-modal-window') || modal;
      const focusableElements = Array.from(modalWindow.querySelectorAll(focusableSelectors))
        .filter(el => el.offsetParent !== null || window.getComputedStyle(el).display !== 'none');

      if (focusableElements.length === 0) {
        e.preventDefault();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        // Shift + Tab: reverse cycle
        if (document.activeElement === firstElement || !modal.contains(document.activeElement)) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab: forward cycle
        if (document.activeElement === lastElement || !modal.contains(document.activeElement)) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    }
  }

  // ========================================================================
  // 2. SHEET 05: GITHUB TELEMETRY INTERACTION
  // ========================================================================

  const TELEMETRY_METRICS = {
    'repos': {
      title: 'PUBLIC REPOSITORIES',
      value: '09',
      provenance: 'GET https://api.github.com/users/sahasanchayan44-tech (.public_repos)',
      verifiedAt: '2026-11-07T08:16:00Z',
      definition: 'Count of publicly accessible repositories owned by the authenticated account.',
      baselineExplanation: 'Static baseline reflects the 9 authentic public repositories discovered in Phase 0. Phase 4 scheduled GitHub Actions will execute automated polling without client-side secrets.'
    },
    'followers': {
      title: 'FOLLOWERS',
      value: '00',
      provenance: 'GET https://api.github.com/users/sahasanchayan44-tech (.followers)',
      verifiedAt: '2026-11-07T08:16:00Z',
      definition: 'Count of GitHub users who follow this developer profile.',
      baselineExplanation: 'Current authentic count is 0. Zero fabrication policy strictly enforced; no artificial numbers are displayed.'
    },
    'following': {
      title: 'FOLLOWING',
      value: '02',
      provenance: 'GET https://api.github.com/users/sahasanchayan44-tech (.following)',
      verifiedAt: '2026-11-07T08:16:00Z',
      definition: 'Count of GitHub profiles followed by this account.',
      baselineExplanation: 'Verified against authenticated profile endpoint. In Phase 4, network changes will synchronize automatically.'
    },
    'stars': {
      title: 'TOTAL STARS EARNED',
      value: '02',
      provenance: 'Calculated: SUM(stargazers_count) across all 9 public repos',
      verifiedAt: '2026-11-07T08:16:00Z',
      definition: 'Total stargazers awarded by the GitHub developer community across public codebases.',
      baselineExplanation: '1 star on sahasanchayan44-tech/chandrayaan-4.0 + 1 star on sahasanchayan44-tech/neuroverse = 2 stars total.'
    },
    'forks': {
      title: 'TOTAL FORKS',
      value: '02',
      provenance: 'Calculated: SUM(forks_count) across all 9 public repos',
      verifiedAt: '2026-11-07T08:16:00Z',
      definition: 'Total times public repositories have been forked by other developers or cloned to other namespaces.',
      baselineExplanation: '1 fork on sahasanchayan44-tech/aria + 1 fork on sahasanchayan44-tech/sunapse-android = 2 forks total.'
    },
    'gists': {
      title: 'PUBLIC GISTS',
      value: '00',
      provenance: 'GET https://api.github.com/users/sahasanchayan44-tech (.public_gists)',
      verifiedAt: '2026-11-07T08:16:00Z',
      definition: 'Public single-file or multi-file code snippets published to GitHub Gist.',
      baselineExplanation: 'Authentic count is 0. Staged for Phase 4 Gist synchronization if technical code snippets are shared.'
    }
  };

  function inspectTelemetryMetric(key) {
    const data = TELEMETRY_METRICS[key];
    if (!data) return;

    const titleEl = document.getElementById('telem-ins-title');
    const valEl = document.getElementById('telem-ins-val');
    const defEl = document.getElementById('telem-ins-def');
    const provEl = document.getElementById('telem-ins-prov');
    const timeEl = document.getElementById('telem-ins-time');
    const explEl = document.getElementById('telem-ins-expl');

    if (titleEl) titleEl.textContent = data.title;
    if (valEl) valEl.textContent = data.value;
    if (defEl) defEl.textContent = data.definition;
    if (provEl) provEl.textContent = data.provenance;
    if (timeEl) timeEl.textContent = data.verifiedAt;
    if (explEl) explEl.textContent = data.baselineExplanation;

    // Highlight active metric card
    document.querySelectorAll('.metric-stat-box').forEach(box => {
      if (box.getAttribute('data-metric-key') === key) {
        box.classList.add('active-metric');
      } else {
        box.classList.remove('active-metric');
      }
    });
  }

  // ========================================================================
  // 3. SHEET 06: CONTRIBUTION HEATMAP CELL INSPECTION & REPO FILTER
  // ========================================================================

  const HEATMAP_CLUSTERS = {
    'mar': {
      label: 'MARCH 2026 // ACCOUNT & AGENT INCEPTION',
      repos: 'aria, synapse, study-manager, admin-panel',
      commits: '18 verified commits (March 16 - March 31)',
      details: 'Initial developer namespace setup and local AI / administration interface experiments.'
    },
    'jul': {
      label: 'JULY 2026 // SPATIAL & STATISTICAL EXPANSION',
      repos: 'chandrayaan-4.0, neuroverse, exam-oracle-ai',
      commits: '24 verified commits (July 16 - July 29)',
      details: 'Major architectural burst: 3D cortical visualization, lunar mission simulation, and statistical Turborepo engine.'
    },
    'nov': {
      label: 'NOVEMBER 2026 // ARCHIVAL & BLUEPRINT SPECIFICATION',
      repos: 'portfolio, BLUEPRINT',
      commits: '12 verified commits / specification revisions',
      details: 'Swiss-minimalist portfolio core release and 12-sheet Forge Runtime BLUEPRINT architectural dossier inception.'
    }
  };

  function inspectHeatmapCluster(clusterKey) {
    const data = HEATMAP_CLUSTERS[clusterKey];
    if (!data) return;

    const labelEl = document.getElementById('heatmap-ins-label');
    const reposEl = document.getElementById('heatmap-ins-repos');
    const countEl = document.getElementById('heatmap-ins-count');
    const detailsEl = document.getElementById('heatmap-ins-details');

    if (labelEl) labelEl.textContent = data.label;
    if (reposEl) reposEl.textContent = data.repos;
    if (countEl) countEl.textContent = data.commits;
    if (detailsEl) detailsEl.textContent = data.details;
  }

  // ========================================================================
  // 4. SHEET 07: EXPANDABLE RESEARCH DOSSIERS
  // ========================================================================

  function initResearchDossiers() {
    const toggleBtns = document.querySelectorAll('.dossier-toggle-btn');
    toggleBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const card = btn.closest('.lab-card');
        if (!card) return;
        const drawer = card.querySelector('.dossier-expanded-content');
        if (!drawer) return;

        const isOpen = drawer.classList.contains('open');
        if (isOpen) {
          drawer.classList.remove('open');
          btn.setAttribute('aria-expanded', 'false');
          btn.querySelector('.toggle-label').textContent = '[ EXPAND DOSSIER ▾ ]';
        } else {
          drawer.classList.add('open');
          btn.setAttribute('aria-expanded', 'true');
          btn.querySelector('.toggle-label').textContent = '[ COLLAPSE DOSSIER ▴ ]';
        }
      });
    });
  }

  // ========================================================================
  // 5. SHEET 08: SYSTEM ARCHITECTURE INTERACTIVE NODES & HIGHLIGHTS
  // ========================================================================

  const ARCH_SUBSYSTEMS = {
    'nextjs': {
      title: 'Next.js 14 / 16 (React 19)',
      tier: 'TIER 01: USER INTERFACE & SPATIAL GRAPHICS',
      role: 'Server and client components, dynamic routing, concurrent rendering hooks',
      protocol: 'HTML5 / React Virtual DOM reconciliation',
      repos: 'chandrayaan-4.0, neuroverse, study-manager, admin-panel'
    },
    'threejs': {
      title: 'Three.js 3D WebGL World',
      tier: 'TIER 01: USER INTERFACE & SPATIAL GRAPHICS',
      role: 'Hardware-accelerated 3D coordinate rendering, anatomical cortical meshes, raycasting ray pickers',
      protocol: 'WebGL 2.0 / GLSL Shaders',
      repos: 'portfolio, neuroverse'
    },
    'vectorcad': {
      title: 'Vector CAD (SVG Engine)',
      tier: 'TIER 01: USER INTERFACE & SPATIAL GRAPHICS',
      role: 'Deterministic 1:1 engineering blueprints, coordinate ribbons, interactive flow schematics',
      protocol: 'Vector Graphic DOM elements with CSS transitions',
      repos: 'BLUEPRINT'
    },
    'tailwind': {
      title: 'Tailwind CSS v4 Modules',
      tier: 'TIER 01: USER INTERFACE & SPATIAL GRAPHICS',
      role: 'High-density design token enforcement, typography scaling, responsive flex/grid layouts',
      protocol: 'Pre-compiled CSS AST',
      repos: 'chandrayaan-4.0, admin-panel'
    },
    'turborepo': {
      title: 'Turborepo Monorepo Pipelines',
      tier: 'TIER 02: COGNITIVE SERVICES & BACKEND ENGINES',
      role: 'Coordinated build caches, cross-package dependency resolution, multi-service orchestration',
      protocol: 'Local filesystem cache & pipeline DAGs',
      repos: 'exam-oracle-ai, synapse'
    },
    'ollama': {
      title: 'Ollama & FastAPIs',
      tier: 'TIER 02: COGNITIVE SERVICES & BACKEND ENGINES',
      role: 'Local quantized model inference execution, token streaming, asynchronous endpoints',
      protocol: 'REST / WebSocket JSON streaming',
      repos: 'synapse, aria'
    },
    'gemini': {
      title: 'Gemini Multimodal Inference',
      tier: 'TIER 02: COGNITIVE SERVICES & BACKEND ENGINES',
      role: 'Multimodal vision and text analysis, anatomical context reasoning, localized querying',
      protocol: 'HTTPS / TLS 443 REST Endpoints',
      repos: 'neuroverse'
    },
    'pythonml': {
      title: 'Python Statistical ML Modeling',
      tier: 'TIER 02: COGNITIVE SERVICES & BACKEND ENGINES',
      role: 'Score distribution curve fitting, test item generation algorithms, percentile regression',
      protocol: 'Python Native C-Extensions & NumPy/SciPy',
      repos: 'exam-oracle-ai'
    },
    'firestore': {
      title: 'Firebase Firestore DB',
      tier: 'TIER 03: PERSISTENCE, CACHE & DOCUMENT STORES',
      role: 'Real-time document synchronization, dynamic user role authorization, collection nesting',
      protocol: 'gRPC / WebSocket Long-Polling',
      repos: 'chandrayaan-4.0, admin-panel'
    },
    'postgres': {
      title: 'PostgreSQL / SQL Models',
      tier: 'TIER 03: PERSISTENCE, CACHE & DOCUMENT STORES',
      role: 'ACID-compliant relational storage, structured examination question banks, statistical schemas',
      protocol: 'PostgreSQL Wire Protocol',
      repos: 'exam-oracle-ai'
    },
    'sqlite': {
      title: 'SQLite / Room DB',
      tier: 'TIER 03: PERSISTENCE, CACHE & DOCUMENT STORES',
      role: 'Zero-latency mobile local cache, offline state retention on Android devices',
      protocol: 'Direct SQLite C library bindings',
      repos: 'sunapse-android'
    },
    'staticjson': {
      title: 'Static JSON Manifests',
      tier: 'TIER 03: PERSISTENCE, CACHE & DOCUMENT STORES',
      role: 'Deterministic read-only CMS payloads, zero-overhead static data loading',
      protocol: 'HTTP GET / Local JSON parse',
      repos: 'portfolio, BLUEPRINT'
    },
    'docker': {
      title: 'Docker Compose Runtimes',
      tier: 'TIER 04: CONTAINER RUNTIMES & DEPLOYMENT TARGETS',
      role: 'Multi-service container orchestration, isolated network bridges, deterministic environments',
      protocol: 'Docker Engine daemon socket',
      repos: 'exam-oracle-ai'
    },
    'nix': {
      title: 'Nix Shell Environments',
      tier: 'TIER 04: CONTAINER RUNTIMES & DEPLOYMENT TARGETS',
      role: 'Declarative, reproducible development toolchains with pinned compiler dependencies',
      protocol: 'Nix store symlinks',
      repos: 'exam-oracle-ai, portfolio'
    },
    'actions': {
      title: 'GitHub Actions CI/CD',
      tier: 'TIER 04: CONTAINER RUNTIMES & DEPLOYMENT TARGETS',
      role: 'Automated test suite execution, static artifact compilation, scheduled telemetry ingestion',
      protocol: 'GitHub Actions Runner Engine',
      repos: 'BLUEPRINT (Staged for Phase 4)'
    },
    'ghpages': {
      title: 'GitHub Pages Deployment Target',
      tier: 'TIER 04: CONTAINER RUNTIMES & DEPLOYMENT TARGETS',
      role: 'Static edge hosting with global CDN distribution and automated TLS certificate issuance',
      protocol: 'HTTPS / HTTP/2',
      repos: 'sahasanchayan44-tech/sahasanchayan44-tech (Phase 4 Target)'
    }
  };

  function inspectArchSubsystem(key) {
    const data = ARCH_SUBSYSTEMS[key];
    if (!data) return;

    const titleEl = document.getElementById('arch-ins-title');
    const tierEl = document.getElementById('arch-ins-tier');
    const roleEl = document.getElementById('arch-ins-role');
    const protoEl = document.getElementById('arch-ins-proto');
    const reposEl = document.getElementById('arch-ins-repos');

    if (titleEl) titleEl.textContent = data.title;
    if (tierEl) tierEl.textContent = data.tier;
    if (roleEl) roleEl.textContent = data.role;
    if (protoEl) protoEl.textContent = data.protocol;
    if (reposEl) reposEl.textContent = data.repos;

    // Highlight node in SVG
    document.querySelectorAll('.arch-node-interactive').forEach(node => {
      if (node.getAttribute('data-subsystem-key') === key) {
        node.classList.add('active-node');
      } else {
        node.classList.remove('active-node');
      }
    });
  }

  // ========================================================================
  // 6. SHEET 09: ROADMAP MILESTONES INTERACTION
  // ========================================================================

  const ROADMAP_DATA = {
    'consensus': {
      title: 'Distributed Consensus & Replication',
      phase: '01 // CURRENT ACTIVE RESEARCH [2026]',
      rationale: 'Core algorithmic study of Raft consensus protocol, quorum leases, and log compaction for fault-tolerant state machine replication.',
      prerequisites: 'Networking primitives, socket programming, distributed systems theory',
      status: 'ACTIVE STUDY (Algorithmic simulation underway)'
    },
    'webgpu': {
      title: 'Spatial Rendering & WebGPU Shaders',
      phase: '01 // CURRENT ACTIVE RESEARCH [2026]',
      rationale: 'Harnessing direct GPU compute pipelines via WebGPU and GLSL fragment shaders for high-density spatial graph visualizers.',
      prerequisites: 'Linear algebra, 3D transformation matrices, WebGL pipeline fundamentals',
      status: 'ACTIVE EXPLORATION (Shader prototype phase)'
    },
    'quantization': {
      title: 'Local Model Optimization & Quantization',
      phase: '01 // CURRENT ACTIVE RESEARCH [2026]',
      rationale: 'Investigating GGUF sub-4-bit quantization, prompt prefix caching, and speculative decoding to minimize inference latency on consumer hardware.',
      prerequisites: 'Transformer attention mechanics, integer quantization arithmetic, Ollama runtimes',
      status: 'ACTIVE EXPERIMENTATION (Ollama/ONNX local runs)'
    },
    'rust': {
      title: 'Rust Systems & Low-Level Runtimes',
      phase: '02 // PLANNED TECHNICAL EXPLORATIONS [2027]',
      rationale: 'Mastering memory safety without garbage collection, borrow checker semantics, and zero-cost abstraction for high-throughput microservices.',
      prerequisites: 'C/C++ memory management, systems programming fundamentals',
      status: 'SCHEDULED EXPLORATION (Planned for 2027)'
    },
    'embedded': {
      title: 'Embedded Microcontrollers & Hardware Buses',
      phase: '02 // PLANNED TECHNICAL EXPLORATIONS [2027]',
      rationale: 'Bare-metal C/C++ firmware, I2C/SPI telemetry integration, and deterministic RTOS scheduling for physical sensory modules.',
      prerequisites: 'Digital logic, microcontroller architectures, real-time operating systems',
      status: 'SCHEDULED EXPLORATION (Planned for 2027)'
    },
    'astrodynamics': {
      title: 'High-Precision Astrodynamics Engines',
      phase: '02 // PLANNED TECHNICAL EXPLORATIONS [2027]',
      rationale: 'High-order gravitational N-body integrators, planetary ephemeris modeling, and orbital transfer optimization algorithms.',
      prerequisites: 'Classical celestial mechanics, numerical integration (Runge-Kutta)',
      status: 'SCHEDULED EXPLORATION (Planned for 2027)'
    },
    'multiagent': {
      title: 'Multi-Agent Orchestration Frameworks',
      phase: '03 // VERIFIED ENGINEERING MILESTONES [2026]',
      rationale: 'Autonomous agent coordination, context synthesis, and tool-calling execution loops implemented in Synapse and ARIA.',
      prerequisites: 'Python asynchronous APIs, prompt orchestration, Ollama runtime',
      status: 'VERIFIED MILESTONE (Implemented in open-source repos)'
    },
    'cortical3d': {
      title: 'Interactive 3D Cortical Visualizer',
      phase: '03 // VERIFIED ENGINEERING MILESTONES [2026]',
      rationale: 'Three.js spatial brain mesh rendering with Gemini multimodal contextual queries deployed in Neuroverse.',
      prerequisites: 'Three.js scene graph, GLTF geometry parsing, Express REST APIs',
      status: 'VERIFIED MILESTONE (Implemented in sahasanchayan44-tech/neuroverse)'
    },
    'monorepo': {
      title: 'Monorepo Containerization & Nix Shells',
      phase: '03 // VERIFIED ENGINEERING MILESTONES [2026]',
      rationale: 'Coordinated monorepo build environments with Turborepo, multi-service Docker Compose files, and reproducible Nix shells.',
      prerequisites: 'Docker engine, Turborepo build caches, declarative package managers',
      status: 'VERIFIED MILESTONE (Implemented in exam-oracle-ai)'
    },
    'slam': {
      title: 'Autonomous Robotic Perception & SLAM',
      phase: '04 // STRATEGIC LONG-TERM OBJECTIVES [HORIZON]',
      rationale: 'Visual-inertial odometry, spatial point-cloud mapping, and real-time obstacle negotiation for autonomous edge robotic agents.',
      prerequisites: 'Computer vision, Kalman filters, point-cloud segmentation',
      status: 'STRATEGIC TARGET (Long-term architectural goal)'
    },
    'zkstorage': {
      title: 'Zero-Knowledge Verifiable Storage Fabric',
      phase: '04 // STRATEGIC LONG-TERM OBJECTIVES [HORIZON]',
      rationale: 'Cryptographically verified distributed storage engine with immutable audit trails and zero-knowledge verification.',
      prerequisites: 'Cryptographic hash trees, zk-SNARK primitives, distributed consensus',
      status: 'STRATEGIC TARGET (Long-term architectural goal)'
    },
    'edgeai': {
      title: 'Sub-10ms Edge Cognitive Inference',
      phase: '04 // STRATEGIC LONG-TERM OBJECTIVES [HORIZON]',
      rationale: 'Ultra-low latency multimodal neural models running fully locally on portable and embedded compute units without cloud dependencies.',
      prerequisites: 'Hardware neural accelerators, kernel fusion, extreme quantization',
      status: 'STRATEGIC TARGET (Long-term architectural goal)'
    }
  };

  function inspectRoadmapMilestone(key) {
    const data = ROADMAP_DATA[key];
    if (!data) return;

    const titleEl = document.getElementById('roadmap-ins-title');
    const phaseEl = document.getElementById('roadmap-ins-phase');
    const ratEl = document.getElementById('roadmap-ins-rat');
    const prereqEl = document.getElementById('roadmap-ins-prereq');
    const statusEl = document.getElementById('roadmap-ins-status');

    if (titleEl) titleEl.textContent = data.title;
    if (phaseEl) phaseEl.textContent = data.phase;
    if (ratEl) ratEl.textContent = data.rationale;
    if (prereqEl) prereqEl.textContent = data.prerequisites;
    if (statusEl) statusEl.textContent = data.status;

    document.querySelectorAll('.roadmap-item').forEach(item => {
      if (item.getAttribute('data-milestone-key') === key) {
        item.classList.add('active-milestone');
      } else {
        item.classList.remove('active-milestone');
      }
    });
  }

  // ========================================================================
  // 7. SHEET 10: LOGBOOK SEARCH, SORT, REPO FILTER & PHASE 4 DATASET TOGGLE
  // ========================================================================

  let logSortOrder = 'DESC'; // 'DESC' = Newest first, 'ASC' = Oldest first
  let logRepoFilter = 'ALL';
  let logSearchQuery = '';
  let activeLogDataset = 'MILESTONES'; // 'MILESTONES' | 'RECENT_COMMITS'
  let cachedHistoricalMilestones = null;
  let cachedRecentCommits = null;

  function renderLogbookRows() {
    const tbody = document.querySelector('#sheet-10 .logbook-table tbody');
    if (!tbody) return;

    if (activeLogDataset === 'MILESTONES') {
      const milestones = cachedHistoricalMilestones || (window.BlueprintDataService ? window.BlueprintDataService.getHistoricalMilestones() : []);
      if (milestones && milestones.length > 0) {
        tbody.innerHTML = milestones.map(m => `
          <tr>
            <td><span class="log-id-badge">${m.log_id}</span></td>
            <td style="color: var(--cyan); font-family: var(--font-tech);">${m.timestamp_display}</td>
            <td><strong>${m.repository}</strong></td>
            <td>${m.commit_url ? `<a href="${m.commit_url}" target="_blank" rel="noopener noreferrer" style="color: var(--cyan); font-family: var(--font-tech);">${m.commit_sha} ↗</a>` : `<span class="manifest-status-badge">${m.commit_sha}</span>`}</td>
            <td>${m.message}</td>
            <td><span class="manifest-status-badge verified">${m.verification_status}</span></td>
          </tr>
        `).join('');
      }
    } else {
      const commits = cachedRecentCommits || (window.BlueprintDataService ? window.BlueprintDataService.getRecentCommits() : []);
      if (commits && commits.length > 0) {
        tbody.innerHTML = commits.map(c => `
          <tr>
            <td><span class="log-id-badge">GIT</span></td>
            <td style="color: var(--cyan); font-family: var(--font-tech);">${c.committed_at ? c.committed_at.slice(0, 10) : '2026'}</td>
            <td><strong>${c.repository}</strong></td>
            <td><a href="${c.commit_url}" target="_blank" rel="noopener noreferrer" style="color: var(--cyan); font-family: var(--font-tech);">${c.commit_sha} ↗</a></td>
            <td>${c.message} <span style="color: var(--text-muted); font-size: 0.72rem;">[${c.author_login ? 'by ' + c.author_login : 'unlinked'}]</span></td>
            <td><span class="manifest-status-badge verified">LIVE COMMIT</span></td>
          </tr>
        `).join('');
      }
    }

    const toggleBtn = document.getElementById('log-dataset-toggle-btn');
    if (toggleBtn) {
      if (activeLogDataset === 'MILESTONES') {
        toggleBtn.textContent = `[ VIEW: HISTORICAL MILESTONES (${cachedHistoricalMilestones ? cachedHistoricalMilestones.length : 11}) ▾ ]`;
      } else {
        toggleBtn.textContent = `[ VIEW: RECENT COMMITS (${cachedRecentCommits ? cachedRecentCommits.length : 0}) ▾ ]`;
      }
    }

    applyLogbookFilters();
  }

  function applyLogbookFilters() {
    const tbody = document.querySelector('#sheet-10 .logbook-table tbody');
    if (!tbody) return;

    const rows = Array.from(tbody.querySelectorAll('tr'));
    let matchCount = 0;

    // Filter
    rows.forEach(row => {
      const text = row.textContent.toLowerCase();
      const repoCell = row.cells[2] ? row.cells[2].textContent.toLowerCase() : '';

      const matchesSearch = !logSearchQuery || text.includes(logSearchQuery);
      const matchesRepo = logRepoFilter === 'ALL' || repoCell.includes(logRepoFilter.toLowerCase());

      if (matchesSearch && matchesRepo) {
        row.style.display = '';
        matchCount++;
      } else {
        row.style.display = 'none';
      }
    });

    // Update count badge
    const countBadge = document.getElementById('log-filter-count');
    if (countBadge) {
      countBadge.textContent = `SHOWING ${matchCount} OF ${rows.length} RECORDS`;
    }
  }

  function toggleLogbookSort() {
    const tbody = document.querySelector('#sheet-10 .logbook-table tbody');
    if (!tbody) return;

    const rows = Array.from(tbody.querySelectorAll('tr'));
    logSortOrder = logSortOrder === 'DESC' ? 'ASC' : 'DESC';

    rows.reverse();
    rows.forEach(row => tbody.appendChild(row));

    const sortBtn = document.getElementById('log-sort-btn');
    if (sortBtn) {
      sortBtn.textContent = logSortOrder === 'DESC' ? '[ SORT: NEWEST FIRST ▾ ]' : '[ SORT: OLDEST FIRST ▴ ]';
    }
  }

  // ========================================================================
  // 8. SHEET 11: CLIPBOARD COPY & HONEST TERMINAL FEEDBACK
  // ========================================================================

  function fallbackCopy(text) {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    } catch (e) {
      // Fallback in sandboxed environment
    }
  }

  function setupClipboardCopy() {
    document.querySelectorAll('.clipboard-copy-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const copyText = btn.getAttribute('data-copy-val') || '';
        if (!copyText) return;

        const updateFeedback = () => {
          const originalText = btn.textContent;
          btn.textContent = '[ COPIED ✓ ]';
          btn.style.borderColor = 'var(--status-synced)';
          btn.style.color = 'var(--status-synced)';
          setTimeout(() => {
            btn.textContent = originalText;
            btn.style.borderColor = '';
            btn.style.color = '';
          }, 1800);
        };

        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(copyText).then(updateFeedback).catch(() => {
            fallbackCopy(copyText);
            updateFeedback();
          });
        } else {
          fallbackCopy(copyText);
          updateFeedback();
        }
      });
    });
  }

  function setupPrototypeTerminalSubmit() {
    const form = document.getElementById('engineering-dispatch-form');
    const stdout = document.getElementById('terminal-stdout');
    if (!form || !stdout) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const sender = document.getElementById('comms-sender').value.trim() || 'ANONYMOUS_ENGINEER';
      const scope = document.getElementById('comms-scope').value || 'general';
      const payload = document.getElementById('comms-payload').value.trim() || 'Empty payload';
      const now = new Date().toISOString();

      const log1 = document.createElement('div');
      log1.style.color = 'var(--cyan)';
      log1.textContent = `> [${now}] BUFFERED DISPATCH: SENDER="${sender}" SCOPE="${scope}"`;

      const log2 = document.createElement('div');
      log2.style.color = 'var(--accent-amber)';
      log2.textContent = `> [PROTOTYPE NOTICE]: Message recorded in local preview memory only. No external API call was made.`;

      const log3 = document.createElement('div');
      log3.style.color = 'var(--text-muted)';
      log3.textContent = `> PAYLOAD EXCERPT: "${payload.substring(0, 60)}${payload.length > 60 ? '...' : ''}" // Awaiting Phase 4 secure ingestion hook.`;

      stdout.appendChild(log1);
      stdout.appendChild(log2);
      stdout.appendChild(log3);
      stdout.scrollTop = stdout.scrollHeight;

      // Reset fields
      document.getElementById('comms-payload').value = '';
    });
  }

  // ========================================================================
  // 9. SHEET 12: ACTIVE INDEX ROW SYNC
  // ========================================================================

  function syncMasterIndexActiveRow() {
    if (!window.BlueprintNavigation) return;
    const currentIdx = window.BlueprintNavigation.getCurrentIndex();
    const rows = document.querySelectorAll('.master-index-table tbody tr');
    rows.forEach((row, idx) => {
      if (idx === currentIdx) {
        row.classList.add('active-index-row');
      } else {
        row.classList.remove('active-index-row');
      }
    });
  }

  // ========================================================================
  // PHASE 4: DATA HYDRATION ENGINE (FROM BLUEPRINT DATA SERVICE)
  // ========================================================================

  function hydrateFromDataService(data, status, freshness) {
    if (!data) return;

    // Cache datasets for Sheet 10
    if (data.historical_milestones && Array.isArray(data.historical_milestones)) {
      cachedHistoricalMilestones = data.historical_milestones;
    }
    if (data.recent_repository_commits && Array.isArray(data.recent_repository_commits)) {
      cachedRecentCommits = data.recent_repository_commits;
    }

    // 1. Hydrate PROJECT_DATA from data.repositories
    if (data.repositories && Array.isArray(data.repositories)) {
      data.repositories.forEach(repo => {
        if (PROJECT_DATA[repo.name]) {
          PROJECT_DATA[repo.name].stars = repo.stars;
          PROJECT_DATA[repo.name].forks = repo.forks;
          PROJECT_DATA[repo.name].lang = repo.primary_language || PROJECT_DATA[repo.name].lang;
          PROJECT_DATA[repo.name].repoUrl = repo.repo_url;
          PROJECT_DATA[repo.name].updated = repo.updated_at ? repo.updated_at.split('T')[0] : PROJECT_DATA[repo.name].updated;
        }
      });
    }

    // 2. Hydrate Sheet 05 Telemetry Metrics
    if (data.telemetry && data.user) {
      const reposCount = data.user.public_repos !== undefined ? String(data.user.public_repos).padStart(2, '0') : '09';
      const followersCount = data.user.followers !== undefined ? String(data.user.followers).padStart(2, '0') : '00';
      const followingCount = data.user.following !== undefined ? String(data.user.following).padStart(2, '0') : '02';
      const starsCount = data.telemetry.total_stars !== undefined ? String(data.telemetry.total_stars).padStart(2, '0') : '02';
      const forksCount = data.telemetry.total_forks !== undefined ? String(data.telemetry.total_forks).padStart(2, '0') : '02';
      const gistsCount = data.user.public_gists !== undefined ? String(data.user.public_gists).padStart(2, '0') : '00';

      const elRepos = document.getElementById('stat-repos-count');
      const elFollowers = document.getElementById('stat-followers-count');
      const elFollowing = document.getElementById('stat-following-count');
      const elStars = document.getElementById('stat-stars-count');
      const elForks = document.getElementById('stat-forks-count');
      const elGists = document.getElementById('stat-gists-count');

      if (elRepos) elRepos.textContent = reposCount;
      if (elFollowers) elFollowers.textContent = followersCount;
      if (elFollowing) elFollowing.textContent = followingCount;
      if (elStars) elStars.textContent = starsCount;
      if (elForks) elForks.textContent = forksCount;
      if (elGists) elGists.textContent = gistsCount;

      // Update TELEMETRY_METRICS records
      const collectedTime = data.provenance ? data.provenance.collected_at_utc : '2026-11-07T20:14:11Z';
      if (TELEMETRY_METRICS['repos']) {
        TELEMETRY_METRICS['repos'].value = reposCount;
        TELEMETRY_METRICS['repos'].verifiedAt = collectedTime;
      }
      if (TELEMETRY_METRICS['followers']) {
        TELEMETRY_METRICS['followers'].value = followersCount;
        TELEMETRY_METRICS['followers'].verifiedAt = collectedTime;
      }
      if (TELEMETRY_METRICS['following']) {
        TELEMETRY_METRICS['following'].value = followingCount;
        TELEMETRY_METRICS['following'].verifiedAt = collectedTime;
      }
      if (TELEMETRY_METRICS['stars']) {
        TELEMETRY_METRICS['stars'].value = starsCount;
        TELEMETRY_METRICS['stars'].verifiedAt = collectedTime;
      }
      if (TELEMETRY_METRICS['forks']) {
        TELEMETRY_METRICS['forks'].value = forksCount;
        TELEMETRY_METRICS['forks'].verifiedAt = collectedTime;
      }
      if (TELEMETRY_METRICS['gists']) {
        TELEMETRY_METRICS['gists'].value = gistsCount;
        TELEMETRY_METRICS['gists'].verifiedAt = collectedTime;
      }

      // Re-trigger current active metric inspector
      const activeMetricBox = document.querySelector('.metric-stat-box.active-metric');
      const currentKey = activeMetricBox ? activeMetricBox.getAttribute('data-metric-key') : 'repos';
      inspectTelemetryMetric(currentKey);

      // Sheet 05 Banner
      const s5Tag = document.getElementById('sheet-05-pipeline-tag');
      const s5Status = document.getElementById('sheet-05-sync-status');
      const rateLimit = data.provenance ? data.provenance.rate_limit_snapshot : null;

      if (s5Tag) {
        if (freshness && freshness.isOffline) s5Tag.textContent = '[ SOURCE: STANDALONE BASELINE // OFFLINE ]';
        else if (freshness && freshness.isStale) s5Tag.textContent = '[ SOURCE: LOCAL SNAPSHOT // STALE (>24H) ]';
        else s5Tag.textContent = '[ SOURCE: LOCAL SNAPSHOT // FRESH (<24H) ]';
      }
      if (s5Status && rateLimit) {
        s5Status.textContent = `SNAPSHOT: ${data.provenance.collected_at_utc} // QUOTA: ${rateLimit.remaining}/${rateLimit.limit} REMAINING // ZERO FABRICATION`;
      }
    }

    // 3. Hydrate Sheet 12 Provenance & Freshness Telemetry Panel
    const provBadge = document.getElementById('data-status-badge');
    const provSource = document.getElementById('provenance-source');
    const provTimestamp = document.getElementById('provenance-timestamp');
    const provAge = document.getElementById('provenance-age');
    const provQuota = document.getElementById('provenance-quota');

    if (provBadge && freshness) {
      if (freshness.isOffline) {
        provBadge.className = 'manifest-status-badge offline';
        provBadge.textContent = '[ SOURCE: STANDALONE AUDITED BASELINE // OFFLINE ]';
      } else if (freshness.isStale) {
        provBadge.className = 'manifest-status-badge stale';
        provBadge.textContent = `[ SOURCE: LOCAL SNAPSHOT // STALE (${freshness.ageHours}H) ]`;
      } else {
        provBadge.className = 'manifest-status-badge verified';
        provBadge.textContent = `[ SOURCE: LOCAL SNAPSHOT // FRESH (${freshness.ageHours}H) ]`;
      }
    }

    if (provSource && data.provenance) {
      provSource.textContent = `${data.provenance.primary_source} (${data.provenance.access_mode})`;
    }
    if (provTimestamp && data.provenance) {
      provTimestamp.textContent = data.provenance.collected_at_utc;
    }
    if (provAge && freshness) {
      provAge.textContent = `${freshness.ageHours} Hours (${freshness.isFresh ? '< 24h // VALID FRESH SNAPSHOT' : freshness.isStale ? '> 24h // REFRESH RECOMMENDED' : 'OFFLINE BASELINE'})`;
    }
    if (provQuota && data.provenance && data.provenance.rate_limit_snapshot) {
      const snap = data.provenance.rate_limit_snapshot;
      const pct = Math.round((snap.remaining / snap.limit) * 100);
      provQuota.innerHTML = `${snap.remaining} / ${snap.limit} Units Remaining ` +
        `<span class="quota-meter-wrap"><span class="quota-meter-bar"><span id="quota-meter-fill" class="quota-meter-fill" style="width: ${pct}%;"></span></span></span> ` +
        `(Safety Gate: &ge; 35)`;
    }

    // 4. Update Sheet 10 Dataset Toggle
    renderLogbookRows();
  }

  // ========================================================================
  // INITIALIZATION ROOT
  // ========================================================================

  function initInteractivity() {
    // 1. Project Explorer
    const searchInput = document.getElementById('repo-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        activeSearchTerm = e.target.value.trim().toLowerCase();
        applyProjectFilters();
      });
    }

    document.querySelectorAll('.lang-filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelectorAll('.lang-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeLangFilter = btn.getAttribute('data-lang') || 'ALL';
        applyProjectFilters();
      });
    });

    document.querySelectorAll('.cat-filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelectorAll('.cat-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeCatFilter = btn.getAttribute('data-cat') || 'ALL';
        applyProjectFilters();
      });
    });

    document.querySelectorAll('#sheet-04 .project-card').forEach(card => {
      card.classList.add('interactive-card');
      card.setAttribute('tabindex', '0');
      card.setAttribute('role', 'button');
      card.setAttribute('aria-label', 'Inspect project architecture');

      const clickHandler = (e) => {
        // If clicking external github link, allow normal navigation
        if (e.target.closest('a')) return;
        const titleEl = card.querySelector('.project-title');
        const repoName = card.getAttribute('data-repo') || (titleEl && titleEl.textContent.trim().toLowerCase());
        if (repoName) openProjectModal(repoName, card);
      };

      card.addEventListener('click', clickHandler);
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          clickHandler(e);
        }
      });
    });

    const modalCloseBtn = document.getElementById('modal-close-btn');
    if (modalCloseBtn) {
      modalCloseBtn.addEventListener('click', closeProjectModal);
    }

    const modalBackdrop = document.getElementById('project-modal');
    if (modalBackdrop) {
      modalBackdrop.addEventListener('click', (e) => {
        if (e.target === modalBackdrop) closeProjectModal();
      });
    }

    window.addEventListener('keydown', handleModalKeydown);

    // 2. Telemetry Inspection
    document.querySelectorAll('.metric-stat-box').forEach(box => {
      box.classList.add('interactive-metric');
      box.setAttribute('tabindex', '0');
      box.setAttribute('role', 'button');

      const trigger = () => {
        const key = box.getAttribute('data-metric-key');
        if (key) inspectTelemetryMetric(key);
      };

      box.addEventListener('click', trigger);
      box.addEventListener('mouseenter', trigger);
      box.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          trigger();
        }
      });
    });

    // 3. Contribution Heatmap
    document.querySelectorAll('.cad-heatmap-svg g[data-cluster-key]').forEach(group => {
      group.style.cursor = 'pointer';
      const trigger = () => {
        const key = group.getAttribute('data-cluster-key');
        if (key) inspectHeatmapCluster(key);
      };
      group.addEventListener('mouseenter', trigger);
      group.addEventListener('click', trigger);
    });

    const heatmapRepoFilter = document.getElementById('heatmap-repo-filter');
    if (heatmapRepoFilter) {
      heatmapRepoFilter.addEventListener('change', (e) => {
        const repo = e.target.value;
        const targetClusters = {
          'all': 'jul',
          'portfolio': 'nov',
          'exam-oracle-ai': 'jul',
          'neuroverse': 'jul',
          'chandrayaan-4.0': 'jul',
          'aria': 'mar',
          'synapse': 'mar'
        };
        inspectHeatmapCluster(targetClusters[repo] || 'jul');
      });
    }

    // 4. Research Dossiers
    initResearchDossiers();

    // 5. System Architecture
    document.querySelectorAll('.arch-node-interactive').forEach(node => {
      const trigger = () => {
        const key = node.getAttribute('data-subsystem-key');
        if (key) inspectArchSubsystem(key);
      };
      node.addEventListener('mouseenter', trigger);
      node.addEventListener('click', trigger);
      node.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          trigger();
        }
      });
    });

    // 6. Roadmap Milestones
    document.querySelectorAll('.roadmap-item[data-milestone-key]').forEach(item => {
      item.classList.add('interactive-milestone');
      item.setAttribute('tabindex', '0');
      item.setAttribute('role', 'button');

      const trigger = () => {
        const key = item.getAttribute('data-milestone-key');
        if (key) inspectRoadmapMilestone(key);
      };

      item.addEventListener('click', trigger);
      item.addEventListener('mouseenter', trigger);
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          trigger();
        }
      });
    });

    // 7. Logbook Controls
    const logSearchInput = document.getElementById('log-search-input');
    if (logSearchInput) {
      logSearchInput.addEventListener('input', (e) => {
        logSearchQuery = e.target.value.trim().toLowerCase();
        applyLogbookFilters();
      });
    }

    const logSortBtn = document.getElementById('log-sort-btn');
    if (logSortBtn) {
      logSortBtn.addEventListener('click', (e) => {
        e.preventDefault();
        toggleLogbookSort();
      });
    }

    const logRepoSelect = document.getElementById('log-repo-select');
    if (logRepoSelect) {
      logRepoSelect.addEventListener('change', (e) => {
        logRepoFilter = e.target.value;
        applyLogbookFilters();
      });
    }

    const logDatasetToggleBtn = document.getElementById('log-dataset-toggle-btn');
    if (logDatasetToggleBtn) {
      logDatasetToggleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        activeLogDataset = activeLogDataset === 'MILESTONES' ? 'RECENT_COMMITS' : 'MILESTONES';
        renderLogbookRows();
      });
    }

    // 8. Clipboard Copy & Terminal Form
    setupClipboardCopy();
    setupPrototypeTerminalSubmit();

    // 9. Sheet 12 Active Row Sync
    syncMasterIndexActiveRow();
    window.addEventListener('hashchange', () => {
      setTimeout(syncMasterIndexActiveRow, 50);
    });

    // 10. Blueprint Data Service Hydration & Event Listener
    window.addEventListener('blueprint:data-ready', (e) => {
      const { data, status, freshness } = e.detail || {};
      hydrateFromDataService(data, status, freshness);
    });

    if (window.BlueprintDataService) {
      const currentData = window.BlueprintDataService.getData();
      if (currentData) {
        hydrateFromDataService(
          currentData,
          window.BlueprintDataService.getStatus(),
          window.BlueprintDataService.getFreshness()
        );
      }
    }

    // Initial triggers for default inspection states
    inspectTelemetryMetric('repos');
    inspectHeatmapCluster('jul');
    inspectArchSubsystem('threejs');
    inspectRoadmapMilestone('consensus');
  }

  document.addEventListener('DOMContentLoaded', initInteractivity);
})();
