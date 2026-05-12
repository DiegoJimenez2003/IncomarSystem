export interface Producto {
  id: string;
  nombre: string;
  tipo: 'pescado' | 'marisco';
  exportable: boolean;
  tipoPac: 'PAC' | 'NO_PAC' | 'AMBOS';
}

export interface Planta {
  id: string;
  nombre: string;
  ubicacion: string;
  tipo: 'PAC' | 'NO_PAC';
  activa: boolean;
}

export interface EstadoProducto {
  id: string;
  nombre: string;
  descripcion: string;
  color: string;
  activo: boolean;
}

export interface Lote {
  id: string;
  loteOrigen: string;
  loteInterno: string;
  productoId: string;
  productoNombre: string;
  plantaId: string;
  plantaNombre: string;
  fechaLlegada: string;
  estado: 'activo' | 'procesando' | 'procesado' | 'despachado';
  estadoProductoId?: string;
  kilosEntrada: number;
  observaciones?: string;
}

export interface GuiaDespacho {
  id: string;
  numero: string;
  loteId: string;
  loteCodigo: string;
  barco: string;
  origen: string;
  destino: string;
  kilos: number;
  fecha: string;
}

export interface ProcesoProductivo {
  id: string;
  loteId: string;
  loteCodigo: string;
  fecha: string;
  kilosEntrada: number;
  kilosSalida: number;
  merma: number;
  rendimiento: number;
  formato: string;
  responsable: string;
}

export interface DetalleProceso {
  id: string;
  procesoId: string;
  tipoParte: string;
  cajas: number;
  kilos: number;
}

export interface Rack {
  id: string;
  codigo: string;
  capacidadMaxima: number;
  capacidadActual: number;
  ubicacion: string;
  estado: 'disponible' | 'parcial' | 'lleno' | 'mantenimiento';
  tipo: 'PAC' | 'NO_PAC';
}

export interface ItemInventario {
  id: string;
  loteId: string;
  loteCodigo: string;
  productoId: string;
  productoNombre: string;
  rackId: string;
  rackCodigo: string;
  cajas: number;
  kilos: number;
  tipoParte?: string;
  fechaIngreso: string;
}

export interface Movimiento {
  id: string;
  tipo: 'entrada' | 'salida' | 'transferencia';
  loteId: string;
  loteCodigo: string;
  productoNombre: string;
  rackOrigenId?: string;
  rackDestinoId?: string;
  rackCodigo?: string;
  cajas: number;
  kilos: number;
  fecha: string;
  responsable: string;
  notas?: string;
}

export interface ControlCalidad {
  id: string;
  loteId: string;
  loteCodigo: string;
  productoNombre: string;
  fecha: string;
  inspector: string;
  estado: 'aprobado' | 'rechazado' | 'observado';
  temperatura?: number;
  aspecto: string;
  olor: string;
  observaciones?: string;
  incidencias?: string;
}

export interface Embarque {
  id: string;
  codigo: string;
  loteIds: string[];
  destino: string;
  transporte: string;
  cajasTotal: number;
  kilosTotal: number;
  fecha: string;
  responsable: string;
  estado: 'preparando' | 'despachado' | 'en_transito' | 'entregado';
}

export const productosData: Producto[] = [
  {
    id: 'p1',
    nombre: 'Jurel',
    tipo: 'pescado',
    exportable: true,
    tipoPac: 'AMBOS',
  },
  {
    id: 'p2',
    nombre: 'Jibia',
    tipo: 'marisco',
    exportable: true,
    tipoPac: 'AMBOS',
  },
  {
    id: 'p3',
    nombre: 'Merluza',
    tipo: 'pescado',
    exportable: true,
    tipoPac: 'PAC',
  },
  {
    id: 'p4',
    nombre: 'Reineta',
    tipo: 'pescado',
    exportable: false,
    tipoPac: 'NO_PAC',
  },
];

export const estadosProductoData: EstadoProducto[] = [
  {
    id: 'ep1',
    nombre: 'En Revisión',
    descripcion: 'Producto en proceso de inspección inicial',
    color: 'yellow',
    activo: true,
  },
  {
    id: 'ep2',
    nombre: 'Aprobado',
    descripcion: 'Producto aprobado para procesamiento/venta',
    color: 'green',
    activo: true,
  },
  {
    id: 'ep3',
    nombre: 'Rechazado',
    descripcion: 'Producto no cumple estándares de calidad',
    color: 'red',
    activo: true,
  },
  {
    id: 'ep4',
    nombre: 'Pendiente',
    descripcion: 'Esperando análisis o documentación',
    color: 'gray',
    activo: true,
  },
  {
    id: 'ep5',
    nombre: 'Contaminado',
    descripcion: 'Producto con contaminación detectada',
    color: 'red',
    activo: true,
  },
  {
    id: 'ep6',
    nombre: 'Procesado',
    descripcion: 'Producto ya procesado y almacenado',
    color: 'blue',
    activo: true,
  },
];

