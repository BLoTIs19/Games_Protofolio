/*
  DATA LAYER
  ----------
  This is the only file that knows about localStorage. Everything else
  (public renderer, admin dashboard) talks to the functions exported on
  `Store`. To move to a real backend later, reimplement the body of each
  function to call your API instead of touching localStorage — nothing
  else in the codebase needs to change.

  Project schema:
  {
    id, slug, title, shortDescription, description,
    category, status,            // status: "In Development" | "Completed" | "On Hold" | "Prototype"
    startDate, endDate, releaseDate,   // "YYYY-MM" strings, endDate/releaseDate optional
    engine, engineVersion, languages[], tools[], platforms[],
    role, teamSize,
    tags[],
    featured: bool,
    visibility: "published" | "draft" | "hidden",
    order: number,               // manual sort position, lower = earlier
    thumbnail: url,
    images: [url],
    videos: [{ title, url }],
    gifs: [{ title, url }],
    links: [{ label, url, type }],
    caseStudy: { overview, contribution, technical, development, challenges, solutions, results }
  }
*/

const STORAGE_KEY = "gdportfolio.projects.v1";
const ORDER_MODE_KEY = "gdportfolio.orderMode.v1"; // "date" | "manual"

const Store = (() => {
  function readRaw() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.error("Store: failed to read localStorage, resetting.", e);
      return null;
    }
  }

  function writeRaw(projects) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
      return true;
    } catch (e) {
      console.error("Store: failed to write localStorage.", e);
      return false;
    }
  }

  function ensureSeeded() {
    const existing = readRaw();
    if (existing === null) {
      writeRaw(DEMO_PROJECTS);
    }
  }

  function slugify(str) {
    return str
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  function uid() {
    return "p_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
  }

  function getAll() {
    ensureSeeded();
    return readRaw() || [];
  }

  function getById(id) {
    return getAll().find((p) => p.id === id) || null;
  }

  function getBySlug(slug) {
    return getAll().find((p) => p.slug === slug) || null;
  }

  function getPublished() {
    return getAll().filter((p) => p.visibility === "published");
  }

  function getOrderMode() {
    return localStorage.getItem(ORDER_MODE_KEY) || "date";
  }

  function setOrderMode(mode) {
    localStorage.setItem(ORDER_MODE_KEY, mode === "manual" ? "manual" : "date");
  }

  function sortProjects(projects) {
    const mode = getOrderMode();
    const list = [...projects];
    if (mode === "manual") {
      return list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    }
    // Default: by date, most recent first (release > end > start)
    const dateOf = (p) => p.releaseDate || p.endDate || p.startDate || "0000-00";
    return list.sort((a, b) => (dateOf(b) > dateOf(a) ? 1 : dateOf(b) < dateOf(a) ? -1 : 0));
  }

  function filterProjects(projects, { tag, query } = {}) {
    let list = projects;
    if (tag && tag !== "all") {
      list = list.filter((p) => p.tags.includes(tag));
    }
    if (query && query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((p) =>
        [p.title, p.shortDescription, p.engine, p.role, ...(p.tags || [])]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q)
      );
    }
    return list;
  }

  function allTags() {
    const tags = new Set();
    getAll().forEach((p) => (p.tags || []).forEach((t) => tags.add(t)));
    return [...tags].sort();
  }

  function save(project) {
    const all = getAll();
    const isNew = !project.id;
    if (isNew) {
      project.id = uid();
      project.slug = slugify(project.title || project.id);
      // avoid slug collisions
      let base = project.slug,
        i = 2;
      while (all.some((p) => p.slug === project.slug)) {
        project.slug = `${base}-${i++}`;
      }
      if (project.order === undefined || project.order === null) {
        project.order = all.length ? Math.max(...all.map((p) => p.order ?? 0)) + 1 : 0;
      }
      all.push(project);
    } else {
      const idx = all.findIndex((p) => p.id === project.id);
      if (idx === -1) throw new Error("Project not found for update: " + project.id);
      // Re-slug only if title changed and new slug is free
      if (project.title && slugify(project.title) !== project.slug) {
        let newSlug = slugify(project.title),
          base = newSlug,
          i = 2;
        while (all.some((p) => p.slug === newSlug && p.id !== project.id)) {
          newSlug = `${base}-${i++}`;
        }
        project.slug = newSlug;
      }
      all[idx] = { ...all[idx], ...project };
    }
    writeRaw(all);
    return project;
  }

  function remove(id) {
    const all = getAll().filter((p) => p.id !== id);
    writeRaw(all);
  }

  function reorder(orderedIds) {
    const all = getAll();
    orderedIds.forEach((id, index) => {
      const p = all.find((x) => x.id === id);
      if (p) p.order = index;
    });
    writeRaw(all);
    setOrderMode("manual");
  }

  function setFeatured(id, featured) {
    const p = getById(id);
    if (!p) return;
    save({ ...p, featured });
  }

  function setVisibility(id, visibility) {
    const p = getById(id);
    if (!p) return;
    save({ ...p, visibility });
  }

  function stats() {
    const all = getAll();
    return {
      total: all.length,
      published: all.filter((p) => p.visibility === "published").length,
      draft: all.filter((p) => p.visibility === "draft").length,
      hidden: all.filter((p) => p.visibility === "hidden").length,
      featured: all.filter((p) => p.featured).length,
      tags: allTags().length,
    };
  }

  function resetToDemo() {
    writeRaw(DEMO_PROJECTS);
  }

  return {
    getAll,
    getById,
    getBySlug,
    getPublished,
    getOrderMode,
    setOrderMode,
    sortProjects,
    filterProjects,
    allTags,
    save,
    remove,
    reorder,
    setFeatured,
    setVisibility,
    stats,
    resetToDemo,
    slugify,
  };
})();

