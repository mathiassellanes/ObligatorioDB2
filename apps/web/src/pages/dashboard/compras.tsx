import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { Venta } from '@repo/shared'
import { ShoppingBag, Calendar, Package } from 'lucide-react'

type VentaConConteo = Venta & { cantidad_entradas: number; comision_monto: number }

export function ComprasPage() {
  const { data: ventas = [], isLoading } = useQuery<VentaConConteo[]>({
    queryKey: ['mis-ventas'],
    queryFn: () => api.get('/ventas'),
  })

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="section-title">Mis Compras</h1>
          <p className="text-[#6b7a9c] text-sm mt-1">Historial de transacciones</p>
        </div>
        <div className="badge-amber flex items-center gap-1.5">
          <ShoppingBag className="w-3.5 h-3.5" />
          {ventas.length} compra{ventas.length !== 1 ? 's' : ''}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="card h-24 animate-pulse" />)}
        </div>
      ) : ventas.length === 0 ? (
        <div className="card p-16 text-center">
          <ShoppingBag className="w-12 h-12 text-[#1a2540] mx-auto mb-4" />
          <p className="text-[#6b7a9c]">No realizaste compras aún.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {ventas.map((venta) => (
            <VentaRow key={venta.id} venta={venta} />
          ))}
        </div>
      )}
    </div>
  )
}

function VentaRow({ venta }: { venta: VentaConConteo }) {
  const estadoColor = venta.estado === 'paga'
    ? 'badge-pitch' : venta.estado === 'confirmada' ? 'badge-amber' : 'badge-red'

  return (
    <div className="card p-5 flex items-center gap-4">
      <div className="w-10 h-10 bg-[#0d1529] rounded-xl flex items-center justify-center border border-[#1a2540] shrink-0">
        <ShoppingBag className="w-4 h-4 text-[#6b7a9c]" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-display font-bold text-sm">Venta #{venta.id}</span>
          <span className={estadoColor}>{venta.estado}</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-[#6b7a9c]">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {new Date(venta.fecha).toLocaleDateString('es-UY')}
          </span>
          <span className="flex items-center gap-1">
            <Package className="w-3 h-3" />
            {venta.cantidad_entradas} entrada{venta.cantidad_entradas !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <div className="text-right shrink-0">
        <div className="font-display font-black text-xl text-[#39ff14]">
          ${Number(venta.monto_total).toLocaleString()}
        </div>
        <div className="text-[#6b7a9c] text-xs">
          Com. {(Number(venta.comision_monto) * 100).toFixed(1)}%
        </div>
      </div>
    </div>
  )
}
