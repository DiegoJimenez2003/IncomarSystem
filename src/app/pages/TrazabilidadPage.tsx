import { useState } from 'react';
import { Search, Route, PackageCheck, FileSignature, Factory, ClipboardCheck, Ship, Package, Tag, ArrowRight } from 'lucide-react';
import {
  lotesData,
  guiasData,
  procesosData,
  calidadData,
  inventarioData,
  movimientosData,
  embarquesData,
  estadosProductoData,
} from '../data/incomarData';

export function TrazabilidadPage() {
  const [loteSeleccionado, setLoteSeleccionado] = useState<string | null>(null);

  const lote = lotesData.find((l) => l.id === loteSeleccionado);
  const guiasLote = guiasData.filter((g) => g.loteId === loteSeleccionado);
  const procesosLote = procesosData.filter((p) => p.loteId === loteSeleccionado);
  const calidadLote = calidadData.filter((c) => c.loteId === loteSeleccionado);
  const inventarioLote = inventarioData.filter((i) => i.loteId === loteSeleccionado);
  const movimientosLote = movimientosData.filter((m) => m.loteId === loteSeleccionado);
  const embarquesLote = embarquesData.filter((e) => e.loteIds.includes(loteSeleccionado || ''));

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-gray-900 mb-2">Trazabilidad de Lotes</h1>
        <p className="text-gray-600">Historial completo desde llegada hasta destino final</p>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <div className="mb-6">
          <label className="block text-gray-700 mb-2">Seleccionar Lote</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={loteSeleccionado || ''}
              onChange={(e) => setLoteSeleccionado(e.target.value || null)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
            >
              <option value="">Seleccione un lote para ver su trazabilidad...</option>
              {lotesData.map((lote) => (
                <option key={lote.id} value={lote.id}>
                  {lote.loteInterno} (Origen: {lote.loteOrigen}) - {lote.productoNombre} ({formatDate(lote.fechaLlegada)})
                </option>
              ))}
            </select>
          </div>
        </div>

        {!loteSeleccionado && (
          <div className="text-center py-12">
            <Route className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Seleccione un lote para visualizar su trazabilidad completa</p>
          </div>
        )}

        {loteSeleccionado && lote && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-600 rounded-lg">
                  <PackageCheck className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-gray-900 mb-4">Información del Lote</h2>

                  <div className="bg-white p-4 rounded-lg mb-4">
                    <div className="flex items-center gap-3 mb-2">
                      <p className="text-sm text-gray-600">Trazabilidad de Lote:</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg text-sm">
                        Lote Origen: {lote.loteOrigen}
                      </span>
                      <ArrowRight className="w-5 h-5 text-gray-400" />
                      <span className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm">
                        Lote Interno: {lote.loteInterno}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Producto</p>
                      <p className="text-gray-900">{lote.productoNombre}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Planta</p>
                      <p className="text-gray-900">{lote.plantaNombre}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Fecha Llegada</p>
                      <p className="text-gray-900">{formatDate(lote.fechaLlegada)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Kilos Entrada</p>
                      <p className="text-gray-900">{lote.kilosEntrada.toLocaleString()} kg</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Estado Proceso</p>
                      <p className="text-gray-900 capitalize">{lote.estado}</p>
                    </div>
                    {lote.estadoProductoId && (
                      <div>
                        <p className="text-sm text-gray-600">Estado Producto</p>
                        <p className="text-gray-900">
                          {estadosProductoData.find(e => e.id === lote.estadoProductoId)?.nombre || 'N/A'}
                        </p>
                      </div>
                    )}
                    {lote.observaciones && (
                      <div className="md:col-span-2">
                        <p className="text-sm text-gray-600">Observaciones</p>
                        <p className="text-gray-900">{lote.observaciones}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <h2 className="text-gray-900 mb-4">Resumen de Stock Actual</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-sm text-gray-700 mb-1">Kilos Entrada</p>
                  <p className="text-blue-700">{lote.kilosEntrada.toLocaleString()} kg</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                  <p className="text-sm text-gray-700 mb-1">Kilos Procesados</p>
                  <p className="text-purple-700">
                    {procesosLote.reduce((sum, p) => sum + p.kilosSalida, 0).toLocaleString()} kg
                  </p>
                </div>
                <div className="p-4 bg-red-50 rounded-lg border border-red-100">
                  <p className="text-sm text-gray-700 mb-1">Merma Total</p>
                  <p className="text-red-700">
                    {procesosLote.reduce((sum, p) => sum + p.merma, 0).toLocaleString()} kg
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                  <p className="text-sm text-gray-700 mb-1">Stock Restante</p>
                  <p className="text-green-700">
                    {inventarioLote.reduce((sum, i) => sum + i.kilos, 0).toLocaleString()} kg
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl border border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <FileSignature className="w-6 h-6 text-blue-600" />
                  <h3 className="text-gray-900">Guías de Despacho ({guiasLote.length})</h3>
                </div>
                {guiasLote.length > 0 ? (
                  <div className="space-y-3">
                    {guiasLote.map((guia) => (
                      <div key={guia.id} className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-gray-900 mb-2">{guia.numero}</p>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-gray-600">Barco:</p>
                            <p className="text-gray-900">{guia.barco}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Kilos:</p>
                            <p className="text-gray-900">{guia.kilos.toLocaleString()} kg</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Origen:</p>
                            <p className="text-gray-900">{guia.origen}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Destino:</p>
                            <p className="text-gray-900">{guia.destino}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">Sin guías registradas</p>
                )}
              </div>

              <div className="bg-white p-6 rounded-xl border border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <Factory className="w-6 h-6 text-purple-600" />
                  <h3 className="text-gray-900">Procesamiento ({procesosLote.length})</h3>
                </div>
                {procesosLote.length > 0 ? (
                  <div className="space-y-3">
                    {procesosLote.map((proceso) => (
                      <div key={proceso.id} className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-gray-900 mb-2">{proceso.formato}</p>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-gray-600">Entrada:</p>
                            <p className="text-gray-900">{proceso.kilosEntrada.toLocaleString()} kg</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Salida:</p>
                            <p className="text-gray-900">{proceso.kilosSalida.toLocaleString()} kg</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Merma:</p>
                            <p className="text-red-700">{proceso.merma.toLocaleString()} kg</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Rendimiento:</p>
                            <p className="text-green-700">{proceso.rendimiento.toFixed(1)}%</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">Sin procesos registrados</p>
                )}
              </div>

              <div className="bg-white p-6 rounded-xl border border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <ClipboardCheck className="w-6 h-6 text-green-600" />
                  <h3 className="text-gray-900">Control de Calidad ({calidadLote.length})</h3>
                </div>
                {calidadLote.length > 0 ? (
                  <div className="space-y-3">
                    {calidadLote.map((control) => (
                      <div
                        key={control.id}
                        className={`p-4 rounded-lg ${
                          control.estado === 'aprobado'
                            ? 'bg-green-50'
                            : control.estado === 'observado'
                            ? 'bg-yellow-50'
                            : 'bg-red-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-gray-900 capitalize">{control.estado}</p>
                          <p className="text-sm text-gray-600">{formatDate(control.fecha)}</p>
                        </div>
                        <div className="text-sm space-y-1">
                          <p className="text-gray-600">
                            Inspector: <span className="text-gray-900">{control.inspector}</span>
                          </p>
                          <p className="text-gray-600">
                            Aspecto: <span className="text-gray-900">{control.aspecto}</span>
                          </p>
                          {control.observaciones && (
                            <p className="text-gray-600">
                              Obs: <span className="text-gray-900">{control.observaciones}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">Sin controles registrados</p>
                )}
              </div>

              <div className="bg-white p-6 rounded-xl border border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <Package className="w-6 h-6 text-yellow-600" />
                  <h3 className="text-gray-900">Inventario Actual ({inventarioLote.length})</h3>
                </div>
                {inventarioLote.length > 0 ? (
                  <div className="space-y-3">
                    {inventarioLote.map((item) => (
                      <div key={item.id} className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-gray-900 mb-2">Rack {item.rackCodigo}</p>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-gray-600">Cajas:</p>
                            <p className="text-gray-900">{item.cajas}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Kilos:</p>
                            <p className="text-gray-900">{item.kilos.toLocaleString()} kg</p>
                          </div>
                          {item.tipoParte && (
                            <div className="col-span-2">
                              <p className="text-gray-600">Tipo:</p>
                              <p className="text-gray-900">{item.tipoParte}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">Sin stock disponible</p>
                )}
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <Ship className="w-6 h-6 text-indigo-600" />
                <h3 className="text-gray-900">Historial de Movimientos ({movimientosLote.length})</h3>
              </div>
              {movimientosLote.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-3 text-sm text-gray-700">Tipo</th>
                        <th className="text-left py-2 px-3 text-sm text-gray-700">Rack</th>
                        <th className="text-left py-2 px-3 text-sm text-gray-700">Cajas</th>
                        <th className="text-left py-2 px-3 text-sm text-gray-700">Kilos</th>
                        <th className="text-left py-2 px-3 text-sm text-gray-700">Fecha</th>
                        <th className="text-left py-2 px-3 text-sm text-gray-700">Responsable</th>
                      </tr>
                    </thead>
                    <tbody>
                      {movimientosLote.map((mov) => (
                        <tr key={mov.id} className="border-b border-gray-100">
                          <td className="py-2 px-3">
                            <span
                              className={`px-2 py-1 rounded text-xs ${
                                mov.tipo === 'entrada'
                                  ? 'bg-green-100 text-green-700'
                                  : mov.tipo === 'salida'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}
                            >
                              {mov.tipo.charAt(0).toUpperCase() + mov.tipo.slice(1)}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-sm text-gray-900">{mov.rackCodigo || '-'}</td>
                          <td className="py-2 px-3 text-sm text-gray-900">{mov.cajas}</td>
                          <td className="py-2 px-3 text-sm text-gray-900">{mov.kilos.toLocaleString()} kg</td>
                          <td className="py-2 px-3 text-sm text-gray-600">{formatDate(mov.fecha)}</td>
                          <td className="py-2 px-3 text-sm text-gray-600">{mov.responsable}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">Sin movimientos registrados</p>
              )}
            </div>

            {embarquesLote.length > 0 && (
              <div className="bg-white p-6 rounded-xl border border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <Ship className="w-6 h-6 text-blue-600" />
                  <h3 className="text-gray-900">Embarques ({embarquesLote.length})</h3>
                </div>
                <div className="space-y-3">
                  {embarquesLote.map((embarque) => (
                    <div key={embarque.id} className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-gray-900">{embarque.codigo}</p>
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs capitalize">
                          {embarque.estado.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-gray-600">Destino:</p>
                          <p className="text-gray-900">{embarque.destino}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Transporte:</p>
                          <p className="text-gray-900">{embarque.transporte}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Cajas:</p>
                          <p className="text-gray-900">{embarque.cajasTotal}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Kilos:</p>
                          <p className="text-gray-900">{embarque.kilosTotal.toLocaleString()} kg</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
