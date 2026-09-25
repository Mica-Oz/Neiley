/* Site-wide behaviour: theme/motion preferences, navbar state, scroll reveals.
   The <head> of every page sets data-theme / data-motion before first paint;
   this file wires up everything that needs the DOM. */
(function () {
  var root = document.documentElement;
  var LOGOS = {
    dark: "/assets/images/opt/logo-nd.png", // bronze on dark green
    hero: "/assets/images/opt/logo-n.png", // tan, matches the hero title
    light: "/assets/images/opt/logo-g4.png", // deep green on ivory
  };

  var ICONS = {
    sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2M12 20v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2 12h2M20 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/></svg>',
    moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>',
    motion: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><path d="M3 12c2.5-4 5-4 7.5 0s5 4 7.5 0c1-1.6 2-2.4 3-2.4"/></svg>',
    still: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><path d="M3 12h18"/></svg>',
  };

  var isSpanish = (root.getAttribute("lang") || "").toLowerCase().indexOf("es") === 0;
  var T = isSpanish
    ? {
        light: "Modo claro", dark: "Modo oscuro",
        toLight: "Cambiar a modo claro", toDark: "Cambiar a modo oscuro",
        motion: "Reducir movimiento",
        motionVideo: "Reducir movimiento y pausar el video de fondo",
        motionOff: "Movimiento reducido (haga clic para permitirlo)",
        lang: "English", langShort: "EN", langLabel: "View this page in English",
      }
    : {
        light: "Light mode", dark: "Dark mode",
        toLight: "Switch to light mode", toDark: "Switch to dark mode",
        motion: "Reduce motion",
        motionVideo: "Reduce motion and pause background video",
        motionOff: "Motion reduced (click to allow)",
        lang: "Español", langShort: "ES", langLabel: "Ver esta página en español",
      };

  function store(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (e) {}
  }
  function isLight() {
    return root.getAttribute("data-theme") === "light";
  }
  function isReduced() {
    return root.getAttribute("data-motion") === "reduce";
  }

  // Enables the JS-dependent initial states in CSS (e.g. undrawn rules).
  root.classList.add("js");

  /* ---------- Preference toggles ---------- */

  function renderPrefs(wrap) {
    var theme = wrap.querySelector('[data-pref="theme"]');
    var motion = wrap.querySelector('[data-pref="motion"]');
    var light = isLight();
    var reduced = isReduced();

    theme.innerHTML =
      (light ? ICONS.moon : ICONS.sun) +
      '<span class="pref-label">' + (light ? T.dark : T.light) + "</span>";
    theme.setAttribute("aria-label", light ? T.toDark : T.toLight);
    theme.title = theme.getAttribute("aria-label");

    motion.innerHTML =
      (reduced ? ICONS.still : ICONS.motion) +
      '<span class="pref-label">' + T.motion + "</span>";
    // On the homepage this is also the pause control for the background video.
    motion.setAttribute(
      "aria-label",
      document.getElementById("background-video") ? T.motionVideo : T.motion
    );
    motion.setAttribute("aria-pressed", reduced ? "true" : "false");
    motion.title = reduced ? T.motionOff : T.motion;
  }

  // Link to the same page in the other language (from the hreflang
  // alternates in <head>), or to that language's home page.
  function languageHref() {
    var other = isSpanish ? "en" : "es";
    var alt = document.querySelector('link[rel="alternate"][hreflang="' + other + '"]');
    if (alt) {
      try {
        var u = new URL(alt.href);
        return u.pathname + u.hash;
      } catch (e) {}
    }
    return isSpanish ? "/" : "/es/";
  }

  function buildPrefs() {
    var collapse = document.querySelector(".navbar .navbar-collapse");
    if (!collapse) return;
    var wrap = document.createElement("div");
    wrap.className = "site-prefs";
    wrap.innerHTML =
      '<a class="pref-btn pref-lang" href="' + languageHref() + '" hreflang="' + (isSpanish ? "en" : "es") +
      '" lang="' + (isSpanish ? "en" : "es") + '" aria-label="' + T.langLabel + '">' +
      '<span class="pref-short" aria-hidden="true">' + T.langShort + "</span>" +
      '<span class="pref-label">' + T.lang + "</span></a>" +
      '<button type="button" class="pref-btn" data-pref="theme"></button>' +
      '<button type="button" class="pref-btn" data-pref="motion"></button>';
    collapse.appendChild(wrap);
    renderPrefs(wrap);

    wrap.addEventListener("click", function (e) {
      var btn = e.target.closest(".pref-btn");
      if (!btn) return;
      var next;
      if (btn.getAttribute("data-pref") === "theme") {
        next = isLight() ? "dark" : "light";
        root.setAttribute("data-theme", next);
        store("nl-theme", next);
      } else {
        next = isReduced() ? "full" : "reduce";
        root.setAttribute("data-motion", next);
        store("nl-motion", next);
        applyMotion();
      }
      renderPrefs(wrap);
      updateNav();
    });
  }

  /* ---------- Motion ---------- */

  // The hero video is attached here rather than in the markup so phones get
  // the small file and data-saver / reduced-motion visitors skip the download
  // entirely (they keep the poster frame).
  function saveData() {
    return !!(navigator.connection && navigator.connection.saveData);
  }
  function loadHeroVideo(video) {
    if (video.getAttribute("src") || isReduced() || saveData()) return false;
    var small = window.matchMedia("(max-width: 768px)").matches;
    video.src = video.getAttribute(small ? "data-src-small" : "data-src-large");
    video.preload = "auto";
    video.load();
    return true;
  }

  function applyMotion() {
    var video = document.getElementById("background-video");
    if (video) {
      if (isReduced()) {
        video.pause();
      } else {
        loadHeroVideo(video);
        var playing = video.play();
        if (playing && playing.catch) playing.catch(function () {});
      }
    }
    if (isReduced()) {
      document.querySelectorAll(".line").forEach(function (el) {
        el.classList.add("is-drawn");
      });
    }
  }

  function observeLines() {
    var lines = document.querySelectorAll(".line");
    if (!("IntersectionObserver" in window) || isReduced()) {
      lines.forEach(function (el) {
        el.classList.add("is-drawn");
      });
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-drawn");
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -10% 0px" }
    );
    lines.forEach(function (el) {
      io.observe(el);
    });
  }

  /* ---------- Navbar ---------- */

  var nav = document.querySelector(".navbar");
  var hero = document.getElementById("hero");
  var logo = nav && nav.querySelector(".navbar-brand img");
  if (logo && !/\/opt\/logo-/.test(logo.getAttribute("src") || "")) logo = null;

  // On the homepage the navbar takes no layout space, so the hero (and its
  // green veil) runs up underneath it.
  function tuckHero() {
    if (nav && hero) nav.style.marginBottom = -nav.offsetHeight + "px";
  }

  function updateNav() {
    if (!nav) return;
    // Transparent only while the page is at rest at the very top; the solid
    // bar fades in on the first bit of scroll.
    var overHero = !!hero && window.scrollY < 8;
    nav.classList.toggle("is-over-hero", overHero);
    if (logo) {
      var src = overHero ? LOGOS.hero : isLight() ? LOGOS.light : LOGOS.dark;
      if (logo.getAttribute("src") !== src) logo.setAttribute("src", src);
    }
  }

  var ticking = false;
  window.addEventListener(
    "scroll",
    function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        updateNav();
        ticking = false;
      });
    },
    { passive: true }
  );
  window.addEventListener("load", tuckHero);
  window.addEventListener("resize", function () {
    tuckHero();
    updateNav();
  });

  // Wordmark revealed beside the logo on hover (decorative; the link already
  // has the logo's alt text).
  var brand = nav && nav.querySelector(".navbar-brand");
  if (brand) {
    var word = document.createElement("span");
    word.className = "brand-word";
    word.setAttribute("aria-hidden", "true");
    word.textContent = "Neiley Law";
    brand.appendChild(word);
  }

  /* ---------- Contact intake ---------- */

  function setupIntake() {
    var form = document.getElementById("intake");
    if (!form) return;
    var more = form.querySelector("[data-intake-more]");
    var urgent = form.querySelector("[data-intake-urgent]");
    var subject = form.querySelector("[data-intake-subject]");
    var email = form.querySelector('[name="email"]');
    var phone = form.querySelector('[name="phone"]');
    var name = form.querySelector('[name="name"]');
    var other = form.querySelector("[data-intake-other]");
    var otherInput = other.querySelector("input");

    form.classList.add("intake-js");

    function open(focusName) {
      if (!form.classList.contains("is-open")) {
        form.classList.add("is-open");
        if (focusName) setTimeout(function () { name.focus(); }, 350);
      }
    }

    form.addEventListener("change", function (e) {
      if (e.target.name !== "matter") return;
      urgent.hidden = !e.target.hasAttribute("data-urgent");
      var isOther = e.target.hasAttribute("data-other");
      other.hidden = !isOther;
      if (isOther) otherInput.focus();
      open(false);
    });
    form.querySelector("[data-intake-skip]").addEventListener("click", function () {
      open(true);
    });

    // Either an email or a phone number is enough to reach someone.
    function checkReach() {
      var ok = email.value.trim() || phone.value.trim();
      email.setCustomValidity(
        ok ? "" : isSpanish
          ? "Agregue un correo electrónico o un número de teléfono para que podamos comunicarnos con usted."
          : "Please add an email or phone number so we can reach you."
      );
    }
    email.addEventListener("input", checkReach);
    phone.addEventListener("input", checkReach);

    // Until the real Web3Forms key is added, don't send visitors to an error
    // page; point them to the phone and email instead.
    var key = form.querySelector("[data-intake-key]");
    var notConnected = key && /^YOUR_/.test(key.value);

    form.addEventListener("submit", function (e) {
      if (notConnected) {
        e.preventDefault();
        var note = form.querySelector("[data-intake-offline]");
        if (!note) {
          note = document.createElement("p");
          note.className = "intake-urgent";
          note.setAttribute("data-intake-offline", "");
          note.setAttribute("role", "status");
          note.innerHTML = isSpanish
            ? 'Nuestro formulario en línea no está disponible en este momento. Llámenos al <a href="tel:970-963-6363">970-963-6363</a> o escríbanos a <a href="mailto:office@neiley.com">office@neiley.com</a>.'
            : 'Our online form is temporarily unavailable. Please call <a href="tel:970-963-6363">970-963-6363</a> or email <a href="mailto:office@neiley.com">office@neiley.com</a>.';
          form.querySelector(".intake-submit").appendChild(note);
        }
        return;
      }
      open(false);
      checkReach();
      if (!form.checkValidity()) {
        e.preventDefault();
        form.reportValidity();
        return;
      }
      var matter = form.querySelector('[name="matter"]:checked');
      var discreet = form.querySelector('[name="discreet"]:checked');
      subject.value =
        "Consultation request" +
        (matter ? ": " + matter.value : "") +
        (matter && matter.hasAttribute("data-other") && otherInput.value.trim()
          ? " (" + otherInput.value.trim() + ")"
          : "") +
        (discreet ? " (discreet contact requested)" : "") +
        (isSpanish ? " [Spanish site]" : "");
    });
  }

  /* ---------- Resources tools ---------- */

  function setupTools() {
    var calc = document.querySelector("[data-timeline-calc]");
    if (calc) {
      var input = calc.querySelector('input[type="date"]');
      var out = calc.querySelector("[data-timeline-result]");
      var fmt = new Intl.DateTimeFormat(isSpanish ? "es-US" : "en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      var update = function () {
        if (!input.value) return;
        var parts = input.value.split("-").map(Number);
        // Colorado: no decree until 91 days after jurisdiction (C.R.S. 14-10-106)
        var d = new Date(parts[0], parts[1] - 1, parts[2] + 91);
        out.innerHTML =
          (isSpanish ? "Fecha más temprana posible del decreto:" : "Earliest possible decree date:") +
          "<strong>" + fmt.format(d) + "</strong>";
      };
      input.addEventListener("input", update);
      calc.addEventListener("submit", function (e) {
        e.preventDefault();
        update();
      });
    }
    document.querySelectorAll("[data-print]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        window.print();
      });
    });
  }

  /* ---------- Mobile call bar ---------- */

  var ICON_PHONE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg>';

  function buildCallBar() {
    var contact = document.getElementById("contact");
    var home = isSpanish ? "/es/" : "/";
    var bar = document.createElement("nav");
    bar.className = "call-bar";
    bar.setAttribute("aria-label", isSpanish ? "Contacto rápido" : "Quick contact");
    bar.innerHTML =
      '<a href="tel:970-963-6363">' + ICON_PHONE + (isSpanish ? "Llamar" : "Call") + "</a>" +
      '<a href="' + (contact ? "#contact" : home + "#contact") + '">' +
      (isSpanish ? "Consulta" : "Schedule") + "</a>";
    document.body.appendChild(bar);
    document.body.classList.add("has-call-bar");

    // Step aside while the contact form itself is on screen.
    if (contact && "IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        bar.classList.toggle("is-hidden", entries[0].isIntersecting);
      }, { rootMargin: "0px 0px -30% 0px" }).observe(contact);
    }
  }

  /* ---------- Loading screen ---------- */

  // First visit of a session: hold the drawn-logo intro for at least
  // INTRO_MIN ms and until the hero video (or the page) is ready, but never
  // longer than INTRO_MAX. Later page loads just fade the cover away.
  var INTRO_MIN = 2100;
  var INTRO_MAX = 4500;
  var revealed = false;

  function reveal() {
    if (revealed) return;
    revealed = true;
    root.classList.remove("is-loading");
    root.classList.add("is-ready");
    try {
      sessionStorage.setItem("nl-intro", "1");
    } catch (e) {}
    observeLines();
    if (window.AOS) {
      AOS.init({
        once: true,
        duration: 1000,
        easing: "ease-out-cubic",
        offset: 60,
        disable: isReduced,
      });
    }
  }

  function waitForIntro() {
    var video = document.getElementById("background-video");
    var assetsReady = false;

    function check() {
      if (revealed) return;
      var now = performance.now();
      if ((assetsReady && now >= INTRO_MIN) || now >= INTRO_MAX) {
        reveal();
      } else {
        setTimeout(check, Math.max(50, (assetsReady ? INTRO_MIN : INTRO_MAX) - now));
      }
    }
    function markReady() {
      assetsReady = true;
      check();
    }

    if (video && video.getAttribute("src")) {
      if (video.readyState >= 2) assetsReady = true;
      else video.addEventListener("loadeddata", markReady, { once: true });
    } else if (video) {
      assetsReady = true; // poster only (data saver)
    } else if (document.readyState === "complete") {
      assetsReady = true;
    } else {
      window.addEventListener("load", markReady, { once: true });
    }
    check();
  }

  /* ---------- Init ---------- */

  buildPrefs();
  setupIntake();
  setupTools();
  buildCallBar();
  tuckHero();
  updateNav();
  applyMotion();

  if (!root.classList.contains("is-loading")) {
    reveal();
  } else if (root.classList.contains("is-intro")) {
    waitForIntro();
  } else {
    // Let the first frame paint under the cover, then lift it.
    requestAnimationFrame(function () {
      setTimeout(reveal, 120);
    });
  }
})();
