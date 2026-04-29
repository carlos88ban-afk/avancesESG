export const generatedDocumentationDate = '29/04/2026';

export const technicalDocs = {
  title: 'Documentacion Tecnica',
  subtitle: 'Arquitectura, infraestructura, datos, riesgos y mantenimiento de ESG Monitor.',
  summary:
    'ESG Monitor es una plataforma web para monitorear el avance de encuestas ESG de proveedores criticos por unidad de negocio. El sistema cruza proveedores cargados desde archivos Excel contra un catalogo de proveedores criticos, calcula estados de avance y permite revisar pendientes, exportar reportes y generar comunicaciones de seguimiento.',
  sections: [
    {
      id: 'vision-general',
      title: 'Descripcion general de la plataforma',
      type: 'cards',
      items: [
        {
          title: 'Proposito',
          body: 'Centralizar el seguimiento de proveedores criticos que deben completar encuestas ESG, mostrando avance global, avance por unidad, proveedores pendientes y proveedores con evaluacion completada.',
        },
        {
          title: 'Usuarios objetivo',
          body: 'Equipos de sostenibilidad, compras, compliance, operaciones y responsables de unidades de negocio que necesitan revisar avance, cargar informacion y coordinar acciones.',
        },
        {
          title: 'Alcance actual',
          body: 'Dashboard ejecutivo, gestion CRUD de proveedores criticos por unidad, carga de archivos XLSX, vista de avances, exportacion Excel, generacion de correos y vista de evaluaciones completadas.',
        },
      ],
    },
    {
      id: 'arquitectura',
      title: 'Arquitectura del sistema',
      type: 'flow',
      description:
        'La aplicacion usa una arquitectura cliente-servidor: React consume APIs REST en Express, y Express consulta Supabase/PostgreSQL mediante el SDK de Supabase.',
      steps: [
        'Usuario opera la interfaz React en Vercel.',
        'React Query solicita datos al backend por medio de Axios.',
        'Express valida, procesa archivos y expone endpoints REST.',
        'El backend consulta o actualiza Supabase/PostgreSQL.',
        'La respuesta vuelve al frontend para renderizar tablas, KPIs y reportes.',
      ],
      mermaid: `flowchart LR
  A[Frontend React - Vercel Free] --> B[Backend Express - Render Free]
  B --> C[Supabase SDK]
  C --> D[(PostgreSQL - Supabase Free)]
  B --> E[Procesamiento XLSX]
  A --> F[PDF y Excel en navegador]`,
    },
    {
      id: 'stack',
      title: 'Stack tecnologico utilizado',
      type: 'table',
      columns: ['Capa', 'Tecnologia', 'Uso principal'],
      rows: [
        ['Frontend', 'React 18, Vite 6, React Router', 'SPA, rutas internas y renderizado de paginas.'],
        ['UI', 'Tailwind CSS, Radix UI, lucide-react', 'Sistema visual, componentes base e iconografia.'],
        ['Estado remoto', '@tanstack/react-query', 'Queries, cache, invalidacion y refresco de datos.'],
        ['HTTP', 'Axios', 'Cliente API con interceptores.'],
        ['Reportes', 'xlsx, jsPDF, html2canvas disponible', 'Exportaciones Excel y PDF desde el navegador.'],
        ['Backend', 'Node.js, Express, CORS, Multer', 'API REST, carga de archivos y procesamiento.'],
        ['Datos', 'Supabase/PostgreSQL', 'Persistencia, funciones SQL y relaciones de negocio.'],
        ['Parsing', 'xlsx', 'Lectura de archivos .xlsx por hojas y columnas esperadas.'],
      ],
    },
    {
      id: 'infraestructura',
      title: 'Infraestructura y despliegue',
      type: 'cards',
      items: [
        {
          title: 'GitHub',
          body: 'Repositorio de codigo fuente. Debe usarse como fuente versionada para frontend, backend, migraciones SQL y documentacion.',
        },
        {
          title: 'Vercel Free',
          body: 'Hospeda el frontend. Tiene limites de ancho de banda, ejecucion y uso segun plan. No debe asumirse disponibilidad empresarial.',
        },
        {
          title: 'Render Free',
          body: 'Hospeda el backend Express. Puede dormir por inactividad, generando demora en la primera peticion despues de un periodo sin uso.',
        },
        {
          title: 'Supabase Free',
          body: 'Hospeda PostgreSQL. Tiene limites de almacenamiento, base de datos, requests y recursos. Para produccion formal se recomienda evaluar plan pago.',
        },
      ],
      notes: [
        'Flujo real: Frontend en Vercel -> Backend en Render -> Supabase/PostgreSQL.',
        'Para produccion critica se recomienda separar ambientes de desarrollo, staging y produccion.',
        'Los planes gratuitos son adecuados para prototipos o uso controlado, no para alta disponibilidad empresarial.',
      ],
    },
    {
      id: 'variables-entorno',
      title: 'Variables de entorno esperadas',
      type: 'table',
      columns: ['Variable', 'Ubicacion', 'Descripcion'],
      rows: [
        ['VITE_API_URL', 'Frontend/Vercel', 'URL base del backend Render. En desarrollo puede quedar vacia para usar proxy de Vite.'],
        ['FRONTEND_URL', 'Backend/Render', 'Origen permitido por CORS, normalmente la URL de Vercel.'],
        ['PORT', 'Backend/Render', 'Puerto del servidor Express. El codigo usa 10000 por defecto.'],
        ['SUPABASE_URL', 'Backend/Render', 'URL del proyecto Supabase.'],
        ['SUPABASE_SERVICE_ROLE_KEY o SUPABASE_ANON_KEY', 'Backend/Render', 'Clave usada por el cliente Supabase segun configuracion del proyecto.'],
      ],
    },
    {
      id: 'estructura-carpetas',
      title: 'Estructura de carpetas',
      type: 'table',
      columns: ['Ruta', 'Responsabilidad'],
      rows: [
        ['frontend/src/pages', 'Paginas principales: Dashboard, Suppliers, Upload, Progress, Evaluacion y Documentacion.'],
        ['frontend/src/components/layout', 'Layout general, sidebar y navegacion movil.'],
        ['frontend/src/components/ui', 'Componentes base reutilizables tipo shadcn/Radix.'],
        ['frontend/src/api', 'Cliente Axios y servicios por dominio.'],
        ['frontend/src/lib', 'Constantes, query client, contexto de autenticacion y utilidades.'],
        ['backend/routes', 'Rutas REST por modulo: suppliers, uploads, completions, progress, dashboard, evaluacion.'],
        ['backend/lib', 'Parser Excel, normalizacion y motor de matching.'],
        ['backend/db', 'Cliente Supabase, schema inicial y migraciones SQL.'],
      ],
    },
    {
      id: 'modulos',
      title: 'Modulos principales',
      type: 'table',
      columns: ['Modulo', 'Frontend', 'Backend/API', 'Responsabilidad'],
      rows: [
        ['Dashboard', 'Dashboard.jsx', 'GET /api/dashboard/metrics', 'KPIs globales, avance por unidad y avance por tipo.'],
        ['Proveedores criticos', 'Suppliers.jsx, SupplierForm.jsx', '/api/suppliers', 'CRUD de relacion proveedor-unidad, busqueda y validacion de duplicados.'],
        ['Carga de archivo', 'Upload.jsx', '/api/uploads', 'Subida XLSX, procesamiento, deduplicacion e insercion en proveedores.'],
        ['Avances', 'Progress.jsx', 'GET /api/progress', 'Tabla de estados, filtros, exportacion Excel y generacion de correos.'],
        ['Completions', 'Servicios internos', '/api/completions', 'Consulta y registro manual/lote de avances; rematching contra proveedores existentes.'],
        ['Evaluaciones', 'EvaluacionProveedores.jsx', 'GET /api/evaluacion', 'Listado de proveedores con evaluacion ESG completada.'],
        ['Documentacion', 'Documentation.jsx', 'Sin API requerida', 'Lectura web y descarga PDF de documentacion tecnica y guia de usuario.'],
      ],
    },
    {
      id: 'apis',
      title: 'Servicios y APIs utilizados',
      type: 'table',
      columns: ['Endpoint', 'Metodo', 'Uso'],
      rows: [
        ['/api/health', 'GET', 'Verifica disponibilidad del backend.'],
        ['/api/dashboard/metrics', 'GET', 'Obtiene metricas agregadas desde funcion SQL.'],
        ['/api/suppliers', 'GET/POST', 'Lista y crea proveedores criticos vinculados a unidades.'],
        ['/api/suppliers/search?q=', 'GET', 'Busca proveedores base por nombre o RUC.'],
        ['/api/suppliers/:id', 'GET/PUT/DELETE', 'Consulta, actualiza o elimina una relacion proveedor-unidad.'],
        ['/api/uploads', 'POST', 'Recibe archivo .xlsx y crea registro en uploads.'],
        ['/api/uploads/:fileId/process', 'POST', 'Procesa hojas, deduplica e inserta proveedores.'],
        ['/api/uploads/:fileId/status', 'GET', 'Consulta estado de procesamiento.'],
        ['/api/progress', 'GET', 'Obtiene detalle de avance desde get_progress_detailed.'],
        ['/api/completions/rematch', 'POST', 'Recalcula avances contra proveedores ya cargados.'],
        ['/api/evaluacion', 'GET', 'Obtiene proveedores con evaluacion completada paginando funcion SQL.'],
      ],
    },
    {
      id: 'modelo-datos',
      title: 'Modelo general de datos',
      type: 'dataModel',
      description:
        'El modelo separa archivos cargados, proveedores detectados en esos archivos, catalogo de proveedores criticos, relacion proveedor-unidad y registros de avance.',
      entities: [
        ['uploads', 'Registra archivo cargado, estado de procesamiento, hojas, registros, coincidencias, errores y fecha de procesamiento.'],
        ['proveedores', 'Almacena filas extraidas desde XLSX: RUC, nombre, unidad, fecha de actualizacion y upload asociado.'],
        ['proveedores_criticos', 'Catalogo base de proveedores criticos con nombre, RUC, estado y fechas.'],
        ['proveedor_unidad', 'Relaciona proveedores criticos con unidades de negocio, tipo retail/no retail y estado.'],
        ['avances', 'Registra coincidencias/completitud por proveedor critico y unidad, metodo de match, fecha y upload asociado.'],
      ],
      relations: [
        'proveedores.upload_id -> uploads.id',
        'avances.upload_id -> uploads.id',
        'avances.critical_supplier_id -> proveedores_criticos.id',
        'proveedor_unidad.proveedor_id -> proveedores_criticos.id',
      ],
      mermaid: `erDiagram
  uploads ||--o{ proveedores : contiene
  uploads ||--o{ avances : origina
  proveedores_criticos ||--o{ proveedor_unidad : aplica_a
  proveedores_criticos ||--o{ avances : registra
  uploads {
    uuid id
    text original_filename
    text status
    integer total_records
    timestamptz processed_at
  }
  proveedores {
    uuid id
    text ruc
    text provider_name
    text unit
    date update_date
    uuid upload_id
  }
  proveedores_criticos {
    uuid id
    text name
    text ruc
    text status
  }
  proveedor_unidad {
    uuid id
    uuid proveedor_id
    text unit
    text type
    text status
  }
  avances {
    uuid id
    uuid critical_supplier_id
    text unit
    text matched_by
    date completion_date
    uuid upload_id
  }`,
    },
    {
      id: 'flujo-datos',
      title: 'Flujo funcional basado en datos',
      type: 'flow',
      description:
        'La carga de archivo alimenta proveedores; luego las consultas SQL y el motor de matching comparan informacion cargada contra proveedores criticos.',
      steps: [
        'El usuario carga un archivo .xlsx desde Cargar Archivo.',
        'El backend crea un registro en uploads con estado uploaded.',
        'El proceso lee todas las hojas, normaliza el nombre de la unidad y extrae fecha, RUC y proveedor.',
        'El sistema deduplica registros dentro del archivo y contra proveedores ya existentes.',
        'Los registros nuevos se insertan en proveedores con referencia a upload_id.',
        'El avance se calcula cruzando proveedores cargados contra proveedores_criticos y proveedor_unidad.',
        'La vista Avances muestra completado o pendiente, metodo de cruce y unidad donde respondio.',
      ],
    },
    {
      id: 'estado-queries',
      title: 'Manejo de estados, queries y mutaciones',
      type: 'cards',
      items: [
        {
          title: 'React Query',
          body: 'Se usa para obtener metricas, proveedores, avances y evaluaciones. Permite cache, invalidacion y refetch automatico.',
        },
        {
          title: 'Mutaciones',
          body: 'Crear, editar y eliminar proveedores invalidan queries relacionadas para refrescar datos. La carga de archivos invalida avances y proveedores.',
        },
        {
          title: 'Polling',
          body: 'La pagina Upload consulta el estado del procesamiento cada 2.5 segundos mientras el archivo se procesa.',
        },
        {
          title: 'Autenticacion',
          body: 'Existe AuthContext, pero actualmente inicializa un usuario Admin local y marca la app como autenticada. No hay control real de roles.',
        },
      ],
    },
    {
      id: 'limitantes',
      title: 'Limitantes conocidas y puntos sensibles',
      type: 'list',
      items: [
        'Render Free puede dormir el backend y causar demora inicial en la primera peticion.',
        'Vercel Free y Supabase Free tienen limites de uso, requests, almacenamiento y recursos.',
        'No existe autenticacion real ni control de roles por modulo.',
        'La carga acepta solo archivos .xlsx y espera columnas especificas: B fecha, D RUC, E nombre; datos desde fila 3.',
        'El matching por nombre requiere coincidencia normalizada exacta; nombres comerciales distintos pueden quedar pendientes.',
        'El backend guarda temporalmente archivos en disco local de Render, por lo que no debe asumirse persistencia de archivos.',
        'El schema inicial y migraciones SQL deben mantenerse sincronizados con la base real de Supabase.',
        'El calculo de progreso depende de funciones SQL como get_progress_detailed y get_dashboard_metrics.',
      ],
    },
    {
      id: 'mantenimiento',
      title: 'Estrategia de mantenimiento',
      type: 'list',
      items: [
        'Actualizar esta documentacion en frontend/src/content/docsData.js cuando cambien modulos, rutas, tablas o flujos.',
        'Revisar logs en Render ante errores 500, tiempos de respuesta altos o fallas de CORS.',
        'Revisar deployments y variables en Vercel cuando el frontend no conecte con el backend.',
        'Revisar tablas, funciones SQL y datos en Supabase cuando los KPIs o avances no cuadren.',
        'Exportar o respaldar datos periodicamente desde Supabase antes de cambios masivos.',
        'Validar archivos de carga antes de procesarlos: formato .xlsx, hojas esperadas, columnas B/D/E y RUCs consistentes.',
        'Corregir problemas de matching revisando RUC, nombre normalizado y unidades de proveedor_unidad.',
        'Agregar nuevas unidades en frontend/src/lib/constants.js y backend/lib/constants.js si afectan normalizacion o formularios.',
      ],
    },
    {
      id: 'recomendaciones',
      title: 'Recomendaciones tecnicas',
      type: 'list',
      items: [
        'Agregar autenticacion real y control de roles por usuario.',
        'Agregar backups periodicos y politicas de recuperacion para Supabase.',
        'Agregar monitoreo de errores y alertas para backend, frontend y base de datos.',
        'Versionar migraciones de base de datos y documentar funciones SQL requeridas.',
        'Agregar auditoria de cambios para proveedores criticos, relaciones y cargas.',
        'Mejorar validaciones de carga con previsualizacion de errores antes de insertar.',
        'Separar ambientes: desarrollo, staging y produccion.',
        'Evaluar planes pagos o infraestructura dedicada para produccion formal.',
      ],
    },
    {
      id: 'despliegue',
      title: 'Recomendaciones para despliegue',
      type: 'list',
      items: [
        'Confirmar que VITE_API_URL apunte al backend Render correcto.',
        'Configurar FRONTEND_URL en Render para permitir CORS desde Vercel.',
        'Verificar SUPABASE_URL y clave de Supabase en Render.',
        'Ejecutar migraciones SQL en Supabase antes de publicar cambios que dependan de nuevas funciones o tablas.',
        'Probar /api/health despues de cada despliegue de backend.',
        'Probar carga de archivo, dashboard y avances despues de cambios en SQL o parser.',
      ],
    },
  ],
};

