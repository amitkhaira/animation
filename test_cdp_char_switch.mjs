import { spawn } from 'child_process';
import fs from 'fs';

async function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function getWsUrl(port) {
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      const data = await res.json();
      if (data.webSocketDebuggerUrl) return data.webSocketDebuggerUrl;
    } catch (e) {}
    await wait(300);
  }
  throw new Error("Could not connect to Chrome debugging port");
}

async function run() {
  const port = 9334;
  const userDataDir = '/Users/B0322527/.gemini/antigravity/scratch/cdp_test_profile2';
  
  const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
    '--headless=new',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-background-networking',
    '--disable-sync',
    '--disable-gpu',
    '--disable-dev-shm-usage',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userDataDir}`,
    'http://localhost:5173/'
  ]);

  try {
    const wsUrl = await getWsUrl(port);
    console.log("Connected to Chrome:", wsUrl);

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

    // Capture console errors
    ws.addEventListener('message', (event) => {
      const msg = JSON.parse(event.data);
      if (msg.method === 'Runtime.consoleAPICalled') {
        const type = msg.params.type;
        const text = msg.params.args.map(a => a.value || JSON.stringify(a)).join(' ');
        if (type === 'error' || type === 'warning') {
          console.log(`[Browser ${type.toUpperCase()}]:`, text);
        }
      }
      if (msg.method === 'Runtime.exceptionThrown') {
        console.error(`[Browser EXCEPTION]:`, msg.params.exceptionDetails?.exception?.description || msg.params.exceptionDetails?.text);
      }
    });

    await send('Runtime.enable');
    await send('Page.enable');

    console.log("Waiting for page load...");
    await wait(3000);

    // Click back button in drawer
    console.log("Clicking Back button in character drawer...");
    const clickBackResult = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const btn = document.querySelector('button[title="Back to Characters"]');
          if (btn) {
            btn.click();
            return 'Clicked back button';
          }
          return 'Back button not found';
        })()
      `,
      returnByValue: true
    });
    console.log("Back button action:", clickBackResult?.result?.value);

    await wait(2000);

    // Select a different character (card index 1 or 2)
    console.log("Selecting a different character from catalog...");
    const clickCharResult = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const cards = document.querySelectorAll('.group');
          let selected = 'None';
          for (let i = 0; i < cards.length; i++) {
            const text = cards[i].textContent || '';
            if (!text.toLowerCase().includes('pandit') && cards[i].querySelector('button')) {
              cards[i].click();
              selected = text.slice(0, 30);
              break;
            }
          }
          return 'Clicked character: ' + selected;
        })()
      `,
      returnByValue: true
    });
    console.log("Select character action:", clickCharResult?.result?.value);

    await wait(3000);

    // Capture screenshot after character switch
    const shotData = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('/Users/B0322527/.gemini/antigravity/brain/bc031004-0250-4cd0-b604-9c7e24e94a22/character_switch_verified.png', Buffer.from(shotData.data, 'base64'));
    console.log("Screenshot saved to character_switch_verified.png");

    // Check health
    const checkHealth = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const root = document.getElementById('root');
          return {
            hasContent: (root && root.children.length > 0),
            htmlLength: root ? root.innerHTML.length : 0,
            hasRedError: !!document.querySelector('.bg-red-950')
          };
        })()
      `,
      returnByValue: true
    });
    console.log("Health check result:", checkHealth?.result?.value);

    ws.close();
  } finally {
    chrome.kill('SIGKILL');
  }
}

run().catch(console.error);
