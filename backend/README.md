# Backend - ESG Proveedores Críticos

Este es el backend de la aplicación, construido con Node.js y Express.

## Instalación

1. Instala las dependencias:
   ```bash
   npm install
   ```

2. Copia el archivo de variables de entorno:
   ```bash
   cp .env.example .env
   ```

3. Configura las variables en `.env`:
   - `PORT`: Puerto del servidor (default 3000)
   - `FRONTEND_URL`: URL del frontend (ej: https://tu-frontend.vercel.app)
   - `SUPABASE_URL`: URL de Supabase
   - `SUPABASE_SERVICE_ROLE_KEY`: Service role key de Supabase

4. Ejecuta en desarrollo:
   ```bash
   npm run dev
   ```

## Despliegue en Render

1. Sube este directorio a un repositorio de Git.
2. Conecta el repo a Render como Web Service.
3. Configura las variables de entorno en Render.
4. El comando de build/start será `npm start`.

Render detectará automáticamente el proyecto Node.js.