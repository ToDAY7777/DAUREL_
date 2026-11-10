import { listProducts, money, esc } from "./db.js";
import { WHATSAPP, CATEGORIES } from "./config.js";

const $ = s => document.querySelector(s);
let products = [], cat = "Todo", term = "";

function card(p) {
  return `<article class="card" data-id="${p.id}" tabindex="0" role="button" aria-label="${esc(p.title)}">
    <div class="card-img">
      ${p.is_new ? '<span class="badge">NUEVO</span>' : ""}
      <img src="${esc(p.images?.[0] || "")}" alt="${esc(p.title)}" loading="lazy">
    </div>
    <h3>${esc(p.title)}</h3>
    <p class="price">${money(p.price)}</p>
  </article>`;
}

function render() {
  const list = products.filter(p =>
    (cat === "Todo" || p.category === cat) &&
    (p.title + " " + (p.description || "")).toLowerCase().includes(term));
  $("#grid").innerHTML = list.length ? list.map(card).join("")
    : `<p class="empty">No encontramos productos con ese filtro. Prueba otra categoría o escríbenos por WhatsApp para pedirlo a tu gusto.</p>`;
  document.querySelectorAll(".chip").forEach(c => c.setAttribute("aria-pressed", c.dataset.cat === cat));
}

function openModal(p) {
  const msg = encodeURIComponent(`Hola Daurel, me interesa: ${p.title} (${money(p.price)}). ¿Está disponible?`);
  $("#modal-body").innerHTML = `
    <div class="gallery">
      <img id="main-img" src="${esc(p.images?.[0] || "")}" alt="${esc(p.title)}">
      <div class="thumbs">${(p.images || []).map(u => `<img src="${esc(u)}" alt="">`).join("")}</div>
    </div>
    <div class="info">
      <p class="muted">${esc(p.category)}</p>
      <h2>${esc(p.title)}</h2>
      <p class="price big">${money(p.price)}</p>
      <p class="desc">${esc(p.description)}</p>
      <a class="btn wa" target="_blank" rel="noopener" href="https://wa.me/${WHATSAPP}?text=${msg}">Pedir por WhatsApp</a>
    </div>`;
  $("#modal").showModal();
}


/* ===== Carrusel de rueda: usa productos cuya foto principal es PNG (recorte sin fondo) ===== */
function initWheel() {
  const items = products.filter(p => /\.png(\?|$)/i.test(p.images?.[0] || "")).slice(0, 8);
  const sec = $("#wheel-sec");
  if (items.length < 2) { sec.hidden = true; return; }
  sec.hidden = false;
  const wheel = $("#wheel"), n = items.length;
  wheel.innerHTML = items.map((p, i) =>
    `<div class="w-item" style="--i:${i}" data-i="${i}" role="button" tabindex="0" aria-label="${esc(p.title)}"><img src="${esc(p.images[0])}" alt="" draggable="false"></div>`).join("");
  const els = [...wheel.children];
  let a = 0, dir = 1, timer, startX = 0, moved = false;

  function go(i) {
    a = Math.max(0, Math.min(n - 1, i));
    sec.style.setProperty("--a", a);
    els.forEach((el, k) => { el.style.setProperty("--d", Math.abs(k - a)); el.classList.toggle("on", k === a); });
    $("#w-title").textContent = items[a].title;
    $("#w-price").textContent = money(items[a].price);
  }
  const tick = () => { if (a === n - 1) dir = -1; if (a === 0) dir = 1; go(a + dir); };
  const start = () => { if (!matchMedia("(prefers-reduced-motion: reduce)").matches) { stop(); timer = setInterval(tick, 4200); } };
  const stop = () => clearInterval(timer);

  $("#w-prev").onclick = () => go(a - 1);
  $("#w-next").onclick = () => go(a + 1);
  $("#w-btn").onclick = () => openModal(items[a]);
  wheel.addEventListener("click", e => {
    const el = e.target.closest(".w-item"); if (!el || moved) return;
    +el.dataset.i === a ? openModal(items[a]) : go(+el.dataset.i);
  });
  sec.addEventListener("keydown", e => { if (e.key === "ArrowLeft") go(a - 1); if (e.key === "ArrowRight") go(a + 1); });
  sec.addEventListener("pointerdown", e => { startX = e.clientX; moved = false; });
  sec.addEventListener("pointerup", e => { const dx = e.clientX - startX; if (Math.abs(dx) > 40) { moved = true; go(a + (dx < 0 ? 1 : -1)); setTimeout(() => moved = false, 50); } });
  sec.addEventListener("pointerenter", stop); sec.addEventListener("pointerleave", start); sec.addEventListener("focusin", stop);
  go(0); start();
}

async function init() {
  $("#chips").innerHTML = ["Todo", ...CATEGORIES].map(c => `<button class="chip" data-cat="${c}">${c}</button>`).join("");
  $("#chips").addEventListener("click", e => { if (e.target.dataset.cat) { cat = e.target.dataset.cat; render(); } });
  $("#search").addEventListener("input", e => { term = e.target.value.toLowerCase(); render(); });
  $("#grid").addEventListener("click", e => { const c = e.target.closest(".card"); if (c) openModal(products.find(p => p.id === c.dataset.id)); });
  $("#grid").addEventListener("keydown", e => { if (e.key === "Enter") e.target.click?.(); });
  $("#modal").addEventListener("click", e => { if (e.target.id === "modal" || e.target.closest(".close")) $("#modal").close(); });
  $("#modal-body").addEventListener("click", e => { if (e.target.closest(".thumbs") && e.target.tagName === "IMG") $("#main-img").src = e.target.src; });
  $("#wa-top").href = `https://wa.me/${WHATSAPP}`;
  try { products = await listProducts(); render(); initWheel(); }
  catch (e) { console.error(e); $("#grid").innerHTML = `<p class="empty">No pudimos cargar los productos. Revisa tu conexión e intenta de nuevo.</p>`; }
}
init();