export const userGuide = {
  title: 'Guia de Usuario',
  subtitle: 'Uso operativo de la plataforma para seguimiento de proveedores y encuestas ESG.',
  summary:
    'Esta guia explica como navegar la plataforma, cargar datos, gestionar proveedores criticos, revisar avance, exportar reportes, generar correos y consultar evaluaciones completadas.',
  sections: [
    {
      id: 'inicio-sesion',
      title: 'Inicio de sesion',
      objective: 'Ingresar a la plataforma desde el navegador.',
      steps: [
        'Abrir la URL del frontend desplegada en Vercel.',
        'Esperar la carga inicial de la aplicacion.',
        'Ingresar al modulo requerido desde la barra lateral o menu movil.',
      ],
      expected: 'La plataforma muestra el Dashboard y permite navegar entre modulos.',
      recommendations: [
        'Si la primera carga demora, puede deberse a que el backend Render Free estaba dormido.',
        'Si una vista muestra error de conexion, refrescar despues de unos segundos y validar conectividad.',
      ],
      validations: ['Actualmente no hay login real ni control de roles; la app inicia con usuario Admin local.'],
    },
    {
      id: 'navegacion',
      title: 'Navegacion general',
      objective: 'Moverse entre los modulos principales de ESG Monitor.',
      steps: [
        'Usar la barra lateral en escritorio.',
        'En movil, abrir el menu superior y seleccionar la opcion deseada.',
        'Entrar a Dashboard, Proveedores Criticos, Cargar Archivo, Avances, Evaluaciones o Documentacion.',
      ],
      expected: 'Cada opcion abre su pagina correspondiente sin perder el contexto de la aplicacion.',
      recommendations: ['Usar Avances para el seguimiento operativo y Dashboard para revision ejecutiva.'],
      validations: ['Si una pagina no existe, la aplicacion muestra la vista PageNotFound.'],
    },
    {
      id: 'dashboard',
      title: 'Dashboard',
      objective: 'Revisar el estado ejecutivo del avance de encuestas ESG.',
      steps: [
        'Ingresar a Dashboard.',
        'Revisar KPIs: Avance Global, Proveedores Criticos, Completados y Pendientes.',
        'Analizar graficos por unidad y por tipo.',
        'Abrir el detalle por unidad para ver separacion retail y no retail.',
      ],
      expected: 'El usuario identifica rapidamente porcentaje de avance, pendientes y unidades con mayor brecha.',
      recommendations: [
        'Usar esta vista en reuniones de seguimiento.',
        'Si no hay datos, cargar proveedores criticos y archivos XLSX primero.',
      ],
      validations: ['Los datos dependen de la funcion SQL get_dashboard_metrics en Supabase.'],
    },
    {
      id: 'proveedores',
      title: 'Gestion de proveedores criticos',
      objective: 'Mantener el catalogo de proveedores criticos y su relacion con unidades.',
      steps: [
        'Entrar a Proveedores Criticos.',
        'Buscar por nombre, RUC o unidad.',
        'Filtrar por unidad o tipo.',
        'Usar Agregar Proveedor para crear una relacion proveedor-unidad.',
        'Seleccionar un proveedor existente desde la busqueda o registrar uno nuevo.',
        'Editar o eliminar la relacion con los botones de accion.',
      ],
      expected: 'El proveedor queda asociado a una unidad y tipo retail/no retail para su seguimiento.',
      recommendations: [
        'Preferir RUC cuando este disponible para mejorar matching.',
        'Evitar crear duplicados: el formulario avisa si el RUC o la relacion ya existen.',
      ],
      validations: [
        'Nombre o proveedor existente es requerido.',
        'Unidad y tipo son requeridos.',
        'La eliminacion borra solo la relacion proveedor-unidad, no el proveedor base.',
      ],
    },
    {
      id: 'carga',
      title: 'Carga y procesamiento de datos',
      objective: 'Registrar proveedores provenientes de archivos ESG en la base de datos.',
      steps: [
        'Entrar a Cargar Archivo.',
        'Arrastrar o seleccionar un archivo .xlsx.',
        'Presionar Procesar Archivo.',
        'Esperar la barra de procesamiento y el resumen final.',
        'Revisar hojas procesadas, registros leidos, unicos, insertados y omitidos.',
      ],
      expected: 'Los proveedores nuevos se guardan en proveedores y quedan disponibles para calculo de avances.',
      recommendations: [
        'Usar archivos .xlsx con hojas por unidad y columnas esperadas.',
        'Corregir datos de origen si hay RUCs incompletos o nombres inconsistentes.',
      ],
      validations: [
        'Solo se aceptan archivos .xlsx.',
        'El backend limita el archivo a 20 MB.',
        'El parser espera fecha en columna B, RUC en D y nombre en E, desde fila 3.',
      ],
    },
    {
      id: 'avances',
      title: 'Avances y seguimiento',
      objective: 'Consultar estado completado o pendiente por proveedor y unidad.',
      steps: [
        'Entrar a Avances.',
        'Usar busqueda por proveedor o RUC.',
        'Filtrar por unidad, tipo, estado, anio o mes.',
        'Revisar fecha de respuesta, metodo de match y unidad donde respondio.',
        'Presionar Actualizar para recargar informacion.',
      ],
      expected: 'La tabla muestra registros completados y pendientes segun los filtros aplicados.',
      recommendations: [
        'Filtrar por unidad y estado pendiente para coordinar acciones.',
        'Revisar metodo de match cuando un proveedor aparezca completado por una unidad distinta.',
      ],
      validations: ['La vista se refresca periodicamente y tambien al presionar Actualizar.'],
    },
    {
      id: 'excel',
      title: 'Exportacion a Excel',
      objective: 'Descargar un reporte ejecutivo de avances con filtros aplicados.',
      steps: [
        'Entrar a Avances.',
        'Aplicar filtros si se requiere un subconjunto.',
        'Presionar Descargar Excel.',
        'Abrir el archivo generado en Excel o herramienta compatible.',
      ],
      expected: 'Se descarga un archivo .xls con resumen ejecutivo y detalle filtrado.',
      recommendations: [
        'Aplicar filtros antes de exportar para reportes por unidad o estado.',
        'Usar el reporte completo cuando se necesite respaldo operativo.',
      ],
      validations: ['Si no hay datos disponibles, la plataforma muestra una alerta y no genera archivo.'],
    },
    {
      id: 'correos',
      title: 'Generacion de correos',
      objective: 'Preparar un correo de seguimiento para proveedores pendientes por unidad.',
      steps: [
        'Entrar a Avances.',
        'Seleccionar una unidad especifica.',
        'Seleccionar estado Pendiente.',
        'Presionar Generar correo para la unidad.',
        'Revisar vista previa y copiar como correo o como HTML.',
      ],
      expected: 'Se copia un mensaje listo para pegar en Outlook o Gmail con tabla de proveedores pendientes.',
      recommendations: [
        'Validar la lista antes de enviar el correo.',
        'Usar Copiar como HTML cuando se requiera conservar formato de tabla.',
      ],
      validations: ['El boton aparece solo cuando hay unidad seleccionada, estado pendiente y registros pendientes.'],
    },
    {
      id: 'evaluaciones',
      title: 'Encuestas ESG y evaluaciones completadas',
      objective: 'Consultar proveedores que completaron evaluacion ESG.',
      steps: [
        'Entrar a Evaluaciones.',
        'Filtrar por anio, mes o unidad cuando existan datos.',
        'Revisar nombre, RUC, unidad y fecha de evaluacion.',
      ],
      expected: 'La plataforma lista los proveedores con evaluacion completada segun los filtros.',
      recommendations: ['Usar esta vista para validar entregables o preparar cortes de cumplimiento.'],
      validations: ['El backend pagina resultados desde la funcion get_proveedores_evaluacion.'],
    },
    {
      id: 'documentacion',
      title: 'Documentacion y descarga PDF',
      objective: 'Consultar y descargar la documentacion tecnica y guia de usuario.',
      steps: [
        'Entrar a Documentacion.',
        'Usar el buscador para encontrar secciones.',
        'Cambiar entre Documentacion Tecnica y Guia de Usuario.',
        'Usar el indice lateral para saltar a una seccion.',
        'Descargar PDF tecnico, PDF de guia o documento completo.',
      ],
      expected: 'El usuario obtiene documentacion legible en web y PDFs ejecutivos.',
      recommendations: ['Actualizar el contenido cuando cambien rutas, tablas, modulos o infraestructura.'],
      validations: ['El PDF se genera en el navegador con fecha de generacion actual.'],
    },
  ],
};

