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


/* ===== Escenario de productos (carrusel interactivo) ===== */
function initStage() {
  const items = products.slice(0, 10), sec = $("#stage");
  if (!items.length) { sec.hidden = true; return; }
  sec.hidden = false;
  document.querySelector(".hero").hidden = true;
  const n = items.length;
  $("#st-track").innerHTML = items.map((p, i) => {
    const cut = /\.png(\?|$)/i.test(p.images?.[0] || "");
    return `<div class="st-item ${cut ? "cut" : "photo"}" data-i="${i}" role="button" tabindex="0" aria-label="${esc(p.title)}"><img src="${esc(p.images?.[0] || "")}" alt="" draggable="false"></div>`;
  }).join("");
  const els = [...$("#st-track").children];
  let a = 0, startX = 0, moved = false, lock = false;

  function go(i) {
    a = Math.max(0, Math.min(n - 1, i));
    els.forEach((el, k) => {
      const o = k - a, ao = Math.abs(o);
      el.style.setProperty("--o", o);
      el.style.setProperty("--s", Math.max(.5, 1.2 - ao * .24));
      el.style.setProperty("--op", ao > 3 ? 0 : 1 - ao * .22);
      el.style.setProperty("--z", 10 - ao);
      el.style.setProperty("--pe", ao > 3 ? "none" : "auto");
      el.classList.toggle("on", k === a);
    });
    $("#st-title").textContent = items[a].title;
    $("#st-price").textContent = money(items[a].price);
    const t = $("#st-thumb"); t.style.width = 100 / n + "%"; t.style.left = (a * 100 / n) + "%";
  }
  if (n < 2) document.querySelectorAll(".st-arrow,.st-bar").forEach(e => e.hidden = true);
  $("#st-prev").onclick = () => go(a - 1);
  $("#st-next").onclick = () => go(a + 1);
  $("#st-btn").onclick = () => openModal(items[a]);
  $("#st-track").addEventListener("click", e => {
    const el = e.target.closest(".st-item"); if (!el || moved) return;
    +el.dataset.i === a ? openModal(items[a]) : go(+el.dataset.i);
  });
  sec.addEventListener("keydown", e => { if (e.key === "ArrowLeft") go(a - 1); if (e.key === "ArrowRight") go(a + 1); });
  sec.addEventListener("pointerdown", e => { startX = e.clientX; moved = false; });
  sec.addEventListener("pointerup", e => { const dx = e.clientX - startX; if (Math.abs(dx) > 40) { moved = true; go(a + (dx < 0 ? 1 : -1)); setTimeout(() => moved = false, 60); } });
  sec.addEventListener("pointermove", e => { const r = sec.getBoundingClientRect(); sec.style.setProperty("--px", ((e.clientX - r.left) / r.width * 2 - 1).toFixed(2)); });
  sec.addEventListener("wheel", e => {
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && Math.abs(e.deltaX) > 20) {
      e.preventDefault();
      if (!lock) { go(a + (e.deltaX > 0 ? 1 : -1)); lock = true; setTimeout(() => lock = false, 450); }
    }
  }, { passive: false });
  go(0);
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
  try { products = await listProducts(); render(); initStage(); }
  catch (e) { console.error(e); $("#grid").innerHTML = `<p class="empty">No pudimos cargar los productos. Revisa tu conexión e intenta de nuevo.</p>`; }
}
init();
