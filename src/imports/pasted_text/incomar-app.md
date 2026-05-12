Diseña una aplicación web moderna, profesional y responsive para una empresa pesquera llamada INCOMAR, enfocada en trazabilidad, inventario y control de procesamiento de productos del mar. El sistema debe ser simple de usar para trabajadores administrativos y operativos, evitando complejidad innecesaria, pero manteniendo una estructura empresarial sólida y profesional.

La aplicación estará enfocada principalmente en:

* Trazabilidad de productos
* Gestión de lotes
* Inventario y stock
* Movimientos de productos
* Control de procesamiento
* Control de calidad
* Reportes
* Gestión de usuarios y roles

El diseño debe parecer un sistema empresarial moderno, limpio, minimalista y eficiente, usando:

* React
* TailwindCSS
* Componentes reutilizables
* Dashboard administrativo
* Sidebar lateral
* Tablas profesionales
* Formularios claros
* Tarjetas estadísticas
* Modo responsive para tablet y escritorio

NO hacer un ecommerce.
NO mostrar precios, ventas ni finanzas.
NO enfocarse en clientes externos.
Es un sistema interno industrial/administrativo.

========================================
ACTORES DEL SISTEMA
===================

1. Administrador / Gerente

* Acceso completo
* Gestiona usuarios
* Gestiona productos
* Gestiona lotes
* Gestiona racks
* Gestiona plantas
* Ve reportes generales
* Modifica información incorrecta
* Ve trazabilidad completa
* Controla inventario general

2. Supervisor / Bodega

* Registra lotes
* Registra procesamiento
* Registra movimientos
* Gestiona racks
* Controla stock
* Actualiza inventario

3. Control de Calidad

* Revisa productos
* Registra observaciones
* Valida estado del producto
* Registra controles sanitarios
* Ve fechas y trazabilidad

4. Secretaria

* Registra guías
* Registra embarques
* Gestiona documentación
* Consulta lotes
* Consulta stock y despachos

========================================
FUNCIONAMIENTO DEL NEGOCIO
==========================

La empresa recibe productos del mar desde barcos.

Productos:

* Jurel
* Jibia
* Merluza
* Reineta

Cada llegada recibe un LOTE único.

Ejemplo:

* Lote 359 → Jurel
* Lote 360 → Jurel
* Lote JB359 → Jibia

Los lotes NO cambian durante todo el proceso y se mantienen hasta el destino final.

Un barco puede traer varias guías de despacho asociadas al mismo lote.

El producto llega en bins (contenedores grandes).

Luego pasa por procesamiento:

* Limpieza
* Corte
* Separación

Ejemplo Jibia:

* Tentáculos
* Aletas
* Reproductor

Los productos se almacenan en racks.

Cada rack puede contener aproximadamente:

* 45 cajas
* cada caja entre 20 y 25 kg

Las salidas de productos NO necesariamente sacan un rack completo.
Se pueden retirar:

* 10 cajas
* 20 cajas
* parcialidades

Por lo tanto el sistema debe manejar:

* movimientos parciales
* stock dinámico
* trazabilidad completa

Existe separación PAC y NO PAC:

* PAC → exportación internacional
* NO PAC → mercado nacional

Los productos NO PAC no pueden mezclarse con PAC.

========================================
MÓDULOS DEL SISTEMA
===================

1. Login

* Inicio de sesión
* Recuperación de contraseña
* Roles y permisos

2. Dashboard

* Resumen visual
* Lotes activos
* Productos procesados
* Stock actual
* Embarques recientes
* Alertas de calidad
* Estado PAC / NO PAC

3. Gestión de Usuarios
   CRUD completo:

* Crear usuario
* Editar usuario
* Eliminar usuario
* Cambiar rol
* Activar/desactivar usuario

4. Gestión de Roles
   CRUD:

* Crear rol
* Editar permisos
* Eliminar rol

5. Gestión de Productos
   CRUD:

* Crear producto
* Editar producto
* Eliminar producto
* Definir exportable
* Definir tipo PAC

6. Gestión de Plantas
   CRUD:

* Crear planta
* Editar planta
* Definir PAC o NO PAC
* Eliminar planta

7. Gestión de Lotes
   CRUD:

* Registrar lote
* Editar lote
* Asociar producto
* Asociar planta
* Registrar fecha llegada
* Estado del lote
* Observaciones

8. Gestión de Guías
   CRUD:

* Registrar guía
* Asociar guía a lote
* Registrar barco
* Origen
* Destino
* Kilos entrada

9. Procesamiento Productivo
   CRUD:

* Registrar procesamiento
* Registrar merma
* Registrar rendimiento
* Registrar formato del producto
* Registrar kilos salida

10. Detalle de Procesamiento
    CRUD:

* Registrar partes procesadas
* Tentáculos
* Aletas
* Reproductor
* Cantidad de cajas
* Kilos

11. Gestión de Racks
    CRUD:

* Crear rack
* Editar rack
* Capacidad máxima
* Estado
* Ubicación

12. Inventario

* Ver stock actual
* Ver cajas disponibles
* Ver kilos disponibles
* Ver ubicación en racks
* Historial de movimientos

13. Movimientos
    CRUD:

* Entrada
* Salida
* Salidas parciales
* Transferencias
* Historial de movimientos

14. Control de Calidad
    CRUD:

* Registrar observaciones
* Aprobar producto
* Rechazar producto
* Registrar incidencias
* Registrar inspecciones sanitarias

15. Embarques
    CRUD:

* Registrar embarque
* Destino
* Cantidad enviada
* Fecha
* Transporte

16. Reportes

* Reporte de inventario
* Reporte de trazabilidad
* Reporte de movimientos
* Reporte por producto
* Reporte por lote
* Reporte PAC/NO PAC
* Exportar PDF

========================================
BASE DE DATOS
=============

Crear estructura considerando:

TABLAS:

* usuarios
* roles
* productos
* plantas
* lotes
* guias_despacho
* procesos_productivos
* detalle_proceso
* racks
* inventario
* movimientos
* control_calidad
* embarques

Usar relaciones reales:

* One to Many
* Foreign Keys
* Trazabilidad completa

========================================
DISEÑO VISUAL
=============

El diseño debe verse:

* Industrial
* Profesional
* Empresarial
* Moderno
* Minimalista

Inspiración:

* ERP
* Sistema de bodega
* Dashboard logístico
* Inventario industrial

Usar:

* Sidebar oscuro
* Cards modernas
* Tablas avanzadas
* Colores sobrios
* Azul industrial
* Gris
* Blanco
* Indicadores visuales PAC/NO PAC

========================================
PANTALLAS IMPORTANTES
=====================

* Login
* Dashboard
* Inventario
* Lotes
* Productos
* Guías
* Racks
* Calidad
* Reportes
* Usuarios
* Embarques
* Historial de trazabilidad

========================================
TRAZABILIDAD (MUY IMPORTANTE)
=============================

Debe existir una pantalla donde al seleccionar un lote se pueda visualizar:

* Producto
* Fecha llegada
* Barco
* Guías asociadas
* Procesamiento realizado
* Merma
* Inventario restante
* Racks utilizados
* Movimientos
* Controles de calidad
* Embarques realizados
* Estado actual

Debe parecer un historial completo del producto desde llegada hasta salida final.

========================================
OBJETIVO GENERAL
================

Crear un sistema web empresarial funcional y realista para reemplazar:

* Excel
* Documentos manuales
* Registros físicos

El sistema debe mejorar:

* organización
* trazabilidad
* control de stock
* control operativo
* consulta rápida de información
* gestión de inventario
* control de productos pesqueros
