import { sb, listProducts, saveProduct, deleteProduct, uploadImage, money, esc } from "./db.js";
import { CATEGORIES } from "./config.js";

const $ = s => document.querySelector(s);
let products = [], images = [];

const toast = (m, bad) => { const t = $("#toast"); t.textContent = m; t.className = "toast show" + (bad ? " bad" : ""); setTimeout(() => t.className = "toast", 3000); };

async function showApp(session) {
  $("#login").hidden = !!session; $("#app").hidden = !session;
  if (session) { $("#category").innerHTML = CATEGORIES.map(c => `<option>${c}</option>`).join(""); refresh(); }
}

async function refresh() {
  products = await listProducts({ onlyActive: false });
  $("#list").innerHTML = products.length ? products.map(p => `
    <li class="row ${p.active ? "" : "off"}">
      <img src="${esc(p.images?.[0] || "")}" alt="">
      <div><strong>${esc(p.title)}</strong><br><span class="muted">${esc(p.category)} · ${money(p.price)}${p.active ? "" : " · oculto"}</span></div>
      <button class="btn small ghost" data-edit="${p.id}">Editar</button>
      <button class="btn small danger" data-del="${p.id}">Eliminar</button>
    </li>`).join("") : `<li class="empty">Aún no hay productos. Agrega el primero con el formulario.</li>`;
}

function renderPreviews() {
  $("#previews").innerHTML = images.map((u, i) => `<div class="prev"><img src="${esc(u)}" alt=""><button type="button" data-rm="${i}" aria-label="Quitar foto">×</button>${i === 0 ? "<em>Principal</em>" : ""}</div>`).join("");
}

function resetForm() { $("#form").reset(); $("#pid").value = ""; images = []; renderPreviews(); $("#form-title").textContent = "Nuevo producto"; }

$("#login-form").addEventListener("submit", async e => {
  e.preventDefault();
  const { error } = await sb.auth.signInWithPassword({ email: $("#email").value, password: $("#password").value });
  if (error) toast("Correo o contraseña incorrectos", true);
});
$("#logout").addEventListener("click", () => sb.auth.signOut());
sb.auth.onAuthStateChange((_, s) => showApp(s));
sb.auth.getSession().then(({ data }) => showApp(data.session));

$("#files").addEventListener("change", async e => {
  const files = [...e.target.files]; if (!files.length) return;
  toast("Subiendo fotos…");
  try { for (const f of files) images.push(await uploadImage(f)); renderPreviews(); toast("Fotos listas"); }
  catch (err) { console.error(err); toast("No se pudo subir la foto", true); }
  e.target.value = "";
});
$("#previews").addEventListener("click", e => { const i = e.target.dataset.rm; if (i !== undefined) { images.splice(+i, 1); renderPreviews(); } });

$("#form").addEventListener("submit", async e => {
  e.preventDefault();
  if (!images.length) return toast("Agrega al menos una foto", true);
  try {
    await saveProduct({
      id: $("#pid").value || undefined, title: $("#title").value.trim(), price: +$("#price").value,
      category: $("#category").value, description: $("#description").value.trim(),
      images, is_new: $("#is_new").checked, active: $("#active").checked,
    });
    toast("Producto guardado"); resetForm(); refresh();
  } catch (err) { console.error(err); toast("No se pudo guardar. Revisa que hayas iniciado sesión.", true); }
});
$("#cancel").addEventListener("click", resetForm);

$("#list").addEventListener("click", async e => {
  const edit = e.target.dataset.edit, del = e.target.dataset.del;
  if (edit) {
    const p = products.find(x => x.id === edit);
    $("#pid").value = p.id; $("#title").value = p.title; $("#price").value = p.price; $("#category").value = p.category;
    $("#description").value = p.description || ""; $("#is_new").checked = p.is_new; $("#active").checked = p.active;
    images = [...(p.images || [])]; renderPreviews(); $("#form-title").textContent = "Editar producto"; scrollTo({ top: 0, behavior: "smooth" });
  }
  if (del && confirm("¿Eliminar este producto? No se puede deshacer.")) {
    try { await deleteProduct(products.find(x => x.id === del)); toast("Producto eliminado"); refresh(); }
    catch { toast("No se pudo eliminar", true); }
  }
});
