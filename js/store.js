import { listProducts, money, esc } from "./db.js";
import { WHATSAPP, CATEGORIES } from "./config.js";

const $ = s => document.querySelector(s);
let products = [], cat = "Todo", term = "";

const waLink = p => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(`Hola Daurel, me interesa: ${p.title} (${money(p.price)}). ¿Está disponible?`)}`;

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
  document.querySelectorAll(".cat").forEach(c => c.setAttribute("aria-pressed", c.dataset.cat === cat));
}

function openModal(p) {
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
      <a class="btn wa" target="_blank" rel="noopener" href="${waLink(p)}">Pedir por WhatsApp</a>
    </div>`;
  $("#modal").showModal();
}

/* ===== Carrusel infinito: se ven 3 (centro grande + lados) ===== */
function initStage() {
  const items = products.slice(0, 12), n = items.length, sec = $("#stage");
  if (!n) { sec.hidden = true; return; }
  sec.hidden = false;
  document.querySelector(".hero").hidden = true;

  // anillo de al menos 5 elementos para que el giro sea continuo (se repiten si hay pocos productos)
  const m = n === 1 ? 1 : n >= 5 ? n : n * Math.ceil(5 / n), h = Math.floor(m / 2);
  const at = k => items[k % n];
  $("#st-track").innerHTML = Array.from({ length: m }, (_, k) => {
    const p = at(k), cut = /\.png(\?|$)/i.test(p.images?.[0] || "");
    return `<div class="st-item ${cut ? "cut" : "photo"}" role="button" tabindex="0" aria-label="${esc(p.title)}"><img src="${esc(p.images?.[0] || "")}" alt="" draggable="false"></div>`;
  }).join("");
  const els = [...$("#st-track").children], info = $("#st-info");
  let a = 0, startX = 0, moved = false, lock = false, started = false;

  function go(k) {
    const prev = a;
    a = ((k % m) + m) % m;
    els.forEach((el, i) => {
      const o = (((i - a + h) % m) + m) % m - h, ao = Math.abs(o);
      el.style.setProperty("--o", o);
      el.style.setProperty("--ao", ao);
      el.style.setProperty("--s", ao === 0 ? 1 : .8);
      el.style.setProperty("--op", ao <= 1 ? 1 : 0);
      el.style.setProperty("--z", 10 - ao);
      el.style.setProperty("--pe", ao <= 1 ? "auto" : "none");
    });
    const p = at(a);
    $("#st-title").textContent = p.title;
    $("#st-price").textContent = money(p.price);
    $("#st-buy").href = waLink(p);
    if (started && a !== prev) { info.classList.remove("swap"); void info.offsetWidth; info.classList.add("swap"); }
    started = true;
  }

  $("#st-track").addEventListener("click", e => {
    const el = e.target.closest(".st-item"); if (!el || moved) return;
    const o = +el.style.getPropertyValue("--o");
    o === 0 ? openModal(at(a)) : go(a + o);
  });
  $("#st-track").addEventListener("keydown", e => { if (e.key === "Enter") e.target.click(); });
  sec.addEventListener("keydown", e => { if (e.key === "ArrowLeft") go(a - 1); if (e.key === "ArrowRight") go(a + 1); });
  sec.addEventListener("pointerdown", e => { startX = e.clientX; moved = false; });
  sec.addEventListener("pointerup", e => { const dx = e.clientX - startX; if (Math.abs(dx) > 40) { moved = true; go(a + (dx < 0 ? 1 : -1)); setTimeout(() => moved = false, 60); } });
  sec.addEventListener("wheel", e => {
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && Math.abs(e.deltaX) > 20) {
      e.preventDefault();
      if (!lock) { go(a + (e.deltaX > 0 ? 1 : -1)); lock = true; setTimeout(() => lock = false, 450); }
    }
  }, { passive: false });
  go(0);
}

async function init() {
  const toGrid = () => $("#grid").scrollIntoView({ behavior: "smooth", block: "start" });
  $("#cats").innerHTML = ["Todo", ...CATEGORIES].map(c => `<button class="cat" data-cat="${c}">${c}</button>`).join("");
  $("#cats").addEventListener("click", e => { if (e.target.dataset.cat) { cat = e.target.dataset.cat; render(); toGrid(); } });
  $("#search-toggle").addEventListener("click", () => { const s = $("#search"); s.hidden = !s.hidden; if (!s.hidden) s.focus(); });
  $("#search").addEventListener("input", e => { term = e.target.value.toLowerCase(); render(); toGrid(); });
  $("#grid").addEventListener("click", e => { const c = e.target.closest(".card"); if (c) openModal(products.find(p => p.id === c.dataset.id)); });
  $("#grid").addEventListener("keydown", e => { if (e.key === "Enter") e.target.click?.(); });
  $("#modal").addEventListener("click", e => { if (e.target.id === "modal" || e.target.closest(".close")) $("#modal").close(); });
  $("#modal-body").addEventListener("click", e => { if (e.target.closest(".thumbs") && e.target.tagName === "IMG") $("#main-img").src = e.target.src; });
  $("#wa-top").href = `https://wa.me/${WHATSAPP}`;
  const head = $("#site-head");
  const onScroll = () => head.classList.toggle("solid", scrollY > 20);
  addEventListener("scroll", onScroll, { passive: true }); onScroll();
  try { products = await listProducts(); render(); initStage(); }
  catch (e) { console.error(e); $("#grid").innerHTML = `<p class="empty">No pudimos cargar los productos. Revisa tu conexión e intenta de nuevo.</p>`; }
}
init();
