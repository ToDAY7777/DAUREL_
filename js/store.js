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

async function init() {
  $("#chips").innerHTML = ["Todo", ...CATEGORIES].map(c => `<button class="chip" data-cat="${c}">${c}</button>`).join("");
  $("#chips").addEventListener("click", e => { if (e.target.dataset.cat) { cat = e.target.dataset.cat; render(); } });
  $("#search").addEventListener("input", e => { term = e.target.value.toLowerCase(); render(); });
  $("#grid").addEventListener("click", e => { const c = e.target.closest(".card"); if (c) openModal(products.find(p => p.id === c.dataset.id)); });
  $("#grid").addEventListener("keydown", e => { if (e.key === "Enter") e.target.click?.(); });
  $("#modal").addEventListener("click", e => { if (e.target.id === "modal" || e.target.closest(".close")) $("#modal").close(); });
  $("#modal-body").addEventListener("click", e => { if (e.target.closest(".thumbs") && e.target.tagName === "IMG") $("#main-img").src = e.target.src; });
  $("#wa-top").href = `https://wa.me/${WHATSAPP}`;
  try { products = await listProducts(); render(); }
  catch (e) { console.error(e); $("#grid").innerHTML = `<p class="empty">No pudimos cargar los productos. Revisa tu conexión e intenta de nuevo.</p>`; }
}
init();
