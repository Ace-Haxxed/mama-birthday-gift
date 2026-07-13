// GET /api/image?path=gallery/...  → streams one photo from the private Blob store.
// The store is private, so images can't be linked directly; this proxies them
// publicly (viewing photos is intended to be public — only changes need auth).
const { get } = require("@vercel/blob");
const { Readable } = require("stream");

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "method not allowed" });
  }

  const path = req.query && req.query.path;
  if (!path || !path.startsWith("gallery/") || path.includes("..")) {
    return res.status(400).json({ error: "bad path" });
  }

  try {
    const result = await get(path, { access: "private" });
    if (!result || !result.stream) return res.status(404).json({ error: "not found" });
    res.setHeader("Content-Type", result.blob.contentType || "image/jpeg");
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    Readable.fromWeb(result.stream).pipe(res);
  } catch (err) {
    return res.status(500).json({ error: String((err && err.message) || err) });
  }
};
