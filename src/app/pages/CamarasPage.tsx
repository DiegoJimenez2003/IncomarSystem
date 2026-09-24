import { useEffect, useMemo, useState } from 'react';
import { Snowflake, Package, Search, X, Layers } from 'lucide-react';
import { supabase } from '../../utils/supabase';

type FiltroCamara = 'todas' | 'PAC' | 'NO_PAC';

const OPCIONES_CAMARA: { valor: FiltroCamara; etiqueta: string }[] = [
{ valor: 'todas', etiqueta: 'Todas' },
{ valor: 'PAC', etiqueta: 'Cámara PAC' },
{ valor: 'NO_PAC', etiqueta: 'Cámara NO PAC' },
];

// Cuenta lotes distintos (un mismo lote puede tener varios registros en la cámara)
function contarLotesDistintos(items: any[]) {
return new Set(items.map((i) => i.lotes?.codigo_lote).filter(Boolean)).size;
}

function sumarKilos(items: any[]) {
return items.reduce((sum, i) => sum + (Number(i.kilos) || 0), 0);
}

function sumarCajas(items: any[]) {
return items.reduce((sum, i) => sum + (Number(i.cajas) || 0), 0);
}

export function CamarasPage() {
const [detalle, setDetalle] = useState<any[]>([]);
const [loading, setLoading] = useState(true);
const [, forceTick] = useState(0);

// Filtros
const [busqueda, setBusqueda] = useState('');
const [filtroCamara, setFiltroCamara] = useState<FiltroCamara>('todas');
const [filtroEspecie, setFiltroEspecie] = useState('');

useEffect(() => {
cargarDatos();
}, []);

// Refresca cada minuto para actualizar el contador de tiempo
useEffect(() => {
const interval = setInterval(() => forceTick((t) => t + 1), 60000);
return () => clearInterval(interval);
}, []);

async function cargarDatos() {
setLoading(true);

const { data, error } = await supabase
    .from('detalle_camara')
    .select(`
    id,
    kilos,
    cajas,
    fecha_ingreso,
    camaras ( id, nombre, tipo ),
    lotes (
        codigo_lote,
        especies ( nombre )
    )
    `)
    .order('fecha_ingreso', { ascending: false });

if (error) {
    console.error(error);
} else {
    setDetalle(data ?? []);
}

setLoading(false);
}

function tiempoTranscurrido(fecha: string) {
const inicio = new Date(fecha).getTime();
const ahora = Date.now();
const diffMs = ahora - inicio;

const dias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
const horas = Math.floor((diffMs / (1000 * 60 * 60)) % 24);

if (dias > 0) return `${dias}d ${horas}h`;
return `${horas}h`;
}

// ======================================================
// RESUMEN (siempre sobre el total, sin filtros)
// ======================================================

const resumen = useMemo(() => {
const pacTodos = detalle.filter((d) => d.camaras?.tipo === 'PAC');
const noPacTodos = detalle.filter((d) => d.camaras?.tipo === 'NO_PAC');

return {
    lotesTotales: contarLotesDistintos(detalle),
    lotesPAC: contarLotesDistintos(pacTodos),
    lotesNoPAC: contarLotesDistintos(noPacTodos),
    kilosTotales: sumarKilos(detalle),
    cajasTotales: sumarCajas(detalle),
};
}, [detalle]);

// ======================================================
// FILTROS
// ======================================================

const especiesDisponibles = useMemo(() => {
const nombres = new Set<string>(
    detalle.map((d) => d.lotes?.especies?.nombre).filter((n): n is string => Boolean(n))
);
return Array.from(nombres).sort((a, b) => a.localeCompare(b));
}, [detalle]);

const detalleFiltrado = useMemo(() => {
const q = busqueda.trim().toLowerCase();

return detalle.filter((d) => {
    if (filtroCamara !== 'todas' && d.camaras?.tipo !== filtroCamara) {
    return false;
    }

    if (filtroEspecie && d.lotes?.especies?.nombre !== filtroEspecie) {
    return false;
    }

    if (q) {
    const codigo = (d.lotes?.codigo_lote ?? '').toLowerCase();
    const especie = (d.lotes?.especies?.nombre ?? '').toLowerCase();
    if (!codigo.includes(q) && !especie.includes(q)) return false;
    }

    return true;
});
}, [detalle, busqueda, filtroCamara, filtroEspecie]);

const hayFiltrosActivos = busqueda !== '' || filtroCamara !== 'todas' || filtroEspecie !== '';

function limpiarFiltros() {
setBusqueda('');
setFiltroCamara('todas');
setFiltroEspecie('');
}

const pac = detalleFiltrado.filter((d) => d.camaras?.tipo === 'PAC');
const noPac = detalleFiltrado.filter((d) => d.camaras?.tipo === 'NO_PAC');

// ======================================================
// COLUMNA DE CÁMARA
// ======================================================

function renderColumna(titulo: string, items: any[], color: string) {
const totalKilos = sumarKilos(items);
const totalCajas = sumarCajas(items);
const lotesDistintos = contarLotesDistintos(items);

return (
    <div className="bg-white p-6 rounded-xl border border-gray-200">
    <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
        <Snowflake className={`w-5 h-5 ${color}`} />
        <h2 className="text-gray-900 font-semibold">{titulo}</h2>
        </div>
        <span className="text-sm text-gray-600">
        {lotesDistintos} {lotesDistintos === 1 ? 'lote' : 'lotes'} · {totalKilos.toLocaleString()} kg
        {totalCajas > 0 ? ` · ${totalCajas.toLocaleString()} cajas` : ''}
        </span>
    </div>

    {items.length === 0 ? (
        <div className="text-center py-10">
        <Package className="w-10 h-10 text-gray-300 mx-auto mb-2" />
        <p className="text-gray-500 text-sm">
            {hayFiltrosActivos ? 'Ningún lote coincide con los filtros' : 'Sin lotes en esta cámara'}
        </p>
        </div>
    ) : (
        <div className="space-y-3">
        {items.map((item) => (
            <div
            key={item.id}
            className="p-4 border border-gray-200 rounded-lg flex items-center justify-between"
            >
            <div>
                <p className="text-gray-900 font-medium">{item.lotes?.codigo_lote}</p>
                <p className="text-sm text-gray-600">{item.lotes?.especies?.nombre ?? '-'}</p>
            </div>

            <div className="text-right">
                <p className="text-gray-900">
                {Number(item.kilos).toLocaleString()} kg
                {item.cajas != null ? ` · ${item.cajas} cajas` : ''}
                </p>
                <p className="text-xs text-gray-500">{tiempoTranscurrido(item.fecha_ingreso)} en cámara</p>
            </div>
            </div>
        ))}
        </div>
    )}
    </div>
);
}

return (
<div className="space-y-6">
    <div>
    <h1 className="text-gray-900 mb-2">Cámaras</h1>
    <p className="text-gray-600">Producto congelado almacenado en cámaras PAC y NO PAC</p>
    </div>

    {loading ? (
    <div className="text-center py-12">
        <p className="text-gray-500">Cargando cámaras...</p>
    </div>
    ) : (
    <>
        {/* RESUMEN */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200">
            <div className="flex items-center gap-2 text-gray-600 mb-2">
            <Layers className="w-4 h-4" />
            <p>Lotes distintos en cámaras</p>
            </div>
            <p className="text-gray-900 text-2xl font-semibold">{resumen.lotesTotales}</p>
        </div>

        <div className="bg-blue-50 p-5 rounded-xl border border-blue-100">
            <p className="text-gray-700 mb-2">Lotes en Cámara PAC</p>
            <p className="text-blue-700 text-2xl font-semibold">{resumen.lotesPAC}</p>
        </div>

        <div className="bg-cyan-50 p-5 rounded-xl border border-cyan-100">
            <p className="text-gray-700 mb-2">Lotes en Cámara NO PAC</p>
            <p className="text-cyan-700 text-2xl font-semibold">{resumen.lotesNoPAC}</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200">
            <p className="text-gray-600 mb-2">Kilos totales</p>
            <p className="text-gray-900 text-2xl font-semibold">{resumen.kilosTotales.toLocaleString()} kg</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200">
            <p className="text-gray-600 mb-2">Cajas totales</p>
            <p className="text-gray-900 text-2xl font-semibold">{resumen.cajasTotales.toLocaleString()}</p>
        </div>
        </div>

        {/* FILTROS */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
            <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por código de lote o especie..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            </div>

            <select
            value={filtroEspecie}
            onChange={(e) => setFiltroEspecie(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm"
            >
            <option value="">Todas las especies</option>
            {especiesDisponibles.map((nombre) => (
                <option key={nombre} value={nombre}>
                {nombre}
                </option>
            ))}
            </select>

            {hayFiltrosActivos && (
            <button
                onClick={limpiarFiltros}
                className="flex items-center justify-center gap-1 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
                <X className="w-4 h-4" />
                Limpiar filtros
            </button>
            )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1.5">
            {OPCIONES_CAMARA.map((opcion) => (
                <button
                key={opcion.valor}
                type="button"
                onClick={() => setFiltroCamara(opcion.valor)}
                className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                    filtroCamara === opcion.valor
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-100'
                }`}
                >
                {opcion.etiqueta}
                </button>
            ))}
            </div>

            <p className="text-sm text-gray-500">
            Mostrando {contarLotesDistintos(detalleFiltrado)} de {resumen.lotesTotales} lotes
            </p>
        </div>
        </div>

        {/* CÁMARAS */}
        <div className={`grid grid-cols-1 gap-6 ${filtroCamara === 'todas' ? 'md:grid-cols-2' : ''}`}>
        {filtroCamara !== 'NO_PAC' && renderColumna('Cámara PAC', pac, 'text-blue-600')}
        {filtroCamara !== 'PAC' && renderColumna('Cámara NO PAC', noPac, 'text-cyan-600')}
        </div>
    </>
    )}
</div>
);
}