export const workflowDocs = [
  {
    title: 'Flujo de gestion de proveedores',
    steps: ['Buscar proveedor', 'Crear o reutilizar proveedor base', 'Asignar unidad y tipo', 'Guardar relacion', 'Monitorear avance'],
  },
  {
    title: 'Flujo de seguimiento de encuestas pendientes',
    steps: ['Abrir Avances', 'Filtrar unidad', 'Filtrar Pendiente', 'Revisar proveedores', 'Generar correo'],
  },
  {
    title: 'Flujo de generacion de reportes',
    steps: ['Abrir Avances', 'Aplicar filtros', 'Validar conteos', 'Descargar Excel', 'Compartir reporte'],
  },
  {
    title: 'Flujo de carga de informacion',
    steps: ['Seleccionar XLSX', 'Crear upload', 'Parsear hojas', 'Insertar proveedores nuevos', 'Actualizar vistas'],
  },
  {
    title: 'Flujo de descarga de documentacion',
    steps: ['Abrir Documentacion', 'Seleccionar seccion', 'Descargar PDF', 'Revisar portada e indice', 'Compartir con equipo'],
  },
];

export const maintenanceChecklist = [
  'Verificar variables de entorno en Vercel y Render.',
  'Revisar logs de Render ante fallas de API o procesamiento.',
  'Revisar deployments de Vercel si el frontend no refleja cambios.',
  'Revisar tablas, funciones y limites en Supabase.',
  'Hacer backup o exportacion antes de cambios masivos.',
  'Probar carga de archivos con datos reales y casos borde.',
  'Revisar matching por RUC y nombre cuando existan pendientes inesperados.',
  'Actualizar frontend/src/content/docsData.js cada vez que se agregue o modifique un modulo.',
];
