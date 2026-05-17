// Fetches the shared site nav, mounts it into <div id="site-nav-mount">,
// and wires up the mobile toggle (open/close, link click, outside click, Escape).

(function () {
  const mount = document.getElementById('site-nav-mount');
  if (!mount) return;

  fetch('partials/nav.html')
    .then((r) => r.text())
    .then((html) => {
      mount.outerHTML = html;
      initNavToggle();
    });

  function initNavToggle() {
    const btn = document.querySelector('.nav-toggle');
    const nav = document.querySelector('#site-nav');
    if (!btn || !nav) return;

    const setOpen = (open) => {
      document.body.classList.toggle('is-nav-open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    };

    btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') === 'true';
      setOpen(!open);
    });

    nav.addEventListener('click', (e) => {
      if (e.target.closest('a')) setOpen(false);
    });

    document.addEventListener('click', (e) => {
      if (!nav.contains(e.target)) setOpen(false);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') setOpen(false);
    });
  }
})();