/* ---------------------------------------------------------------------
   Demo / placeholder content. Fictional projects — replace or remove
   from the admin dashboard. Media URLs point to neutral placeholders.
--------------------------------------------------------------------- */
const DEMO_PROJECTS = [
  {
    id: "p_demo1",
    slug: "ashfall-protocol",
    title: "Ashfall Protocol",
    shortDescription: "A squad-based tactics prototype with a custom cover and line-of-sight system.",
    description:
      "Ashfall Protocol is a turn-based tactics prototype built to explore a fully custom cover, line-of-sight and ability-targeting system in Unreal Engine 5. The project focuses on readable tactical feedback: every tile communicates risk before the player commits to a move.",
    category: "Tactics / Strategy",
    status: "In Development",
    startDate: "2025-02",
    endDate: "",
    releaseDate: "",
    engine: "Unreal Engine 5",
    engineVersion: "5.4",
    languages: ["C++", "Blueprint"],
    tools: ["Perforce", "Jenkins"],
    platforms: ["PC"],
    role: "Gameplay Programmer",
    teamSize: "3 (solo programmer)",
    tags: ["Unreal Engine", "C++", "Gameplay", "AI", "Tools"],
    featured: true,
    visibility: "published",
    order: 0,
    thumbnail: "https://placehold.co/1200x750/1c1f26/e3a857?text=Ashfall+Protocol",
    images: [
      "https://placehold.co/1600x900/1c1f26/e9e7e2?text=Cover+System",
      "https://placehold.co/1600x900/1c1f26/e9e7e2?text=Ability+Targeting",
      "https://placehold.co/1600x900/1c1f26/e9e7e2?text=Line+of+Sight+Debug",
    ],
    videos: [{ title: "Combat loop walkthrough", url: "" }],
    gifs: [{ title: "Cover-to-cover movement", url: "" }],
    links: [
      { label: "Source code", url: "https://github.com/yourusername/ashfall-protocol", type: "github" },
    ],
    caseStudy: {
      overview:
        "A tactics prototype focused on making cover and threat ranges legible at a glance, without cluttering the HUD.",
      contribution:
        "Designed and implemented the entire gameplay layer solo: grid pathing, a custom line-of-sight solver, cover scoring, and the ability-targeting pipeline.",
      technical:
        "Line-of-sight uses a precomputed visibility grid refreshed on cover changes, avoiding per-frame raycasts. Abilities are data-driven via a small DSL parsed into gameplay tags.",
      development:
        "Built iteratively in two-week milestones, with a debug overlay for visualizing the visibility grid used throughout development.",
      challenges:
        "Naively recalculating visibility every frame caused frame-time spikes on larger maps.",
      solutions:
        "Moved to an event-driven recalculation model, only updating cells affected by a change, cutting the per-move cost by over 90%.",
      results:
        "A fully playable vertical slice with three ability types, destructible cover, and a working turn economy.",
    },
  },
  {
    id: "p_demo2",
    slug: "hollow-orbit",
    title: "Hollow Orbit",
    shortDescription: "A co-op survival game jam entry with server-authoritative multiplayer.",
    description:
      "Built in 72 hours for a game jam, Hollow Orbit is a 2-player co-op survival game about repairing a stranded ship. Focused on getting replication right under a tight deadline.",
    category: "Co-op Survival",
    status: "Completed",
    startDate: "2025-06",
    endDate: "2025-06",
    releaseDate: "2025-06",
    engine: "Unreal Engine 5",
    engineVersion: "5.3",
    languages: ["C++", "Blueprint"],
    tools: ["Git"],
    platforms: ["PC"],
    role: "Multiplayer Programmer",
    teamSize: "4",
    tags: ["Unreal Engine", "Multiplayer", "Game Jam", "Team Project", "C++"],
    featured: true,
    visibility: "published",
    order: 1,
    thumbnail: "https://placehold.co/1200x750/1c1f26/5fa8a0?text=Hollow+Orbit",
    images: [
      "https://placehold.co/1600x900/1c1f26/e9e7e2?text=Ship+Interior",
      "https://placehold.co/1600x900/1c1f26/e9e7e2?text=Repair+System",
    ],
    videos: [],
    gifs: [{ title: "Repair minigame", url: "" }],
    links: [
      { label: "Source code", url: "https://github.com/yourusername/hollow-orbit", type: "github" },
      { label: "Play on itch.io", url: "", type: "itch" },
    ],
    caseStudy: {
      overview: "A 72-hour jam project built around a single shared mechanic: repairing systems under time pressure.",
      contribution:
        "Owned all networking: server-authoritative repair state, lag-compensated interaction, and reconnect handling.",
      technical:
        "Replicated a compact repair-state struct per system rather than replicating individual actors, keeping bandwidth low on a jam-quality connection.",
      development: "Shipped in three sprints across the weekend with the rest of a 4-person team.",
      challenges: "Late-joining players could desync repair progress.",
      solutions: "Added a full-state resync on join, gated behind a single RPC to avoid flooding the connection.",
      results: "Finished top 10 of the jam's multiplayer category with a stable, playable build.",
    },
  },
  {
    id: "p_demo3",
    slug: "field-editor-toolkit",
    title: "Field Editor Toolkit",
    shortDescription: "An in-editor tool for placing and previewing procedural foliage clusters.",
    description:
      "An Unreal Editor utility widget suite that lets designers paint procedural foliage clusters with live parameter previews, cutting foliage-pass iteration time significantly.",
    category: "Tools / Pipeline",
    status: "Completed",
    startDate: "2024-11",
    endDate: "2025-01",
    releaseDate: "",
    engine: "Unreal Engine 5",
    engineVersion: "5.2",
    languages: ["C++", "Python"],
    tools: ["Git", "Jira"],
    platforms: ["PC (Editor Tool)"],
    role: "Tools Programmer",
    teamSize: "1",
    tags: ["Unreal Engine", "Tools", "Procedural Generation", "C++"],
    featured: false,
    visibility: "published",
    order: 2,
    thumbnail: "https://placehold.co/1200x750/1c1f26/e3a857?text=Field+Editor+Toolkit",
    images: ["https://placehold.co/1600x900/1c1f26/e9e7e2?text=Editor+Widget"],
    videos: [],
    gifs: [],
    links: [],
    caseStudy: {
      overview: "An internal tool built to speed up environment art iteration.",
      contribution: "Designed and built the tool end to end as a solo tools programmer.",
      technical: "Implemented as an Editor Utility Widget with a C++ backend for cluster generation and undo support.",
      development: "Developed alongside an environment artist who used it daily and drove the feature list.",
      challenges: "Initial versions didn't integrate with Unreal's undo/redo transaction system.",
      solutions: "Wrapped generation calls in scoped transactions so artists could safely experiment.",
      results: "Reduced foliage-pass iteration time on a test level from hours to minutes.",
    },
  },
];