export const plantasData: Planta[] = [
  {
    id: 'pl1',
    nombre: 'Planta Norte - PAC',
    ubicacion: 'Iquique',
    tipo: 'PAC',
    activa: true,
  },
  {
    id: 'pl2',
    nombre: 'Planta Sur - Nacional',
    ubicacion: 'Puerto Montt',
    tipo: 'NO_PAC',
    activa: true,
  },
];

export const lotesData: Lote[] = [
  {
    id: 'l1',
    loteOrigen: 'PROV-JUR-2026-001',
    loteInterno: 'INC-359',
    productoId: 'p1',
    productoNombre: 'Jurel',
    plantaId: 'pl1',
    plantaNombre: 'Planta Norte - PAC',
    fechaLlegada: '2026-05-01T08:00:00',
    estado: 'procesado',
    estadoProductoId: 'ep2',
    kilosEntrada: 2500,
    observaciones: 'Calidad excelente',
  },
  {
    id: 'l2',
    loteOrigen: 'PROV-JUR-2026-002',
    loteInterno: 'INC-360',
    productoId: 'p1',
    productoNombre: 'Jurel',
    plantaId: 'pl1',
    plantaNombre: 'Planta Norte - PAC',
    fechaLlegada: '2026-05-02T09:30:00',
    estado: 'procesando',
    estadoProductoId: 'ep1',
    kilosEntrada: 3000,
  },
  {
    id: 'l3',
    loteOrigen: 'BARCO-JIB-589',
    loteInterno: 'INC-JB359',
    productoId: 'p2',
    productoNombre: 'Jibia',
    plantaId: 'pl1',
    plantaNombre: 'Planta Norte - PAC',
    fechaLlegada: '2026-05-03T07:15:00',
    estado: 'activo',
    estadoProductoId: 'ep4',
    kilosEntrada: 1800,
  },
  {
    id: 'l4',
    loteOrigen: 'PROV-MER-2026-120',
    loteInterno: 'INC-MZ120',
    productoId: 'p3',
    productoNombre: 'Merluza',
    plantaId: 'pl1',
    plantaNombre: 'Planta Norte - PAC',
    fechaLlegada: '2026-05-05T10:00:00',
    estado: 'procesado',
    estadoProductoId: 'ep6',
    kilosEntrada: 2200,
  },
];

export const guiasData: GuiaDespacho[] = [
  {
    id: 'g1',
    numero: 'GD-001-2026',
    loteId: 'l1',
    loteCodigo: 'INC-359',
    barco: 'Pacifico I',
    origen: 'Iquique',
    destino: 'Planta Norte',
    kilos: 2500,
    fecha: '2026-05-01T08:00:00',
  },
  {
    id: 'g2',
    numero: 'GD-002-2026',
    loteId: 'l2',
    loteCodigo: 'INC-360',
    barco: 'Pacifico II',
    origen: 'Iquique',
    destino: 'Planta Norte',
    kilos: 3000,
    fecha: '2026-05-02T09:30:00',
  },
  {
    id: 'g3',
    numero: 'GD-003-2026',
    loteId: 'l3',
    loteCodigo: 'INC-JB359',
    barco: 'Austral Mar',
    origen: 'Talcahuano',
    destino: 'Planta Norte',
    kilos: 1800,
    fecha: '2026-05-03T07:15:00',
  },
];

export const procesosData: ProcesoProductivo[] = [
  {
    id: 'pr1',
    loteId: 'l1',
    loteCodigo: 'INC-359',
    fecha: '2026-05-01T14:00:00',
    kilosEntrada: 2500,
    kilosSalida: 2200,
    merma: 300,
    rendimiento: 88,
    formato: 'Entero limpio',
    responsable: 'Juan Supervisor',
  },
  {
    id: 'pr2',
    loteId: 'l4',
    loteCodigo: 'INC-MZ120',
    fecha: '2026-05-05T15:30:00',
    kilosEntrada: 2200,
    kilosSalida: 1850,
    merma: 350,
    rendimiento: 84.1,
    formato: 'Filete sin piel',
    responsable: 'Juan Supervisor',
  },
];

export const detallesProcesoData: DetalleProceso[] = [
  {
    id: 'dp1',
    procesoId: 'pr1',
    tipoParte: 'Entero limpio',
    cajas: 98,
    kilos: 2200,
  },
  {
    id: 'dp2',
    procesoId: 'pr2',
    tipoParte: 'Filete',
    cajas: 82,
    kilos: 1850,
  },
];

