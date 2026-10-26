import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";

export const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const BUCKET = "products";

export async function listProducts({ onlyActive = true } = {}) {
  let q = sb.from("products").select("*").order("created_at", { ascending: false });
  if (onlyActive) q = q.eq("active", true);
  const { data, error } = await q;
  if (error) throw error;
  return data;
}

export async function saveProduct(p) {
  const { id, ...fields } = p;
  const req = id ? sb.from("products").update(fields).eq("id", id) : sb.from("products").insert(fields);
  const { error } = await req;
  if (error) throw error;
}

export async function deleteProduct(p) {
  const { error } = await sb.from("products").delete().eq("id", p.id);
  if (error) throw error;
  const paths = (p.images || []).map(u => u.split(`/${BUCKET}/`)[1]).filter(Boolean);
  if (paths.length) await sb.storage.from(BUCKET).remove(paths);
}

export async function uploadImage(file) {
  const ext = file.name.split(".").pop().toLowerCase();
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await sb.storage.from(BUCKET).upload(path, file, { cacheControl: "31536000" });
  if (error) throw error;
  return sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

export const money = n => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);
export const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
