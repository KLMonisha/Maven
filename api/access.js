// Vercel Serverless Function — checks Whop membership by email
// WHOP_API_KEY and WHOP_PRODUCT_ID stay server-side only

const WHOP_API_BASE = "https://api.whop.com/api/v5";

const ALLOWED_ORIGINS = [
  "https://maven-app-blue.vercel.app",
  "http://localhost:5173",
];

function getCorsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export default async function handler(req, res) {
  const origin = req.headers.origin || "";
  const cors = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    res.writeHead(204, cors);
    res.end();
    return;
  }

  if (req.method !== "POST") {
    res.writeHead(405, { ...cors, "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }

  const apiKey = process.env.WHOP_API_KEY;
  const productId = process.env.WHOP_PRODUCT_ID;

  if (!apiKey || !productId) {
    res.writeHead(500, { ...cors, "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Whop credentials not configured" }));
    return;
  }

  try {
    const { email } = req.body;

    if (!email || typeof email !== "string") {
      res.writeHead(400, { ...cors, "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Email is required" }));
      return;
    }

    // First, look up memberships for this product, filtered by email
    const membershipsUrl = `${WHOP_API_BASE}/memberships?product_id=${productId}&email=${encodeURIComponent(email)}&valid=true`;

    const whopRes = await fetch(membershipsUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!whopRes.ok) {
      const errText = await whopRes.text();
      console.error("Whop API error:", whopRes.status, errText);

      // If the API returns an error, treat as no access rather than crashing
      res.writeHead(200, { ...cors, "Content-Type": "application/json" });
      res.end(JSON.stringify({ has_access: false }));
      return;
    }

    const data = await whopRes.json();

    // Check if any valid membership exists
    const hasAccess =
      Array.isArray(data.data) &&
      data.data.length > 0 &&
      data.data.some(
        (m) => m.status === "active" || m.status === "trialing" || m.valid === true
      );

    res.writeHead(200, { ...cors, "Content-Type": "application/json" });
    res.end(JSON.stringify({ has_access: hasAccess }));
  } catch (err) {
    console.error("Access check error:", err);
    res.writeHead(500, { ...cors, "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Internal server error" }));
  }
}
