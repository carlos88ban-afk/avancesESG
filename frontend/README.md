# Frontend - ESG Proveedores Críticos

Este es el frontend de la aplicación, construido con React y Vite.

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
   - `VITE_API_URL`: URL del backend (ej: https://avancesesg.onrender.com)

4. Ejecuta en desarrollo:
   ```bash
   npm run dev
   ```

## Despliegue en Vercel

1. Sube este directorio a un repositorio de Git.
2. Conecta el repo a Vercel.
3. Configura las variables de entorno en Vercel:
   - `VITE_API_URL`: URL del backend desplegado (ej: https://avancesesg.onrender.com).

Vercel detectará automáticamente el proyecto Vite.

```bash
# Iniciar servidor de desarrollo
npm run dev

# Build para producción
npm run build

# Preview de build
npm run preview
```

## Stack Tecnológico

- **Frontend**: React 18 + Vite + TailwindCSS
- **Backend**: Node.js (Render)
- **Base de Datos**: PostgreSQL (Supabase)
- **Hosting Frontend**: Vercel
- **UI Components**: Radix UI + Shadcn/ui

## Estructura del Proyecto

```
src/
├── components/
│   ├── dashboard/    # Componentes de KPIs y gráficos
│   ├── suppliers/    # Componentes de gestión de proveedores
│   ├── layout/       # Layout y navegación
│   └── ui/           # Componentes reutilizables
├── pages/            # Páginas principales
├── lib/              # Contexto de autenticación y utilidades
├── hooks/            # Hooks personalizados
└── utils/            # Funciones auxiliares
```

## Funcionalidades

### 1. Subida de Archivo
- Validación de estructura xlsx (8 hojas)
- Validación de columnas requeridas (B, D, E)

### 2. Procesamiento de Datos
- Eliminación de duplicados
- Normalización de unidades de negocio
- Matching de proveedores con RUC, nombre

### 3. Dashboard
- KPIs: % avance global, por unidad, por tipo
- Gráficos interactivos
- Estado visual (verde/rojo)

### 4. Gestión de Proveedores
- ABM de proveedores críticos
- Alertas de eliminación/modificación

## Reglas de Negocio

### Normalización de Unidades
- QUIMICA SUIZA → FARMACIAS PERUANAS
- FINANCIERA OH → SIP
- INTERCORP RETAIL → Usar unidad definida

### Matching de Proveedores
Se considera un match si cumple al menos uno:
1. RUC exacto coincide
2. RUC sin último dígito coincide
3. Nombre coincide (normalized: uppercase + trim + sin caracteres especiales)

### Completado Global
Un proveedor crítico completado en una unidad se marca como completado en TODAS sus unidades.

## Fórmula de Cálculo

```
avance = completados / total_críticos * 100%
```

## Desarrollo

```bash
# Linting
npm run lint

# Fix linting errors
npm run lint:fix

# Type checking
npm run typecheck
```

## Contribución

Seguir los estándares de código del proyecto.

## Soporte

Para problemas o preguntas, contactar with soporte del equipo de desarrollo.
