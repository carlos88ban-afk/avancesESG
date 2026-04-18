# ESG Proveedores Críticos

Este repositorio contiene el código separado para el frontend y backend de la aplicación de monitoreo de proveedores críticos ESG.

## Estructura

- `frontend/`: Código del frontend (React + Vite), para desplegar en Vercel.
- `backend/`: Código del backend (Node.js + Express), para desplegar en Render.

## Base de Datos

La base de datos está configurada en Supabase PostgreSQL. El schema se encuentra en `backend/db/schema.sql`.

## Despliegue

1. **Backend en Render**:
   - Sube la carpeta `backend/` a un repo.
   - Despliega como Web Service en Render.
   - Configura variables de entorno.

2. **Frontend en Vercel**:
   - Sube la carpeta `frontend/` a un repo.
   - Despliega en Vercel.
   - Configura `VITE_API_BASE_URL` apuntando al backend en Render.

## Desarrollo Local

Para desarrollo local, ejecuta ambos proyectos:

1. Backend: `cd backend && npm run dev`
2. Frontend: `cd frontend && npm run dev`

Asegúrate de configurar las variables de entorno en ambos.