export const racksData: Rack[] = [
  {
    id: 'r1',
    codigo: 'R-PAC-001',
    capacidadMaxima: 45,
    capacidadActual: 38,
    ubicacion: 'Cámara 1 - Zona A',
    estado: 'parcial',
    tipo: 'PAC',
  },
  {
    id: 'r2',
    codigo: 'R-PAC-002',
    capacidadMaxima: 45,
    capacidadActual: 45,
    ubicacion: 'Cámara 1 - Zona B',
    estado: 'lleno',
    tipo: 'PAC',
  },
  {
    id: 'r3',
    codigo: 'R-PAC-003',
    capacidadMaxima: 45,
    capacidadActual: 0,
    ubicacion: 'Cámara 2 - Zona A',
    estado: 'disponible',
    tipo: 'PAC',
  },
  {
    id: 'r4',
    codigo: 'R-NOPAC-001',
    capacidadMaxima: 45,
    capacidadActual: 25,
    ubicacion: 'Cámara 3 - Zona A',
    estado: 'parcial',
    tipo: 'NO_PAC',
  },
];

export const inventarioData: ItemInventario[] = [
  {
    id: 'inv1',
    loteId: 'l1',
    loteCodigo: 'INC-359',
    productoId: 'p1',
    productoNombre: 'Jurel',
    rackId: 'r1',
    rackCodigo: 'R-PAC-001',
    cajas: 38,
    kilos: 855,
    tipoParte: 'Entero limpio',
    fechaIngreso: '2026-05-01T16:00:00',
  },
  {
    id: 'inv2',
    loteId: 'l4',
    loteCodigo: 'INC-MZ120',
    productoId: 'p3',
    productoNombre: 'Merluza',
    rackId: 'r2',
    rackCodigo: 'R-PAC-002',
    cajas: 45,
    kilos: 1012,
    tipoParte: 'Filete',
    fechaIngreso: '2026-05-05T17:30:00',
  },
];

export const movimientosData: Movimiento[] = [
  {
    id: 'm1',
    tipo: 'entrada',
    loteId: 'l1',
    loteCodigo: 'INC-359',
    productoNombre: 'Jurel',
    rackDestinoId: 'r1',
    rackCodigo: 'R-PAC-001',
    cajas: 98,
    kilos: 2200,
    fecha: '2026-05-01T16:00:00',
    responsable: 'Juan Supervisor',
    notas: 'Ingreso después de procesamiento',
  },
  {
    id: 'm2',
    tipo: 'salida',
    loteId: 'l1',
    loteCodigo: 'INC-359',
    productoNombre: 'Jurel',
    rackOrigenId: 'r1',
    rackCodigo: 'R-PAC-001',
    cajas: 60,
    kilos: 1345,
    fecha: '2026-05-04T10:00:00',
    responsable: 'Ana Secretaria',
    notas: 'Despacho parcial a cliente exportación',
  },
  {
    id: 'm3',
    tipo: 'entrada',
    loteId: 'l4',
    loteCodigo: 'INC-MZ120',
    productoNombre: 'Merluza',
    rackDestinoId: 'r2',
    rackCodigo: 'R-PAC-002',
    cajas: 82,
    kilos: 1850,
    fecha: '2026-05-05T17:30:00',
    responsable: 'Juan Supervisor',
  },
];

export const calidadData: ControlCalidad[] = [
  {
    id: 'cc1',
    loteId: 'l1',
    loteCodigo: 'INC-359',
    productoNombre: 'Jurel',
    fecha: '2026-05-01T12:00:00',
    inspector: 'María Calidad',
    estado: 'aprobado',
    temperatura: -18,
    aspecto: 'Excelente',
    olor: 'Fresco característico',
    observaciones: 'Producto en óptimas condiciones',
  },
  {
    id: 'cc2',
    loteId: 'l3',
    loteCodigo: 'INC-JB359',
    productoNombre: 'Jibia',
    fecha: '2026-05-03T10:00:00',
    inspector: 'María Calidad',
    estado: 'observado',
    temperatura: -17,
    aspecto: 'Bueno',
    olor: 'Normal',
    observaciones: 'Algunas piezas con decoloración menor',
    incidencias: 'Separar piezas con decoloración',
  },
  {
    id: 'cc3',
    loteId: 'l4',
    loteCodigo: 'INC-MZ120',
    productoNombre: 'Merluza',
    fecha: '2026-05-05T14:00:00',
    inspector: 'María Calidad',
    estado: 'aprobado',
    temperatura: -19,
    aspecto: 'Excelente',
    olor: 'Fresco',
  },
];

export const embarquesData: Embarque[] = [
  {
    id: 'e1',
    codigo: 'EMB-001-2026',
    loteIds: ['l1'],
    destino: 'Estados Unidos - Miami',
    transporte: 'Contenedor refrigerado TC-4521',
    cajasTotal: 60,
    kilosTotal: 1345,
    fecha: '2026-05-04T10:00:00',
    responsable: 'Ana Secretaria',
    estado: 'despachado',
  },
];
