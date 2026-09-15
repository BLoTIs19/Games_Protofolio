(function () {
  Auth.requireAuthOrRedirect("login.html");

  function el(tag, attrs = {}, children = []) {
    const node = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
      if (k === "html") node.innerHTML = v;
      else if (k === "text") node.textContent = v;
      else node.setAttribute(k, v);
    });
    (Array.isArray(children) ? children : [children]).forEach((c) => c && node.appendChild(c));
    return node;
  }

  /* ---------- View switching ---------- */
  const views = ["overview", "projects", "editor"];
  function showView(name) {
    views.forEach((v) => {
      document.getElementById(`view-${v}`).style.display = v === name ? "" : "none";
    });
    document.querySelectorAll(".admin-nav button").forEach((b) => b.classList.toggle("active", b.dataset.view === name));
    if (name === "overview") renderOverview();
    if (name === "projects") renderProjectList();
    window.scrollTo({ top: 0, behavior: "instant" in document.documentElement.style ? "instant" : "auto" });
  }

  document.querySelectorAll(".admin-nav button[data-view]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.dataset.view === "editor") resetForm();
      showView(btn.dataset.view);
    });
  });
  document.getElementById("newProjectBtn").addEventListener("click", () => {
    resetForm();
    showView("editor");
  });
  document.getElementById("logoutBtn").addEventListener("click", () => {
    Auth.logout();
    window.location.href = "login.html";
  });

  /* ---------- Toast ---------- */
  let toastTimer;
  function toast(message, type = "success") {
    const t = document.getElementById("toast");
    t.textContent = message;
    t.className = `toast show ${type}`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 2600);
  }

  /* ---------- Overview ---------- */
  function renderOverview() {
    const stats = Store.stats();
    const grid = document.getElementById("statGrid");
    grid.innerHTML = "";
    const cards = [
      ["Total projects", stats.total],
      ["Published", stats.published],
      ["Drafts", stats.draft],
      ["Hidden", stats.hidden],
      ["Featured", stats.featured],
      ["Tags in use", stats.tags],
    ];
    cards.forEach(([label, num]) => {
      const card = el("div", { class: "stat-card" });
      card.appendChild(el("div", { class: "num", text: num }));
      card.appendChild(el("div", { class: "label", text: label }));
      grid.appendChild(card);
    });

    const recentWrap = document.getElementById("recentProjects");
    recentWrap.innerHTML = "";
    const recent = [...Store.getAll()]
      .sort((a, b) => (b.id > a.id ? 1 : -1))
      .slice(0, 5);
    if (!recent.length) {
      recentWrap.appendChild(el("p", { text: "No projects yet — add your first one from the sidebar." }));
      return;
    }
    recent.forEach((p) => recentWrap.appendChild(projectRow(p, { compact: true })));
  }

  /* ---------- Manage projects list ---------- */
  function renderOrderControls() {
    const mode = Store.getOrderMode();
    document.getElementById("orderModeNote").textContent =
      mode === "manual"
        ? "Manual order is active — drag rows to reorder. This overrides date sorting on the public site."
        : "Projects are sorted by date (newest first) on the public site.";
    document.getElementById("useDateSort").disabled = mode === "date";
    document.getElementById("useManualSort").disabled = mode === "manual";
  }

  document.getElementById("useDateSort").addEventListener("click", () => {
    Store.setOrderMode("date");
    renderOrderControls();
    renderProjectList();
    toast("Sorting projects by date.");
  });
  document.getElementById("useManualSort").addEventListener("click", () => {
    Store.setOrderMode("manual");
    renderOrderControls();
    renderProjectList();
    toast("Manual ordering enabled — drag rows to reorder.");
  });

  function visibilityBadge(v) {
    const cls = v === "published" ? "badge-published" : v === "draft" ? "badge-draft" : "badge-hidden";
    return el("span", { class: `badge ${cls}`, text: v });
  }

  function projectRow(p, { compact = false } = {}) {
    const mode = Store.getOrderMode();
    const row = el("div", { class: "admin-project-row", draggable: mode === "manual" && !compact ? "true" : "false" });
    row.dataset.id = p.id;

    row.appendChild(
      mode === "manual" && !compact
        ? el("div", { class: "drag-handle", text: "⠿" })
        : el("div", {})
    );

    row.appendChild(el("img", { src: p.thumbnail || "https://placehold.co/120x80/1c1f26/e3a857?text=%20", alt: "" }));

    const info = el("div");
    info.appendChild(el("div", { class: "title", text: p.title }));
    const metaParts = [p.engine, p.role, p.status].filter(Boolean).join(" · ");
    info.appendChild(el("div", { class: "meta", text: metaParts }));
    row.appendChild(info);

    row.appendChild(visibilityBadge(p.visibility));
    row.appendChild(p.featured ? el("span", { class: "badge badge-featured", text: "featured" }) : el("span", {}));

    const actions = el("div", { class: "row-actions" });
    if (!compact) {
      const editBtn = el("button", { class: "btn btn-outline btn-sm", text: "Edit" });
      editBtn.addEventListener("click", () => {
        populateForm(p);
        showView("editor");
      });
      actions.appendChild(editBtn);

      const featureBtn = el("button", { class: "btn btn-outline btn-sm", text: p.featured ? "Unfeature" : "Feature" });
      featureBtn.addEventListener("click", () => {
        Store.setFeatured(p.id, !p.featured);
        renderProjectList();
        toast(p.featured ? "Removed from featured." : "Marked as featured.");
      });
      actions.appendChild(featureBtn);

      const visSelect = el("select", { class: "btn btn-outline btn-sm" });
      ["published", "draft", "hidden"].forEach((v) => {
        const opt = el("option", { value: v, text: v });
        if (v === p.visibility) opt.setAttribute("selected", "true");
        visSelect.appendChild(opt);
      });
      visSelect.addEventListener("change", (e) => {
        Store.setVisibility(p.id, e.target.value);
        renderProjectList();
        toast(`Visibility set to ${e.target.value}.`);
      });
      actions.appendChild(visSelect);

      const delBtn = el("button", { class: "btn btn-danger btn-sm", text: "Delete" });
      delBtn.addEventListener("click", () => confirmDelete(p));
      actions.appendChild(delBtn);
    }
    row.appendChild(actions);
    return row;
  }

  function renderProjectList() {
    renderOrderControls();
    const wrap = document.getElementById("projectList");
    wrap.innerHTML = "";
    const projects = Store.sortProjects(Store.getAll());
    if (!projects.length) {
      wrap.appendChild(el("div", { class: "empty-state", text: "No projects yet. Click \u201cAdd project\u201d to create your first one." }));
      return;
    }
    projects.forEach((p) => wrap.appendChild(projectRow(p)));
    if (Store.getOrderMode() === "manual") initDragReorder(wrap);
  }

  function initDragReorder(container) {
    let dragEl = null;
    container.querySelectorAll(".admin-project-row").forEach((row) => {
      row.addEventListener("dragstart", () => {
        dragEl = row;
        row.classList.add("dragging");
      });
      row.addEventListener("dragend", () => {
        row.classList.remove("dragging");
        dragEl = null;
        const ids = [...container.querySelectorAll(".admin-project-row")].map((r) => r.dataset.id);
        Store.reorder(ids);
        toast("Project order updated.");
      });
      row.addEventListener("dragover", (e) => {
        e.preventDefault();
        const after = getDragAfterElement(container, e.clientY);
        if (!dragEl) return;
        if (after == null) container.appendChild(dragEl);
        else container.insertBefore(dragEl, after);
      });
    });
  }

  function getDragAfterElement(container, y) {
    const rows = [...container.querySelectorAll(".admin-project-row:not(.dragging)")];
    return rows.reduce(
      (closest, row) => {
        const box = row.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) return { offset, element: row };
        return closest;
      },
      { offset: Number.NEGATIVE_INFINITY, element: null }
    ).element;
  }

  /* ---------- Delete confirmation ---------- */
  let pendingDeleteId = null;
  function confirmDelete(p) {
    pendingDeleteId = p.id;
    document.getElementById("deleteModalText").textContent = `"${p.title}" will be permanently removed. This action can't be undone.`;
    document.getElementById("deleteModal").classList.add("open");
  }
  document.getElementById("cancelDelete").addEventListener("click", () => {
    document.getElementById("deleteModal").classList.remove("open");
    pendingDeleteId = null;
  });
  document.getElementById("confirmDelete").addEventListener("click", () => {
    if (pendingDeleteId) {
      Store.remove(pendingDeleteId);
      toast("Project deleted.");
    }
    document.getElementById("deleteModal").classList.remove("open");
    pendingDeleteId = null;
    renderProjectList();
    renderOverview();
  });

  /* ---------- Chip inputs (languages, tools, platforms, tags) ---------- */
  const chipState = { languages: [], tools: [], platforms: [], tags: [] };

  function renderChips(field) {
    const wrap = document.getElementById(`chip_${field}`);
    wrap.querySelectorAll(".chip").forEach((c) => c.remove());
    const input = wrap.querySelector("input");
    chipState[field].forEach((value, i) => {
      const chip = el("span", { class: "chip" });
      chip.appendChild(el("span", { text: value }));
      const removeBtn = el("button", { type: "button", text: "\u00d7" });
      removeBtn.addEventListener("click", () => {
        chipState[field].splice(i, 1);
        renderChips(field);
      });
      chip.appendChild(removeBtn);
      wrap.insertBefore(chip, input);
    });
  }

  ["languages", "tools", "platforms", "tags"].forEach((field) => {
    const wrap = document.getElementById(`chip_${field}`);
    const input = wrap.querySelector("input");
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === ",") {
        e.preventDefault();
        const value = input.value.trim().replace(/,$/, "");
        if (value && !chipState[field].includes(value)) {
          chipState[field].push(value);
          renderChips(field);
        }
        input.value = "";
      } else if (e.key === "Backspace" && !input.value) {
        chipState[field].pop();
        renderChips(field);
      }
    });
  });

  /* ---------- Gallery images ---------- */
  let galleryImages = [];
  function renderGalleryPreview() {
    const wrap = document.getElementById("galleryPreview");
    wrap.innerHTML = "";
    galleryImages.forEach((url, i) => {
      const box = el("div", { class: "thumb-wrap" });
      box.appendChild(el("img", { src: url, alt: "" }));
      const removeBtn = el("button", { class: "remove-thumb", type: "button", text: "\u00d7" });
      removeBtn.addEventListener("click", () => {
        galleryImages.splice(i, 1);
        renderGalleryPreview();
      });
      box.appendChild(removeBtn);
      wrap.appendChild(box);
    });
  }
  document.getElementById("addGalleryImage").addEventListener("click", () => {
    const input = document.getElementById("galleryInput");
    const url = input.value.trim();
    if (url) {
      galleryImages.push(url);
      renderGalleryPreview();
      input.value = "";
    }
  });

  /* ---------- Repeaters: videos, gifs, links ---------- */
  function makeRepeater(containerId, placeholderPrimary, placeholderSecondary, hasType = false) {
    const container = document.getElementById(containerId);
    function addRow(primary = "", secondary = "", type = "custom") {
      const row = el("div", { class: "repeatable-item" });
      const primaryInput = el("input", { placeholder: placeholderPrimary, value: primary });
      const secondaryInput = el("input", { placeholder: placeholderSecondary, value: secondary });
      row.appendChild(primaryInput);
      row.appendChild(secondaryInput);
      if (hasType) {
        const typeSelect = el("select");
        ["github", "source", "playable", "steam", "epic", "itch", "youtube", "demo", "download", "custom"].forEach((t) => {
          const opt = el("option", { value: t, text: t });
          if (t === type) opt.setAttribute("selected", "true");
          typeSelect.appendChild(opt);
        });
        row.appendChild(typeSelect);
        row.dataset.hasType = "true";
      }
      const removeBtn = el("button", { type: "button", class: "btn btn-outline btn-sm", text: "Remove" });
      removeBtn.addEventListener("click", () => row.remove());
      row.appendChild(removeBtn);
      container.appendChild(row);
    }
    return {
      addRow,
      clear: () => (container.innerHTML = ""),
      getValues: () =>
        [...container.querySelectorAll(".repeatable-item")].map((row) => {
          const inputs = row.querySelectorAll("input");
          const select = row.querySelector("select");
          return hasType
            ? { label: inputs[0].value.trim(), url: inputs[1].value.trim(), type: select ? select.value : "custom" }
            : { title: inputs[0].value.trim(), url: inputs[1].value.trim() };
        }).filter((r) => r.url),
    };
  }

  const videoRepeater = makeRepeater("videoRepeater", "Title (e.g. Combat walkthrough)", "Video URL (mp4 or YouTube)");
  const gifRepeater = makeRepeater("gifRepeater", "Title (optional)", "GIF URL");
  const linkRepeater = makeRepeater("linkRepeater", "Label (e.g. View source code)", "URL", true);

  document.getElementById("addVideoRow").addEventListener("click", () => videoRepeater.addRow());
  document.getElementById("addGifRow").addEventListener("click", () => gifRepeater.addRow());
  document.getElementById("addLinkRow").addEventListener("click", () => linkRepeater.addRow());

  /* ---------- Form reset / populate / submit ---------- */
  const form = document.getElementById("projectForm");

  function resetForm() {
    form.reset();
    document.getElementById("f_id").value = "";
    document.getElementById("editorHeading").textContent = "Add project";
    ["languages", "tools", "platforms", "tags"].forEach((f) => {
      chipState[f] = [];
      renderChips(f);
    });
    galleryImages = [];
    renderGalleryPreview();
    videoRepeater.clear();
    gifRepeater.clear();
    linkRepeater.clear();
    videoRepeater.addRow();
    gifRepeater.addRow();
    linkRepeater.addRow("", "", "github");
  }

  function populateForm(p) {
    document.getElementById("f_id").value = p.id;
    document.getElementById("editorHeading").textContent = `Edit — ${p.title}`;
    document.getElementById("f_title").value = p.title || "";
    document.getElementById("f_shortDescription").value = p.shortDescription || "";
    document.getElementById("f_description").value = p.description || "";
    document.getElementById("f_category").value = p.category || "";
    document.getElementById("f_status").value = p.status || "In Development";
    document.getElementById("f_startDate").value = p.startDate || "";
    document.getElementById("f_endDate").value = p.endDate || "";
    document.getElementById("f_releaseDate").value = p.releaseDate || "";
    document.getElementById("f_engine").value = p.engine || "";
    document.getElementById("f_engineVersion").value = p.engineVersion || "";
    document.getElementById("f_role").value = p.role || "";
    document.getElementById("f_teamSize").value = p.teamSize || "";
    document.getElementById("f_thumbnail").value = p.thumbnail || "";
    document.getElementById("f_visibility").value = p.visibility || "published";
    document.getElementById("f_featured").value = String(!!p.featured);

    chipState.languages = [...(p.languages || [])];
    chipState.tools = [...(p.tools || [])];
    chipState.platforms = [...(p.platforms || [])];
    chipState.tags = [...(p.tags || [])];
    ["languages", "tools", "platforms", "tags"].forEach(renderChips);

    galleryImages = [...(p.images || [])];
    renderGalleryPreview();

    videoRepeater.clear();
    (p.videos && p.videos.length ? p.videos : [{ title: "", url: "" }]).forEach((v) => videoRepeater.addRow(v.title, v.url));

    gifRepeater.clear();
    (p.gifs && p.gifs.length ? p.gifs : [{ title: "", url: "" }]).forEach((g) => gifRepeater.addRow(g.title, g.url));

    linkRepeater.clear();
    (p.links && p.links.length ? p.links : [{ label: "", url: "", type: "github" }]).forEach((l) =>
      linkRepeater.addRow(l.label, l.url, l.type)
    );

    const cs = p.caseStudy || {};
    document.getElementById("cs_overview").value = cs.overview || "";
    document.getElementById("cs_contribution").value = cs.contribution || "";
    document.getElementById("cs_technical").value = cs.technical || "";
    document.getElementById("cs_development").value = cs.development || "";
    document.getElementById("cs_challenges").value = cs.challenges || "";
    document.getElementById("cs_solutions").value = cs.solutions || "";
    document.getElementById("cs_results").value = cs.results || "";
  }

  document.getElementById("cancelEditBtn").addEventListener("click", () => showView("projects"));

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const title = document.getElementById("f_title").value.trim();
    const shortDescription = document.getElementById("f_shortDescription").value.trim();
    if (!title || !shortDescription) {
      toast("Project name and short description are required.", "error");
      return;
    }

    const id = document.getElementById("f_id").value || undefined;
    const existing = id ? Store.getById(id) : null;

    const project = {
      id,
      slug: existing ? existing.slug : undefined,
      title,
      shortDescription,
      description: document.getElementById("f_description").value.trim(),
      category: document.getElementById("f_category").value.trim(),
      status: document.getElementById("f_status").value,
      startDate: document.getElementById("f_startDate").value,
      endDate: document.getElementById("f_endDate").value,
      releaseDate: document.getElementById("f_releaseDate").value,
      engine: document.getElementById("f_engine").value.trim(),
      engineVersion: document.getElementById("f_engineVersion").value.trim(),
      role: document.getElementById("f_role").value.trim(),
      teamSize: document.getElementById("f_teamSize").value.trim(),
      languages: [...chipState.languages],
      tools: [...chipState.tools],
      platforms: [...chipState.platforms],
      tags: [...chipState.tags],
      thumbnail: document.getElementById("f_thumbnail").value.trim(),
      images: [...galleryImages],
      videos: videoRepeater.getValues(),
      gifs: gifRepeater.getValues(),
      links: linkRepeater.getValues(),
      visibility: document.getElementById("f_visibility").value,
      featured: document.getElementById("f_featured").value === "true",
      order: existing ? existing.order : undefined,
      caseStudy: {
        overview: document.getElementById("cs_overview").value.trim(),
        contribution: document.getElementById("cs_contribution").value.trim(),
        technical: document.getElementById("cs_technical").value.trim(),
        development: document.getElementById("cs_development").value.trim(),
        challenges: document.getElementById("cs_challenges").value.trim(),
        solutions: document.getElementById("cs_solutions").value.trim(),
        results: document.getElementById("cs_results").value.trim(),
      },
    };

    try {
      Store.save(project);
      toast(existing ? "Project updated." : "Project created.");
      showView("projects");
    } catch (err) {
      console.error(err);
      toast("Something went wrong saving this project.", "error");
    }
  });

  /* ---------- Init ---------- */
  resetForm();
  showView("overview");
})();
