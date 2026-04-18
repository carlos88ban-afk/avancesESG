# ESG Proveedores Críticos - Plataforma de Monitoreo

Plataforma web para monitorear el avance del llenado de encuestas ESG por proveedores críticos.

## Descripción del Proyecto

Sistema que procesa archivos .xlsx con información de proveedores, normaliza datos, realiza matching contra una base de proveedores críticos y genera reportes de progreso.

### Características Principales

- 📊 **Dashboard de KPIs**: Visualización de % avance global, por unidad y por tipo de proveedor
- 📁 **Carga de Archivos**: Subida y procesamiento de archivos Excel con múltiples hojas
- 👥 **Gestión de Proveedores**: CRUD de proveedores críticos
- 📈 **Visualización de Progreso**: Tabla de avances con filtros (unidad, tipo, estado)
- ✅ **Validaciones Inteligentes**: Normalización y matching de proveedores

## Requisitos Previos

1. Node.js 18+
2. npm o yarn
3. Variables de entorno configuradas

## Instalación

```bash
# Clonar el repositorio
git clone <repository-url>

# Navegar al directorio del proyecto
cd avances

# Instalar dependencias
npm install

# Crear archivo .env.local
cp .env.example .env.local
```

## Configuración de Variables de Entorno

Crear un archivo `.env.local`:

```
VITE_SUPABASE_URL=tu_url_supabase
VITE_SUPABASE_ANON_KEY=tu_anon_key
```

## Ejecución Local

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
