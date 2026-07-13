/* Admin uploader — talks to /api/upload and /api/photos.
   The password is kept only for this browser session. */
"use strict";

const PW_KEY = "rs_admin_pw";
const $ = (s) => document.querySelector(s);
const getPw = () => sessionStorage.getItem(PW_KEY) || "";
const setPw = (v) => sessionStorage.setItem(PW_KEY, v);

function api(path, opts = {}) {
  const headers = Object.assign({}, opts.headers, { "x-admin-password": getPw() });
  return fetch(path, Object.assign({}, opts, { headers }));
}

/* Pull the server's error message out of a failed response. */
async function apiError(r) {
  let msg = "";
  try { msg = (await r.json()).error || ""; } catch { /* non-JSON body */ }
  if (r.status === 404) return "no backend here — this only works on the Vercel site (ruheenasyed.com/admin), not localhost or GitHub Pages";
  return `${msg || "request failed"} (HTTP ${r.status})`;
}

async function verify(pw) {
  try {
    const r = await fetch("/api/auth", { method: "POST", headers: { "x-admin-password": pw } });
    if (r.ok) return { ok: true };
    return { ok: false, msg: await apiError(r) };
  } catch {
    return { ok: false, msg: "could not reach the server — are you online?" };
  }
}

function showContent() {
  $("#gate").hidden = true;
  $("#content").hidden = false;
  refresh();
}

function showGate(message) {
  $("#content").hidden = true;
  $("#gate").hidden = false;
  $("#gateError").textContent = message || "";
}

/* Resize/compress an image file to keep uploads small and fast. */
function downscale(file, maxDim = 1600, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let w = img.naturalWidth, h = img.naturalHeight;
      const s = Math.min(1, maxDim / Math.max(w, h));
      w = Math.round(w * s); h = Math.round(h * s);
      const c = document.createElement("canvas");
      c.width = w; c.height = h;
      c.getContext("2d").drawImage(img, 0, 0, w, h);
      const dataUrl = c.toDataURL("image/jpeg", quality);
      URL.revokeObjectURL(img.src);
      resolve({ dataBase64: dataUrl.split(",")[1], type: "image/jpeg" });
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

function uploadedThumb(p) {
  const fig = document.createElement("figure");
  fig.className = "thumb";
  const img = document.createElement("img");
  img.src = p.url; img.loading = "lazy"; img.alt = "";
  const btn = document.createElement("button");
  btn.className = "del"; btn.type = "button"; btn.textContent = "Delete";
  btn.onclick = async () => {
    if (!confirm("Delete this photo for everyone?")) return;
    btn.disabled = true;
    const key = p.pathname
      ? "path=" + encodeURIComponent(p.pathname)
      : "url=" + encodeURIComponent(p.url);
    const dr = await api("/api/photos?" + key, { method: "DELETE" });
    if (dr.ok) refresh();
    else { alert("Delete failed: " + (await apiError(dr))); btn.disabled = false; }
  };
  fig.append(img, btn);
  return fig;
}

function builtInThumb(name) {
  const fig = document.createElement("figure");
  fig.className = "thumb";
  const img = document.createElement("img");
  img.src = "/" + encodeURIComponent(name); img.loading = "lazy"; img.alt = "";
  const tag = document.createElement("span");
  tag.className = "tag"; tag.textContent = "built-in";
  tag.title = "Shipped with the site itself — can only be removed by editing the code.";
  fig.append(img, tag);
  return fig;
}

async function refresh() {
  const grid = $("#photos");
  grid.innerHTML = '<p class="muted">Loading…</p>';

  let uploaded = [];
  let note = "";
  try {
    const r = await fetch("/api/photos", { cache: "no-store" });
    if (!r.ok) note = `Could not load uploaded photos: ${await apiError(r)}`;
    else {
      const { photos = [], error } = await r.json();
      if (error) note = `Storage error: ${error}`;
      else uploaded = photos;
    }
  } catch {
    note = "Could not load uploaded photos (is the backend set up?).";
  }

  grid.innerHTML = "";
  if (note) grid.appendChild(mutedText(note));
  else if (!uploaded.length) grid.appendChild(mutedText("No uploaded photos yet — the ones below are built into the site."));
  uploaded.slice().reverse().forEach((p) => grid.appendChild(uploadedThumb(p)));

  const builtIn = (typeof PHOTOS !== "undefined" ? PHOTOS : [])
    .concat(typeof BONUS_PHOTOS !== "undefined" ? BONUS_PHOTOS : []);
  builtIn.forEach((name) => grid.appendChild(builtInThumb(name)));
}

function mutedText(text) {
  const p = document.createElement("p");
  p.className = "muted";
  p.textContent = text;
  return p;
}

async function handleFiles(files) {
  const status = $("#status");
  if (!getPw()) { alert("Enter the admin password first."); return; }
  let ok = 0, fail = 0, lastErr = "";
  for (const f of files) {
    if (!f.type || !f.type.startsWith("image/")) continue;
    status.textContent = `Uploading ${f.name}…`;
    try {
      const payload = await downscale(f);
      const r = await api("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (r.ok) ok++;
      else {
        fail++;
        lastErr = await apiError(r);
        if (r.status === 401) { status.textContent = `Upload failed: ${lastErr}`; return; }
      }
    } catch { fail++; lastErr = "network error while uploading"; }
  }
  status.textContent = fail
    ? `Done — ${ok} added, ${fail} failed. Last error: ${lastErr}`
    : `Done — ${ok} added.`;
  refresh();
}

document.addEventListener("DOMContentLoaded", async () => {
  const pwInput = $("#pw");
  const unlockBtn = $("#unlock");

  const tryUnlock = async () => {
    const pw = pwInput.value.trim();
    if (!pw) { $("#gateError").textContent = "Enter the password."; return; }
    unlockBtn.disabled = true;
    unlockBtn.textContent = "Checking…";
    const res = await verify(pw);
    unlockBtn.disabled = false;
    unlockBtn.textContent = "Unlock";
    if (res.ok) { setPw(pw); showContent(); }
    else { sessionStorage.removeItem(PW_KEY); $("#gateError").textContent = res.msg; }
  };

  unlockBtn.onclick = tryUnlock;
  pwInput.addEventListener("keydown", (e) => { if (e.key === "Enter") tryUnlock(); });

  const file = $("#file");
  $("#pick").onclick = () => file.click();
  file.onchange = () => { handleFiles([...file.files]); file.value = ""; };
  $("#reload").onclick = refresh;
  $("#lock").onclick = () => { sessionStorage.removeItem(PW_KEY); pwInput.value = ""; showGate(""); };

  const drop = $("#drop");
  drop.addEventListener("click", (e) => { if (e.target === drop) file.click(); });
  ["dragover", "dragenter"].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add("over"); }));
  ["dragleave", "drop"].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove("over"); }));
  drop.addEventListener("drop", (e) => handleFiles([...e.dataTransfer.files]));

  // Already unlocked this session? Re-verify silently instead of trusting storage.
  const stored = getPw();
  if (stored) {
    pwInput.value = stored;
    if ((await verify(stored)).ok) showContent();
    else { sessionStorage.removeItem(PW_KEY); showGate(""); }
  } else {
    showGate("");
  }
});
