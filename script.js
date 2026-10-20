// Emmanuel C. Solayao | Portfolio
// Theme switch, drawer menu, eased scrolling, scroll effects, project filter, animated network,
// count-ups, confetti, and more.
// Plain JavaScript, no libraries. Motion is skipped for visitors who prefer reduced motion.

(function () {
  "use strict";

  var root = document.documentElement;
  root.classList.add("js-ready"); // lets the CSS start entrance animations

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var mobileQuery = window.matchMedia("(max-width: 760px)");

  var header = document.querySelector(".site-header");
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");
  var navLinks = nav ? nav.querySelectorAll("a") : [];
  var backdrop = document.querySelector(".nav-backdrop");
  var indicator = document.querySelector(".nav-indicator");
  var progressBar = document.querySelector(".progress span");
  var toTop = document.querySelector(".to-top");
  var mainEl = document.getElementById("main");
  var footerEl = document.querySelector(".site-footer");

  // Reads the live colour tokens from style.css, so canvas and confetti follow the theme
  function token(name, fallback) {
    var value = window.getComputedStyle(root).getPropertyValue(name).trim();
    return value || fallback;
  }

  /* ==========================================================
     Dark / light theme
     The first choice is made by a tiny script in <head> (no flash).
     This part handles the button, saving the choice, and the transition.
     ========================================================== */

  var themeBtn = document.querySelector(".theme-toggle");
  var themeMeta = document.querySelector('meta[name="theme-color"]');
  var THEME_COLORS = { dark: "#0f1626", light: "#f6f8fd" };

  function currentTheme() {
    return root.getAttribute("data-theme") === "light" ? "light" : "dark";
  }

  function savedTheme() {
    try { return localStorage.getItem("theme"); } catch (err) { return null; }
  }

  function applyTheme(theme, save) {
    root.setAttribute("data-theme", theme);
    if (themeMeta) themeMeta.setAttribute("content", THEME_COLORS[theme]);
    if (themeBtn) {
      themeBtn.setAttribute("aria-label", theme === "dark" ? "Switch to light theme" : "Switch to dark theme");
    }
    if (save) {
      try { localStorage.setItem("theme", theme); } catch (err) { /* private mode: just skip saving */ }
    }
    document.dispatchEvent(new CustomEvent("themechange", { detail: { theme: theme } }));
  }

  applyTheme(currentTheme(), false); // sync the button label and browser colour with the early choice

  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      var next = currentTheme() === "dark" ? "light" : "dark";

      if (reduceMotion) {
        applyTheme(next, true);
        return;
      }

      // Best case: a circular reveal that grows out of the button (View Transitions API)
      if (document.startViewTransition) {
        var box = themeBtn.getBoundingClientRect();
        var x = box.left + box.width / 2;
        var y = box.top + box.height / 2;
        var radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));

        var transition = document.startViewTransition(function () { applyTheme(next, true); });

        transition.ready.then(function () {
          root.animate(
            { clipPath: ["circle(0px at " + x + "px " + y + "px)", "circle(" + radius + "px at " + x + "px " + y + "px)"] },
            { duration: 650, easing: "cubic-bezier(0.2, 0.7, 0.2, 1)", pseudoElement: "::view-transition-new(root)" }
          );
        }).catch(function () { /* transition was skipped; the theme is already applied */ });
        return;
      }

      // Fallback: a short colour fade
      root.classList.add("theme-fade");
      applyTheme(next, true);
      setTimeout(function () { root.classList.remove("theme-fade"); }, 500);
    });
  }

  // If the visitor never chose a theme, follow their system when it changes
  var systemTheme = window.matchMedia("(prefers-color-scheme: light)");
  function onSystemTheme(event) {
    var saved = savedTheme();
    if (saved !== "light" && saved !== "dark") applyTheme(event.matches ? "light" : "dark", false);
  }
  if (systemTheme.addEventListener) systemTheme.addEventListener("change", onSystemTheme);
  else if (systemTheme.addListener) systemTheme.addListener(onSystemTheme);

  /* ==========================================================
     Mobile drawer menu
     ========================================================== */

  var menuOpen = false;

  function setInert(on) {
    [mainEl, footerEl, toTop].forEach(function (el) {
      if (!el) return;
      if (on) el.setAttribute("inert", "");
      else el.removeAttribute("inert");
    });
  }

  function setMenu(open) {
    if (!toggle || !nav) return;
    menuOpen = open;
    nav.classList.toggle("is-open", open);
    if (backdrop) backdrop.classList.toggle("is-open", open);
    root.classList.toggle("menu-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    setInert(open); // keeps keyboard focus out of the page behind the drawer

    if (open && navLinks.length) {
      requestAnimationFrame(function () { navLinks[0].focus(); });
    }
  }

  if (toggle && nav) {
    // Each link slides in with its own delay (see --n in style.css)
    Array.prototype.forEach.call(nav.querySelectorAll("li"), function (li, i) {
      li.style.setProperty("--n", i);
    });

    toggle.addEventListener("click", function () { setMenu(!menuOpen); });

    navLinks.forEach(function (link) {
      link.addEventListener("click", function () { setMenu(false); });
    });

    if (backdrop) backdrop.addEventListener("click", function () { setMenu(false); });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && menuOpen) {
        setMenu(false);
        toggle.focus();
      }
    });

    // Rotating a phone or widening the window past the breakpoint closes the drawer
    var onBreakpoint = function (event) { if (!event.matches && menuOpen) setMenu(false); };
    if (mobileQuery.addEventListener) mobileQuery.addEventListener("change", onBreakpoint);
    else if (mobileQuery.addListener) mobileQuery.addListener(onBreakpoint);
  }

  /* ==========================================================
     Eased scrolling for in-page links
     ========================================================== */

  var scrollFrame = 0;

  function stopScroll() {
    if (scrollFrame) {
      cancelAnimationFrame(scrollFrame);
      scrollFrame = 0;
    }
  }

  // If the visitor grabs the wheel, touches the screen, or presses a key, hand control back
  ["wheel", "touchstart", "keydown"].forEach(function (name) {
    window.addEventListener(name, stopScroll, { passive: true });
  });

  function smoothScrollTo(targetY) {
    stopScroll();
    var startY = window.scrollY;
    var distance = targetY - startY;
    if (Math.abs(distance) < 2) return;

    // Short hops are quick, long jumps take a little longer (capped)
    var duration = Math.min(1100, 520 + Math.abs(distance) * 0.18);
    var startTime = null;

    function ease(p) { return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; }

    function frame(ts) {
      if (startTime === null) startTime = ts;
      var p = Math.min((ts - startTime) / duration, 1);
      // "instant" so the CSS scroll-behavior: smooth does not stack on top of this
      window.scrollTo({ top: startY + distance * ease(p), behavior: "instant" });
      scrollFrame = p < 1 ? requestAnimationFrame(frame) : 0;
    }

    scrollFrame = requestAnimationFrame(frame);
  }

  if (!reduceMotion) {
    document.addEventListener("click", function (event) {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      var link = event.target.closest ? event.target.closest('a[href^="#"]') : null;
      if (!link) return;

      var hash = link.getAttribute("href");
      if (!hash || hash.length < 2) return;

      var target = document.getElementById(decodeURIComponent(hash.slice(1)));
      if (!target) return;

      event.preventDefault();

      var offset = parseFloat(window.getComputedStyle(root).scrollPaddingTop) || 0;
      var max = root.scrollHeight - window.innerHeight;
      var y = target.getBoundingClientRect().top + window.scrollY - offset;
      smoothScrollTo(Math.max(0, Math.min(max, y)));

      if (window.history && history.pushState) history.pushState(null, "", hash);

      // Move keyboard focus to the section so screen readers and Tab continue from there
      target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
    });
  }

  /* ==========================================================
     Active link, sliding indicator, progress bar, back-to-top
     ========================================================== */

  var sections = [];
  navLinks.forEach(function (link) {
    var id = link.getAttribute("href");
    if (id && id.charAt(0) === "#" && id.length > 1) {
      var section = document.querySelector(id);
      if (section) sections.push({ link: link, section: section });
    }
  });

  var currentLink = null;
  var indicatorStarted = false;

  function moveIndicator() {
    if (!indicator || !currentLink) return;
    if (window.getComputedStyle(indicator).display === "none") return; // hidden on mobile
    indicator.style.width = currentLink.offsetWidth + "px";
    indicator.style.transform = "translateX(" + currentLink.offsetLeft + "px)";
    if (!indicatorStarted) {
      indicatorStarted = true;
      indicator.classList.add("is-ready");
      // Turn transitions on after the first placement so it does not slide in from the left
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { indicator.classList.add("is-animated"); });
      });
    }
  }

  function markActive() {
    if (!sections.length) return;

    // Clicked links land a section's top about 72px from the viewport top (scroll-padding-top in
    // style.css), so a 120px threshold leaves comfortable room.
    var threshold = 120;
    var current = sections[0];

    sections.forEach(function (item) {
      if (item.section.getBoundingClientRect().top <= threshold) current = item;
    });

    // At the very bottom of the page, the final section (Contact) wins
    if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 4) {
      current = sections[sections.length - 1];
    }

    sections.forEach(function (item) {
      var active = item === current;
      item.link.classList.toggle("is-active", active);
      if (active) item.link.setAttribute("aria-current", "true");
      else item.link.removeAttribute("aria-current");
    });

    if (current.link !== currentLink) {
      currentLink = current.link;
      moveIndicator();
    }
  }

  var parallaxEls = Array.prototype.slice.call(document.querySelectorAll("[data-parallax]"));

  function parallax() {
    if (reduceMotion) return;
    parallaxEls.forEach(function (el) {
      // Measure the parent, which is not moved, so the effect cannot feed back on itself
      var rect = el.parentElement.getBoundingClientRect();
      if (rect.bottom < -100 || rect.top > window.innerHeight + 100) return;
      var offset = rect.top + rect.height / 2 - window.innerHeight / 2;
      var speed = parseFloat(el.getAttribute("data-parallax")) || 0;
      el.style.translate = "0 " + (-offset * speed).toFixed(1) + "px";
    });
  }

  var ticking = false;

  function update() {
    ticking = false;
    var y = window.scrollY;
    var max = document.documentElement.scrollHeight - window.innerHeight;

    if (progressBar) progressBar.style.transform = "scaleX(" + (max > 0 ? Math.min(y / max, 1) : 0) + ")";
    if (header) header.classList.toggle("is-scrolled", y > 8);
    if (toTop) toTop.classList.toggle("is-visible", y > 700);

    markActive();
    parallax();
  }

  function onScroll() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", function () { onScroll(); moveIndicator(); });
  window.addEventListener("load", function () { update(); moveIndicator(); });
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { moveIndicator(); });
  }
  update();

  /* ==========================================================
     Split headings, scroll reveal, count-up numbers
     ========================================================== */

  // Section headings marked data-split: each word slides up out of a mask.
  // The text stays real text, so screen readers and search engines read it normally.
  function splitWords(el) {
    var words = el.textContent.trim().split(/\s+/);
    el.textContent = "";
    words.forEach(function (word, i) {
      var outer = document.createElement("span");
      var inner = document.createElement("span");
      outer.className = "word";
      inner.style.setProperty("--i", i);
      inner.textContent = word;
      outer.appendChild(inner);
      el.appendChild(outer);
      if (i < words.length - 1) el.appendChild(document.createTextNode(" "));
    });
  }

  if (!reduceMotion) {
    document.querySelectorAll("[data-split]").forEach(splitWords);
  }

  // Children of [data-stagger] reveal one after another
  document.querySelectorAll("[data-stagger]").forEach(function (group) {
    Array.prototype.forEach.call(group.children, function (child, i) {
      child.style.setProperty("--d", i * 90 + "ms");
      if (!child.hasAttribute("data-split")) child.classList.add("reveal");
    });
  });

  function countUp(node, delay) {
    var target = parseFloat(node.getAttribute("data-count"));
    var total = node.getAttribute("data-total");
    var suffix = node.getAttribute("data-suffix") || "";
    var duration = 1100;
    var start = null;

    function format(n) {
      return Math.round(n) + (total ? " / " + total : "") + suffix;
    }

    node.textContent = format(0);

    setTimeout(function () {
      function frame(ts) {
        if (start === null) start = ts;
        var p = Math.min((ts - start) / duration, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        node.textContent = format(target * eased);
        if (p < 1) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }, delay);
  }

  function reveal(el) {
    if (el.classList.contains("is-in")) return;
    el.classList.add("is-in");
    if (reduceMotion) return;

    var delay = (parseInt(el.style.getPropertyValue("--d"), 10) || 0) + 150;

    el.querySelectorAll("[data-count]").forEach(function (node) { countUp(node, delay); });

    if (el.hasAttribute("data-confetti")) {
      setTimeout(function () { confetti(el); }, delay + 1200);
    }
  }

  var revealObserver = null;
  var revealEls = document.querySelectorAll(".reveal, [data-split]");

  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("is-in"); });
  } else {
    revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          reveal(entry.target);
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -6% 0px" });

    revealEls.forEach(function (el) { revealObserver.observe(el); });
  }

  /* ==========================================================
     Project filter
     Each card carries data-category="..."; each button carries data-filter="...".
     To add a project: copy a card, set its data-category, and (if the category is new)
     copy a filter button in index.html. Nothing here needs to change.
     ========================================================== */

  (function initFilters() {
    var bar = document.querySelector(".filters");
    var grid = document.querySelector(".project-grid");
    if (!bar || !grid) return;

    var buttons = Array.prototype.slice.call(bar.querySelectorAll("[data-filter]"));
    var items = Array.prototype.slice.call(grid.querySelectorAll("[data-category]"));
    var projects = items.filter(function (el) { return el.tagName === "ARTICLE"; });
    var status = document.getElementById("filter-status");
    var timer = 0;

    function matches(el, filter) {
      return filter === "all" || el.getAttribute("data-category") === filter;
    }

    function countFor(filter) {
      return projects.filter(function (el) { return matches(el, filter); }).length;
    }

    // Small number badges on the buttons
    buttons.forEach(function (btn) {
      var badge = btn.querySelector(".count");
      if (badge) badge.textContent = countFor(btn.getAttribute("data-filter"));
    });

    function swap(filter) {
      var enterIndex = 0;

      items.forEach(function (el) {
        el.classList.remove("is-leaving");

        if (!matches(el, filter)) {
          el.hidden = true;
          return;
        }

        if (el.hidden) {
          el.hidden = false;

          // Reveal right away so a card never stays invisible waiting for the scroll observer
          reveal(el);
          if (revealObserver) revealObserver.unobserve(el);

          if (!reduceMotion) {
            el.style.setProperty("--ed", enterIndex * 70 + "ms");
            el.classList.add("is-entering");
            enterIndex++;
            el.addEventListener("animationend", function done(e) {
              if (e.target !== el) return; // ignore animations on child elements
              el.classList.remove("is-entering");
              el.removeEventListener("animationend", done);
            });
          }
        }
      });

      if (status) {
        var n = countFor(filter);
        status.textContent = (filter === "all" ? "Showing all " : "Showing ") + n + (n === 1 ? " project" : " projects");
      }
    }

    function apply(filter) {
      buttons.forEach(function (btn) {
        var on = btn.getAttribute("data-filter") === filter;
        btn.classList.toggle("is-active", on);
        btn.setAttribute("aria-pressed", String(on));
      });

      clearTimeout(timer);

      var leaving = items.filter(function (el) { return !matches(el, filter) && !el.hidden; });

      if (reduceMotion || !leaving.length) {
        swap(filter);
        return;
      }

      // Fade the old cards out first, then swap and pop the new ones in
      leaving.forEach(function (el) { el.classList.add("is-leaving"); });
      timer = setTimeout(function () { swap(filter); }, 220);
    }

    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () { apply(btn.getAttribute("data-filter")); });
    });
  })();

  /* ==========================================================
     Confetti (perfect score)
     ========================================================== */

  var confettiRunning = false;

  function confetti(origin) {
    if (reduceMotion || confettiRunning) return;
    confettiRunning = true;

    var canvas = document.createElement("canvas");
    canvas.className = "confetti";
    document.body.appendChild(canvas);

    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = window.innerWidth;
    var h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    var ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);

    var rect = origin.getBoundingClientRect();
    var ox = rect.left + rect.width / 2;
    var oy = rect.top + rect.height / 3;
    var colors = [token("--indigo", "#8b95ff"), token("--amber", "#f4b95a"), token("--text", "#e9eef8"), token("--mint", "#6ee7b7")];
    var pieces = [];

    for (var i = 0; i < 90; i++) {
      var angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.1;
      var speed = 6 + Math.random() * 9;
      pieces.push({
        x: ox, y: oy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 5 + Math.random() * 5,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.4,
        color: colors[(Math.random() * colors.length) | 0]
      });
    }

    var startTime = performance.now();

    function frame(now) {
      var t = now - startTime;
      ctx.clearRect(0, 0, w, h);

      pieces.forEach(function (p) {
        p.vy += 0.28;
        p.vx *= 0.985;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;

        ctx.save();
        ctx.globalAlpha = t > 1500 ? Math.max(0, 1 - (t - 1500) / 700) : 1;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      });

      if (t < 2200) {
        requestAnimationFrame(frame);
      } else {
        canvas.remove();
        confettiRunning = false;
      }
    }

    requestAnimationFrame(frame);
  }

  document.querySelectorAll("[data-confetti]").forEach(function (el) {
    el.addEventListener("click", function () { confetti(el); });
  });

  /* ==========================================================
     Typing line in the hero
     ========================================================== */

  var typed = document.querySelector(".typed");

  if (typed && !reduceMotion) {
    var phrases = ["computer networking", "IT systems", "building with AI tools"];
    var phraseIndex = 0;
    var charIndex = phrases[0].length;
    var deleting = true; // start by deleting the placeholder text, then cycle

    var tick = function () {
      var phrase = phrases[phraseIndex];

      if (!deleting) {
        charIndex++;
        typed.textContent = phrase.slice(0, charIndex);
        if (charIndex === phrase.length) {
          deleting = true;
          return setTimeout(tick, 1700);
        }
        return setTimeout(tick, 70);
      }

      charIndex--;
      typed.textContent = phrase.slice(0, charIndex);
      if (charIndex === 0) {
        deleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
        return setTimeout(tick, 350);
      }
      return setTimeout(tick, 35);
    };

    setTimeout(tick, 2600); // wait for the hero entrance to finish
  }

  /* ==========================================================
     Animated network in the hero
     ========================================================== */

  (function initNetwork() {
    var hero = document.getElementById("home");
    var canvas = hero ? hero.querySelector(".network") : null;
    if (!canvas || !canvas.getContext) return;

    var ctx = canvas.getContext("2d");
    var MAX_LINK = 140;
    var MOUSE_LINK = 170;
    var w = 0, h = 0, dpr = 1;
    var nodes = [], packets = [], edges = [];
    var mouse = { x: 0, y: 0, on: false };
    var running = false, raf = 0, last = 0, spawnTimer = 0;

    // Line and node colours come from --net-rgb / --net-hot-rgb, so they change with the theme
    var netRGB = "139,149,255";
    var hotRGB = "244,185,90";

    function readColors() {
      netRGB = token("--net-rgb", netRGB).replace(/\s+/g, "");
      hotRGB = token("--net-hot-rgb", hotRGB).replace(/\s+/g, "");
    }

    readColors();

    document.addEventListener("themechange", function () {
      readColors();
      if (!running && w && h) draw(); // repaint a still frame (reduced motion, or hero off screen)
    });

    function makeNode() {
      var a = Math.random() * Math.PI * 2;
      var s = 8 + Math.random() * 16; // pixels per second
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        r: 1.8 + Math.random() * 1.6,
        hub: Math.random() < 0.12
      };
    }

    function resize() {
      var rect = hero.getBoundingClientRect();
      w = Math.round(rect.width);
      h = Math.round(rect.height);
      if (!w || !h) return;

      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      var count = Math.max(16, Math.min(64, Math.round((w * h) / 17000)));
      while (nodes.length < count) nodes.push(makeNode());
      nodes.length = count;
      nodes.forEach(function (n) {
        if (n.x > w) n.x = Math.random() * w;
        if (n.y > h) n.y = Math.random() * h;
      });

      if (reduceMotion || !running) draw();
    }

    function step(dt) {
      var i, n;

      for (i = 0; i < nodes.length; i++) {
        n = nodes[i];
        n.x += n.vx * dt;
        n.y += n.vy * dt;

        if (n.x < 0) { n.x = 0; n.vx = Math.abs(n.vx); }
        else if (n.x > w) { n.x = w; n.vx = -Math.abs(n.vx); }
        if (n.y < 0) { n.y = 0; n.vy = Math.abs(n.vy); }
        else if (n.y > h) { n.y = h; n.vy = -Math.abs(n.vy); }

        // Nodes near the cursor are nudged away
        if (mouse.on) {
          var dx = n.x - mouse.x, dy = n.y - mouse.y;
          var d2 = dx * dx + dy * dy;
          if (d2 < 22500 && d2 > 1) {
            var d = Math.sqrt(d2);
            var push = (1 - d / 150) * 60 * dt;
            n.x += (dx / d) * push;
            n.y += (dy / d) * push;
          }
        }
      }

      // Send a data packet along a random link now and then
      spawnTimer += dt;
      if (spawnTimer > 0.7 && edges.length && packets.length < 14) {
        spawnTimer = 0;
        var e = edges[(Math.random() * edges.length) | 0];
        packets.push({ a: e[0], b: e[1], t: 0, speed: 0.6 + Math.random() * 0.6 });
      }

      for (i = packets.length - 1; i >= 0; i--) {
        packets[i].t += packets[i].speed * dt;
        if (packets[i].t >= 1) packets.splice(i, 1);
      }
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      edges.length = 0;
      ctx.lineWidth = 1;

      var i, j, n, m, dx, dy, d2, a;

      for (i = 0; i < nodes.length; i++) {
        n = nodes[i];
        for (j = i + 1; j < nodes.length; j++) {
          m = nodes[j];
          dx = n.x - m.x;
          dy = n.y - m.y;
          d2 = dx * dx + dy * dy;
          if (d2 < MAX_LINK * MAX_LINK) {
            a = (1 - Math.sqrt(d2) / MAX_LINK) * 0.32;
            ctx.strokeStyle = "rgba(" + netRGB + "," + a.toFixed(3) + ")";
            ctx.beginPath();
            ctx.moveTo(n.x, n.y);
            ctx.lineTo(m.x, m.y);
            ctx.stroke();
            edges.push([i, j]);
          }
        }
      }

      // The cursor acts as a node of its own
      if (mouse.on) {
        for (i = 0; i < nodes.length; i++) {
          n = nodes[i];
          dx = n.x - mouse.x;
          dy = n.y - mouse.y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < MOUSE_LINK) {
            a = (1 - dist / MOUSE_LINK) * 0.6;
            ctx.strokeStyle = "rgba(" + hotRGB + "," + a.toFixed(3) + ")";
            ctx.beginPath();
            ctx.moveTo(mouse.x, mouse.y);
            ctx.lineTo(n.x, n.y);
            ctx.stroke();
          }
        }
        ctx.fillStyle = "rgba(" + hotRGB + ",0.95)";
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(" + hotRGB + ",0.35)";
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 9, 0, Math.PI * 2);
        ctx.stroke();
      }

      for (i = 0; i < nodes.length; i++) {
        n = nodes[i];
        ctx.fillStyle = n.hub ? "rgba(" + hotRGB + ",0.9)" : "rgba(" + netRGB + ",0.75)";
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.hub ? n.r + 1.5 : n.r, 0, Math.PI * 2);
        ctx.fill();
      }

      for (i = 0; i < packets.length; i++) {
        var p = packets[i];
        var from = nodes[p.a], to = nodes[p.b];
        if (!from || !to) continue;
        var x = from.x + (to.x - from.x) * p.t;
        var y = from.y + (to.y - from.y) * p.t;
        ctx.fillStyle = "rgba(" + hotRGB + ",0.2)";
        ctx.beginPath();
        ctx.arc(x, y, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(" + hotRGB + ",1)";
        ctx.beginPath();
        ctx.arc(x, y, 2.6, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function loop(ts) {
      if (!running) return;
      if (!last) last = ts;
      var dt = Math.min((ts - last) / 1000, 0.05);
      last = ts;
      step(dt);
      draw();
      raf = requestAnimationFrame(loop);
    }

    function start() {
      if (running || reduceMotion) return;
      running = true;
      last = 0;
      raf = requestAnimationFrame(loop);
    }

    function stop() {
      running = false;
      cancelAnimationFrame(raf);
    }

    resize();

    if ("ResizeObserver" in window) {
      new ResizeObserver(resize).observe(hero);
    } else {
      window.addEventListener("resize", resize);
    }

    if (reduceMotion) return; // one still frame is already drawn

    var heroVisible = true;

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        heroVisible = entries[0].isIntersecting;
        if (heroVisible && !document.hidden) start(); else stop();
      }).observe(hero);
    }

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stop(); else if (heroVisible) start();
    });

    hero.addEventListener("pointermove", function (e) {
      var rect = hero.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.on = true;
    });
    hero.addEventListener("pointerleave", function () { mouse.on = false; });

    start();
  })();

  /* ==========================================================
     Hero photo tilt (mouse only)
     ========================================================== */

  var heroSection = document.getElementById("home");
  var heroPhoto = heroSection ? heroSection.querySelector(".hero-photo") : null;
  var tilt = heroPhoto ? heroPhoto.querySelector(".tilt") : null;

  if (tilt && finePointer && !reduceMotion) {
    heroSection.addEventListener("pointermove", function (e) {
      if (e.pointerType !== "mouse") return;
      var rect = heroPhoto.getBoundingClientRect();
      var nx = (e.clientX - (rect.left + rect.width / 2)) / (window.innerWidth / 2);
      var ny = (e.clientY - (rect.top + rect.height / 2)) / (window.innerHeight / 2);
      nx = Math.max(-1, Math.min(1, nx));
      ny = Math.max(-1, Math.min(1, ny));
      tilt.style.setProperty("--ry", (nx * 10).toFixed(2) + "deg");
      tilt.style.setProperty("--rx", (-ny * 8).toFixed(2) + "deg");
    });

    heroSection.addEventListener("pointerleave", function () {
      tilt.style.setProperty("--ry", "0deg");
      tilt.style.setProperty("--rx", "0deg");
    });
  }

  /* ==========================================================
     Cursor spotlight on cards, magnetic buttons, click ripple
     ========================================================== */

  document.querySelectorAll(".spot").forEach(function (el) {
    el.addEventListener("pointermove", function (e) {
      var rect = el.getBoundingClientRect();
      el.style.setProperty("--mx", e.clientX - rect.left + "px");
      el.style.setProperty("--my", e.clientY - rect.top + "px");
    });
  });

  if (finePointer && !reduceMotion) {
    document.querySelectorAll(".btn").forEach(function (btn) {
      btn.addEventListener("pointermove", function (e) {
        if (e.pointerType !== "mouse") return;
        var rect = btn.getBoundingClientRect();
        var x = e.clientX - (rect.left + rect.width / 2);
        var y = e.clientY - (rect.top + rect.height / 2);
        btn.style.setProperty("--tx", (x * 0.2).toFixed(1) + "px");
        btn.style.setProperty("--ty", (y * 0.3).toFixed(1) + "px");
      });
      btn.addEventListener("pointerleave", function () {
        btn.style.setProperty("--tx", "0px");
        btn.style.setProperty("--ty", "0px");
      });
    });
  }

  if (!reduceMotion) {
    document.querySelectorAll(".btn").forEach(function (btn) {
      btn.addEventListener("pointerdown", function (e) {
        var rect = btn.getBoundingClientRect();
        var size = Math.max(rect.width, rect.height) * 2;
        var wave = document.createElement("span");
        wave.className = "ripple";
        wave.style.width = wave.style.height = size + "px";
        wave.style.left = e.clientX - rect.left - size / 2 + "px";
        wave.style.top = e.clientY - rect.top - size / 2 + "px";
        btn.appendChild(wave);
        wave.addEventListener("animationend", function () { wave.remove(); });
      });
    });
  }

  /* ==========================================================
     Copy email button
     ========================================================== */

  var copyBtn = document.querySelector("[data-copy]");
  var copyStatus = document.getElementById("copy-status");

  function copyFallback(text) {
    var area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    var ok = false;
    try { ok = document.execCommand("copy"); } catch (err) { ok = false; }
    area.remove();
    return ok;
  }

  // If copying is blocked, highlight the visible address so Ctrl+C really works
  function selectAddress() {
    var address = document.querySelector(".contact-address");
    var selection = window.getSelection ? window.getSelection() : null;
    if (!address || !selection) return;
    var range = document.createRange();
    range.selectNodeContents(address);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  if (copyBtn) {
    var copyLabelEl = copyBtn.querySelector(".btn-label") || copyBtn;
    var copyLabel = copyLabelEl.textContent;
    var copyTimer = 0;

    copyBtn.addEventListener("click", function () {
      var text = copyBtn.getAttribute("data-copy");

      function done(ok) {
        copyLabelEl.textContent = ok ? "Copied!" : "Press Ctrl+C to copy";
        copyBtn.classList.toggle("is-done", ok);
        if (copyStatus) copyStatus.textContent = ok ? "Email address copied to clipboard." : "Copy failed.";
        if (!ok) selectAddress();
        clearTimeout(copyTimer);
        copyTimer = setTimeout(function () {
          copyLabelEl.textContent = copyLabel;
          copyBtn.classList.remove("is-done");
        }, 1800);
      }

      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(copyFallback(text)); });
      } else {
        done(copyFallback(text));
      }
    });
  }

  /* ==========================================================
     Footer year
     ========================================================== */

  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
})();
