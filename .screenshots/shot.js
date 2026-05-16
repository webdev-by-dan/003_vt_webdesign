const puppeteer = require('puppeteer-core');
const path = require('path');

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const ROOT = path.resolve(__dirname, '..');
const fileUrl = (p) => 'file:///' + path.join(ROOT, p).replace(/\\/g, '/');

const PAGES = ['index.html', 'portfolio.html', 'contact.html'];
const VIEWPORTS = [
  { name: 'mobile',  width: 390,  height: 844,  dpr: 2 },
  { name: 'tablet',  width: 768,  height: 1024, dpr: 2 },
  { name: 'desktop', width: 1440, height: 900,  dpr: 1 },
];

(async () => {
  const tag = process.argv[2] || 'final';
  const browser = await puppeteer.launch({
    executablePath: EDGE,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu'],
  });

  for (const pageFile of PAGES) {
    const pname = pageFile.replace(/\.html$/, '');
    for (const vp of VIEWPORTS) {
      const page = await browser.newPage();
      await page.setViewport({
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: vp.dpr,
        isMobile: vp.name === 'mobile',
        hasTouch: vp.name !== 'desktop',
      });
      await page.goto(fileUrl(pageFile), { waitUntil: 'networkidle2', timeout: 30000 });

      // Disable ScrollReveal's hide-until-scrolled rule so full-page screenshots
      // show every section, not just whatever scrolled into view.
      await page.addStyleTag({
        content: '.is-revealing { visibility: visible !important; opacity: 1 !important; transform: none !important; }'
      });

      // Scroll through the page to trigger ScrollReveal anyway (belt + suspenders).
      await page.evaluate(async () => {
        const h = document.body.scrollHeight;
        for (let y = 0; y < h; y += 400) {
          window.scrollTo(0, y);
          await new Promise(r => setTimeout(r, 60));
        }
        window.scrollTo(0, 0);
      });
      await new Promise(r => setTimeout(r, 600));

      const out = path.join(__dirname, `${tag}-${pname}-${vp.name}.png`);
      await page.screenshot({ path: out, fullPage: true });
      console.log('OK', `${tag}-${pname}-${vp.name}`);
      await page.close();
    }
  }
  await browser.close();
})();
