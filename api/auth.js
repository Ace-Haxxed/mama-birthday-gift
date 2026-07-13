// POST /api/auth   header: x-admin-password   → { ok: true } or 401
// Lets the admin page verify a password before showing anything.
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

  return res.status(200).json({ ok: true });
};
