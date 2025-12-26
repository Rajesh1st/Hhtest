import fetch from "node-fetch";
import { JSDOM } from "jsdom";

export default async function handler(req, res) {
  try {
    const target = req.query.url;
    if (!target) {
      return res.status(400).json({ error: "Missing url param" });
    }

    // 1️⃣ Fetch target page
    const pageRes = await fetch(target, {
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });
    const html = await pageRes.text();

    // 2️⃣ Extract obfuscated JS (example)
    const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
    if (!scriptMatch) {
      return res.status(500).json({ error: "JS not found" });
    }

    const obfuscatedJS = scriptMatch[1];

    // 3️⃣ Fake browser environment
    const dom = new JSDOM(``, {
      runScripts: "dangerously",
      resources: "usable",
      url: target
    });

    const { window } = dom;
    window.atob = str => Buffer.from(str, "base64").toString("binary");

    // 4️⃣ Execute obfuscated JS
    window.eval(obfuscatedJS);

    // 5️⃣ Result (example: redirect)
    const finalUrl = window.location.href;

    return res.json({
      success: true,
      final: finalUrl
    });

  } catch (err) {
    return res.status(500).json({
      error: err.message
    });
  }
}
