# Variables de Entorno CRÍTICAS para Vercel

## ⚠️ INSTRUCCIONES URGENTES

### 1. Ve a Vercel Dashboard
- https://vercel.com/dashboard
- Selecciona el proyecto "mindhub-frontend" (o como se llame)
- Ve a Settings → Environment Variables

### 2. Agrega estas variables EXACTAMENTE:

```bash
# SUPABASE - CRÍTICAS
NEXT_PUBLIC_SUPABASE_URL=https://jvbcpldzoyicefdtnwkd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2YmNwbGR6b3lpY2VmZHRud2tkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0MDE0NzAsImV4cCI6MjA3MDk3NzQ3MH0.X4DoFvbOPy5x7Y0p2OFnEJp38pquPGLBq4CdNmt-waI

# SERVICE ROLE KEY - MÁS CRÍTICA
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2YmNwbGR6b3lpY2VmZHRud2tkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTQwMTQ3MCwiZXhwIjoyMDcwOTc3NDcwfQ.-iooltGuYeGqXVh7pgRhH_Oo_R64VtHIssbE3u_y0WQ

# DJANGO BACKEND URL (para cuando esté deployed)
NEXT_PUBLIC_DJANGO_API_URL=https://mindhub-django-backend.vercel.app
BACKEND_URL=https://mindhub-django-backend.vercel.app
```

### 3. IMPORTANTE: Marcar para todos los environments
- [ ] Production
- [ ] Preview  
- [ ] Development

### 4. Click "Save" y luego "Redeploy"

## 🚨 NOTA CRÍTICA

Sin el `SUPABASE_SERVICE_ROLE_KEY`, las API routes NO pueden autenticar con Supabase.
Esta es la razón de TODOS los errores 401.

## Para obtener las keys desde Supabase:

1. Ve a https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Settings → API
4. Copia:
   - `anon` public key → NEXT_PUBLIC_SUPABASE_ANON_KEY
   - `service_role` secret key → SUPABASE_SERVICE_ROLE_KEY

## Después de configurar:

1. Redeploy el proyecto en Vercel
2. Espera 2-3 minutos
3. Los errores 401 deberían desaparecer

## Si sigues teniendo problemas con Django:

El Django backend también necesita deployment separado. Si aún no está deployed:

1. Crea nuevo proyecto en Vercel para Django
2. Importa desde GitHub (carpeta mindhub/backend-django)
3. Configura las variables de entorno del Django
4. Deploy

---

**ESTO ES URGENTE - La app NO funcionará hasta que configures estas variables**