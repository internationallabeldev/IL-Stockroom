'use client'

import { useState } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Maximize2, X, MapPin } from 'lucide-react'

const markerIcon = L.divIcon({
  html: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="36" viewBox="0 0 24 36">
    <path fill="#1A1A1A" d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24S24 21 24 12C24 5.4 18.6 0 12 0z"/>
    <circle fill="#F5F2EA" cx="12" cy="12" r="5"/>
  </svg>`,
  className: '',
  iconSize: [24, 36],
  iconAnchor: [12, 36],
  popupAnchor: [0, -38],
})

const DEFAULT_LAT = 18.9242
const DEFAULT_LNG = -99.2216

type Props = {
  lat: number | null
  lng: number | null
  onChange: (lat: number, lng: number) => void
  readOnly?: boolean
}

function ClickHandler({ onChange }: { onChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) { onChange(e.latlng.lat, e.latlng.lng) },
  })
  return null
}

type MapCoreProps = {
  lat: number | null
  lng: number | null
  onChange: (lat: number, lng: number) => void
  zoom?: number
  readOnly?: boolean
}

function MapCore({ lat, lng, onChange, zoom = 13, readOnly = false }: MapCoreProps) {
  const centerLat = lat ?? DEFAULT_LAT
  const centerLng = lng ?? DEFAULT_LNG

  return (
    <MapContainer
      center={[centerLat, centerLng]}
      zoom={zoom}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={!readOnly}
      dragging={!readOnly}
      doubleClickZoom={!readOnly}
      zoomControl={!readOnly}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {!readOnly && <ClickHandler onChange={onChange} />}
      {lat !== null && lng !== null && (
        <Marker
          position={[lat, lng]}
          icon={markerIcon}
          draggable={!readOnly}
          eventHandlers={!readOnly ? {
            dragend(e) {
              const pos = e.target.getLatLng()
              onChange(pos.lat, pos.lng)
            },
          } : {}}
        />
      )}
    </MapContainer>
  )
}

export default function ProviderMap({ lat, lng, onChange, readOnly = false }: Props) {
  const [fullscreen, setFullscreen] = useState(false)

  return (
    <>
      {/* Compact map */}
      <div className="relative w-full h-64 border border-[#1A1A1A]/20 overflow-hidden group">
        <MapCore lat={lat} lng={lng} onChange={onChange} readOnly={readOnly} />

        <button
          type="button"
          onClick={() => setFullscreen(true)}
          className="absolute top-2 right-2 z-1000 size-8 bg-[#F5F2EA] border border-[#1A1A1A]/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#E5E1D8] shadow-sm"
          title="Ver mapa completo"
        >
          <Maximize2 className="size-3.5 text-[#1A1A1A]" />
        </button>

        {!readOnly && lat === null && (
          <div className="absolute bottom-2 left-2 z-1000 bg-[#F5F2EA]/90 border border-[#1A1A1A]/15 px-2 py-1 pointer-events-none">
            <p className="text-[9px] font-bold uppercase tracking-widest text-[#5f5e59]">
              Click para fijar ubicación
            </p>
          </div>
        )}
      </div>

      {/* Fullscreen dialog */}
      {fullscreen && (
        <div className="fixed inset-0 z-9999 flex flex-col bg-[#1A1A1A]/60 backdrop-blur-sm">
          <div className="flex items-center justify-between px-5 py-3 bg-[#F5F2EA] border-b border-[#1A1A1A]/15 shrink-0">
            <div className="flex items-center gap-2">
              <MapPin className="size-4 text-[#1A1A1A]/60" />
              <span className="font-heading font-bold text-sm tracking-tight">
                {readOnly ? 'Ubicación del proveedor' : 'Seleccionar ubicación'}
              </span>
              {lat !== null && lng !== null && (
                <span className="font-mono text-[11px] text-[#5f5e59] ml-2">
                  {lat.toFixed(6)}, {lng.toFixed(6)}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setFullscreen(false)}
              className="size-8 flex items-center justify-center hover:bg-[#E5E1D8] transition-colors"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="flex-1 relative">
            <MapCore
              key="fullscreen"
              lat={lat}
              lng={lng}
              onChange={onChange}
              zoom={14}
              readOnly={readOnly}
            />
          </div>

          <div className="px-5 py-2.5 bg-[#F5F2EA] border-t border-[#1A1A1A]/15 flex items-center justify-between shrink-0">
            <p className="text-[9px] font-bold uppercase tracking-widest text-[#5f5e59]">
              {readOnly
                ? 'Ubicación guardada del proveedor'
                : 'Click en el mapa o arrastra el marcador para ajustar'}
            </p>
            <button
              type="button"
              onClick={() => setFullscreen(false)}
              className="px-4 py-1.5 bg-[#1A1A1A] text-[#F5F2EA] text-[10px] font-bold uppercase tracking-widest hover:opacity-80 transition-opacity"
            >
              {readOnly ? 'Cerrar' : 'Confirmar ubicación'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
