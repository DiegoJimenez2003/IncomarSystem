# Sistema INCOMAR - Gestión Pesquera con Trazabilidad

## Descripción General

INCOMAR es un sistema de gestión industrial para empresas pesqueras que permite el control completo de trazabilidad desde la llegada del producto hasta el embarque final.

## Características Principales

### 1. Sistema de Trazabilidad Dual de Lotes

El sistema maneja dos identificadores de lote:

- **Lote Origen**: Código asignado por el proveedor/barco (Ej: PROV-JUR-2026-001)
- **Lote Interno**: Código interno de la empresa (Ej: INC-359)

Esto permite rastrear el producto desde su origen hasta el destino final, manteniendo la trazabilidad completa incluso cuando se reasignan códigos internos.

**Búsqueda por:**
- Lote origen
- Lote interno
- Guía de despacho
- Producto
- Barco

### 2. Estados de Producto

Sistema flexible de estados para control de calidad:

- **En Revisión**: Producto en proceso de inspección inicial
- **Aprobado**: Producto aprobado para procesamiento/venta
- **Rechazado**: Producto no cumple estándares
- **Pendiente**: Esperando análisis o documentación
- **Contaminado**: Producto con contaminación detectada
- **Procesado**: Producto ya procesado y almacenado

Cada estado tiene:
- Color identificatorio
- Descripción clara
- Estado activo/inactivo
- CRUD completo para roles autorizados

### 3. Gestión de Racks y Movimientos Parciales

El sistema soporta movimientos dinámicos:

**Salidas Parciales:**
- Un rack puede contener 45 cajas
- Se pueden retirar 10, 20 o cualquier cantidad
- El stock se actualiza dinámicamente
- Se mantiene registro de cada movimiento

**Control de Stock:**
- Cajas por rack
- Kilos por rack
- Ubicación física
- Capacidad disponible
- Tipo PAC/NO PAC

**Ejemplo de Movimiento Parcial:**
```
Rack R-PAC-001:
- Capacidad: 45 cajas
- Contenido inicial: 98 cajas Jurel (2200 kg)
- Salida parcial: 60 cajas (1345 kg)
- Stock restante: 38 cajas (855 kg)
```

### 4. Roles y Permisos

#### Administrador
- Acceso completo a todos los módulos
- Gestión de usuarios, productos, plantas
- Configuración del sistema

#### Supervisor/Bodega
- Registro de lotes y procesamiento
- Gestión de racks y movimientos
- Control de stock
- Actualización de inventario

#### Control de Calidad
- Inspecciones y validaciones
- **CRUD completo de estados de producto**
- Registro de observaciones
- Aprobación/rechazo de lotes

#### Secretaria
- **CRUD completo de guías de despacho**
- **CRUD completo de embarques**
- Gestión de documentación
- Consulta de lotes y stock

### 5. Separación PAC / NO PAC

**PAC (Exportación Internacional):**
- Racks dedicados
- Procesamiento separado
- Controles adicionales
- Trazabilidad específica

**NO PAC (Mercado Nacional):**
- Racks dedicados
- Procesamiento local
- Controles estándar

**Regla importante:** Los productos PAC y NO PAC **NO pueden mezclarse** en el mismo rack.

### 6. Módulos del Sistema

1. **Dashboard**: Métricas en tiempo real, alertas, distribución PAC/NO PAC
2. **Lotes**: Gestión con lote origen y lote interno
3. **Guías**: Registro de guías asociadas a lotes
4. **Procesamiento**: Control de rendimientos y merma
5. **Inventario**: Stock por lotes y racks
6. **Racks**: Gestión de ubicaciones
7. **Movimientos**: Entradas, salidas y transferencias (parciales)
8. **Control Calidad**: Inspecciones y estados de producto
9. **Estados Producto**: CRUD de estados personalizados
10. **Embarques**: Seguimiento de despachos
11. **Trazabilidad**: Historial completo del producto
12. **Reportes**: 6 tipos de reportes exportables
13. **Productos**: Catálogo pesquero
14. **Plantas**: Gestión de plantas PAC/NO PAC
15. **Usuarios**: Administración de accesos

