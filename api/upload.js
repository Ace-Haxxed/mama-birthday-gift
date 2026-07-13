// POST /api/upload   body: { dataBase64, type }   (requires x-admin-password)
// Uploads a (client-side downscaled) image to Vercel Blob under gallery/.
const { put } = require("@vercel/blob");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "method not allowed" });
  }

  if (!process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: "ADMIN_PASSWORD is not set on the server — add it in Vercel → Settings → Environment Variables, then redeploy" });
  }

  const pw = req.headers["x-admin-password"];
  if (!pw || pw !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: "wrong password" });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return res.status(500).json({ error: "no Blob store connected — Vercel → Storage → create a Blob store and connect it to this project, then redeploy" });
  }

  let body = req.body;
  if (!body || typeof body === "string") body = await readJson(req);
  if (!body || !body.dataBase64) return res.status(400).json({ error: "missing image" });

  const buf = Buffer.from(body.dataBase64, "base64");
  if (!buf.length) return res.status(400).json({ error: "empty image" });
  if (buf.length > 6 * 1024 * 1024) return res.status(413).json({ error: "image too large" });

  const type = typeof body.type === "string" ? body.type : "image/jpeg";
  const ext = type.includes("png") ? "png" : "jpg";
  const name = `gallery/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  try {
    const blob = await put(name, buf, { access: "public", contentType: type });
    return res.status(200).json({ ok: true, url: blob.url });
  } catch (err) {
    return res.status(500).json({ error: String((err && err.message) || err) });
  }
};

function readJson(req) {
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (c) => (data += c));
    req.on("end", () => { try { resolve(JSON.parse(data)); } catch { resolve(null); } });
    req.on("error", () => resolve(null));
  });
}
