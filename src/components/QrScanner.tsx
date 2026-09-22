import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { X } from 'lucide-react'

export interface QrEquipmentData {
  num_inventaire: string
  nom: string
  marque: string
  modele: string
  type_equipement: string
  service_nom: string
  localisation_nom: string
}

interface QrScannerProps {
  onScan: (data: QrEquipmentData) => void
  onClose: () => void
}

export default function QrScanner({ onScan, onClose }: QrScannerProps) {
  const [error, setError] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const scannerRef = useRef<Html5Qrcode | null>(null)

  useEffect(() => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    ) || window.innerWidth < 768

    if (!isMobile) {
      setError('Le scan QR est disponible uniquement sur mobile')
      return
    }

    const scanner = new Html5Qrcode('qr-reader')
    scannerRef.current = scanner

    const startScanning = async () => {
      try {
        setScanning(true)
        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            try {
              const data: QrEquipmentData = JSON.parse(decodedText)
              if (data.num_inventaire && data.nom) {
                void scanner.stop().then(() => onScan(data))
              }
            } catch {
              // Not valid JSON, ignore
            }
          },
          () => {} // ignore errors during scanning
        )
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        if (msg.includes('NotAllowedError')) {
          setError('Permission camera refusee. Autorisez l\'acces camera dans les parametres.')
        } else if (msg.includes('NotFoundError')) {
          setError('Aucun camera detecte sur cet appareil')
        } else {
          setError(`Erreur camera: ${msg}`)
        }
        setScanning(false)
      }
    }

    startScanning()

    return () => {
      if (scannerRef.current) {
        void scannerRef.current.stop()
        void scannerRef.current.clear()
      }
    }
  }, [onScan])

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl overflow-hidden max-w-md w-full">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-slate-900">Scanner QR Code</h3>
          <button
            onClick={() => {
              void scannerRef.current?.stop()
              onClose()
            }}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative aspect-square bg-black">
          {error ? (
            <div className="flex items-center justify-center h-full p-6 text-center">
              <div>
                <div className="text-4xl mb-3">📷</div>
                <p className="text-white text-sm">{error}</p>
              </div>
            </div>
          ) : (
            <>
              <div id="qr-reader" className="w-full h-full" />
              {scanning && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-64 h-64 border-2 border-white/50 rounded-xl">
                    <div className="w-full h-0.5 bg-red-500 animate-pulse mt-0" />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="p-4 text-center">
          <p className="text-xs text-slate-500">
            Positionnez le QR code de l'equipement dans le cadre
          </p>
        </div>
      </div>
    </div>
  )
}
