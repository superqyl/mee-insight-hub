(function () {
  const fallback = {
    meta: {
      site_name: "MEE Insight Hub",
      hero_title: "公开情报与私域收藏洞察中枢",
      current_thesis: "这里汇总每日、每周、每月的新闻热点、个人洞察、产品机会、MEE 自进化和参考来源；先读报告正文，再按证据簇追溯来源。"
    },
    report_packs: [],
    reports: []
  };

  const state = { data: fallback, selectedPack: "daily", selectedReport: "" };
  const progress = document.querySelector(".reading-progress");

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

  function isSourceIndexReport(report) {
    return report?.report_kind === "source-index" || report?.report_contract?.id === "source-index" || report?.track_id === "sources";
  }

  function isFactSummaryReport(report) {
    return report?.report_kind === "fact-summary" || report?.report_contract?.id === "fact-summary";
  }

  function renderFactSummaryReport(report) {
    const wrapper = el("article", "report-body fact-summary-report");
    wrapper.appendChild(renderReportIntro(report));

    const itemsSection = el("section", "fact-summary-section");
    itemsSection.append(el("h4", "", "1. 热点摘要"));
    const grid = el("div", "news-digest-grid");
    (report.news_items || []).forEach((item, index) => {
      const card = el("article", "news-digest-card");
      card.append(el("span", "news-rank", String(index + 1).padStart(2, "0")));
      const imageSrc = item.image?.src || item.image_url || "";
      if (imageSrc) {
        const figure = el("figure", "news-source-figure");
        const button = el("button", "image-zoom");
        button.type = "button";
        button.dataset.full = imageSrc;
        const img = document.createElement("img");
        img.src = imageSrc;
        img.alt = item.image?.alt || `${item.title || "热点新闻"} 原始来源图片`;
        button.appendChild(img);
        figure.append(button);
        figure.append(el("figcaption", "", item.image?.origin === "source" ? "原始新闻图片" : "来源图片"));
        card.append(figure);
      }
      card.append(el("h5", "", item.title || "未命名热点"));
      const newsMeta = [item.source_name, item.published_at && item.published_at !== "unknown" ? item.published_at : ""].filter(Boolean).join(" · ");
      if (newsMeta) card.append(el("p", "news-meta", newsMeta));
      if (item.summary) card.append(el("p", "", item.summary));
      if (item.key_points && item.key_points.length) {
        const points = el("div", "news-key-points");
        points.append(el("strong", "", "重点信息"));
        points.append(list(item.key_points));
        card.append(points);
      }
      if (item.detail_highlights && item.detail_highlights.length) {
        const details = el("div", "news-detail-highlights");
        details.append(el("strong", "", "关键细节"));
        details.append(list(item.detail_highlights));
        card.append(details);
      }
      if (item.benchmark_highlights && item.benchmark_highlights.length) {
        const benchmark = el("div", "news-benchmark");
        benchmark.append(el("strong", "", "关键指标"));
        benchmark.append(list(item.benchmark_highlights));
        if (item.benchmark_table && item.benchmark_table.length) {
          const tableWrap = el("div", "benchmark-table-wrap");
          const table = document.createElement("table");
          table.className = "benchmark-table";
          const thead = document.createElement("thead");
          const headRow = document.createElement("tr");
          ["指标", "Opus 4.8", "Opus 4.7", "GPT-5.5", "Gemini 3.1 Pro"].forEach((label) => headRow.append(el("th", "", label)));
          thead.append(headRow);
          table.append(thead);
          const tbody = document.createElement("tbody");
          item.benchmark_table.forEach((row) => {
            const tr = document.createElement("tr");
            tr.append(el("td", "", row.metric || ""));
            tr.append(el("td", "", row.opus_48 || ""));
            tr.append(el("td", "", row.opus_47 || ""));
            tr.append(el("td", "", row.gpt_55 || ""));
            tr.append(el("td", "", row.gemini_31 || ""));
            tbody.append(tr);
          });
          table.append(tbody);
          tableWrap.append(table);
          benchmark.append(tableWrap);
        }
        card.append(benchmark);
      }
      const meta = el("div", "meta-row");
      [item.source_group, item.source_type, item.trust_tier].filter(Boolean).forEach((value) => meta.append(el("span", "", value)));
      if ((item.related_themes || []).length) meta.append(el("span", "", `关联：${item.related_themes.join(" / ")}`));
      if (meta.childNodes.length) card.append(meta);
      if (item.boundary) card.append(el("p", "news-boundary", item.boundary));
      if (item.url) {
        const link = document.createElement("a");
        link.className = "news-link";
        link.href = item.url;
        link.textContent = "查看公开来源";
        if (/^https?:/i.test(item.url)) {
          link.target = "_blank";
          link.rel = "noreferrer noopener";
        }
        card.append(link);
      }
      grid.append(card);
    });
    itemsSection.append(grid);
    wrapper.append(itemsSection);

    const watchSection = el("section", "fact-summary-section");
    watchSection.append(el("h4", "", "2. 观察重点"));
    watchSection.append(list(report.watch_points || []));
    wrapper.append(watchSection);

    const sourceSection = el("section", "fact-summary-section source-summary-block");
    sourceSection.append(el("h4", "", "3. 参考数据来源"));
    sourceSection.append(list(report.source_summary || []));
    if (report.references && report.references.length) {
      sourceSection.append(el("strong", "source-reference-title", "公开参考资料"));
      sourceSection.append(renderReferenceChips(report.references));
    }
    wrapper.append(sourceSection);
    return wrapper;
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
    packBox.append(el("p", "", `${pack.summary || ""} 当前周期包含 ${reports.length} 份正文，覆盖新闻热点、个人洞察、产品商机、MEE 进化和参考来源。`));
    packBox.append(el("span", "report-count", `${reports.length} 份报告正文`));
    summaryTarget?.replaceChildren(packBox);

    const report = reports.find((item) => item.id === state.selectedReport) || reports[0];
    if (!report) {
      target.textContent = "当前周期暂无报告正文。";
      return;
    }
    if (isSourceIndexReport(report)) {
      target.replaceChildren(renderSourceIndexReport(report));
      setupLightbox();
      return;
    }
    if (isFactSummaryReport(report)) {
      target.replaceChildren(renderFactSummaryReport(report));
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

  function render(data) {
    state.data = data;
    renderHero(data);
    renderReports(data);
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

  fetch("./public/data/site-content.json", { cache: "no-store" })
    .then((response) => response.ok ? response.json() : fallback)
    .then(render)
    .catch(() => render(fallback));

  window.addEventListener("scroll", () => {
    updateProgress();
  });
  updateProgress();
})();
