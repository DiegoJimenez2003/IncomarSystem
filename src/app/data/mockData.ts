export interface Producto {
  id: string;
  nombre: string;
  tipo: string;
  estado: 'fresco' | 'congelado';
  precio: number;
  cantidad: number;
  stockMinimo: number;
  unidad: string;
}

export interface Movimiento {
  id: string;
  productoId: string;
  productoNombre: string;
  tipo: 'entrada' | 'salida';
  cantidad: number;
  fecha: string;
  responsable: string;
  notas?: string;
}

export interface Empleado {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  cargo: string;
  area: string;
}

export const productosData: Producto[] = [
  {
    id: 'p1',
    nombre: 'Salmón Atlántico',
    tipo: 'Pescado',
    estado: 'fresco',
    precio: 8500,
    cantidad: 45,
    stockMinimo: 20,
    unidad: 'kg',
  },
  {
    id: 'p2',
    nombre: 'Merluza Austral',
    tipo: 'Pescado',
    estado: 'congelado',
    precio: 4200,
    cantidad: 120,
    stockMinimo: 30,
    unidad: 'kg',
  },
  {
    id: 'p3',
    nombre: 'Camarones',
    tipo: 'Marisco',
    estado: 'fresco',
    precio: 12000,
    cantidad: 15,
    stockMinimo: 10,
    unidad: 'kg',
  },
  {
    id: 'p4',
    nombre: 'Ostiones',
    tipo: 'Marisco',
    estado: 'fresco',
    precio: 15000,
    cantidad: 8,
    stockMinimo: 15,
    unidad: 'kg',
  },
  {
    id: 'p5',
    nombre: 'Congrio',
    tipo: 'Pescado',
    estado: 'fresco',
    precio: 6800,
    cantidad: 35,
    stockMinimo: 20,
    unidad: 'kg',
  },
  {
    id: 'p6',
    nombre: 'Reineta',
    tipo: 'Pescado',
    estado: 'congelado',
    precio: 5500,
    cantidad: 80,
    stockMinimo: 25,
    unidad: 'kg',
  },
  {
    id: 'p7',
    nombre: 'Jaiba',
    tipo: 'Marisco',
    estado: 'fresco',
    precio: 9500,
    cantidad: 22,
    stockMinimo: 15,
    unidad: 'kg',
  },
  {
    id: 'p8',
    nombre: 'Choritos',
    tipo: 'Marisco',
    estado: 'congelado',
    precio: 3500,
    cantidad: 60,
    stockMinimo: 20,
    unidad: 'kg',
  },
];

export const movimientosData: Movimiento[] = [
  {
    id: 'm1',
    productoId: 'p1',
    productoNombre: 'Salmón Atlántico',
    tipo: 'entrada',
    cantidad: 50,
    fecha: '2026-04-20T08:30:00',
    responsable: 'Juan Bodeguero',
    notas: 'Entrega proveedor MarChile',
  },
  {
    id: 'm2',
    productoId: 'p3',
    productoNombre: 'Camarones',
    tipo: 'salida',
    cantidad: 10,
    fecha: '2026-04-20T10:15:00',
    responsable: 'Juan Bodeguero',
    notas: 'Pedido restaurante El Pescador',
  },
  {
    id: 'm3',
    productoId: 'p2',
    productoNombre: 'Merluza Austral',
    tipo: 'entrada',
    cantidad: 100,
    fecha: '2026-04-19T14:20:00',
    responsable: 'Juan Bodeguero',
  },
  {
    id: 'm4',
    productoId: 'p4',
    productoNombre: 'Ostiones',
    tipo: 'salida',
    cantidad: 12,
    fecha: '2026-04-19T16:45:00',
    responsable: 'Carlos Administrador',
    notas: 'Pedido especial cliente VIP',
  },
  {
    id: 'm5',
    productoId: 'p5',
    productoNombre: 'Congrio',
    tipo: 'entrada',
    cantidad: 40,
    fecha: '2026-04-18T09:00:00',
    responsable: 'Juan Bodeguero',
  },
];

export const empleadosData: Empleado[] = [
  {
    id: 'e1',
    nombre: 'Carlos Administrador',
    email: 'admin@mariscos.cl',
    telefono: '+56 9 8765 4321',
    cargo: 'Administrador General',
    area: 'Administración',
  },
  {
    id: 'e2',
    nombre: 'Juan Bodeguero',
    email: 'bodega@mariscos.cl',
    telefono: '+56 9 7654 3210',
    cargo: 'Encargado de Bodega',
    area: 'Operaciones',
  },
  {
    id: 'e3',
    nombre: 'María Supervisora',
    email: 'supervisor@mariscos.cl',
    telefono: '+56 9 6543 2109',
    cargo: 'Supervisora de Calidad',
    area: 'Calidad',
  },
  {
    id: 'e4',
    nombre: 'Pedro González',
    email: 'pedro@mariscos.cl',
    telefono: '+56 9 5432 1098',
    cargo: 'Operario de Bodega',
    area: 'Operaciones',
  },
  {
    id: 'e5',
    nombre: 'Ana Martínez',
    email: 'ana@mariscos.cl',
    telefono: '+56 9 4321 0987',
    cargo: 'Asistente Administrativa',
    area: 'Administración',
  },
];
