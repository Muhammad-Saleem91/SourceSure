import http from "http";

const routes = [
  "/",
  "/cases",
  "/cases/new",
  "/cases/00000000-0000-0000-0000-000000000001",
  "/cases/00000000-0000-0000-0000-000000000001/requirements",
  "/cases/00000000-0000-0000-0000-000000000001/documents",
  "/cases/00000000-0000-0000-0000-000000000001/eligibility",
  "/cases/00000000-0000-0000-0000-000000000001/ranking",
  "/cases/00000000-0000-0000-0000-000000000001/sensitivity",
  "/cases/00000000-0000-0000-0000-000000000001/decision",
];

async function testRoute(path) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:3000${path}`, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        const isOk = res.statusCode === 200;
        const hasTitle = body.includes("SourceSure") || body.includes("Aluminum Motor Housing") || body.includes("Requirements") || body.includes("Eligibility");
        resolve({ path, statusCode: res.statusCode, isOk, hasTitle, size: body.length });
      });
    });
    req.on("error", (err) => resolve({ path, statusCode: 500, isOk: false, error: err.message }));
  });
}

async function runUITests() {
  console.log("==================================================");
  console.log(" 🧪 SOURCE SURE FRONTEND AUTOMATED UI ROUTE TESTS");
  console.log("==================================================");

  let passed = 0;
  let failed = 0;

  for (const route of routes) {
    const result = await testRoute(route);
    if (result.isOk) {
      console.log(` ✅ PASS [200 OK]  ${route.padEnd(55)} (${(result.size / 1024).toFixed(1)} KB)`);
      passed++;
    } else {
      console.log(` ❌ FAIL [${result.statusCode}] ${route} - ${result.error || "Bad status"}`);
      failed++;
    }
  }

  console.log("--------------------------------------------------");
  console.log(` RESULTS: ${passed} Passed, ${failed} Failed out of ${routes.length} total UI routes.`);
  console.log("==================================================");
  if (failed > 0) process.exit(1);
}

runUITests();
