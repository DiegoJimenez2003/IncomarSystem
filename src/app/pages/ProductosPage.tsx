import { useState, useEffect } from 'react';
import { Search, Plus, Fish } from 'lucide-react';
import { supabase } from '../../utils/supabase';

// ==========================================================
// Modelo de producto mostrado en la interfaz
// ==========================================================
interface Producto {
  id: string;
  especie_id: string;
  nombre_especie: string;
  nombre_cientifico: string;
  exportable: boolean;
  tipo_pac: string;
}

export function ProductosPage() {

  // ==========================================================
  // Estado del buscador
  // ==========================================================
  const [searchTerm, setSearchTerm] = useState('');

  // ==========================================================
  // Lista de productos obtenidos desde Supabase
  // ==========================================================
  const [productos, setProductos] = useState<Producto[]>([]);

  // ==========================================================
  // Estado de carga de la página
  // ==========================================================
  const [loading, setLoading] = useState(true);

  // ==========================================================
  // Cargar productos al iniciar la página
  // ==========================================================
  useEffect(() => {
    cargarProductos();
  }, []);

  // ==========================================================
  // Obtener productos desde Supabase
  // ==========================================================
  async function cargarProductos() {
    try {

      const { data, error } = await supabase
        .from('productos')
        .select(`
          id,
          especie_id,
          exportable,
          tipo_pac
        `);

      if (error) {
        console.error('Error cargando productos:', error);
        return;
      }

      // ==========================================================
      // Construir lista final de productos con información
      // legible para el usuario
      // ==========================================================
      const productosConNombre: Producto[] = [];

      for (const producto of data ?? []) {

        // ==========================================================
        // Buscar información de la especie relacionada
        // ==========================================================
        const { data: especie } = await supabase
          .from('especies')
          .select(`
            nombre,
            nombre_cientifico
          `)
          .eq('id', producto.especie_id)
          .single();

        productosConNombre.push({
          id: producto.id,
          especie_id: producto.especie_id,
          nombre_especie: especie?.nombre ?? 'Sin especie',
          nombre_cientifico:
            especie?.nombre_cientifico ?? 'Sin nombre científico',
          exportable: producto.exportable,
          tipo_pac: producto.tipo_pac
        });
      }

      setProductos(productosConNombre);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // ==========================================================
  // Filtrar productos por nombre común
  // ==========================================================
  const productosFiltrados = productos.filter((producto) =>
    producto.nombre_especie
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  // ==========================================================
  // Pantalla de carga
  // ==========================================================
  if (loading) {
    return (
      <div className="p-6">
        Cargando productos...
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ======================================================
          Encabezado de página
      ====================================================== */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

        <div>
          <h1 className="text-gray-900 mb-2">
            Gestión de Productos
          </h1>

          <p className="text-gray-600">
            Catálogo de productos pesqueros
          </p>
        </div>

        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-5 h-5" />
          Nuevo Producto
        </button>

      </div>

      {/* ======================================================
          Contenedor principal
      ====================================================== */}
      <div className="bg-white p-6 rounded-xl border border-gray-200">

        {/* ====================================================
            Buscador
        ==================================================== */}
        <div className="mb-6">

          <div className="relative">

            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

            <input
              type="text"
              placeholder="Buscar producto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

          </div>

        </div>

        {/* ====================================================
            Tarjetas de productos
        ==================================================== */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

          {productosFiltrados.map((producto) => (

            <div
              key={producto.id}
              className="p-5 rounded-xl border border-gray-200 hover:border-blue-300 transition-all"
            >

              {/* ==================================================
                  Encabezado de tarjeta
              ================================================== */}
              <div className="flex items-center gap-3 mb-3">

                <div className="p-2 bg-blue-100 rounded-lg">
                  <Fish className="w-5 h-5 text-blue-600" />
                </div>

                <div>
                  <h3 className="text-gray-900 font-medium">
                    {producto.nombre_especie}
                  </h3>

                  <p className="text-xs text-gray-500 italic">
                    {producto.nombre_cientifico}
                  </p>
                </div>

              </div>

              {/* ==================================================
                  Información del producto
              ================================================== */}
              <div className="space-y-2 text-sm">

                <div className="flex items-center justify-between">
                  <span className="text-gray-600">
                    Nombre científico:
                  </span>

                  <span className="text-gray-900 text-right">
                    {producto.nombre_cientifico}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600">
                    Exportable:
                  </span>

                  <span
                    className={
                      producto.exportable
                        ? 'text-green-700'
                        : 'text-gray-700'
                    }
                  >
                    {producto.exportable ? 'Sí' : 'No'}
                  </span>
                </div>

                {/* ==============================================
                    Indicador PAC
                ============================================== */}
                <div className="mt-3">

                  <span
                    className={`px-3 py-1 rounded-full text-xs ${
                      producto.tipo_pac === 'PAC'
                        ? 'bg-blue-100 text-blue-700'
                        : producto.tipo_pac === 'NO_PAC'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-purple-100 text-purple-700'
                    }`}
                  >
                    {producto.tipo_pac === 'AMBOS'
                      ? 'PAC / NO PAC'
                      : producto.tipo_pac}
                  </span>

                </div>

              </div>

            </div>

          ))}

        </div>

      </div>

    </div>
  );
}