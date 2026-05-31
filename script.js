(function () {
  const fallback = {
    meta: {
      site_name: "MEE Insight Hub",
      hero_title: "从每日信号到长期判断",
      current_thesis: "一个持续更新的公开情报与私域收藏洞察站：汇聚新闻热点、AI 与工程趋势、产品机会、个人认知线索和 MEE 自进化记录，按日报、周报、月报沉淀成可追溯的判断与行动建议。",
      summary: "先读新闻热点和个人洞察，把外部变化、你的收藏线索、产品机会和 MEE 进化放进同一张判断网络；来源索引用于追溯证据，不抢占阅读入口。",
      metrics: [
        { label: "报告周期", value: "日 / 周 / 月" },
        { label: "优先阅读", value: "新闻 / 洞察" },
        { label: "机会线索", value: "产品 / 商机" },
        { label: "证据来源", value: "97" }
      ]
    },
    periods: [],
    report_packs: [],
    reports: [],
    tracks: [],
    rollup_steps: [],
    evidence_clusters: [],
    source_groups: [],
    publications: []
  };

  const state = { data: fallback, selectedTrack: "mee", selectedPack: "daily", selectedReport: "" };
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
    document.querySelector("#hero-title").textContent = data.meta.hero_title || fallback.meta.hero_title || data.meta.site_name || fallback.meta.site_name;
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

  function renderReferenceChips(items) {
    const row = el("div", "reference-row");
    for (const item of items || []) {
      const link = document.createElement("a");
      link.href = item.url || "#top";
      link.textContent = item.label || item.url || "参考资料";
      if (item.url && /^https?:/i.test(item.url)) {
        link.target = "_blank";
        link.rel = "noreferrer noopener";
      }
      row.appendChild(link);
    }
    return row;
  }

  function normalizeReportPacks(data) {
    const packs = data.report_packs || [];
    if (packs.length) return packs;
    if ((data.reports || []).length) {
      const period = data.meta?.period || {};
      return [{
        id: data.meta?.cadence || period.cadence || "current",
        label: data.meta?.cadence === "weekly" ? "周报" : data.meta?.cadence === "monthly" ? "月报" : "日报",
        title: period.display || period.label || "当前报告",
        summary: "当前周期报告正文。",
        reports: data.reports || []
      }];
    }
    return [];
  }

  function renderReportPackTabs(packs) {
    const target = document.querySelector("#report-pack-tabs");
    if (!target) return;
    target.replaceChildren(...packs.map((pack) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.role = "tab";
      btn.textContent = pack.label || pack.title;
      btn.setAttribute("aria-selected", String(pack.id === state.selectedPack));
      btn.addEventListener("click", () => {
        state.selectedPack = pack.id;
        state.selectedReport = "";
        renderReports(state.data);
      });
      return btn;
    }));
  }

  function preferredReportOrder(reports) {
    const order = ["news", "personal", "product", "mee", "sources"];
    return (reports || []).slice().sort((a, b) => {
      const ai = order.indexOf(a.track_id);
      const bi = order.indexOf(b.track_id);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });
  }

  function renderReportTabs(reports) {
    const target = document.querySelector("#report-tabs");
    if (!target) return;
    const orderedReports = preferredReportOrder(reports);
    target.replaceChildren(...orderedReports.map((report) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.role = "tab";
      btn.textContent = report.label || report.title;
      btn.setAttribute("aria-selected", String(report.id === state.selectedReport));
      btn.addEventListener("click", () => {
        state.selectedReport = report.id;
        renderReports(state.data);
      });
      return btn;
    }));
  }

  function renderReports(data) {
    const target = document.querySelector("#report-detail");
    const summaryTarget = document.querySelector("#report-pack-summary");
    if (!target) return;
    const packs = normalizeReportPacks(data);
    if (!packs.length) {
      target.textContent = "暂无报告正文。";
      summaryTarget?.replaceChildren();
      return;
    }
    if (!packs.some((pack) => pack.id === state.selectedPack)) state.selectedPack = packs[0].id;
    const pack = packs.find((item) => item.id === state.selectedPack) || packs[0];
    const reports = preferredReportOrder(pack.reports || []);
    if (!reports.some((report) => report.id === state.selectedReport)) state.selectedReport = reports[0]?.id || "";
    renderReportPackTabs(packs);
    renderReportTabs(reports);

    const packBox = el("div", "report-pack-card");
    packBox.append(el("strong", "", pack.title || pack.label || "报告包"));
    packBox.append(el("p", "", pack.summary || ""));
    packBox.append(el("span", "report-count", `${reports.length} 份报告正文`));
    summaryTarget?.replaceChildren(packBox);

    const report = reports.find((item) => item.id === state.selectedReport) || reports[0];
    if (!report) {
      target.textContent = "当前周期暂无报告正文。";
      return;
    }
    const wrapper = el("article", "report-body");

    const intro = el("div", "report-intro");
    const introText = document.createElement("div");
    introText.append(el("div", "report-kicker", report.kicker || report.label || "报告"));
    introText.append(el("h3", "", report.title));
    introText.append(el("p", "", report.lead || report.summary || ""));
    intro.appendChild(introText);
    if (report.visual && report.visual.src) {
      const figure = el("figure", "report-figure");
      const button = el("button", "image-zoom");
      button.type = "button";
      button.dataset.full = report.visual.src;
      const img = document.createElement("img");
      img.src = report.visual.src;
      img.alt = report.visual.alt || report.title;
      button.appendChild(img);
      figure.append(button);
      if (report.visual.alt) figure.append(el("figcaption", "", report.visual.alt));
      intro.appendChild(figure);
    }
    wrapper.appendChild(intro);

    const insightSection = el("section", "report-subsection");
    insightSection.append(el("h4", "", "1. 核心洞察"));
    (report.insights || []).forEach((insight, index) => {
      const card = el("article", "insight-card");
      card.append(el("h5", "", `1.${index + 1}. ${insight.title}`));
      card.append(el("p", "", insight.summary || ""));
      if (insight.sub_insights && insight.sub_insights.length) {
        const sub = el("div", "sub-insights");
        sub.append(el("strong", "", "子洞察"));
        sub.append(list(insight.sub_insights));
        card.append(sub);
      }
      if (insight.evidence && insight.evidence.length) {
        const ev = el("div", "evidence-line");
        ev.append(el("strong", "", "证据簇"));
        const chips = el("div", "meta-row");
        insight.evidence.forEach((item) => chips.append(el("span", "", item)));
        ev.append(chips);
        card.append(ev);
      }
      insightSection.append(card);
    });
    wrapper.appendChild(insightSection);

    const actionSection = el("section", "report-subsection");
    actionSection.append(el("h4", "", "2. 关键行动建议"));
    const actions = el("ol", "action-list");
    (report.actions || []).forEach((action) => {
      const li = document.createElement("li");
      li.textContent = action;
      actions.appendChild(li);
    });
    actionSection.append(actions);
    wrapper.appendChild(actionSection);

    const sourceSection = el("section", "report-subsection source-summary-block");
    sourceSection.append(el("h4", "", "3. 参考数据来源"));
    sourceSection.append(list(report.source_summary || []));
    if (report.references && report.references.length) {
      sourceSection.append(el("strong", "source-reference-title", "公开参考资料"));
      sourceSection.append(renderReferenceChips(report.references));
    }
    wrapper.appendChild(sourceSection);

    target.replaceChildren(wrapper);
    setupLightbox();
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
    renderReports(data);
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
