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
  const port = 9339;
  const profileDir = '/Users/B0322527/.gemini/antigravity/scratch/chrome_verify_interactions';
  
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

    // 1. Capture initial stage with Pandit selected: toolbar and bounding box
    console.log("1. Verifying toolbar with Flip fully visible...");
    const shot1 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('/Users/B0322527/.gemini/antigravity/brain/bc031004-0250-4cd0-b604-9c7e24e94a22/final_verified_toolbar.png', Buffer.from(shot1.data, 'base64'));
    console.log("Saved final_verified_toolbar.png");

    // 2. Click "Flip" button in toolbar
    console.log("2. Clicking 'Flip' button...");
    const clickFlip = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const btns = Array.from(document.querySelectorAll('button'));
          const flipBtn = btns.find(b => b.textContent.trim().startsWith('Flip') && b.title === 'Flip Horizontally');
          if (flipBtn) {
            flipBtn.click();
            return 'Clicked Flip button';
          }
          return 'Flip button not found';
        })()
      `,
      returnByValue: true
    });
    console.log(clickFlip?.result?.value);
    await wait(1000);

    const shot2 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('/Users/B0322527/.gemini/antigravity/brain/bc031004-0250-4cd0-b604-9c7e24e94a22/final_verified_flipped.png', Buffer.from(shot2.data, 'base64'));
    console.log("Saved final_verified_flipped.png");

    // 3. Click "Props" -> Open Props Drawer -> Click Right Hand -> Select Trishul
    console.log("3. Opening Props drawer & attaching Trishul to Right Hand...");
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const btns = Array.from(document.querySelectorAll('button'));
          const propsBtn = btns.find(b => b.textContent.includes('Props') && b.title === 'Add Props & Accessories');
          if (propsBtn) propsBtn.click();
        })()
      `
    });
    await wait(1000);

    // Click Right Hand slot
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const cards = Array.from(document.querySelectorAll('div, button'));
          const rhCard = cards.find(el => el.textContent.includes('Right Hand') && el.className.includes('cursor-pointer'));
          if (rhCard) rhCard.click();
        })()
      `
    });
    await wait(1000);

    // Select Trishul
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const propCards = Array.from(document.querySelectorAll('div'));
          const trishulCard = propCards.find(el => el.textContent.includes('Trishul') && el.className.includes('cursor-pointer'));
          if (trishulCard) trishulCard.click();
        })()
      `
    });
    await wait(1500);

    const shot3 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('/Users/B0322527/.gemini/antigravity/brain/bc031004-0250-4cd0-b604-9c7e24e94a22/final_verified_props_trishul.png', Buffer.from(shot3.data, 'base64'));
    console.log("Saved final_verified_props_trishul.png");

  } catch (err) {
    console.error("CDP Test error:", err);
  } finally {
    chrome.kill();
  }
}

main();
