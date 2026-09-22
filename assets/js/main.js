(() => {
  const CONTENT_URL = "content/portfolio.yml";
  const DIAGRAM_EXTS = ["png", "jpg", "jpeg", "webp", "svg"];

  const ICONS = {
    infra:
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 19h16M7 16V8m5 8V5m5 11v-6" /></svg>',
    agent:
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="6" cy="6" r="2.2" /><circle cx="18" cy="8" r="2.2" /><circle cx="8" cy="18" r="2.2" /><circle cx="17" cy="17" r="2.2" /><path d="M8 7.5 16 8.5M7.5 8.2 8.4 16M17.2 10l-1 5.2M10.2 18.2 15 17.4" /></svg>',
    leadership:
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="8" cy="9" r="2.3" /><circle cx="16" cy="9" r="2.3" /><path d="M4.5 18c.6-2.4 2.4-3.7 3.5-3.7 1.4 0 2.5.8 3.2 1.8.7-1 1.8-1.8 3.2-1.8 1.1 0 2.9 1.3 3.5 3.7" /></svg>',
  };

  const escapeHtml = (value) =>
    String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");

  const textToHtml = (value) =>
    escapeHtml(value)
      .replaceAll("\n", "<br />")
      .replaceAll("  ", " ");

  const cloneTemplate = (id) => {
    const tpl = document.getElementById(id);
    return tpl.content.firstElementChild.cloneNode(true);
  };

  const diagramCandidates = (id, explicit) => {
    const files = [];
    if (explicit) files.push(explicit);
    DIAGRAM_EXTS.forEach((ext) => {
      files.push(`assets/projects/${id}/architecture.${ext}`);
    });
    DIAGRAM_EXTS.forEach((ext) => {
      files.push(`assets/projects/${id}/${id}_architecture.${ext}`);
    });
    return [...new Set(files)];
  };

  const probeImage = (src) =>
    new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(src);
      img.onerror = () => resolve("");
      img.src = encodeURI(src);
    });

  const findDiagram = async (id, explicit) => {
    for (const src of diagramCandidates(id, explicit)) {
      const hit = await probeImage(src);
      if (hit) return hit;
    }
    return "";
  };

  const galleryCandidates = (id, extras = []) => {
    const stems = [
      `${id}_main`,
      `${id}_architecture`,
      `${id}_annotation`,
      `${id}_tech`,
      `${id}_skills`,
      `${id}_screen`,
      `${id}_aws`,
      "main",
      "architecture",
      "annotation",
      "tech",
      "skills",
      "screen",
      "aws",
    ];
    const files = extras.filter(Boolean);
    stems.forEach((stem) => {
      files.push(`assets/projects/${id}/${stem}.png`);
      files.push(`assets/projects/${id}/${stem}.jpg`);
      files.push(`assets/projects/${id}/${stem}.webp`);
    });
    return [...new Set(files)];
  };

  const findGallery = async (id, extras = []) => {
    const hits = await Promise.all(galleryCandidates(id, extras).map(probeImage));
    return [...new Set(hits.filter(Boolean))];
  };

  const adjacentRecords = [];

  const fillSlot = (slot, { src, title, caption, emptyLabel, emptyHint }) => {
    slot.dataset.title = title;
    slot.dataset.caption = caption;
    slot.dataset.image = src;
    slot.replaceChildren();
    slot.classList.remove("p-0", "p-4", "p-5");

    if (src) {
      const img = document.createElement("img");
      img.src = src;
      img.alt = title;
      img.className = "h-full w-full rounded-xl object-contain bg-white";
      slot.classList.add("p-0");
      slot.append(img);
      return;
    }

    slot.classList.add("p-4");
    slot.innerHTML = `
      <div class="flex h-full min-h-[208px] flex-col justify-between">
        <p class="font-mono text-[11px] uppercase tracking-wider text-signal">Architecture</p>
        <div>
          <p class="text-sm font-medium">${escapeHtml(emptyLabel)}</p>
          <p class="mt-1 text-xs leading-5 text-mist">${escapeHtml(emptyHint)}</p>
        </div>
      </div>
    `;
  };

  const renderHero = (data) => {
    document.title = `${data.name} | ${data.role}`;
    document.querySelectorAll("[data-name]").forEach((el) => {
      el.textContent = data.name;
    });
    document.querySelectorAll("[data-email]").forEach((el) => {
      if (el.tagName === "A") el.href = `mailto:${data.email}`;
      if (el.dataset.email === "text") el.textContent = data.email;
    });
    document.querySelectorAll("[data-github]").forEach((el) => {
      el.href = data.github;
      if (el.dataset.github === "label") el.textContent = data.github_label || data.github;
    });
    document.querySelector("[data-pdf]")?.setAttribute("href", data.pdf || "portfolio.pdf");

    const hero = data.hero;
    document.getElementById("hero-kicker").textContent = hero.kicker;
    document.getElementById("hero-title").innerHTML = textToHtml(hero.title);
    document.getElementById("hero-summary").innerHTML = textToHtml(hero.summary);
    document.getElementById("hero-primary-cta").textContent = hero.primary_cta;
    document.getElementById("hero-secondary-cta").textContent = hero.secondary_cta;

    const statsRoot = document.getElementById("hero-stats");
    statsRoot.replaceChildren();
    (hero.stats || []).forEach((stat) => {
      const node = cloneTemplate("tpl-stat");
      node.querySelector("[data-label]").textContent = stat.label;
      node.querySelector("[data-value]").textContent = stat.value;
      statsRoot.append(node);
    });
  };

  const renderStrengths = (data) => {
    document.getElementById("strengths-heading").textContent = data.strengths.heading;
    const root = document.getElementById("strength-list");
    root.replaceChildren();
    (data.strengths.items || []).forEach((item) => {
      const node = cloneTemplate("tpl-strength");
      node.querySelector("[data-icon]").innerHTML = ICONS[item.icon] || ICONS.infra;
      node.querySelector("[data-title]").textContent = item.title;
      node.querySelector("[data-body]").textContent = item.body;
      root.append(node);
    });
  };

  const renderProject = async (project, index) => {
    const node = cloneTemplate("tpl-project");
    node.querySelector("[data-index]").textContent = String(index + 1).padStart(2, "0");
    node.querySelector("[data-period]").textContent = project.period;
    node.querySelector("[data-title]").textContent = project.title;
    node.querySelector("[data-subtitle]").textContent = project.subtitle;
    node.querySelector("[data-label]").textContent = project.label;
    node.querySelector("[data-summary]").textContent = project.summary;

    const techRoot = node.querySelector("[data-tech]");
    (project.tech || []).forEach((name) => {
      const badge = cloneTemplate("tpl-badge");
      badge.textContent = name;
      techRoot.append(badge);
    });

    const solutionRoot = node.querySelector("[data-solutions]");
    (project.solutions || []).forEach((item) => {
      const row = cloneTemplate("tpl-solution");
      row.querySelector("[data-title]").textContent = item.title;
      row.querySelector("[data-body]").textContent = item.body;
      solutionRoot.append(row);
    });

    const extras = [project.diagram, ...(project.images || [])].filter(Boolean);
    const gallery = await findGallery(project.id, extras);

    const slot = node.querySelector("[data-arch-trigger]");
    const column = node.querySelector("[data-arch-col]");
    const title = project.diagram_title || `${project.title} 아키텍처`;
    const caption = project.diagram_caption || "";
    fillSlot(slot, {
      src: gallery[0] || "",
      title,
      caption,
      emptyLabel: "다이어그램 플레이스홀더",
      emptyHint: `assets/projects/${project.id}/ 에 이미지를 넣거나 diagram 경로를 지정하세요.`,
    });

    if (gallery.length > 1 && column) {
      gallery.slice(1).forEach((src, index) => {
        const extra = slot.cloneNode(false);
        extra.className = "arch-slot h-[240px] w-full rounded-xl p-0 text-left";
        fillSlot(extra, {
          src,
          title: `${project.title} · 자료 ${index + 2}`,
          caption,
          emptyLabel: "",
          emptyHint: "",
        });
        column.append(extra);
      });
    }
    return node;
  };

  const renderProjects = async (data) => {
    document.getElementById("projects-heading").textContent = data.projects.heading;
    document.getElementById("projects-intro").textContent = data.projects.intro;
    const root = document.getElementById("project-list");
    root.replaceChildren();
    const cards = await Promise.all((data.projects.items || []).map(renderProject));
    cards.forEach((card, index) => {
      card.classList.toggle("mt-10", index === 0);
      card.classList.toggle("mt-6", index > 0);
      root.append(card);
    });

    document.getElementById("adjacent-heading").textContent = data.adjacent.heading;
    const hintEl = document.getElementById("adjacent-hint");
    if (hintEl) hintEl.textContent = data.adjacent.hint || "";
    const adjacentRoot = document.getElementById("adjacent-list");
    adjacentRoot.replaceChildren();
    adjacentRecords.length = 0;

    for (const item of data.adjacent.items || []) {
      const gallery = await findGallery(item.id, item.images);
      adjacentRecords.push({ ...item, gallery });
      const node = cloneTemplate("tpl-adjacent");
      node.dataset.id = item.id;
      node.querySelector("[data-title]").textContent = item.title;
      node.querySelector("[data-body]").textContent = item.body;
      const thumb = node.querySelector("[data-thumb]");
      if (gallery[0] && thumb) {
        thumb.src = encodeURI(gallery[0]);
        thumb.alt = item.title;
        thumb.classList.remove("hidden");
      }
      adjacentRoot.append(node);
    }
  };

  const renderSideProject = async (data) => {
    const side = data.side_project;
    document.getElementById("side-heading").textContent = side.heading;
    document.getElementById("side-kicker").textContent = side.kicker;
    document.getElementById("side-title").textContent = side.title;
    document.getElementById("side-subtitle").textContent = side.subtitle;
    document.getElementById("side-summary").textContent = side.summary;

    const highlights = document.getElementById("side-highlights");
    highlights.replaceChildren();
    (side.highlights || []).forEach((item) => {
      const node = cloneTemplate("tpl-highlight");
      node.querySelector("[data-title]").textContent = item.title;
      node.querySelector("[data-body]").textContent = item.body;
      highlights.append(node);
    });

    const techRoot = document.getElementById("side-tech");
    techRoot.replaceChildren();
    (side.tech || []).forEach((name) => {
      const badge = cloneTemplate("tpl-badge");
      badge.textContent = name;
      techRoot.append(badge);
    });

    const extras = [side.diagram, ...(side.images || [])].filter(Boolean);
    const found = await Promise.all(extras.map(probeImage));
    const gallery = [...new Set(found.filter(Boolean))];
    if (!gallery.length) {
      const fallback = await findDiagram(side.id, side.diagram);
      if (fallback) gallery.push(fallback);
    }

    const slot = document.getElementById("side-diagram");
    const column = document.getElementById("side-arch-col");
    const title = side.diagram_title || side.title;
    const caption = side.diagram_caption || "";
    fillSlot(slot, {
      src: gallery[0] || "",
      title,
      caption,
      emptyLabel: "화면 · 아키텍처 플레이스홀더",
      emptyHint: `assets/projects/${side.id}/ 에 이미지를 넣거나 diagram 경로를 지정하세요.`,
    });

    if (gallery.length > 1 && column && slot) {
      gallery.slice(1).forEach((src, index) => {
        const extra = slot.cloneNode(false);
        extra.removeAttribute("id");
        extra.className = "arch-slot h-[240px] w-full rounded-xl p-0 text-left";
        fillSlot(extra, {
          src,
          title: `${side.title} · 자료 ${index + 2}`,
          caption,
          emptyLabel: "",
          emptyHint: "",
        });
        column.append(extra);
      });
    }
  };

  const renderTalks = async (data) => {
    if (!data.talks) return;
    document.getElementById("talks-heading").textContent = data.talks.heading;
    document.getElementById("talks-intro").textContent = data.talks.intro || "";
    const root = document.getElementById("talks-list");
    root.replaceChildren();

    for (const item of data.talks.items || []) {
      const node = cloneTemplate("tpl-talk");
      node.querySelector("[data-period]").textContent = item.period;
      node.querySelector("[data-place]").textContent = item.place;
      node.querySelector("[data-title]").textContent = item.title;
      node.querySelector("[data-body]").textContent = item.body;
      const photo = node.querySelector("[data-photo]");
      const src = item.image ? await probeImage(item.image) : "";
      if (src && photo) {
        photo.dataset.title = item.title;
        photo.dataset.caption = `${item.period} · ${item.place}`;
        photo.dataset.image = src;
        photo.setAttribute("data-arch-trigger", "");
        const img = document.createElement("img");
        img.src = encodeURI(src);
        img.alt = item.title;
        img.className = "h-36 w-full object-cover";
        photo.append(img);
      } else if (photo) {
        photo.remove();
      }
      root.append(node);
    }
  };

  const renderExperience = (data) => {
    document.getElementById("experience-heading").textContent = data.experience.heading;
    const recentRoot = document.getElementById("experience-recent");
    recentRoot.replaceChildren();
    (data.experience.recent || []).forEach((item) => {
      const node = cloneTemplate("tpl-experience");
      node.querySelector("[data-title]").textContent = item.title;
      node.querySelector("[data-period]").textContent = item.period;
      node.querySelector("[data-body]").textContent = item.body;
      recentRoot.append(node);
    });

    const earlier = data.experience.earlier;
    document.getElementById("earlier-title").textContent = earlier.title;
    document.getElementById("earlier-summary").textContent = earlier.summary;
    const earlierRoot = document.getElementById("experience-earlier");
    earlierRoot.replaceChildren();
    (earlier.items || []).forEach((item) => {
      const node = cloneTemplate("tpl-earlier");
      node.querySelector("[data-title]").textContent = item.title;
      node.querySelector("[data-period]").textContent = item.period;
      node.querySelector("[data-body]").textContent = item.body;
      earlierRoot.append(node);
    });
  };

  const renderStack = (data) => {
    document.getElementById("stack-heading").textContent = data.stack.heading;
    const root = document.getElementById("stack-list");
    root.replaceChildren();
    (data.stack.items || []).forEach((item) => {
      const node = cloneTemplate("tpl-stack");
      node.querySelector("[data-title]").textContent = item.title;
      node.querySelector("[data-body]").textContent = item.body;
      root.append(node);
    });
  };

  const renderContact = (data) => {
    document.getElementById("contact-heading").textContent = data.contact.heading;
    document.getElementById("contact-body").textContent = data.contact.body;
    document.getElementById("footer-credits").textContent = `${data.name}. ${data.footer.credits}`;
    const yearEl = document.getElementById("year");
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());
  };

  const bindUi = () => {
    const nav = document.getElementById("site-nav");
    const navToggle = document.getElementById("nav-toggle");
    const mobileNav = document.getElementById("mobile-nav");

    const onScroll = () => {
      if (!nav) return;
      nav.classList.toggle("shadow-lg", window.scrollY > 8);
      nav.classList.toggle("border-b", window.scrollY > 8);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    navToggle?.addEventListener("click", () => {
      const open = mobileNav?.classList.toggle("hidden") === false;
      navToggle.setAttribute("aria-expanded", String(open));
    });

    mobileNav?.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        mobileNav.classList.add("hidden");
        navToggle?.setAttribute("aria-expanded", "false");
      });
    });

    document.querySelectorAll("[data-accordion-btn]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const panel = btn.parentElement?.querySelector("[data-accordion-panel]");
        const label = btn.querySelector("[data-accordion-label]");
        const expanded = btn.getAttribute("aria-expanded") === "true";
        btn.setAttribute("aria-expanded", String(!expanded));
        panel?.classList.toggle("is-open", !expanded);
        if (label) label.textContent = expanded ? "펼치기" : "접기";
      });
    });

    const overlay = document.getElementById("arch-modal");
    const detailOverlay = document.getElementById("detail-modal");
    const modalTitle = document.getElementById("arch-modal-title");
    const modalImage = document.getElementById("arch-modal-image");
    const modalPlaceholder = document.getElementById("arch-modal-placeholder");
    const modalCaption = document.getElementById("arch-modal-caption");

    const syncBodyLock = () => {
      const anyOpen = overlay?.classList.contains("is-open") || detailOverlay?.classList.contains("is-open");
      document.body.classList.toggle("modal-open", Boolean(anyOpen));
    };

    const closeArch = () => {
      overlay?.classList.remove("is-open");
      if (modalImage) {
        modalImage.src = "";
        modalImage.classList.add("hidden");
      }
      modalPlaceholder?.classList.remove("hidden");
      syncBodyLock();
    };

    const openArch = (trigger) => {
      const title = trigger.dataset.title || "아키텍처 다이어그램";
      const image = trigger.dataset.image || "";
      const caption = trigger.dataset.caption || "";

      if (modalTitle) modalTitle.textContent = title;
      if (modalCaption) modalCaption.textContent = caption;

      if (image && modalImage) {
        modalImage.src = encodeURI(image);
        modalImage.alt = title;
        modalImage.classList.remove("hidden");
        modalPlaceholder?.classList.add("hidden");
        modalImage.onerror = () => {
          modalImage.classList.add("hidden");
          modalPlaceholder?.classList.remove("hidden");
        };
      } else {
        modalImage?.classList.add("hidden");
        modalPlaceholder?.classList.remove("hidden");
      }

      overlay?.classList.add("is-open");
      syncBodyLock();
      document.getElementById("arch-modal-close")?.focus();
    };

    const closeDetail = () => {
      detailOverlay?.classList.remove("is-open");
      syncBodyLock();
    };

    const openDetail = (id) => {
      const item = adjacentRecords.find((row) => row.id === id);
      if (!item || !detailOverlay) return;

      document.getElementById("detail-kicker").textContent = [item.period, item.label].filter(Boolean).join(" · ");
      document.getElementById("detail-title").textContent = item.title;
      document.getElementById("detail-subtitle").textContent = item.subtitle || "";
      document.getElementById("detail-summary").textContent = item.summary || item.body;
      document.getElementById("detail-outcomes").textContent = item.outcomes || "";

      const techRoot = document.getElementById("detail-tech");
      techRoot.replaceChildren();
      (item.tech || []).forEach((name) => {
        const badge = cloneTemplate("tpl-badge");
        badge.textContent = name;
        techRoot.append(badge);
      });

      const solutionRoot = document.getElementById("detail-solutions");
      solutionRoot.replaceChildren();
      (item.solutions || []).forEach((row) => {
        const node = cloneTemplate("tpl-solution");
        node.querySelector("[data-title]").textContent = row.title;
        node.querySelector("[data-body]").textContent = row.body;
        solutionRoot.append(node);
      });

      const galleryRoot = document.getElementById("detail-gallery");
      galleryRoot.replaceChildren();
      (item.gallery || []).forEach((src, index) => {
        const node = cloneTemplate("tpl-gallery");
        node.dataset.title = item.title;
        node.dataset.caption = `${item.title} · 자료 ${index + 1}`;
        node.dataset.image = src;
        const img = node.querySelector("img");
        img.src = encodeURI(src);
        img.alt = `${item.title} ${index + 1}`;
        galleryRoot.append(node);
      });

      detailOverlay.classList.add("is-open");
      syncBodyLock();
      document.getElementById("detail-close")?.focus();
    };

    document.querySelectorAll("[data-arch-trigger]").forEach((trigger) => {
      trigger.addEventListener("click", () => openArch(trigger));
    });

    document.getElementById("detail-gallery")?.addEventListener("click", (event) => {
      const trigger = event.target.closest("[data-arch-trigger]");
      if (trigger) openArch(trigger);
    });

    document.querySelectorAll("[data-adjacent-trigger]").forEach((btn) => {
      btn.addEventListener("click", () => openDetail(btn.dataset.id));
    });

    document.getElementById("arch-modal-close")?.addEventListener("click", closeArch);
    overlay?.addEventListener("click", (event) => {
      if (event.target === overlay) closeArch();
    });
    document.getElementById("detail-close")?.addEventListener("click", closeDetail);
    detailOverlay?.addEventListener("click", (event) => {
      if (event.target === detailOverlay) closeDetail();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      if (overlay?.classList.contains("is-open")) closeArch();
      else closeDetail();
    });

    window.addEventListener("beforeprint", () => {
      document.querySelectorAll("[data-accordion-panel]").forEach((panel) => {
        panel.classList.add("is-open");
      });
      document.querySelectorAll("[data-accordion-btn]").forEach((btn) => {
        btn.setAttribute("aria-expanded", "true");
      });
    });
  };

  const showError = (message) => {
    const banner = document.getElementById("content-error");
    if (!banner) return;
    banner.textContent = message;
    banner.classList.remove("hidden");
  };

  const start = async () => {
    try {
      const response = await fetch(CONTENT_URL);
      if (!response.ok) throw new Error(`콘텐츠 파일을 찾지 못했습니다: ${CONTENT_URL}`);
      const data = jsyaml.load(await response.text());
      renderHero(data);
      renderStrengths(data);
      await renderProjects(data);
      await renderSideProject(data);
      renderExperience(data);
      renderStack(data);
      await renderTalks(data);
      renderContact(data);
      bindUi();
      document.getElementById("page-shell")?.classList.remove("invisible");
      document.documentElement.dataset.ready = "true";
    } catch (error) {
      console.error(error);
      showError("content/portfolio.yml 을 읽지 못했습니다. 로컬에서는 python3 -m http.server 로 열어주세요.");
      document.getElementById("page-shell")?.classList.remove("invisible");
    }
  };

  start();
})();
