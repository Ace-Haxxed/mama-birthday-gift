// GET    /api/photos          → public list of uploaded gallery photos
// DELETE /api/photos?url=...   → remove one (requires x-admin-password)
//
// Storage is Vercel Blob. Needs a Blob store linked to the project
// (provides BLOB_READ_WRITE_TOKEN) and an ADMIN_PASSWORD env var.
const { list, del } = require("@vercel/blob");

const PREFIX = "gallery/";

module.exports = async (req, res) => {
  if (req.method === "GET") {
    try {
      const { blobs } = await list({ prefix: PREFIX });
      const photos = blobs
        .sort((a, b) => new Date(a.uploadedAt) - new Date(b.uploadedAt))
        .map((b) => ({
          // Private store: b.url needs auth, so serve through the image proxy.
          url: "/api/image?path=" + encodeURIComponent(b.pathname),
          pathname: b.pathname,
          uploadedAt: b.uploadedAt,
        }));
      res.setHeader("Cache-Control", "no-store");
      return res.status(200).json({ photos });
    } catch (err) {
      // If the store isn't configured yet, don't break the gallery — return empty.
      return res.status(200).json({ photos: [], error: String((err && err.message) || err) });
    }
  }

  if (req.method === "DELETE") {
    if (!authorized(req)) return res.status(401).json({ error: "unauthorized" });
    // Accepts a blob pathname (preferred) or a full blob URL — del() takes either.
    const target = req.query && (req.query.path || req.query.url);
    if (!target) return res.status(400).json({ error: "missing path" });
    try {
      await del(target);
      return res.status(200).json({ ok: true });
    } catch (err) {
      return res.status(500).json({ error: String((err && err.message) || err) });
    }
  }

  res.setHeader("Allow", "GET, DELETE");
  return res.status(405).json({ error: "method not allowed" });
};

function authorized(req) {
  const pw = req.headers["x-admin-password"];
  return Boolean(pw && process.env.ADMIN_PASSWORD && pw === process.env.ADMIN_PASSWORD);
}
