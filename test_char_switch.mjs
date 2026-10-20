import http from 'http';

// Helper to send CDP command over WebSocket
async function main() {
  console.log("Checking Dev Server on 5173...");
  const res = await fetch("http://localhost:5173/");
  console.log("Server status:", res.status);
}

main().catch(console.error);
