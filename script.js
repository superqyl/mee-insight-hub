(function () {
  const fallback = {
    meta: {
      site_name: "MEE Insight Hub",
      hero_title: "公开情报与私域收藏洞察中枢",
      current_thesis: "这里汇总每日、每周、每月的新闻热点、个人洞察、产品机会、MEE 自进化和参考来源；先读报告正文，再按证据簇追溯来源。",
      summary: "建议阅读顺序：先看新闻热点判断外部变化，再看个人洞察沉淀能力变化，随后进入产品机会和 MEE 进化；参考来源只用于追溯，不抢占阅读入口。",
      metrics: [
        { label: "先读外部变化", value: "新闻热点" },
        { label: "再看能力变化", value: "个人洞察" },
        { label: "转成机会实验", value: "产品/商机" },
        { label: "最后追溯证据", value: "97 源" }
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

  function renderReportIntro(report) {
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
    return intro;
  }

  function renderSourceIndexReport(report) {
    const wrapper = el("article", "report-body source-index-report");
    const sourceIndex = report.source_index || {};
    wrapper.appendChild(renderReportIntro(report));

    const summary = el("section", "source-index-section");
    summary.append(el("h4", "", "1. 来源覆盖概要"));
    summary.append(list(sourceIndex.summary || report.source_summary || []));
    wrapper.appendChild(summary);

    const groupsSection = el("section", "source-index-section");
    groupsSection.append(el("h4", "", "2. 来源类型归档"));
    const groups = el("div", "source-index-grid");
    (sourceIndex.groups || []).forEach((group) => {
      const card = el("article", "source-index-card");
      card.append(el("h5", "", group.title || group.label || "来源组"));
      const meta = el("div", "meta-row");
      meta.append(el("span", "", `${group.count || 0} 条`));
      if (group.trust_tier) meta.append(el("span", "", group.trust_tier));
      (group.source_types || []).slice(0, 4).forEach((item) => meta.append(el("span", "", item)));
      card.append(meta);
      if (group.why) {
        card.append(el("strong", "", "为什么值得参考"));
        card.append(el("p", "", group.why));
      }
      if (group.use_for) {
        card.append(el("strong", "", "关联主题"));
        card.append(el("p", "", group.use_for));
      }
      if (group.boundary) {
        card.append(el("strong", "", "可信边界"));
        card.append(el("p", "", group.boundary));
      }
      groups.append(card);
    });
    groupsSection.append(groups);
    wrapper.appendChild(groupsSection);

    const ledgerSection = el("section", "source-index-section");
    ledgerSection.append(el("h4", "", "3. 不可读或访问受限 ledger"));
    const ledger = el("div", "source-ledger-list");
    (sourceIndex.ledger || []).forEach((item) => {
      const card = el("article", "source-ledger-card");
      card.append(el("strong", "", item.title || "待处理来源"));
      card.append(el("span", "status", item.status || "待处理"));
      if (item.note) card.append(el("p", "", item.note));
      ledger.append(card);
    });
    ledgerSection.append(ledger);
    wrapper.appendChild(ledgerSection);

    const references = el("section", "source-index-section");
    references.append(el("h4", "", "4. 公开参考入口"));
    if (report.references && report.references.length) references.append(renderReferenceChips(report.references));
    wrapper.appendChild(references);
    return wrapper;
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
    if (report.report_kind === "source-index" || report.track_id === "sources") {
      target.replaceChildren(renderSourceIndexReport(report));
      setupLightbox();
      return;
    }
    const wrapper = el("article", "report-body");
    wrapper.appendChild(renderReportIntro(report));

    const insightSection = el("section", "report-subsection");
    insightSection.append(el("h4", "", "1. 核心洞察"));
    (report.insights || []).forEach((insight, index) => {
      const card = el("article", "insight-card");
      card.append(el("h5", "", `1.${index + 1}. ${insight.title}`));
      const content = el("div", "insight-content");
      const copy = el("div", "insight-copy");
      copy.append(el("p", "insight-summary", insight.summary || ""));
      if (insight.analysis && insight.analysis.length) {
        const analysis = el("div", "insight-analysis");
        insight.analysis.forEach((paragraph) => analysis.append(el("p", "", paragraph)));
        copy.append(analysis);
      }
      if (insight.sub_insights && insight.sub_insights.length) {
        const sub = el("div", "sub-insights");
        sub.append(el("strong", "", "子洞察"));
        sub.append(list(insight.sub_insights));
        copy.append(sub);
      }
      if (insight.evidence && insight.evidence.length) {
        const ev = el("div", "evidence-line");
        ev.append(el("strong", "", "证据簇"));
        const chips = el("div", "meta-row");
        insight.evidence.forEach((item) => chips.append(el("span", "", item)));
        ev.append(chips);
        copy.append(ev);
      }
      content.append(copy);
      if (insight.visual && insight.visual.src) {
        const figure = el("figure", "insight-figure");
        const button = el("button", "image-zoom");
        button.type = "button";
        button.dataset.full = insight.visual.src;
        const img = document.createElement("img");
        img.src = insight.visual.src;
        img.alt = insight.visual.alt || insight.title;
        button.appendChild(img);
        figure.append(button);
        if (insight.visual.alt) figure.append(el("figcaption", "", insight.visual.alt));
        content.append(figure);
      }
      card.append(content);
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

    if (document.body.dataset.lightboxBound !== "1") {
      document.body.dataset.lightboxBound = "1";
      document.addEventListener("click", (event) => {
        const button = event.target instanceof Element ? event.target.closest(".image-zoom") : null;
        if (!button) return;
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
      lightbox.addEventListener("click", (event) => { if (event.target === lightbox) close(); });
      lightboxClose?.addEventListener("click", close);
      document.addEventListener("keydown", (event) => { if (event.key === "Escape") close(); });
    }
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
