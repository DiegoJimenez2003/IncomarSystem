import { useState } from 'react';
import { Search, Plus, Edit2, Trash2, X, Tag } from 'lucide-react';
import { estadosProductoData } from '../data/incomarData';
import { useAuth } from '../context/AuthContext';

export function EstadosProductoPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState(false);
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [color, setColor] = useState('gray');
  const [activo, setActivo] = useState(true);

  const estadosFiltrados = estadosProductoData.filter((estado) =>
    estado.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    estado.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getColorClass = (color: string) => {
    const colors = {
      red: 'bg-red-100 text-red-700 border-red-200',
      green: 'bg-green-100 text-green-700 border-green-200',
      blue: 'bg-blue-100 text-blue-700 border-blue-200',
      yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      gray: 'bg-gray-100 text-gray-700 border-gray-200',
      purple: 'bg-purple-100 text-purple-700 border-purple-200',
      orange: 'bg-orange-100 text-orange-700 border-orange-200',
    };
    return colors[color as keyof typeof colors] || colors.gray;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowModal(false);
    setNombre('');
    setDescripcion('');
    setColor('gray');
    setActivo(true);
    setEditando(false);
  };

  const handleNuevo = () => {
    setEditando(false);
    setNombre('');
    setDescripcion('');
    setColor('gray');
    setActivo(true);
    setShowModal(true);
  };

  const handleEditar = (estado: any) => {
    setEditando(true);
    setNombre(estado.nombre);
    setDescripcion(estado.descripcion);
    setColor(estado.color);
    setActivo(estado.activo);
    setShowModal(true);
  };

  const handleEliminar = (id: string) => {
    if (confirm('¿Está seguro de eliminar este estado? Esta acción no se puede deshacer.')) {
      alert('Estado eliminado (funcionalidad de demostración)');
    }
  };

  const canManage = user?.rol === 'administrador' || user?.rol === 'calidad';

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-gray-900 mb-2">Estados de Producto</h1>
          <p className="text-gray-600">Gestión de estados para control de calidad</p>
        </div>

        {canManage && (
          <button
            onClick={handleNuevo}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nuevo Estado
          </button>
        )}
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar estado..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {estadosFiltrados.map((estado) => (
            <div
              key={estado.id}
              className={`p-5 rounded-xl border-2 ${getColorClass(estado.color)}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Tag className="w-5 h-5" />
                  <h3 className="font-medium">{estado.nombre}</h3>
                </div>
                {canManage && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEditar(estado)}
                      className="p-1.5 hover:bg-white/50 rounded transition-colors"
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEliminar(estado.id)}
                      className="p-1.5 hover:bg-white/50 rounded transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <p className="text-sm mb-3">{estado.descripcion}</p>

              <div className="flex items-center justify-between">
                <span className="text-xs">Estado:</span>
                <span className={`text-xs px-2 py-1 rounded ${estado.activo ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-800'}`}>
                  {estado.activo ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            </div>
          ))}
        </div>

        {estadosFiltrados.length === 0 && (
          <div className="text-center py-12">
            <Tag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No se encontraron estados</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-gray-900">{editando ? 'Editar Estado' : 'Nuevo Estado'}</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-700 mb-2">Nombre del Estado</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej: En Revisión"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">Descripción</label>
                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe cuándo se usa este estado..."
                  rows={3}
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">Color</label>
                <div className="grid grid-cols-4 gap-2">
                  {['red', 'green', 'blue', 'yellow', 'gray', 'purple', 'orange'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        color === c
                          ? 'border-blue-600 scale-105'
                          : 'border-gray-200 hover:border-gray-300'
                      } ${getColorClass(c)}`}
                    >
                      <span className="capitalize text-xs">{c}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="activo"
                  checked={activo}
                  onChange={(e) => setActivo(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="activo" className="text-gray-700">Estado activo</label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editando ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
