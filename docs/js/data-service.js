/**
 * BLUEPRINT / FORGE RUNTIME — LOCAL PUBLIC DATA SERVICE
 * Document ID: BP-JS-DATA-REV01
 * 
 * Local, read-only data service. Fetches local snapshot 'data/github-data.json'
 * without ever calling external APIs from the browser. Supports offline fallback
 * and emits 'blueprint:data-ready' event.
 */

(function () {
  'use strict';

  // Audited Standalone Fallback Baseline (DATA_INTEGRITY_AUDIT.md)
  const FALLBACK_BASELINE = {
    provenance: {
      collected_at_utc: '2026-11-07T13:46:00.000Z',
      collector_version: '1.2.0-baseline',
      access_mode: 'UNAUTHENTICATED_PUBLIC_REST',
      primary_source: 'Audited Offline Baseline (DATA_INTEGRITY_AUDIT.md)',
      rate_limit_snapshot: {
        limit: 60,
        remaining: 60,
        reset_utc: '2026-11-07T14:46:00.000Z',
        used: 0
      }
    },
    user: {
      login: 'sahasanchayan44-tech',
      id: 268472249,
      created_at: '2026-03-16T00:20:48Z',
      updated_at: '2026-07-29T17:11:57Z',
      public_repos: 9,
      followers: 0,
      following: 2,
      public_gists: 0,
      html_url: 'https://github.com/sahasanchayan44-tech'
    },
    telemetry: {
      total_stars: 2,
      total_forks: 2,
      account_age_days: 236,
      primary_ecosystems: ['JavaScript', 'Python', 'TypeScript', 'Kotlin', 'Shell'],
      public_events_90d_count: 2
    },
    repositories: [
      {
        name: 'portfolio',
        project_id: 'PRJ-01',
        category: 'Frontend',
        primary_language: 'JavaScript',
        languages: { JavaScript: 10000 },
        stars: 0,
        forks: 0,
        default_branch: 'master',
        created_at: '2026-11-01T06:53:19Z',
        updated_at: '2026-11-01T07:16:01Z',
        pushed_at: '2026-11-01T07:16:01Z',
        repo_url: 'https://github.com/sahasanchayan44-tech/portfolio',
        api_description: null,
        architectural_description: 'Swiss-minimalist portfolio and 2D/3D Cultural Archive. Integrates Three.js 3D world with 8 interactive zones and structured static JSON CMS.',
        architecture: 'Static CMS + 3D Raycasting',
        key_components: ['Three.js 3D', '2D Archive', 'JSON CMS'],
        provenance: { metadata_source: 'Baseline Audit', architecture_source: 'Codebase Inspection' }
      },
      {
        name: 'exam-oracle-ai',
        project_id: 'PRJ-02',
        category: 'AI / ML',
        primary_language: 'Python',
        languages: { Python: 8000, TypeScript: 2000 },
        stars: 0,
        forks: 0,
        default_branch: 'main',
        created_at: '2026-07-29T16:25:51Z',
        updated_at: '2026-07-29T17:16:46Z',
        pushed_at: '2026-07-29T17:16:46Z',
        repo_url: 'https://github.com/sahasanchayan44-tech/exam-oracle-ai',
        api_description: null,
        architectural_description: 'Enterprise AI and statistical examination analysis platform. Built as a Turbo monorepo with containerized microservices and Python statistical engines.',
        architecture: 'Containerized Monorepo',
        key_components: ['Turborepo', 'Python ML', 'Docker Engine'],
        provenance: { metadata_source: 'Baseline Audit', architecture_source: 'Codebase Inspection' }
      },
      {
        name: 'neuroverse',
        project_id: 'PRJ-03',
        category: 'Spatial 3D',
        primary_language: 'TypeScript',
        languages: { TypeScript: 9000, JavaScript: 1000 },
        stars: 1,
        forks: 0,
        default_branch: 'main',
        created_at: '2026-07-22T15:03:56Z',
        updated_at: '2026-07-25T20:31:42Z',
        pushed_at: '2026-07-25T20:31:42Z',
        repo_url: 'https://github.com/sahasanchayan44-tech/neuroverse',
        api_description: null,
        architectural_description: 'Cognitive neural interface featuring interactive 3D brain model visualizers, full-stack Express server, and Google Gemini multimodal AI integration.',
        architecture: 'Next.js + Express + Gemini',
        key_components: ['Next.js 14', '3D Brain', 'Gemini API'],
        provenance: { metadata_source: 'Baseline Audit', architecture_source: 'Codebase Inspection' }
      },
      {
        name: 'chandrayaan-4.0',
        project_id: 'PRJ-04',
        category: 'Space & Systems',
        primary_language: 'JavaScript',
        languages: { JavaScript: 12000 },
        stars: 1,
        forks: 0,
        default_branch: 'main',
        created_at: '2026-07-16T08:06:31Z',
        updated_at: '2026-07-16T20:16:33Z',
        pushed_at: '2026-07-16T20:16:33Z',
        repo_url: 'https://github.com/sahasanchayan44-tech/chandrayaan-4.0',
        api_description: null,
        architectural_description: 'Mission telemetry and orbital trajectory visualization dashboard for lunar exploration simulation. Real-time telemetry monitoring with Firebase backend.',
        architecture: 'Next.js 16 + Firebase',
        key_components: ['Next.js 16', 'Mission Dashboard', 'Firebase DB'],
        provenance: { metadata_source: 'Baseline Audit', architecture_source: 'Codebase Inspection' }
      },
      {
        name: 'sunapse-android',
        project_id: 'PRJ-05',
        category: 'Mobile',
        primary_language: 'Kotlin',
        languages: { Kotlin: 15000 },
        stars: 0,
        forks: 1,
        default_branch: 'main',
        created_at: '2026-03-31T14:47:55Z',
        updated_at: '2026-04-05T14:34:07Z',
        pushed_at: '2026-04-05T14:34:07Z',
        repo_url: 'https://github.com/sahasanchayan44-tech/sunapse-android',
        api_description: null,
        architectural_description: 'Mobile companion client for the Synapse knowledge workspace. Built with native Android Jetpack Compose, Material Design 3, and offline-first room database.',
        architecture: 'Android Jetpack + Kotlin',
        key_components: ['Kotlin', 'Compose UI', 'Offline DB'],
        provenance: { metadata_source: 'Baseline Audit', architecture_source: 'Codebase Inspection' }
      },
      {
        name: 'synapse',
        project_id: 'PRJ-06',
        category: 'AI / ML',
        primary_language: 'TypeScript',
        languages: { TypeScript: 8000, Python: 4000 },
        stars: 0,
        forks: 0,
        default_branch: 'main',
        created_at: '2026-03-27T04:24:09Z',
        updated_at: '2026-03-27T04:47:58Z',
        pushed_at: '2026-03-27T04:47:58Z',
        repo_url: 'https://github.com/sahasanchayan44-tech/synapse',
        api_description: null,
        architectural_description: 'Local developer AI assistant and code intelligence workspace. Connects local LLM inference engines (Ollama) with FastAPI orchestration and React frontend.',
        architecture: 'Ollama + FastAPI + React',
        key_components: ['React', 'FastAPI', 'Ollama LLM'],
        provenance: { metadata_source: 'Baseline Audit', architecture_source: 'Codebase Inspection' }
      },
      {
        name: 'study-manager',
        project_id: 'PRJ-07',
        category: 'Frontend',
        primary_language: 'TypeScript',
        languages: { TypeScript: 11000 },
        stars: 0,
        forks: 0,
        default_branch: 'main',
        created_at: '2026-03-27T05:06:39Z',
        updated_at: '2026-03-28T11:01:36Z',
        pushed_at: '2026-03-28T11:01:36Z',
        repo_url: 'https://github.com/sahasanchayan44-tech/study-manager',
        api_description: null,
        architectural_description: 'Structured academic schedule and engineering sprint management application. Implements deterministic task state machines and local persistence.',
        architecture: 'TypeScript SPA + LocalStorage',
        key_components: ['TypeScript', 'Task State Machine', 'Local Persistence'],
        provenance: { metadata_source: 'Baseline Audit', architecture_source: 'Codebase Inspection' }
      },
      {
        name: 'admin-panel',
        project_id: 'PRJ-08',
        category: 'Frontend',
        primary_language: 'TypeScript',
        languages: { TypeScript: 9500 },
        stars: 0,
        forks: 0,
        default_branch: 'main',
        created_at: '2026-03-31T14:15:18Z',
        updated_at: '2026-03-31T14:19:50Z',
        pushed_at: '2026-03-31T14:19:50Z',
        repo_url: 'https://github.com/sahasanchayan44-tech/admin-panel',
        api_description: null,
        architectural_description: 'Administrative management dashboard featuring role-based access controls, data tables with pagination, and interactive telemetry charts.',
        architecture: 'Vite + React + Tailwind',
        key_components: ['React 18', 'Tailwind CSS', 'Data Grid'],
        provenance: { metadata_source: 'Baseline Audit', architecture_source: 'Codebase Inspection' }
      },
      {
        name: 'aria',
        project_id: 'PRJ-09',
        category: 'Space & Systems',
        primary_language: 'Shell',
        languages: { Shell: 5000 },
        stars: 0,
        forks: 1,
        default_branch: 'main',
        created_at: '2026-03-18T02:59:58Z',
        updated_at: '2026-03-18T03:04:38Z',
        pushed_at: '2026-03-18T03:04:38Z',
        repo_url: 'https://github.com/sahasanchayan44-tech/aria',
        api_description: null,
        architectural_description: 'Autonomous Linux system administration and developer environment automation scripts. Automated toolchain configuration and containerized service deployment.',
        architecture: 'Linux Shell + Docker',
        key_components: ['Bash Shell', 'Systemd', 'Docker Automation'],
        provenance: { metadata_source: 'Baseline Audit', architecture_source: 'Codebase Inspection' }
      }
    ],
    historical_milestones: [
      { log_id: 'LOG-01', timestamp_display: '2026-11-07', timestamp_iso: '2026-11-07T00:00:00Z', repository: 'sahasanchayan44-tech/BLUEPRINT', commit_sha: 'LOCAL SPEC', commit_url: null, author_login: 'sahasanchayan44-tech', message: 'Forge Runtime 12-sheet unified engineering dossier specification & CAD layout system', verification_status: 'ACTIVE LOCAL SPECIFICATION' },
      { log_id: 'LOG-02', timestamp_display: '2026-11-01T07:15Z', timestamp_iso: '2026-11-01T07:16:01Z', repository: 'sahasanchayan44-tech/portfolio', commit_sha: '3409681', commit_url: 'https://github.com/sahasanchayan44-tech/portfolio/commit/3409681229af2cf671c54fcc7955d3e1af8acf63', author_login: 'sahasanchayan44-tech', message: 'Optimize 3D rendering pipeline and add multi-threaded fast server', verification_status: 'VERIFIED GIT COMMIT' },
      { log_id: 'LOG-03', timestamp_display: '2026-07-29T17:16Z', timestamp_iso: '2026-07-29T17:16:46Z', repository: 'sahasanchayan44-tech/exam-oracle-ai', commit_sha: '9c56152', commit_url: 'https://github.com/sahasanchayan44-tech/exam-oracle-ai/commit/9c561526f8b1502ed703f2b88298e779afcdedce', author_login: 'sahasanchayan44-tech', message: 'feat(ui): add interactive neural network canvas background with dynamic mouse node-edge communication', verification_status: 'VERIFIED GIT COMMIT' },
      { log_id: 'LOG-04', timestamp_display: '2026-07-25T20:31Z', timestamp_iso: '2026-07-25T20:31:42Z', repository: 'sahasanchayan44-tech/neuroverse', commit_sha: 'f150e42', commit_url: 'https://github.com/sahasanchayan44-tech/neuroverse/commit/f150e4241554a01cc68abd6a062f08178c3e46bd', author_login: 'sahasanchayan44-tech', message: 'fix(deps): override three-mesh-bvh to ^0.8.0 in package.json to resolve deprecation warning', verification_status: 'VERIFIED GIT COMMIT' },
      { log_id: 'LOG-05', timestamp_display: '2026-07-16T20:16Z', timestamp_iso: '2026-07-16T20:16:33Z', repository: 'sahasanchayan44-tech/chandrayaan-4.0', commit_sha: 'a3bf025', commit_url: 'https://github.com/sahasanchayan44-tech/chandrayaan-4.0/commit/a3bf025810defcca2691bdf82561a1da5bf17a7d', author_login: 'sahasanchayan44-tech', message: 'Refactor hopper workspace header breadcrumbs, tabs, inputs, and action buttons to use native dashboard styling', verification_status: 'VERIFIED GIT COMMIT' },
      { log_id: 'LOG-06', timestamp_display: '2026-04-05T14:34Z', timestamp_iso: '2026-04-05T14:34:07Z', repository: 'sahasanchayan44-tech/sunapse-android', commit_sha: '304876e', commit_url: 'https://github.com/sahasanchayan44-tech/sunapse-android/commit/304876eb8cb12cd27679a4f2fc51b2c443290a52', author_login: 'sahasanchayan44-tech', message: 'Synapse 3.8', verification_status: 'VERIFIED GIT COMMIT' },
      { log_id: 'LOG-07', timestamp_display: '2026-03-31T05:53Z', timestamp_iso: '2026-03-31T14:19:50Z', repository: 'sahasanchayan44-tech/admin-panel', commit_sha: '34909cc', commit_url: 'https://github.com/sahasanchayan44-tech/admin-panel/commit/34909cc7bad9f016cbc20bfa47d172ddd494c26c', author_login: 'sahasanchayan44-tech', message: 'i made some changes to the files, make sure to commit the changes', verification_status: 'VERIFIED GIT COMMIT' },
      { log_id: 'LOG-08', timestamp_display: '2026-03-28T07:37Z', timestamp_iso: '2026-03-28T11:01:36Z', repository: 'sahasanchayan44-tech/study-manager', commit_sha: '854d01a', commit_url: 'https://github.com/sahasanchayan44-tech/study-manager/commit/854d01af05033c552890fc831c6bb3a5a8c6b05d', author_login: 'sahasanchayan44-tech', message: 'change the icon to a coin but keep the moving facoter and rotating one', verification_status: 'VERIFIED GIT COMMIT' },
      { log_id: 'LOG-09', timestamp_display: '2026-03-27T04:22Z', timestamp_iso: '2026-03-27T04:47:58Z', repository: 'sahasanchayan44-tech/synapse', commit_sha: '119369b', commit_url: 'https://github.com/sahasanchayan44-tech/synapse/commit/119369b68d9880d812f5c8c6f1987c7f8a88d0de', author_login: 'sahasanchayan44-tech', message: 'Initial commit', verification_status: 'VERIFIED GIT COMMIT' },
      { log_id: 'LOG-10', timestamp_display: '2026-03-18T03:04Z', timestamp_iso: '2026-03-18T03:04:38Z', repository: 'sahasanchayan44-tech/aria', commit_sha: '17f670e', commit_url: 'https://github.com/sahasanchayan44-tech/aria/commit/17f670e2697e591aaac9b488398d0aa290a1cd69', author_login: 'sahasanchayan44-tech', message: 'Add files via upload', verification_status: 'VERIFIED GIT COMMIT' },
      { log_id: 'LOG-11', timestamp_display: '2026-03-16T00:20Z', timestamp_iso: '2026-03-16T00:20:48Z', repository: 'github.com/sahasanchayan44-tech', commit_sha: 'API: 268472249', commit_url: 'https://github.com/sahasanchayan44-tech', author_login: 'sahasanchayan44-tech', message: 'Authenticated GitHub developer profile initialized and public repository namespace registered', verification_status: 'VERIFIED API RECORD' }
    ],
    recent_repository_commits: [],
    limitations: {
      contribution_calendar: 'Full 52-week contribution calendar requires authenticated GraphQL pipeline.',
      events_window: 'Public events stream is restricted to 90-day window.',
      graphql_access: 'Anonymous GraphQL access rate limit is 0.',
      rate_limit_policy: 'Unauthenticated REST API is capped at 60 requests per hour per IP.'
    }
  };

  let activeData = null;
  let activeStatus = 'UNINITIALIZED'; // 'LIVE_SNAPSHOT_FRESH' | 'LIVE_SNAPSHOT_STALE' | 'OFFLINE_FALLBACK'
  let initPromise = null;

  async function loadData(url = 'data/github-data.json') {
    try {
      // Local snapshot fetch only - NEVER call external API
      const res = await fetch(url, { cache: 'no-cache' });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} when fetching local snapshot`);
      }
      const json = await res.json();

      // Basic structure validation
      if (!json || !json.provenance || !json.repositories || !json.historical_milestones) {
        throw new Error('Local snapshot failed structure validation');
      }

      activeData = json;
      const collectedTime = new Date(json.provenance.collected_at_utc).getTime();
      const ageHours = (Date.now() - collectedTime) / (1000 * 60 * 60);

      if (ageHours < 24) {
        activeStatus = 'LIVE_SNAPSHOT_FRESH';
      } else {
        activeStatus = 'LIVE_SNAPSHOT_STALE';
      }

      console.log(`[BlueprintDataService] Loaded local snapshot from ${url}. Status: ${activeStatus} (Age: ${ageHours.toFixed(1)}h)`);
    } catch (err) {
      console.warn(`[BlueprintDataService] Local snapshot unavailable (${err.message}). Using embedded audited baseline.`);
      activeData = JSON.parse(JSON.stringify(FALLBACK_BASELINE));
      activeStatus = 'OFFLINE_FALLBACK';
    }

    // Dispatch DOM event for hydration
    const freshness = getFreshnessInfo();
    window.dispatchEvent(new CustomEvent('blueprint:data-ready', {
      detail: {
        data: activeData,
        status: activeStatus,
        freshness: freshness
      }
    }));

    return activeData;
  }

  function setMockData(mockData) {
    activeData = mockData;
    activeStatus = 'MOCK_TEST_HYDRATION';
    const freshness = getFreshnessInfo();
    window.dispatchEvent(new CustomEvent('blueprint:data-ready', {
      detail: {
        data: activeData,
        status: activeStatus,
        freshness: freshness
      }
    }));
  }

  function loadFromUrl(url) {
    return loadData(url);
  }

  function init() {
    initPromise = loadData('data/github-data.json');
    return initPromise;
  }

  function getData() {
    return activeData || FALLBACK_BASELINE;
  }

  function getStatus() {
    return activeStatus;
  }

  function getFreshnessInfo() {
    const data = getData();
    const collectedAt = data.provenance ? data.provenance.collected_at_utc : null;
    const collectedTime = collectedAt ? new Date(collectedAt).getTime() : 0;
    const ageMs = Math.max(0, Date.now() - collectedTime);
    const ageHours = +(ageMs / (1000 * 60 * 60)).toFixed(1);
    const ageDays = +(ageMs / (1000 * 60 * 60 * 24)).toFixed(1);

    return {
      status: activeStatus,
      collectedAtUtc: collectedAt,
      ageHours: ageHours,
      ageDays: ageDays,
      isFresh: activeStatus === 'LIVE_SNAPSHOT_FRESH',
      isStale: activeStatus === 'LIVE_SNAPSHOT_STALE',
      isOffline: activeStatus === 'OFFLINE_FALLBACK',
      rateLimit: (data.provenance && data.provenance.rate_limit_snapshot) || null
    };
  }

  // Public Service Interface
  window.BlueprintDataService = {
    init,
    getData,
    getStatus,
    getFreshness: getFreshnessInfo,
    getFreshnessInfo,
    loadFromUrl,
    setMockData,
    getUser: () => (getData().user),
    getTelemetry: () => (getData().telemetry),
    getRepositories: () => (getData().repositories || []),
    getHistoricalMilestones: () => (getData().historical_milestones || []),
    getRecentCommits: () => (getData().recent_repository_commits || []),
    getLimitations: () => (getData().limitations || {})
  };

  // Auto-init on script load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { init(); });
  } else {
    init();
  }
})();
