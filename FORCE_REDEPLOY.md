# INSTRUCCIONES PARA FORCE REDEPLOY EN VERCEL

## 🚨 URGENTE: Force Redeploy Manual

### Paso 1: Ve a Vercel Dashboard
1. Abre: https://vercel.com/dashboard
2. Selecciona tu proyecto frontend (mindhub)

### Paso 2: Force Redeploy
1. Ve a la pestaña "Deployments"
2. Click en los 3 puntos del deployment más reciente
3. Click "Redeploy"
4. **IMPORTANTE**: Click "Redeploy" de nuevo en el modal (confirmar)

### Paso 3: Verificar que esté usando código nuevo
Cuando termine el redeploy (2-3 minutos), ve a:
- https://mindhub.cloud
- Abre DevTools (F12) → Console
- Busca logs que empiecen con `[AUTH]`
- Si los ves, significa que el código nuevo está desplegado

### Paso 4: Si aún no funciona
Si después del force redeploy siguen los mismos errores:

1. Ve a Settings → Environment Variables en Vercel
2. Verifica que están estas variables:
   - `SUPABASE_SERVICE_ROLE_KEY` 
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. Si faltan, agrégalas con estos valores:
```
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2YmNwbGR6b3lpY2VmZHRud2tkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTQwMTQ3MCwiZXhwIjoyMDcwOTc3NDcwfQ.-iooltGuYeGqXVh7pgRhH_Oo_R64VtHIssbE3u_y0WQ

NEXT_PUBLIC_SUPABASE_URL=https://jvbcpldzoyicefdtnwkd.supabase.co

NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2YmNwbGR6b3lpY2VmZHRud2tkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0MDE0NzAsImV4cCI6MjA3MDk3NzQ3MH0.X4DoFvbOPy5x7Y0p2OFnEJp38pquPGLBq4CdNmt-waI
```

### ⚠️ NOTA IMPORTANTE
El problema NO es el código (que está correcto), sino que Vercel no está desplegando la versión más reciente.

Un force redeploy debería resolver esto inmediatamente.