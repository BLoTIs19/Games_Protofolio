(function () {
  const cfg = SITE_CONFIG;

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

  function escapeHtml(str) {
    const d = document.createElement("div");
    d.textContent = str ?? "";
    return d.innerHTML;
  }

  /* ---------- Hero / About / Skills / Contact / Footer ---------- */
  function renderStaticContent() {
    if (cfg.accentColor) {
      document.documentElement.style.setProperty("--accent", cfg.accentColor);
    }
    document.title = `${cfg.name} — ${cfg.title}`;
    document.getElementById("heroName").textContent = `Hi, I'm ${cfg.name}`;
    document.getElementById("heroTitle").textContent = cfg.title;
    document.getElementById("heroTagline").textContent = cfg.tagline;

    const ctaWrap = document.getElementById("heroCtas");
    const ctas = [
      { ...cfg.hero.ctaPrimary, cls: "btn-primary" },
      { ...cfg.hero.ctaSecondary, cls: "btn-outline" },
      { ...cfg.hero.ctaTertiary, cls: "btn-outline" },
    ];
    ctas.forEach((c) => {
      if (!c.label) return;
      const a = el("a", { class: `btn ${c.cls}`, href: c.href || "#" });
      a.textContent = c.label;
      ctaWrap.appendChild(a);
    });

    const bioWrap = document.getElementById("aboutBio");
    cfg.about.bio.forEach((p) => bioWrap.appendChild(el("p", { text: p })));

    const focusList = document.getElementById("aboutFocus");
    cfg.about.focus.forEach((f) => focusList.appendChild(el("li", { text: f })));

    const skillsGrid = document.getElementById("skillsGrid");
    cfg.skills.forEach((group) => {
      const groupEl = el("div", { class: "skill-group" });
      groupEl.appendChild(el("h3", { text: group.group }));
      const list = el("ul", { class: "skill-list" });
      group.items.forEach((item) => list.appendChild(el("li", { text: item })));
      groupEl.appendChild(list);
      skillsGrid.appendChild(groupEl);
    });

    const contactGrid = document.getElementById("contactGrid");
    const contactItems = [
      { label: "Email", value: cfg.social.email, href: `mailto:${cfg.social.email}` },
      { label: "GitHub", value: "View profile", href: cfg.social.github },
      { label: "LinkedIn", value: "Connect", href: cfg.social.linkedin },
      { label: "itch.io", value: "View profile", href: cfg.social.itch },
      { label: "ArtStation", value: "View profile", href: cfg.social.artstation },
    ].filter((c) => c.href);
    contactItems.forEach((c) => {
      const card = el("a", { class: "contact-card", href: c.href, target: "_blank", rel: "noopener" });
      card.appendChild(el("span", { class: "label", text: c.label }));
      card.appendChild(el("span", { class: "value", text: c.value }));
      contactGrid.appendChild(card);
    });

    document.getElementById("footerName").textContent = cfg.name;
    document.getElementById("footerName2").textContent = cfg.name;
    document.getElementById("footerRole").textContent = cfg.title;
    document.getElementById("footerYear").textContent = new Date().getFullYear();
    const footerLinks = document.getElementById("footerLinks");
    contactItems.slice(0, 4).forEach((c) => {
      const li = el("li");
      const a = el("a", { href: c.href, target: "_blank", rel: "noopener", text: c.label });
      li.appendChild(a);
      footerLinks.appendChild(li);
    });
  }

  /* ---------- Project cards ---------- */
  function timelineLabel(p) {
    const startYear = p.startDate ? p.startDate.slice(0, 4) : "";
    const endYear = p.releaseDate ? p.releaseDate.slice(0, 4) : p.endDate ? p.endDate.slice(0, 4) : "Present";
    if (!startYear) return "";
    return startYear === endYear ? startYear : `${startYear} – ${endYear}`;
  }

  function projectCard(p) {
    const card = el("a", { class: "project-card", href: `project.html?slug=${encodeURIComponent(p.slug)}` });
    const thumb = el("div", { class: "project-thumb" });
    thumb.appendChild(el("img", { src: p.thumbnail || "https://placehold.co/1200x750/1c1f26/e3a857?text=" + encodeURIComponent(p.title), alt: `${p.title} thumbnail`, loading: "lazy" }));
    if (p.featured) thumb.appendChild(el("span", { class: "featured-badge", text: "Featured" }));
    card.appendChild(thumb);

    const body = el("div", { class: "project-body" });
    body.appendChild(el("h3", { text: p.title }));
    body.appendChild(el("p", { class: "project-desc", text: p.shortDescription }));

    const meta = el("div", { class: "project-meta" });
    if (p.engine) meta.appendChild(el("span", { html: `<b>Engine</b>&nbsp;${escapeHtml(p.engine)}` }));
    if (p.role) meta.appendChild(el("span", { html: `<b>Role</b>&nbsp;${escapeHtml(p.role)}` }));
    const tl = timelineLabel(p);
    if (tl) meta.appendChild(el("span", { html: `<b>Timeline</b>&nbsp;${escapeHtml(tl)}` }));
    body.appendChild(meta);

    const tags = el("div", { class: "tag-list" });
    (p.tags || []).slice(0, 4).forEach((t) => tags.appendChild(el("span", { class: "tag-badge", text: t })));
    body.appendChild(tags);

    body.appendChild(el("span", { class: "project-view", text: "View case study →" }));
    card.appendChild(body);
    return card;
  }

  /* ---------- Projects: featured + filterable grid ---------- */
  let activeTag = "all";
  let searchQuery = "";

  function renderFeatured() {
    const wrap = document.getElementById("featuredGrid");
    wrap.innerHTML = "";
    const featured = Store.sortProjects(Store.getPublished().filter((p) => p.featured));
    const section = document.getElementById("featured");
    if (!featured.length) {
      section.style.display = "none";
      return;
    }
    section.style.display = "";
    featured.forEach((p) => wrap.appendChild(projectCard(p)));
  }

  function renderFilterTags() {
    const wrap = document.getElementById("filterTags");
    wrap.innerHTML = "";
    const tags = ["all", ...Store.allTags()];
    tags.forEach((tag) => {
      const btn = el("button", { class: "filter-tag" + (tag === activeTag ? " active" : ""), text: tag === "all" ? "All" : tag });
      btn.addEventListener("click", () => {
        activeTag = tag;
        renderFilterTags();
        renderAllProjects();
      });
      wrap.appendChild(btn);
    });
  }

  function renderAllProjects() {
    const wrap = document.getElementById("allProjectsGrid");
    wrap.innerHTML = "";
    let list = Store.sortProjects(Store.getPublished());
    list = Store.filterProjects(list, { tag: activeTag, query: searchQuery });
    if (!list.length) {
      wrap.appendChild(
        el("div", { class: "empty-state", text: "No projects match that filter yet. Try a different tag or search term." })
      );
      return;
    }
    list.forEach((p) => wrap.appendChild(projectCard(p)));
  }

  /* ---------- Nav interactions ---------- */
  function initNav() {
    const toggle = document.getElementById("navToggle");
    const links = document.getElementById("navLinks");
    toggle.addEventListener("click", () => {
      const isOpen = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });
    links.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => {
        links.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      })
    );

    const sections = ["about", "skills", "projects", "contact"].map((id) => document.getElementById(id));
    const navAnchors = [...links.querySelectorAll("a")];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            navAnchors.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === `#${entry.target.id}`));
          }
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    sections.forEach((s) => s && observer.observe(s));
  }

  /* ---------- Scroll reveal ---------- */
  function initReveal() {
    const items = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) {
      items.forEach((i) => i.classList.add("in-view"));
      return;
    }
    const io = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    items.forEach((i) => io.observe(i));
  }

  function initSearch() {
    const input = document.getElementById("projectSearch");
    input.addEventListener("input", (e) => {
      searchQuery = e.target.value;
      renderAllProjects();
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    renderStaticContent();
    renderFeatured();
    renderFilterTags();
    renderAllProjects();
    initNav();
    initReveal();
    initSearch();
  });
})();
