const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const SHOTS_DIR = path.join(__dirname, 'screenshots');
if (!fs.existsSync(SHOTS_DIR)) fs.mkdirSync(SHOTS_DIR);

const PAGES = [
  'index.html',
  'portfolio.html',
  'contact.html',
  'project-femc-dashboards.html',
  'project-atlas.html',
  'project-femc-digitization.html',
  'project-rosica.html',
];

const VIEWPORTS = [
  { name: 'mobile',  width: 390, height: 844 },
  { name: 'tablet',  width: 820, height: 1180 },
  { name: 'desktop', width: 1440, height: 900 },
];

(async () => {
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });

  for (const file of PAGES) {
    const fileUrl = 'file:///' + path.join(__dirname, file).replace(/\\/g, '/');
    for (const vp of VIEWPORTS) {
      const page = await browser.newPage();
      await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: 1 });
      await page.goto(fileUrl, { waitUntil: 'networkidle0' });

      // Force all ScrollReveal "is-revealing" elements to be visible
      await page.addStyleTag({
        content: `
          .sr .has-animations .is-revealing,
          .is-revealing {
            visibility: visible !important;
            opacity: 1 !important;
            transform: none !important;
          }
        `,
      });

      // Make all images eager so lazy-loaded ones render before screenshot
      await page.evaluate(() => {
        document.querySelectorAll('img').forEach(img => {
          img.loading = 'eager';
          img.decoding = 'sync';
        });
      });

      // Scroll through the page to trigger any remaining lazy loads
      await page.evaluate(async () => {
        await new Promise((resolve) => {
          let y = 0;
          const step = 400;
          const timer = setInterval(() => {
            window.scrollTo(0, y);
            y += step;
            if (y >= document.body.scrollHeight) {
              clearInterval(timer);
              window.scrollTo(0, 0);
              resolve();
            }
          }, 80);
        });
      });

      // Wait for any newly-triggered image loads to complete
      await page.evaluate(async () => {
        const imgs = Array.from(document.images).filter(img => !img.complete);
        await Promise.all(imgs.map(img => new Promise((resolve) => {
          img.onload = img.onerror = resolve;
        })));
      });

      // Small wait for fonts/animations to settle
      await new Promise(r => setTimeout(r, 1000));

      const name = `${file.replace('.html','')}_${vp.name}.png`;
      await page.screenshot({
        path: path.join(SHOTS_DIR, name),
        fullPage: true,
      });
      console.log('Saved', name);
      await page.close();
    }
  }

  await browser.close();
})().catch(err => { console.error(err); process.exit(1); });
