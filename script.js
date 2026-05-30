(function () {
  const progress = document.querySelector(".reading-progress");
  const navLinks = Array.from(document.querySelectorAll(".site-nav a"));
  const sections = navLinks
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);
  const actionItems = Array.from(document.querySelectorAll(".action-item"));
  const zoomButtons = Array.from(document.querySelectorAll(".image-zoom"));
  const lightbox = document.querySelector("#image-lightbox");
  const lightboxImage = lightbox ? lightbox.querySelector("img") : null;
  const lightboxClose = lightbox ? lightbox.querySelector(".lightbox-close") : null;

  function updateProgress() {
    const scrollTop = window.scrollY;
    const height = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = height > 0 ? Math.min(scrollTop / height, 1) : 0;
    progress.style.width = `${ratio * 100}%`;
  }

  function updateActiveNav() {
    const current = sections
      .slice()
      .reverse()
      .find((section) => section.getBoundingClientRect().top <= 120);

    navLinks.forEach((link) => {
      const target = link.getAttribute("href").slice(1);
      link.classList.toggle("active", Boolean(current && current.id === target));
    });
  }

  actionItems.forEach((item, index) => {
    const input = item.querySelector("input");
    const key = `mee-insight-action-${index}`;
    input.checked = localStorage.getItem(key) === "done";
    item.classList.toggle("done", input.checked);

    input.addEventListener("change", () => {
      item.classList.toggle("done", input.checked);
      if (input.checked) {
        localStorage.setItem(key, "done");
      } else {
        localStorage.removeItem(key);
      }
    });
  });

  function closeLightbox() {
    if (!lightbox || !lightboxImage) return;

    lightbox.classList.remove("open");
    lightbox.setAttribute("aria-hidden", "true");
    lightboxImage.removeAttribute("src");
    lightboxImage.alt = "";
    document.body.classList.remove("lightbox-lock");
  }

  zoomButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (!lightbox || !lightboxImage) return;

      const image = button.querySelector("img");
      const fullImage = button.dataset.full || (image && image.currentSrc);
      if (!fullImage) return;

      lightboxImage.src = fullImage;
      lightboxImage.alt = image ? image.alt : "图片预览";
      lightbox.classList.add("open");
      lightbox.setAttribute("aria-hidden", "false");
      document.body.classList.add("lightbox-lock");
      if (lightboxClose) lightboxClose.focus();
    });
  });

  if (lightbox) {
    lightbox.addEventListener("click", (event) => {
      if (event.target === lightbox) closeLightbox();
    });
  }

  if (lightboxClose) {
    lightboxClose.addEventListener("click", closeLightbox);
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeLightbox();
  });

  window.addEventListener("scroll", () => {
    updateProgress();
    updateActiveNav();
  });

  updateProgress();
  updateActiveNav();
})();
