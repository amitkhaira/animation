import { spawn } from 'child_process';
import fs from 'fs';

async function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function getWsUrl(port) {
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/list`);
      const list = await res.json();
      const page = list.find(p => p.type === 'page' && p.webSocketDebuggerUrl);
      if (page) return page.webSocketDebuggerUrl;
    } catch (e) {}
    await wait(300);
  }
  throw new Error("Could not connect to Chrome debugging port");
}

async function main() {
  const port = 9338;
  const profileDir = '/Users/B0322527/.gemini/antigravity/scratch/chrome_verify_props';
  
  const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
    '--headless=new',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    '--disable-dev-shm-usage',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profileDir}`,
    '--window-size=1440,900',
    'http://localhost:5173/'
  ]);

  try {
    const wsUrl = await getWsUrl(port);
    console.log("Connected to Chrome via CDP:", wsUrl);

    const ws = new WebSocket(wsUrl);
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    let id = 1;
    function send(method, params = {}) {
      return new Promise((resolve) => {
        const curId = id++;
        const onMsg = (event) => {
          const msg = JSON.parse(event.data);
          if (msg.id === curId) {
            ws.removeEventListener('message', onMsg);
            resolve(msg.result);
          }
        };
        ws.addEventListener('message', onMsg);
        ws.send(JSON.stringify({ id: curId, method, params }));
      });
    }

    await send('Runtime.enable');
    await send('Page.enable');

    console.log("Waiting for app to load...");
    await wait(3500);

    // 1. Capture stage with Pandit selected: toolbar and bounding box should be visible
    console.log("1. Verifying floating context toolbar & bounding box...");
    const shot1 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('/Users/B0322527/.gemini/antigravity/brain/bc031004-0250-4cd0-b604-9c7e24e94a22/verify_toolbar_and_box.png', Buffer.from(shot1.data, 'base64'));
    console.log("Saved verify_toolbar_and_box.png");

    // 2. Click "Props" button in the context toolbar
    console.log("2. Clicking 'Props' button in floating context toolbar...");
    const clickPropsRes = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const btns = Array.from(document.querySelectorAll('button'));
          const propsBtn = btns.find(b => b.textContent.includes('Props') && !b.textContent.includes('Props 21'));
          if (propsBtn) {
            propsBtn.click();
            return 'Clicked Props button in toolbar';
          }
          return 'Props button not found';
        })()
      `,
      returnByValue: true
    });
    console.log(clickPropsRes?.result?.value);
    await wait(1500);

    // 3. Capture screenshot of the Props Slots drawer
    console.log("3. Capturing Props Slots drawer screenshot...");
    const shot2 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('/Users/B0322527/.gemini/antigravity/brain/bc031004-0250-4cd0-b604-9c7e24e94a22/verify_props_slots_drawer.png', Buffer.from(shot2.data, 'base64'));
    console.log("Saved verify_props_slots_drawer.png");

    // 4. Click "Left Hand" slot card in the Props drawer
    console.log("4. Clicking 'Left Hand' slot card...");
    const clickLeftHandRes = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const slotCards = Array.from(document.querySelectorAll('.space-y-2 > div'));
          const leftHandCard = slotCards.find(c => c.textContent.includes('Left Hand'));
          if (leftHandCard) {
            leftHandCard.click();
            return 'Clicked Left Hand slot card';
          }
          return 'Left Hand slot card not found';
        })()
      `,
      returnByValue: true
    });
    console.log(clickLeftHandRes?.result?.value);
    await wait(1500);

    // 5. Capture screenshot of the Prop Catalog grid (Lantern, Mashaal, etc.)
    console.log("5. Capturing Prop Catalog grid screenshot...");
    const shot3 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('/Users/B0322527/.gemini/antigravity/brain/bc031004-0250-4cd0-b604-9c7e24e94a22/verify_prop_catalog_grid.png', Buffer.from(shot3.data, 'base64'));
    console.log("Saved verify_prop_catalog_grid.png");

    // 6. Click on Mashaal Animated or Lantern to attach to Left Hand
    console.log("6. Clicking on prop to attach...");
    const clickAttachRes = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const propCards = Array.from(document.querySelectorAll('.grid > div'));
          const mashaalCard = propCards.find(c => c.textContent.includes('Mashaal') || c.textContent.includes('Lantern'));
          if (mashaalCard) {
            mashaalCard.click();
            return 'Clicked prop card: ' + mashaalCard.textContent.trim();
          }
          return 'Prop card not found';
        })()
      `,
      returnByValue: true
    });
    console.log(clickAttachRes?.result?.value);
    await wait(2000);

    // 7. Capture screenshot showing attached prop on character
    console.log("7. Capturing canvas with attached prop...");
    const shot4 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('/Users/B0322527/.gemini/antigravity/brain/bc031004-0250-4cd0-b604-9c7e24e94a22/verify_attached_prop_canvas.png', Buffer.from(shot4.data, 'base64'));
    console.log("Saved verify_attached_prop_canvas.png");

    ws.close();
  } finally {
    chrome.kill('SIGKILL');
  }
}

main().catch(console.error);
