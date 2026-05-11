import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function capture() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  const targets = [
    { url: 'http://localhost:5173/bustracker', name: 'bustracker_screenshot.png' },
    { url: 'http://localhost:5173/office', name: 'office_screenshot.png' },
    { url: 'http://localhost:5173/page/internet', name: 'internet_screenshot.png' },
    { url: 'https://quizzy-online.web.app', name: 'quizzy_screenshot.png' }
  ];

  for (const t of targets) {
    try {
      console.log(`Navigating to ${t.url}...`);
      await page.goto(t.url, { waitUntil: 'networkidle2', timeout: 30000 });
      // Small delay to ensure animations finish
      await new Promise(r => setTimeout(r, 2000));
      
      const outPath = path.join(__dirname, 'public', t.name);
      await page.screenshot({ path: outPath });
      console.log(`Saved screenshot to ${outPath}`);
    } catch (e) {
      console.error(`Failed to capture ${t.url}: ${e.message}`);
    }
  }

  await browser.close();
}

capture();
