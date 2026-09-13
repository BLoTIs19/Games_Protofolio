(function () {
  "use strict";

  const LOCAL_KEY = "shelf64_local_projects";

  function getLocalProjects() {
    try {
      const raw = localStorage.getItem(LOCAL_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveLocalProjects(list) {
    try {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(list));
    } catch (e) {
      /* storage unavailable, ignore */
    }
  }

  // Combine the checked-in projects.js data with anything added locally
  // in this browser via the "Add a project" form.
  let allProjects = (typeof PROJECTS !== "undefined" ? PROJECTS : []).concat(getLocalProjects());
  let activeTag = "All";

  const grid = document.getElementById("grid");
  const filtersEl = document.getElementById("filters");
  const emptyState = document.getElementById("emptyState");

  function uniqueTags(projects) {
    const set = new Set();
    projects.forEach(p => (p.tags || []).forEach(t => set.add(t)));
    return Array.from(set);
  }

  function renderFilters() {
    const tags = ["All", ...uniqueTags(allProjects)];
    filtersEl.innerHTML = "";
    tags.forEach(tag => {
      const btn = document.createElement("button");
      btn.className = "chip" + (tag === activeTag ? " active" : "");
      btn.textContent = tag;
      btn.addEventListener("click", () => {
        activeTag = tag;
        renderFilters();
        renderGrid();
      });
      filtersEl.appendChild(btn);
    });
  }

  function cardTemplate(project) {
    const card = document.createElement("button");
    card.className = "cartridge";
    card.setAttribute("aria-label", "Open details for " + project.title);

    const label = document.createElement("div");
    label.className = "cart-label";
    if (project.image) {
      const img = document.createElement("img");
      img.src = project.image;
      img.alt = "";
      label.appendChild(img);
    } else {
      const glyph = document.createElement("span");
      glyph.className = "fallback-glyph";
      glyph.textContent = "▣";
      label.appendChild(glyph);
    }

    const body = document.createElement("div");
    body.className = "cart-body";
    body.innerHTML = `
      <p class="cart-title">${escapeHtml(project.title)}</p>
      <p class="cart-tagline">${escapeHtml(project.tagline || "")}</p>
      <div class="cart-tags">${(project.tags || []).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join("")}</div>
    `;

    card.appendChild(label);
    card.appendChild(body);
    card.addEventListener("click", () => openDetail(project));
    return card;
  }

  function renderGrid() {
    const visible = activeTag === "All"
      ? allProjects
      : allProjects.filter(p => (p.tags || []).includes(activeTag));

    grid.innerHTML = "";
    visible.forEach(p => grid.appendChild(cardTemplate(p)));
    emptyState.hidden = visible.length !== 0;
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str == null ? "" : String(str);
    return div.innerHTML;
  }

  // ---------- detail modal ----------
  const detailOverlay = document.getElementById("detailOverlay");
  const detailContent = document.getElementById("detailContent");

  function openDetail(project) {
    const gallery = (project.gallery && project.gallery.length ? project.gallery : [project.image]).filter(Boolean);
    detailContent.innerHTML = `
      ${project.image ? `<img class="detail-cover" src="${project.image}" alt="">` : ""}
      <h3 class="detail-title" id="detailTitle">${escapeHtml(project.title)}</h3>
      <p class="detail-meta">${[project.year, project.engine].filter(Boolean).map(escapeHtml).join(" · ")}</p>
      <p class="detail-desc">${escapeHtml(project.description || project.tagline || "")}</p>
      ${gallery.length > 1 ? `<div class="detail-gallery">${gallery.map(src => `<img src="${src}" alt="">`).join("")}</div>` : ""}
      <div class="detail-links">
        ${project.playUrl ? `<a class="btn btn-primary" href="${project.playUrl}" target="_blank" rel="noopener">Play the demo</a>` : ""}
        ${project.codeUrl ? `<a class="btn btn-ghost" href="${project.codeUrl}" target="_blank" rel="noopener">View source</a>` : ""}
      </div>
    `;
    openOverlay(detailOverlay);
  }

  function openOverlay(el) { el.hidden = false; }
  function closeOverlay(el) { el.hidden = true; }

  document.querySelectorAll("[data-close]").forEach(btn => {
    btn.addEventListener("click", () => closeOverlay(btn.closest(".modal-overlay")));
  });
  document.querySelectorAll(".modal-overlay").forEach(overlay => {
    overlay.addEventListener("click", e => { if (e.target === overlay) closeOverlay(overlay); });
  });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      document.querySelectorAll(".modal-overlay").forEach(o => closeOverlay(o));
    }
  });

  // ---------- nav scroll ----------
  document.querySelectorAll("[data-scroll]").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelector(btn.dataset.scroll).scrollIntoView({ behavior: "smooth" });
    });
  });

  // ---------- add-project modal ----------
  const addOverlay = document.getElementById("addOverlay");
  document.getElementById("openAddProject").addEventListener("click", () => openOverlay(addOverlay));
  document.getElementById("openAddProject2").addEventListener("click", () => openOverlay(addOverlay));

  const addForm = document.getElementById("addForm");
  const snippetWrap = document.getElementById("snippetWrap");
  const snippetOut = document.getElementById("snippetOut");

  addForm.addEventListener("submit", e => {
    e.preventDefault();
    const data = new FormData(addForm);
    const project = {
      id: (data.get("title") || "project").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || ("project-" + Date.now()),
      title: data.get("title") || "Untitled",
      year: data.get("year") || "",
      engine: data.get("engine") || "",
      tagline: data.get("tagline") || "",
      description: data.get("description") || "",
      tags: (data.get("tags") || "").split(",").map(s => s.trim()).filter(Boolean),
      image: data.get("image") || "",
      gallery: (data.get("gallery") || "").split(",").map(s => s.trim()).filter(Boolean),
      playUrl: data.get("playUrl") || "",
      codeUrl: data.get("codeUrl") || ""
    };

    // live preview: store locally and re-render immediately
    const local = getLocalProjects();
    local.push(project);
    saveLocalProjects(local);
    allProjects = (typeof PROJECTS !== "undefined" ? PROJECTS : []).concat(local);
    renderFilters();
    renderGrid();

    // generate paste-ready code for projects.js
    snippetOut.value = "  " + JSON.stringify(project, null, 2).split("\n").join("\n  ") + ",";
    snippetWrap.hidden = false;
  });

  document.getElementById("copySnippet").addEventListener("click", () => {
    const btn = document.getElementById("copySnippet");
    const done = () => {
      const original = btn.textContent;
      btn.textContent = "Copied!";
      setTimeout(() => (btn.textContent = original), 1500);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(snippetOut.value).then(done).catch(() => {
        snippetOut.select();
        document.execCommand("copy");
        done();
      });
    } else {
      snippetOut.select();
      document.execCommand("copy");
      done();
    }
  });

  // ---------- hero boot text ----------
  const bootLines = [
    "SHELF/64 BIOS v1.0",
    "",
    "Checking cartridge slot ... OK",
    "Loading project index ...",
  ];

  function typeBoot() {
    const el = document.getElementById("bootText");
    let text = "";
    let line = 0, char = 0;

    function tick() {
      if (line >= bootLines.length) {
        const count = allProjects.length;
        el.textContent = text + `\n${count} cartridge${count === 1 ? "" : "s"} found.\nREADY.`;
        return;
      }
      const current = bootLines[line];
      if (char <= current.length) {
        el.textContent = text + current.slice(0, char) + "\u2588";
        char++;
        setTimeout(tick, 18);
      } else {
        text += current + "\n";
        line++;
        char = 0;
        setTimeout(tick, 120);
      }
    }
    tick();
  }

  // ---------- init ----------
  renderFilters();
  renderGrid();
  typeBoot();
})();
