# Daurel – tienda y panel admin

Sitio estático (HTML + JS) para GitHub Pages. Datos y fotos en Supabase (gratis).


## 1. Crear Supabase
1. Crea cuenta y proyecto en https://supabase.com
2. **SQL Editor** → pega y ejecuta `supabase/setup.sql`
3. **Authentication → Users → Add user**: tu correo y contraseña (marca *Auto confirm*)
4. **Authentication → Sign In / Providers**: desactiva *Allow new users to sign up* (así nadie más puede ser admin)
5. **Project Settings → API**: copia *Project URL* y la clave *anon public*

## 2. Configurar
Edita `js/config.js`: URL, clave anon, tu número de WhatsApp y categorías.

## 3. Publicar
Sube la carpeta a un repo de GitHub → Settings → Pages → rama `main`, carpeta `/ (root)`.
- Tienda: `https://TU-USUARIO.github.io/REPO/`
- Admin: `https://TU-USUARIO.github.io/REPO/admin.html`

Para probar local no abras el archivo con doble clic; usa `npx serve` o la extensión Live Server de VS Code.

## Seguridad
La clave *anon* es pública por diseño. La protección está en las políticas RLS de `setup.sql`: cualquiera lee productos activos, solo el usuario con sesión puede crear, editar o borrar.