### 7. Trazabilidad Completa

El módulo de trazabilidad muestra:

- ✅ Lote origen y lote interno
- ✅ Producto y barco
- ✅ Guías de despacho asociadas
- ✅ Procesamiento y merma
- ✅ Movimientos (entradas/salidas/transferencias)
- ✅ Stock restante en racks
- ✅ Controles de calidad
- ✅ Estados de producto
- ✅ Embarques realizados
- ✅ Historial completo tipo log industrial

### 8. Flujo del Producto

```
1. Llegada desde Barco
   ↓
2. Asignación de Lotes (Origen + Interno)
   ↓
3. Registro de Guías
   ↓
4. Control de Calidad Inicial
   ↓
5. Asignación de Estado
   ↓
6. Procesamiento (Limpieza, Corte)
   ↓
7. Cálculo de Merma y Rendimiento
   ↓
8. Almacenamiento en Racks
   ↓
9. Movimientos (Entradas/Salidas Parciales)
   ↓
10. Control de Calidad Final
    ↓
11. Preparación de Embarque
    ↓
12. Despacho Final
```

## Credenciales de Acceso

```
Administrador:
- Email: admin@incomar.cl
- Password: admin123

Supervisor/Bodega:
- Email: supervisor@incomar.cl
- Password: super123

Control de Calidad:
- Email: calidad@incomar.cl
- Password: calidad123

Secretaria:
- Email: secretaria@incomar.cl
- Password: secre123
```

## Productos Gestionados

- Jurel
- Jibia
- Merluza
- Reineta

## Reportes Disponibles

1. Inventario General
2. Trazabilidad por Lote
3. Movimientos
4. PAC / NO PAC
5. Procesamiento
6. Control de Calidad

## Datos de Demostración

El sistema incluye datos simulados para:
- 4 lotes con trazabilidad completa
- 3 guías de despacho
- 2 procesos productivos
- 4 racks (PAC y NO PAC)
- Múltiples movimientos parciales
- 3 controles de calidad
- 1 embarque
- 6 estados de producto predefinidos

## Persistencia de Datos

Actualmente el sistema usa datos simulados en el frontend. Para tener persistencia real:

1. Conectar Supabase desde la configuración de Make
2. Los datos se almacenarán en tablas relacionales
3. Se mantendrá la trazabilidad completa
4. Todos los movimientos quedarán registrados

**Nota**: Make no está diseñado para información personal identificable (PII) ni datos sensibles.

## Tecnologías Utilizadas

- React 18
- TypeScript
- TailwindCSS v4
- React Router v7
- Recharts (gráficos)
- Lucide React (iconos)

## Arquitectura de Datos

### Relaciones Principales

```
Lotes → Guías (1:N)
Lotes → Procesos (1:N)
Lotes → Controles Calidad (1:N)
Lotes → Inventario (1:N)
Lotes → Movimientos (1:N)
Lotes → Estados Producto (N:1)
Inventario → Racks (N:1)
Movimientos → Racks (N:1)
```

## Ventajas del Sistema

✅ Trazabilidad completa desde origen hasta destino  
✅ Separación PAC/NO PAC  
✅ Movimientos parciales dinámicos  
✅ Estados de producto personalizables  
✅ Control de merma y rendimientos  
✅ Gestión por roles  
✅ Reportes exportables  
✅ Interfaz moderna e intuitiva  
✅ Diseño responsivo  

## Próximos Pasos (Producción)

1. Conectar backend (Supabase)
2. Implementar generación real de PDFs
3. Agregar notificaciones en tiempo real
4. Implementar sistema de alertas automáticas
5. Agregar exportación a Excel
6. Integrar con sistemas externos
7. Agregar cámara para escaneo de códigos
