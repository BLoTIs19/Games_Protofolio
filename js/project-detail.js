(function () {
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

  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug");
  const project = slug ? Store.getBySlug(slug) : null;

  if (!project || project.visibility !== "published") {
    document.getElementById("projectContent").style.display = "none";
    document.getElementById("notFound").style.display = "block";
    return;
  }

  document.getElementById("pageTitle").textContent = `${project.title} — ${SITE_CONFIG.name}`;
  document.getElementById("pageDesc").setAttribute("content", project.shortDescription || "");

  document.getElementById("dCategory").textContent = `// ${project.category || "project"}`;
  document.getElementById("dTitle").textContent = project.title;
  document.getElementById("dShort").textContent = project.shortDescription;
  document.getElementById("dStatus").textContent = project.status || "";

  const heroImg = document.getElementById("dHeroImage");
  if (project.thumbnail) {
    heroImg.src = project.thumbnail;
    heroImg.alt = `${project.title} key art`;
  } else {
    document.getElementById("dHeroMediaWrap").style.display = "none";
  }

  // Spec table
  const specTable = document.getElementById("dSpecTable");
  const specs = [
    ["Engine", project.engine],
    ["Engine version", project.engineVersion],
    ["Role", project.role],
    ["Team size", project.teamSize],
    ["Languages", (project.languages || []).join(", ")],
    ["Tools", (project.tools || []).join(", ")],
    ["Platforms", (project.platforms || []).join(", ")],
  ].filter(([, v]) => v);
  specs.forEach(([k, v]) => {
    const cell = el("div", { class: "spec-cell" });
    cell.appendChild(el("div", { class: "k", text: k }));
    cell.appendChild(el("div", { class: "v", text: v }));
    specTable.appendChild(cell);
  });

  // Tags
  const tagWrap = document.getElementById("dTags");
  (project.tags || []).forEach((t) => tagWrap.appendChild(el("span", { class: "tag-badge", text: t })));

  // Links
  const linkLabels = {
    github: "View source code",
    source: "View source code",
    playable: "Play the game",
    steam: "View on Steam",
    epic: "View on Epic Games Store",
    itch: "View on itch.io",
    youtube: "Watch on YouTube",
    demo: "Try the demo",
    download: "Download",
  };
  const linkRow = document.getElementById("dLinks");
  (project.links || [])
    .filter((l) => l.url)
    .forEach((l) => {
      const label = l.label || linkLabels[l.type] || "View link";
      linkRow.appendChild(el("a", { class: "btn btn-outline", href: l.url, target: "_blank", rel: "noopener", text: label }));
    });

  // Case study sections (only render if content exists)
  const caseSectionsWrap = document.getElementById("caseSections");
  const cs = project.caseStudy || {};
  const sectionDefs = [
    ["Overview", cs.overview],
    ["My contribution", cs.contribution],
    ["Technical details", cs.technical],
    ["Development", cs.development],
    ["Challenges", cs.challenges],
    ["Solutions", cs.solutions],
    ["Results", cs.results],
  ];
  let hasAnyCaseSection = false;
  sectionDefs.forEach(([heading, text]) => {
    if (!text) return;
    hasAnyCaseSection = true;
    const section = el("div", { class: "case-section" });
    section.appendChild(el("h2", { text: heading }));
    section.appendChild(el("p", { text }));
    caseSectionsWrap.appendChild(section);
  });
  if (!hasAnyCaseSection && project.description) {
    const section = el("div", { class: "case-section" });
    section.appendChild(el("h2", { text: "Overview" }));
    section.appendChild(el("p", { text: project.description }));
    caseSectionsWrap.appendChild(section);
  }

  // Gallery
  const images = project.images || [];
  const galleryGrid = document.getElementById("galleryGrid");
  if (!images.length) {
    document.getElementById("gallerySection").style.display = "none";
  } else {
    images.forEach((src, i) => {
      const img = el("img", { src, alt: `${project.title} screenshot ${i + 1}`, loading: "lazy" });
      img.addEventListener("click", () => openLightbox(i));
      galleryGrid.appendChild(img);
    });
  }

  // Videos
  const videoSection = document.getElementById("videoSection");
  const videos = (project.videos || []).filter((v) => v.url);
  if (videos.length) {
    videoSection.appendChild(el("h3", { text: "Gameplay showcase" }));
    videos.forEach((v) => {
      const wrap = el("div", { class: "video-wrap" });
      if (/youtube\.com|youtu\.be/.test(v.url)) {
        const embedUrl = v.url.replace("watch?v=", "embed/");
        wrap.appendChild(el("iframe", { src: embedUrl, title: v.title || project.title, allowfullscreen: "true" }));
      } else {
        const video = el("video", { controls: "true", preload: "metadata" });
        video.appendChild(el("source", { src: v.url }));
        wrap.appendChild(video);
      }
      videoSection.appendChild(wrap);
    });
  }

  // GIFs
  const gifSection = document.getElementById("gifSection");
  const gifs = (project.gifs || []).filter((g) => g.url);
  if (gifs.length) {
    gifSection.appendChild(el("h3", { text: "Technical demonstration" }));
    gifs.forEach((g) => {
      const wrap = el("div", { class: "gif-wrap" });
      wrap.appendChild(el("img", { src: g.url, alt: g.title || "Demonstration GIF", loading: "lazy" }));
      gifSection.appendChild(wrap);
    });
  }

  /* ---------- Lightbox ---------- */
  let currentIndex = 0;
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightboxImg");

  function openLightbox(index) {
    currentIndex = index;
    lightboxImg.src = images[currentIndex];
    lightboxImg.alt = `${project.title} screenshot ${currentIndex + 1}`;
    lightbox.classList.add("open");
    document.getElementById("lightboxClose").focus();
  }
  function closeLightbox() {
    lightbox.classList.remove("open");
  }
  function showRelative(offset) {
    currentIndex = (currentIndex + offset + images.length) % images.length;
    lightboxImg.src = images[currentIndex];
  }

  document.getElementById("lightboxClose").addEventListener("click", closeLightbox);
  document.getElementById("lightboxPrev").addEventListener("click", () => showRelative(-1));
  document.getElementById("lightboxNext").addEventListener("click", () => showRelative(1));
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener("keydown", (e) => {
    if (!lightbox.classList.contains("open")) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") showRelative(-1);
    if (e.key === "ArrowRight") showRelative(1);
  });
})();
