import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix para ícones do Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  title?: string;
  popup?: string;
  icon?: 'default' | 'vehicle' | 'origin' | 'destination';
}

export interface MapRoute {
  coordinates: [number, number][];
  color?: string;
}

interface MapProps {
  center?: [number, number];
  zoom?: number;
  markers?: MapMarker[];
  route?: MapRoute;
  onMapClick?: (lat: number, lng: number) => void;
  onMarkerClick?: (markerId: string) => void;
  className?: string;
  showCurrentLocation?: boolean;
}

// Ícones personalizados
const createCustomIcon = (type: MapMarker['icon']) => {
  const colors = {
    default: '#3B82F6',
    vehicle: '#10B981',
    origin: '#22C55E',
    destination: '#EF4444',
  };

  const color = colors[type || 'default'];

  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        ${type === 'vehicle' ? '<span style="color:white;font-size:12px;">🚗</span>' : ''}
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

export default function Map({
  center = [-23.5505, -46.6333], // São Paulo default
  zoom = 13,
  markers = [],
  route,
  onMapClick,
  onMarkerClick,
  className = 'h-[400px] w-full',
  showCurrentLocation = false,
}: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null);

  // Inicializar mapa
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current).setView(center, zoom);

    // OpenStreetMap tiles (GRATUITO!)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // Layer para markers
    markersLayerRef.current = L.layerGroup().addTo(map);

    // Click handler
    if (onMapClick) {
      map.on('click', (e) => {
        onMapClick(e.latlng.lat, e.latlng.lng);
      });
    }

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Obter localização atual
  useEffect(() => {
    if (!showCurrentLocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation([position.coords.latitude, position.coords.longitude]);
      },
      (error) => {
        console.error('Erro ao obter localização:', error);
      }
    );
  }, [showCurrentLocation]);

  // Atualizar centro do mapa
  useEffect(() => {
    if (mapInstanceRef.current && center) {
      mapInstanceRef.current.setView(center, zoom);
    }
  }, [center, zoom]);

  // Atualizar markers
  useEffect(() => {
    if (!markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    markers.forEach((marker) => {
      const icon = createCustomIcon(marker.icon);
      const leafletMarker = L.marker([marker.lat, marker.lng], { icon });

      if (marker.popup) {
        leafletMarker.bindPopup(marker.popup);
      }

      if (marker.title) {
        leafletMarker.bindTooltip(marker.title);
      }

      if (onMarkerClick) {
        leafletMarker.on('click', () => onMarkerClick(marker.id));
      }

      leafletMarker.addTo(markersLayerRef.current!);
    });

    // Adicionar localização atual
    if (currentLocation) {
      const currentLocMarker = L.circleMarker(currentLocation, {
        radius: 8,
        fillColor: '#3B82F6',
        color: '#fff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8,
      });
      currentLocMarker.bindTooltip('Você está aqui');
      currentLocMarker.addTo(markersLayerRef.current!);
    }
  }, [markers, currentLocation, onMarkerClick]);

  // Atualizar rota
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Remover rota anterior
    if (routeLayerRef.current) {
      routeLayerRef.current.remove();
      routeLayerRef.current = null;
    }

    if (route && route.coordinates.length > 0) {
      const latLngs = route.coordinates.map(([lat, lng]) => L.latLng(lat, lng));
      routeLayerRef.current = L.polyline(latLngs, {
        color: route.color || '#3B82F6',
        weight: 4,
        opacity: 0.8,
      }).addTo(mapInstanceRef.current);

      // Ajustar visualização para mostrar toda a rota
      mapInstanceRef.current.fitBounds(routeLayerRef.current.getBounds(), { padding: [50, 50] });
    }
  }, [route]);

  return (
    <div className={className}>
      <div ref={mapRef} style={{ height: '100%', width: '100%', borderRadius: '8px' }} />
    </div>
  );
}
