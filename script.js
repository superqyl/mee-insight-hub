(function () {
  const fallback = {
    meta: {
      site_name: "MEE Insight Hub",
      current_thesis: "把日报、周报、月报沉淀成一个持续更新的认知、机会和系统进化中枢。",
      summary: "GitHub Pages 为默认主链路；Feishu 与 Vercel 仅在显式 opt-in 时生成。",
      metrics: [
        { label: "主题频道", value: "5" },
        { label: "时间层", value: "3" },
        { label: "默认发布", value: "GH" },
        { label: "证据系统", value: "1" }
      ]
    },
    periods: [],
    tracks: [],
    rollup_steps: [],
    evidence_clusters: [],
    source_groups: [],
    publications: []
  };

  const state = { data: fallback, selectedTrack: "mee" };
  const progress = document.querySelector(".reading-progress");
  const navLinks = Array.from(document.querySelectorAll(".site-nav a"));
  const sections = navLinks.map((link) => document.querySelector(link.getAttribute("href"))).filter(Boolean);

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function list(items) {
    const ul = document.createElement("ul");
    for (const item of items || []) {
      const li = document.createElement("li");
      li.textContent = item;
      ul.appendChild(li);
    }
    return ul;
  }

  function renderHero(data) {
    document.querySelector("#hero-thesis").textContent = data.meta.current_thesis || fallback.meta.current_thesis;
    document.querySelector("#hero-summary").textContent = data.meta.summary || fallback.meta.summary;
    const metrics = document.querySelector("#hero-metrics");
    metrics.replaceChildren(...(data.meta.metrics || []).map((metric) => {
      const box = document.createElement("div");
      const value = el("strong", "", metric.value);
      const label = el("span", "", metric.label);
      box.append(value, label);
      return box;
    }));
  }

  function renderPeriods(data) {
    const target = document.querySelector("#period-cards");
    target.replaceChildren(...(data.periods || []).map((period) => {
      const card = el("article", "period-card");
      card.append(el("div", "label", period.label));
      card.append(el("h3", "", period.title));
      card.append(el("p", "", period.summary));
      card.append(list(period.items || []));
      return card;
    }));
  }

  function renderTrackTabs(data) {
    const target = document.querySelector("#track-tabs");
    target.replaceChildren(...(data.tracks || []).map((track) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.role = "tab";
      btn.textContent = track.label;
      btn.setAttribute("aria-selected", String(track.id === state.selectedTrack));
      btn.addEventListener("click", () => {
        state.selectedTrack = track.id;
        renderTracks(state.data);
      });
      return btn;
    }));
  }

  function renderTracks(data) {
    renderTrackTabs(data);
    const track = (data.tracks || []).find((item) => item.id === state.selectedTrack) || (data.tracks || [])[0];
    const target = document.querySelector("#track-detail");
    if (!track) {
      target.textContent = "暂无主题数据。";
      return;
    }
    state.selectedTrack = track.id;
    const head = el("div", "track-head");
    const titleWrap = document.createElement("div");
    titleWrap.append(el("h3", "", track.label));
    titleWrap.append(el("p", "", track.description));
    head.append(titleWrap, el("span", "track-pill", track.default_cadence || "daily / weekly / monthly"));

    const columns = el("div", "track-columns");
    for (const group of [
      ["日报 delta", track.daily_focus || []],
      ["周报聚类", track.weekly_focus || []],
      ["月报沉淀", track.monthly_focus || []]
    ]) {
      const col = el("div", "track-column");
      col.append(el("h4", "", group[0]));
      col.append(list(group[1]));
      columns.appendChild(col);
    }
    target.replaceChildren(head, columns);
  }

  function renderRollup(data) {
    const target = document.querySelector("#rollup-steps");
    target.replaceChildren(...(data.rollup_steps || []).map((step) => {
      const li = document.createElement("li");
      const body = document.createElement("div");
      body.append(el("h3", "", step.title));
      body.append(el("p", "", step.description));
      li.appendChild(body);
      return li;
    }));
  }

  function renderEvidence(data) {
    const target = document.querySelector("#evidence-clusters");
    target.replaceChildren(...(data.evidence_clusters || []).map((cluster) => {
      const card = el("article", "evidence-card");
      card.append(el("h3", "", cluster.title));
      card.append(el("p", "", cluster.summary));
      const meta = el("div", "meta-row");
      for (const item of [...(cluster.tracks || []), ...(cluster.source_groups || [])]) meta.append(el("span", "", item));
      card.append(meta);
      return card;
    }));
  }

  function renderSources(data) {
    const target = document.querySelector("#source-groups");
    target.replaceChildren(...(data.source_groups || []).map((source) => {
      const card = el("article", "source-card");
      card.append(el("strong", "", source.trust_tier || "mixed"));
      card.append(el("h3", "", source.label));
      card.append(el("p", "", source.description));
      const meta = el("div", "meta-row");
      for (const item of source.used_for || []) meta.append(el("span", "", item));
      card.append(meta);
      return card;
    }));
  }

  function renderPublications(data) {
    const target = document.querySelector("#publication-list");
    target.replaceChildren(...(data.publications || []).map((pub) => {
      const card = el("article", "publication-card");
      const body = document.createElement("div");
      body.append(el("h3", "", pub.title));
      body.append(el("p", "", pub.summary));
      const link = document.createElement("a");
      link.href = pub.href || "#top";
      link.textContent = pub.href ? "打开" : "待生成";
      if (pub.href && /^https?:/i.test(pub.href)) {
        link.target = "_blank";
        link.rel = "noreferrer noopener";
      }
      card.append(body, el("span", "status", pub.status || pub.cadence || "draft"));
      if (pub.href) body.appendChild(link);
      return card;
    }));
  }

  function render(data) {
    state.data = data;
    if (!(data.tracks || []).some((track) => track.id === state.selectedTrack)) {
      state.selectedTrack = (data.tracks || [])[0]?.id || "mee";
    }
    renderHero(data);
    renderPeriods(data);
    renderTracks(data);
    renderRollup(data);
    renderEvidence(data);
    renderSources(data);
    renderPublications(data);
    setupLightbox();
  }

  function setupLightbox() {
    const lightbox = document.querySelector("#image-lightbox");
    const lightboxImage = lightbox ? lightbox.querySelector("img") : null;
    const lightboxClose = lightbox ? lightbox.querySelector(".lightbox-close") : null;
    if (!lightbox || !lightboxImage) return;

    function close() {
      lightbox.classList.remove("open");
      lightbox.setAttribute("aria-hidden", "true");
      lightboxImage.removeAttribute("src");
      document.body.classList.remove("lightbox-lock");
    }

    document.querySelectorAll(".image-zoom").forEach((button) => {
      if (button.dataset.bound === "1") return;
      button.dataset.bound = "1";
      button.addEventListener("click", () => {
        const img = button.querySelector("img");
        const full = button.dataset.full || img?.currentSrc;
        if (!full) return;
        lightboxImage.src = full;
        lightboxImage.alt = img?.alt || "图片预览";
        lightbox.classList.add("open");
        lightbox.setAttribute("aria-hidden", "false");
        document.body.classList.add("lightbox-lock");
        lightboxClose?.focus();
      });
    });
    lightbox.addEventListener("click", (event) => { if (event.target === lightbox) close(); });
    lightboxClose?.addEventListener("click", close);
    document.addEventListener("keydown", (event) => { if (event.key === "Escape") close(); });
  }

  function updateProgress() {
    const height = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = height > 0 ? Math.min(window.scrollY / height, 1) : 0;
    progress.style.width = `${ratio * 100}%`;
  }

  function updateActiveNav() {
    const current = sections.slice().reverse().find((section) => section.getBoundingClientRect().top <= 120);
    navLinks.forEach((link) => {
      const target = link.getAttribute("href").slice(1);
      link.classList.toggle("active", Boolean(current && current.id === target));
    });
  }

  fetch("./public/data/site-content.json", { cache: "no-store" })
    .then((response) => response.ok ? response.json() : fallback)
    .then(render)
    .catch(() => render(fallback));

  window.addEventListener("scroll", () => {
    updateProgress();
    updateActiveNav();
  });
  updateProgress();
  updateActiveNav();
})();
