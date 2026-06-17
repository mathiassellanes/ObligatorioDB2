import { useEffect, useRef, useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode'
import { Camera, Keyboard, Scan, Shield, Loader2, AlertTriangle } from 'lucide-react'

type SectorAsignado = {
  id_sector: number
  id_evento: number
  nombre_sector: string
  nombre_equipo_local: string
  nombre_equipo_visitante: string
  fecha_evento: string
  validacion_completa: boolean
  dispositivo_id: string | null
}

type FuncionarioMe = {
  sectores: SectorAsignado[]
}

// El sector de validación se mantiene durante el evento: una vez elegido, se
// guarda hasta el fin del día o por 5 horas (lo que ocurra primero), así el
// funcionario no tiene que re-seleccionarlo en cada validación.
const SECTOR_KEY = 'mt_func_sector'

function loadStoredSector(): string {
  try {
    const raw = localStorage.getItem(SECTOR_KEY)
    if (!raw) return ''
    const { key, exp } = JSON.parse(raw)
    if (typeof exp === 'number' && exp > Date.now()) return key
    localStorage.removeItem(SECTOR_KEY)
  } catch { /* corrupt value */ }
  return ''
}

function persistSector(key: string) {
  if (!key) { localStorage.removeItem(SECTOR_KEY); return }
  const endOfDay = new Date()
  endOfDay.setHours(23, 59, 59, 999)
  const exp = Math.min(endOfDay.getTime(), Date.now() + 5 * 60 * 60 * 1000)
  localStorage.setItem(SECTOR_KEY, JSON.stringify({ key, exp }))
}

export function FuncionarioPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'camera' | 'manual'>('camera')
  const [sectorKey, setSectorKey] = useState(loadStoredSector)
  const [manual, setManual] = useState('')
  const [scanning, setScanning] = useState(false)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const { data: me, isLoading } = useQuery<FuncionarioMe>({
    queryKey: ['funcionario-me'],
    queryFn: () => api.get('/qr/funcionario/me'),
  })

  const sectores = me?.sectores ?? []
  const selectedSector = sectores.find(s => `${s.id_sector}-${s.id_evento}` === sectorKey)
  const dispositivoId = selectedSector?.dispositivo_id ?? null

  function selectSector(key: string) {
    setSectorKey(key)
    setManual('')
    persistSector(key)
  }

  // Si el sector guardado ya no está entre los asignados (evento terminó, etc.),
  // limpiar la selección persistida.
  useEffect(() => {
    if (sectorKey && me && !selectedSector) {
      setSectorKey('')
      persistSector('')
    }
  }, [me, sectorKey, selectedSector])

  // Start/stop camera scanner.
  // stop() throws synchronously if the scanner isn't actively scanning, and
  // start() is async — under StrictMode the effect mounts, cleans up, and
  // remounts before start() resolves, so a naive cleanup stop() crashes with
  // "Cannot stop, scanner is not running". Gate stop() on the live state and
  // wait for start() to settle before tearing down.
  useEffect(() => {
    // El <div id="qr-reader"> solo se renderiza cuando hay sector + dispositivo.
    // Con un sector persistido el effect puede dispararse antes de que cargue
    // `me` (dispositivoId todavía null), cuando el div aún no existe → no
    // arrancar el scanner hasta que el viewport esté en el DOM.
    if (mode !== 'camera' || !sectorKey || !dispositivoId) return
    if (!document.getElementById('qr-reader')) return

    const qr = new Html5Qrcode('qr-reader')
    scannerRef.current = qr

    async function stopSafe() {
      try {
        const s = qr.getState()
        if (s === Html5QrcodeScannerState.SCANNING || s === Html5QrcodeScannerState.PAUSED) {
          await qr.stop()
        }
      } catch { /* not running — nothing to stop */ }
    }

    const started = qr.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 240, height: 240 } },
      (decodedText) => {
        stopSafe().then(() => {
          scannerRef.current = null
          navigate(decodedText)
        })
      },
      () => { /* ignore per-frame decode errors */ }
    ).then(() => true).catch(() => {
      setMode('manual')
      return false
    })

    return () => {
      // Only stop once start() has settled, and only if it actually started.
      started.then((ok) => { if (ok) stopSafe() })
    }
  }, [mode, sectorKey, dispositivoId])

  function navigate(codigo: string) {
    if (!dispositivoId || !selectedSector) return
    router.navigate({
      to: '/funcionario/resultado',
      search: {
        codigo,
        dispositivo: dispositivoId,
        sector: selectedSector.id_sector,
        evento: selectedSector.id_evento,
      }
    })
  }

  function handleManualSubmit() {
    if (manual.trim()) navigate(manual.trim())
  }

  if (isLoading) return (
    <div className="min-h-screen bg-[#050914] flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-[#39ff14] animate-spin" />
    </div>
  )

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#050914]">
      <div className="max-w-md mx-auto px-4 py-6">

        {/* No device warning for selected sector */}
        {sectorKey && !dispositivoId && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 mb-5 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-amber-400 text-sm">Sin dispositivo asignado para este evento. Contactá al administrador.</p>
          </div>
        )}

        {/* Sector select */}
        <div className="mb-5">
          <label className="label mb-2">Sector de validación</label>
          <select
            className="input-field text-base"
            value={sectorKey}
            onChange={e => selectSector(e.target.value)}
          >
            <option value="">Seleccioná sector...</option>
            {sectores.map(s => (
              <option key={`${s.id_sector}-${s.id_evento}`} value={`${s.id_sector}-${s.id_evento}`}>
                {s.nombre_sector} — {s.nombre_equipo_local} vs {s.nombre_equipo_visitante}
              </option>
            ))}
          </select>
        </div>

        {sectorKey && dispositivoId && (
          <>
            {/* Mode toggle */}
            <div className="flex gap-1 mb-5 bg-[#090f20] p-1 rounded-xl border border-[#1a2540]">
              <button
                onClick={() => setMode('camera')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-display font-bold uppercase tracking-wide transition-all ${
                  mode === 'camera' ? 'bg-[#39ff14] text-[#050914]' : 'text-[#6b7a9c]'
                }`}
              >
                <Camera className="w-4 h-4" />Cámara
              </button>
              <button
                onClick={() => setMode('manual')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-display font-bold uppercase tracking-wide transition-all ${
                  mode === 'manual' ? 'bg-[#39ff14] text-[#050914]' : 'text-[#6b7a9c]'
                }`}
              >
                <Keyboard className="w-4 h-4" />Manual
              </button>
            </div>

            {mode === 'camera' ? (
              <div className="card card-glow overflow-hidden">
                {/* Camera viewport */}
                <div className="relative bg-[#000] aspect-square w-full">
                  <div id="qr-reader" className="w-full h-full" ref={containerRef} />
                  {/* Corner brackets overlay */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="relative w-48 h-48">
                      {[
                        'top-0 left-0 border-t-2 border-l-2',
                        'top-0 right-0 border-t-2 border-r-2',
                        'bottom-0 left-0 border-b-2 border-l-2',
                        'bottom-0 right-0 border-b-2 border-r-2',
                      ].map((cls, i) => (
                        <div key={i} className={`absolute ${cls} border-[#39ff14] w-8 h-8`} />
                      ))}
                      {/* Scan line */}
                      <div className="absolute inset-0 overflow-hidden rounded-sm">
                        <div className="h-0.5 bg-[#39ff14] opacity-80 animate-[scan_2s_ease-in-out_infinite]"
                          style={{ animationName: 'scan' }} />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-4 flex items-center gap-2 text-[#6b7a9c] text-xs">
                  <Scan className="w-3.5 h-3.5 text-[#39ff14] shrink-0" />
                  Apuntá la cámara al código QR del asistente
                </div>
              </div>
            ) : (
              <div className="card card-glow p-5">
                <h2 className="font-display font-extrabold text-sm uppercase tracking-widest text-[#39ff14] mb-4">
                  Ingreso manual
                </h2>
                <div className="space-y-3">
                  <input
                    className="input-field font-mono text-sm"
                    placeholder="Pegá o escribí el código QR"
                    value={manual}
                    onChange={e => setManual(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleManualSubmit()}
                    autoFocus
                  />
                  <button
                    onClick={handleManualSubmit}
                    disabled={!manual.trim()}
                    className="btn-pitch w-full flex items-center justify-center gap-2 py-3 text-base"
                  >
                    <Scan className="w-5 h-5" />Validar
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {!sectorKey && (
          <div className="card p-10 text-center mt-2">
            <Shield className="w-12 h-12 text-[#1a2540] mx-auto mb-4" />
            <p className="text-[#6b7a9c] text-sm">Seleccioná un sector para comenzar a validar</p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes scan {
          0% { transform: translateY(0); }
          50% { transform: translateY(192px); }
          100% { transform: translateY(0); }
        }
        /* html5-qrcode dibuja su propio "shaded region" con brackets blancos
           (el cuadrado blanco). Lo ocultamos: ya tenemos overlay verde propio.
           El video se fuerza a cubrir todo el viewport. */
        #qr-reader { border: 0 !important; background: #000 !important; }
        #qr-reader video {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          display: block !important;
        }
        #qr-reader #qr-shaded-region { display: none !important; }
        #qr-reader #qr-canvas { display: none !important; }
      `}</style>
    </div>
  )
}
