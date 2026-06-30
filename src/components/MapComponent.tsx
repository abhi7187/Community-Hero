import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Info, CheckCircle2, AlertTriangle, Clock, Compass, Loader2 } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

interface Issue {
  id: string;
  title: string;
  category: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Pending' | 'Assigned' | 'In Progress' | 'Resolved' | 'Closed';
  latitude: number;
  longitude: number;
  address: string;
}

interface MapComponentProps {
  issues: Issue[];
  selectedIssueId?: string;
  onSelectIssue?: (issueId: string) => void;
  interactive?: boolean;
  onLocationSelect?: (lat: number, lng: number, address: string) => void;
  initialLat?: number;
  initialLng?: number;
}

export default function MapComponent({
  issues,
  selectedIssueId,
  onSelectIssue,
  interactive = false,
  onLocationSelect,
  initialLat = 37.7749,
  initialLng = -122.4194,
}: MapComponentProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const draggedPinMarkerRef = useRef<L.Marker | null>(null);
  const userGpsMarkerRef = useRef<L.Marker | null>(null);

  // States
  const [draggedPin, setDraggedPin] = useState<{ lat: number; lng: number } | null>(
    interactive ? { lat: initialLat, lng: initialLng } : null
  );
  const [gpsLoading, setGpsLoading] = useState(false);
  const [myPosition, setMyPosition] = useState<{ lat: number; lng: number } | null>(null);

  // Status mapping for CSS colors
  const getStatusColorClass = (status: string) => {
    switch (status) {
      case 'Resolved': return 'bg-emerald-500 border-emerald-300';
      case 'In Progress': return 'bg-amber-500 border-amber-300';
      case 'Assigned': return 'bg-blue-500 border-blue-300';
      case 'Closed': return 'bg-slate-500 border-slate-400';
      default: return 'bg-rose-500 border-rose-300';
    }
  };

  const getSeverityRingClass = (severity: string) => {
    switch (severity) {
      case 'Critical': return 'ring-4 ring-rose-500/80 animate-pulse';
      case 'High': return 'ring-2 ring-orange-400/80 animate-pulse';
      case 'Medium': return 'ring-2 ring-amber-300/80';
      default: return 'ring-1 ring-emerald-300/80';
    }
  };

  // Create a customized HTML marker icon using Leaflet's DivIcon
  const createCustomMarker = (status: string, severity: string, isSelected: boolean) => {
    const statusColor = getStatusColorClass(status);
    const severityRing = getSeverityRingClass(severity);
    const selectedClass = isSelected ? 'scale-125 ring-4 ring-white border-white' : '';

    return L.divIcon({
      html: `
        <div class="w-6 h-6 rounded-full border-2 flex items-center justify-center shadow-lg transition-transform ${statusColor} ${severityRing} ${selectedClass}">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-white"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
        </div>
      `,
      className: 'custom-leaflet-pin-wrapper',
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
  };

  // 1. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    // Initialize map with custom Zoom control location
    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 13,
      zoomControl: false,
    });

    // Add zoom control at top-right
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Apply CartoDB Dark Matter tile layer for premium dark tactical HUD feel
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(map);

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // 2. Add and Update Incident Markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove old markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add markers for all registered issues
    issues.forEach(issue => {
      const isSelected = selectedIssueId === issue.id;
      const customIcon = createCustomMarker(issue.status, issue.severity, isSelected);

      const marker = L.marker([issue.latitude, issue.longitude], { icon: customIcon })
        .addTo(map)
        .on('click', () => {
          if (onSelectIssue) onSelectIssue(issue.id);
        });

      // Bind a clean popup styled via custom HTML
      const tooltipContent = `
        <div class="p-1 font-sans text-slate-100 min-w-[150px]">
          <h5 class="font-bold text-xs truncate m-0 text-slate-100">${issue.title}</h5>
          <p class="text-[10px] text-slate-400 mt-0.5 truncate m-0">${issue.address}</p>
          <div class="flex items-center gap-1.5 mt-1">
            <span class="px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider font-mono bg-slate-800 text-slate-300 uppercase">${issue.status}</span>
            <span class="px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider font-mono bg-indigo-950/40 text-indigo-400 uppercase">${issue.severity}</span>
          </div>
        </div>
      `;

      marker.bindTooltip(tooltipContent, {
        direction: 'top',
        offset: [0, -10],
        className: 'custom-leaflet-tooltip bg-slate-900 border border-slate-700 text-white p-2 rounded-lg shadow-xl'
      });

      markersRef.current.push(marker);

      // Centering view smoothly on selection
      if (isSelected) {
        map.flyTo([issue.latitude, issue.longitude], 15, { animate: true, duration: 1 });
      }
    });
  }, [issues, selectedIssueId]);

  // 3. Setup Draggable Pin for Interactive Reporting Mode
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (draggedPinMarkerRef.current) {
      draggedPinMarkerRef.current.remove();
      draggedPinMarkerRef.current = null;
    }

    if (interactive && draggedPin) {
      const pinIcon = L.divIcon({
        html: `
          <div class="flex flex-col items-center select-none">
            <div class="bg-rose-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-lg border border-rose-400 whitespace-nowrap mb-1 font-mono uppercase tracking-wider">
              Drag or Click map
            </div>
            <div class="w-8 h-8 bg-rose-600 rounded-full border-2 border-white flex items-center justify-center shadow-2xl ring-4 ring-rose-500/30">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="animate-pulse"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
            </div>
          </div>
        `,
        className: 'interactive-dragged-pin-wrapper',
        iconSize: [120, 60],
        iconAnchor: [60, 52]
      });

      const marker = L.marker([draggedPin.lat, draggedPin.lng], {
        icon: pinIcon,
        draggable: true
      }).addTo(map);

      // Listen for drag end event to resolve coordinates and update address
      marker.on('dragend', async (e: any) => {
        const { lat, lng } = e.target.getLatLng();
        const updatedLat = Number(lat.toFixed(5));
        const updatedLng = Number(lng.toFixed(5));
        setDraggedPin({ lat: updatedLat, lng: updatedLng });

        if (onLocationSelect) {
          let resolvedAddress = `Coordinates: ${updatedLat}, ${updatedLng}`;
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${updatedLat}&lon=${updatedLng}`, {
              headers: { 'Accept-Language': 'en' }
            });
            if (res.ok) {
              const data = await res.json();
              resolvedAddress = data.display_name || resolvedAddress;
            }
          } catch (err) {
            console.error('Reverse geocoding error:', err);
          }
          onLocationSelect(updatedLat, updatedLng, resolvedAddress);
        }
      });

      draggedPinMarkerRef.current = marker;
    }
  }, [interactive, draggedPin]);

  // 4. Synchronize with initialLat / initialLng changes from parent
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.flyTo([initialLat, initialLng], mapRef.current.getZoom());
      if (interactive) {
        setDraggedPin({ lat: initialLat, lng: initialLng });
      }
    }
  }, [initialLat, initialLng, interactive]);

  // 5. Handle direct map click positioning in interactive mode
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const handleMapClick = async (e: L.LeafletMouseEvent) => {
      if (!interactive || !onLocationSelect) return;
      const { lat, lng } = e.latlng;
      const updatedLat = Number(lat.toFixed(5));
      const updatedLng = Number(lng.toFixed(5));

      setDraggedPin({ lat: updatedLat, lng: updatedLng });

      let resolvedAddress = `Coordinates: ${updatedLat}, ${updatedLng}`;
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${updatedLat}&lon=${updatedLng}`, {
          headers: { 'Accept-Language': 'en' }
        });
        if (res.ok) {
          const data = await res.json();
          resolvedAddress = data.display_name || resolvedAddress;
        }
      } catch (err) {
        console.error('Reverse geocoding error:', err);
      }
      onLocationSelect(updatedLat, updatedLng, resolvedAddress);
    };

    map.on('click', handleMapClick);
    return () => {
      map.off('click', handleMapClick);
    };
  }, [interactive, onLocationSelect]);

  // 6. Draw real-time User GPS blue pulse
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (userGpsMarkerRef.current) {
      userGpsMarkerRef.current.remove();
      userGpsMarkerRef.current = null;
    }

    if (myPosition) {
      const gpsIcon = L.divIcon({
        html: `
          <div class="relative flex items-center justify-center">
            <div class="absolute w-6 h-6 bg-blue-500 rounded-full animate-ping opacity-60"></div>
            <div class="w-3.5 h-3.5 bg-blue-500 rounded-full border-2 border-white shadow-lg"></div>
          </div>
        `,
        className: 'user-gps-pin-wrapper',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      userGpsMarkerRef.current = L.marker([myPosition.lat, myPosition.lng], { icon: gpsIcon }).addTo(map);
    }
  }, [myPosition]);

  // Real-time GPS User Locater handler
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('GPS Geolocation is not supported by your browser.');
      return;
    }

    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        const updatedLat = Number(lat.toFixed(5));
        const updatedLng = Number(lng.toFixed(5));

        setGpsLoading(false);
        setMyPosition({ lat: updatedLat, lng: updatedLng });

        if (mapRef.current) {
          mapRef.current.flyTo([updatedLat, updatedLng], 16, { animate: true, duration: 1.5 });
        }

        // If in reporting mode, auto pinpoint to detected GPS location
        if (interactive && onLocationSelect) {
          setDraggedPin({ lat: updatedLat, lng: updatedLng });
          let resolvedAddress = `Coordinates: ${updatedLat}, ${updatedLng}`;
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${updatedLat}&lon=${updatedLng}`, {
              headers: { 'Accept-Language': 'en' }
            });
            if (res.ok) {
              const data = await res.json();
              resolvedAddress = data.display_name || resolvedAddress;
            }
          } catch (err) {
            console.error('Reverse geocoding error:', err);
          }
          onLocationSelect(updatedLat, updatedLng, resolvedAddress);
        }
      },
      (error) => {
        console.error('GPS localization error:', error);
        setGpsLoading(false);
        // Fallback to San Francisco center
        if (mapRef.current) {
          mapRef.current.flyTo([37.7749, -122.4194], 14, { animate: true, duration: 1.5 });
        }
        alert('Could not determine exact location. Falling back to default center.');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  return (
    <div className="relative w-full h-[400px] md:h-[480px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
      {/* Map canvas container */}
      <div
        id="civic-map-canvas"
        ref={mapContainerRef}
        className="w-full h-full cursor-crosshair"
      />

      {/* Floating Locate-Me button */}
      <button
        onClick={handleLocateMe}
        disabled={gpsLoading}
        className="absolute bottom-4 left-4 z-[1000] bg-slate-900/90 backdrop-blur-md hover:bg-slate-800 text-slate-100 border border-slate-700/80 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xl hover:text-indigo-400 disabled:opacity-75 cursor-pointer transition-all"
        title="Find my real current location"
      >
        {gpsLoading ? (
          <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
        ) : (
          <Compass className="w-4 h-4 text-emerald-400 animate-pulse" />
        )}
        <span>{gpsLoading ? 'Detecting GPS...' : 'Locate Me'}</span>
      </button>

      {/* Map Overlay Controls / HUD */}
      <div className="absolute top-3 left-3 z-[1000] bg-slate-900/90 backdrop-blur-md p-3 rounded-xl border border-slate-800 text-white flex flex-col gap-1 shadow-lg max-w-[200px] pointer-events-none">
        <h4 className="text-[11px] font-bold tracking-widest text-emerald-400 font-mono uppercase">HYPERLOCAL HUB HUD</h4>
        <p className="text-[10px] text-slate-400 leading-tight">Interactive real-world OpenStreetMap integration.</p>
        <div className="flex items-center gap-1.5 mt-1.5 text-[9px] font-mono text-slate-300">
          <Clock className="w-3 h-3 text-emerald-400" />
          <span>UTC LIVE SYNC</span>
        </div>
      </div>

      {/* Map Legend */}
      <div className="absolute bottom-3 right-3 z-[1000] bg-slate-900/90 backdrop-blur-sm px-3 py-2 rounded-xl border border-slate-800 flex gap-3 text-[10px] font-mono text-slate-300 shadow-md">
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
          <span>Pending</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
          <span>Assigned</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
          <span>In Progress</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <span>Resolved</span>
        </div>
      </div>
    </div>
  );
}
