# Sistema de Trazabilidad y Gestión Pesquera - Incomar

Sistema web desarrollado para la gestión, control y trazabilidad de productos del mar dentro de una planta pesquera. El proyecto digitaliza procesos que antes se realizaban de forma manual mediante Excel y documentos físicos, permitiendo mejorar el control operativo, el almacenamiento y el historial de productos desde su ingreso hasta el despacho final.

---

## Tecnologías utilizadas

| Categoría | Tecnología |
|---|---|
| Framework | React 18 + TypeScript |
| Bundler | Vite |
| Estilos | Tailwind CSS |
| Backend / Base de datos | Supabase (PostgreSQL + Auth + Realtime) |
| Íconos | lucide-react |
| Gráficos | Recharts |
| Generación de PDF | jsPDF + jspdf-autotable |
| Control de versiones | Git & GitHub |

---

## Funcionalidades principales

### Dashboard
Resumen general del sistema con datos en tiempo real desde Supabase: lotes activos, inventario total, embarques activos, observaciones de calidad pendientes, distribución de productos PAC (exportación) / NO PAC (nacional), rendimiento de procesamiento, movimientos recientes y distribución de lotes por estado.

### Trazabilidad de lotes
Búsqueda de lotes por código con vista completa del recorrido: información general, ubicación actual en racks, línea de tiempo unificada (movimientos, asignaciones, controles de calidad, embarques), guías de origen y procesamiento. Incluye **exportación a PDF** de la trazabilidad completa de un lote. Se actualiza en tiempo real ante cambios en la base de datos (Supabase Realtime).

### Inventario
Control de stock actual por rack, con búsqueda por lote/producto/rack, resumen por rack (kilos, cajas, capacidad, lotes) y **exportación a PDF** del inventario completo con resumen general y detalle por rack.

### Plantas
CRUD completo de las plantas físicas de procesamiento (nombre, código, dirección, zona de pesca). Antes de eliminar una planta, el sistema valida que no tenga lotes asociados para evitar romper la integridad de los datos.

### Embarques
Registro de despachos con selección de uno o varios lotes, control de kilos/cajas disponibles por lote (evita sobre-despachar), descuento automático de inventario por rack (FIFO por fecha de ingreso) y generación automática de movimientos de salida. Incluye edición de los datos generales del embarque (cliente, destino, transporte, fecha, observaciones) y cambio de estado (preparando → despachado → en tránsito → entregado).

### Control de calidad
Registro de inspecciones asociadas a cada lote: estado del producto, temperatura, observaciones e inspector responsable.

---

## Estructura del proyecto

```
src/
│
├── components/     # Componentes reutilizables (modales, formularios, etc.)
├── pages/          # Vistas principales (Dashboard, Trazabilidad, Inventario, Plantas, Embarques...)
├── context/         # Contextos de React (ej. AuthContext)
├── assets/         # Recursos estáticos (logos, imágenes)
├── utils/          # Utilidades y configuración del cliente de Supabase
└── styles/         # Estilos globales
```

---

## Requisitos previos

* [Node.js](https://nodejs.org/) 18 o superior
* npm (incluido con Node.js)
* Una cuenta y proyecto creado en [Supabase](https://supabase.com/)
* Visual Studio Code (recomendado, no obligatorio)

---

## Instalación del proyecto

### 1. Clonar el repositorio

```bash
git clone https://github.com/DiegoJimenez2003/IncomarSystem.git
```

### 2. Entrar al proyecto

```bash
cd IncomarSystem
```

### 3. Instalar dependencias

```bash
npm install
```

Esto instala automáticamente todas las dependencias del proyecto, incluyendo:

```bash
npm install @supabase/supabase-js lucide-react recharts jspdf jspdf-autotable
```

(ya están declaradas en `package.json`, este paso extra solo es necesario si alguna falta al clonar).

### 4. Configurar variables de entorno

Crear un archivo `.env` en la raíz del proyecto con las credenciales de tu proyecto de Supabase (las encontrás en tu panel de Supabase → *Project Settings* → *API*):

```bash
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-anonima-publica
```

> ⚠️ El archivo `.env` no debe subirse al repositorio. Verificar que esté incluido en `.gitignore`.

### 5. Preparar la base de datos

En el proyecto de Supabase, ejecutar el script SQL con la definición de tablas (`schema.sql`, si el repositorio lo incluye) desde el **SQL Editor** de Supabase. Esto crea las tablas necesarias: `usuarios`, `roles`, `especies`, `productos`, `plantas`, `racks`, `lotes`, `detalle_lote`, `movimientos`, `tipos_movimiento`, `guias`, `embarques`, `embarque_detalle`, `estados_embarque`, `control_calidad`, `estados_producto`, `procesamientos`, `documentos`, `categorias_documentos`, `etiquetas` y `turnos`, junto a sus relaciones.

También conviene cargar datos iniciales (seed) para las tablas de referencia (`roles`, `estados_producto`, `estados_embarque`, `tipos_movimiento`), ya que varias vistas del sistema dependen de que existan valores como `"salida"` en `tipos_movimiento` o `"preparando"` en `estados_embarque`.

### 6. Ejecutar el entorno de desarrollo

```bash
npm run dev
```

### 7. Abrir en el navegador

```
http://localhost:5173
```

---

## Compilar para producción

```bash
npm run build
```

Los archivos optimizados se generan en la carpeta `dist/`, listos para desplegar en cualquier servicio de hosting estático (Vercel, Netlify, etc.).

---

## Estado actual del proyecto

**En desarrollo activo.**

Implementado hasta el momento:

* ✅ Dashboard con datos reales de Supabase
* ✅ Trazabilidad de lotes con exportación a PDF y actualización en tiempo real
* ✅ Inventario por rack con exportación a PDF
* ✅ CRUD de plantas
* ✅ Registro y edición de embarques, con descuento automático de inventario
* ✅ Control de calidad por lote

Pendiente / en definición:

* Gestión de usuarios y roles desde la interfaz
* Reportes operacionales adicionales
* Refinamiento de permisos por rol en todas las vistas

---

## Autor

Desarrollado por **Diego Jiménez**
Proyecto de práctica profesional enfocado en la digitalización de procesos pesqueros y trazabilidad industrial.