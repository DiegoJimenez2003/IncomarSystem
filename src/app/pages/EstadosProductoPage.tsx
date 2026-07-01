import { useEffect, useState } from 'react';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Tag
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { supabase } from '../../utils/supabase';
import { EstadoProductoModal} from '../components/Productos/EstadosProductoModal';

interface EstadoProducto {
  id: string;
  nombre: string;
  descripcion: string | null;
  color: string | null;
  activo: boolean;
}

export function EstadosProductoPage() {

  //==========================================
  // Usuario autenticado
  //==========================================

  const { user } = useAuth();

  //==========================================
  // Estados de la página
  //==========================================

  const [estados, setEstados] =
    useState<EstadoProducto[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [searchTerm, setSearchTerm] =
    useState('');

  //==========================================
  // Modal
  //==========================================

  const [mostrarModal, setMostrarModal] =
    useState(false);

  const [estadoEditar, setEstadoEditar] =
    useState<EstadoProducto | null>(null);

  //==========================================
  // Permisos
  //==========================================

  const canManage =
    user?.rol === 'administrador'
    || user?.rol === 'calidad';

  //==========================================
  // Cargar datos al iniciar
  //==========================================

  useEffect(() => {
    cargarEstados();
  }, []);

  //==========================================
  // Obtener estados desde Supabase
  //==========================================

  async function cargarEstados() {

    try {

      setLoading(true);

      const { data, error } =
        await supabase
          .from('estados_producto')
          .select('*')
          .order('nombre');

      if (error) {
        console.error(error);
        return;
      }

      setEstados(data ?? []);

    } finally {

      setLoading(false);

    }

  }

  //==========================================
  // Eliminar Estado
  //==========================================

  async function eliminarEstado(id: string) {

    const confirmar = confirm(
      '¿Desea eliminar este estado?'
    );

    if (!confirmar) return;

    const { error } =
      await supabase
        .from('estados_producto')
        .delete()
        .eq('id', id);

    if (error) {

      console.error(error);
      alert('No fue posible eliminar.');

      return;
    }

    cargarEstados();

  }

  //==========================================
  // Buscar
  //==========================================

  const estadosFiltrados =
    estados.filter((estado) => {

      return (

        estado.nombre
          .toLowerCase()
          .includes(searchTerm.toLowerCase())

        ||

        estado.descripcion
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase())

      );

    });

  //==========================================
  // Color de las tarjetas
  //==========================================

  const getColorClass = (
    color?: string
  ) => {

    const colors = {

      red:
        'bg-red-100 text-red-700 border-red-200',

      green:
        'bg-green-100 text-green-700 border-green-200',

      blue:
        'bg-blue-100 text-blue-700 border-blue-200',

      yellow:
        'bg-yellow-100 text-yellow-700 border-yellow-200',

      gray:
        'bg-gray-100 text-gray-700 border-gray-200',

      purple:
        'bg-purple-100 text-purple-700 border-purple-200',

      orange:
        'bg-orange-100 text-orange-700 border-orange-200',

    };

    return colors[
      color as keyof typeof colors
    ] || colors.gray;

  };

  //==========================================
  // Render
  //==========================================

  return (
  <div className="space-y-6">

    {/*==========================================
        Encabezado
    ==========================================*/}

    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

      <div>
        <h1 className="text-gray-900 mb-2">
          Estados de Producto
        </h1>

        <p className="text-gray-600">
          Gestión de estados utilizados durante el proceso productivo.
        </p>
      </div>

      {canManage && (

        <button
          onClick={() => {

            setEstadoEditar(null);
            setMostrarModal(true);

          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          Nuevo Estado
        </button>

      )}

    </div>

    {/*==========================================
        Buscador
    ==========================================*/}

    <div className="bg-white rounded-xl border border-gray-200 p-6">

      <div className="relative mb-6">

        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"/>

        <input
          type="text"
          placeholder="Buscar estado..."
          value={searchTerm}
          onChange={(e)=>setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
        />

      </div>

      {/*==========================================
          Loading
      ==========================================*/}

      {loading && (

        <div className="text-center py-10">

          Cargando...

        </div>

      )}

      {/*==========================================
          Tarjetas
      ==========================================*/}

      {!loading && (

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">

          {estadosFiltrados.map((estado)=>(

            <div
              key={estado.id}
              className={`border-2 rounded-xl p-5 ${getColorClass(estado.color ?? "gray")}`}
            >

              <div className="flex justify-between items-start">

                <div className="flex items-center gap-2">

                  <Tag className="w-5 h-5"/>

                  <h3 className="font-semibold">

                    {estado.nombre}

                  </h3>

                </div>

                {canManage && (

                  <div className="flex gap-1">

                    <button
                      onClick={()=>{
                        setEstadoEditar(estado);
                        setMostrarModal(true);
                      }}
                      className="p-2 hover:bg-white/60 rounded-lg"
                    >
                      <Edit2 className="w-4 h-4"/>
                    </button>

                    <button
                      onClick={()=>
                        eliminarEstado(estado.id)
                      }
                      className="p-2 hover:bg-white/60 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4"/>
                    </button>

                  </div>

                )}

              </div>

              <p className="text-sm mt-4 min-h-[60px]">

                {estado.descripcion || "Sin descripción"}

              </p>

              <div className="mt-5 flex justify-between items-center">

                <span className="text-xs">

                  Estado

                </span>

                <span
                  className={`px-2 py-1 rounded text-xs ${
                    estado.activo
                      ? "bg-green-200 text-green-800"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >

                  {estado.activo
                    ? "Activo"
                    : "Inactivo"}

                </span>

              </div>

            </div>

          ))}

        </div>

      )}

      {/*==========================================
          Sin resultados
      ==========================================*/}

      {!loading &&
        estadosFiltrados.length===0 && (

        <div className="text-center py-10">

          <Tag className="mx-auto w-12 h-12 text-gray-300 mb-3"/>

          <p className="text-gray-500">

            No existen estados registrados.

          </p>

        </div>

      )}

    </div>

    {/*==========================================
        Resumen
    ==========================================*/}

    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

      <div className="bg-white rounded-xl border p-5">

        <p className="text-gray-500">
          Total Estados
        </p>

        <p className="text-3xl font-bold">

          {estados.length}

        </p>

      </div>

      <div className="bg-green-50 rounded-xl border p-5">

        <p className="text-gray-500">
          Activos
        </p>

        <p className="text-3xl font-bold text-green-700">

          {
            estados.filter(
              e=>e.activo
            ).length
          }

        </p>

      </div>

      <div className="bg-gray-50 rounded-xl border p-5">

        <p className="text-gray-500">
          Inactivos
        </p>

        <p className="text-3xl font-bold text-gray-700">

          {
            estados.filter(
              e=>!e.activo
            ).length
          }

        </p>

      </div>

    </div>

    {/*==========================================
        Modal
    ==========================================*/}

    {mostrarModal && (

      <EstadoProductoModal

        estado={estadoEditar}

        onClose={()=>{
          setMostrarModal(false);
          setEstadoEditar(null);
        }}

        onSuccess={()=>{
          cargarEstados();
        }}

      />

    )}

  </div>
);
}
