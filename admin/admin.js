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

async function refresh() {
  const grid = $("#photos");
  grid.innerHTML = '<p class="muted">Loading…</p>';
  try {
    const r = await fetch("/api/photos", { cache: "no-store" });
    const { photos = [] } = await r.json();
    if (!photos.length) { grid.innerHTML = '<p class="muted">No uploaded photos yet.</p>'; return; }
    grid.innerHTML = "";
    photos.slice().reverse().forEach((p) => {
      const fig = document.createElement("figure");
      fig.className = "thumb";
      const img = document.createElement("img");
      img.src = p.url; img.loading = "lazy"; img.alt = "";
      const btn = document.createElement("button");
      btn.className = "del"; btn.type = "button"; btn.textContent = "Delete";
      btn.onclick = async () => {
        if (!confirm("Delete this photo for everyone?")) return;
        btn.disabled = true;
        const dr = await api("/api/photos?url=" + encodeURIComponent(p.url), { method: "DELETE" });
        if (dr.ok) refresh();
        else { alert("Delete failed — check the password."); btn.disabled = false; }
      };
      fig.append(img, btn);
      grid.appendChild(fig);
    });
  } catch {
    grid.innerHTML = '<p class="muted">Could not load photos (is the backend set up?).</p>';
  }
}

async function handleFiles(files) {
  const status = $("#status");
  if (!getPw()) { alert("Enter the admin password first."); return; }
  let ok = 0, fail = 0;
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
      else { fail++; if (r.status === 401) { status.textContent = "Wrong password."; return; } }
    } catch { fail++; }
  }
  status.textContent = `Done — ${ok} added${fail ? `, ${fail} failed` : ""}.`;
  refresh();
}

document.addEventListener("DOMContentLoaded", () => {
  const pwInput = $("#pw");
  pwInput.value = getPw();
  $("#unlock").onclick = () => { setPw(pwInput.value.trim()); $("#status").textContent = "Password saved for this session."; };
  pwInput.addEventListener("keydown", (e) => { if (e.key === "Enter") $("#unlock").click(); });

  const file = $("#file");
  $("#pick").onclick = () => file.click();
  file.onchange = () => handleFiles([...file.files]);
  $("#reload").onclick = refresh;

  const drop = $("#drop");
  drop.addEventListener("click", (e) => { if (e.target === drop) file.click(); });
  ["dragover", "dragenter"].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add("over"); }));
  ["dragleave", "drop"].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove("over"); }));
  drop.addEventListener("drop", (e) => handleFiles([...e.dataTransfer.files]));

  refresh();
});
