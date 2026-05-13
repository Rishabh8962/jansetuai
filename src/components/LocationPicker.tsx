import { useEffect, useRef, useState } from 'react';
import { APIProvider, Map, Marker } from '@vis.gl/react-google-maps';
import { MapPin, Crosshair, Map as MapIcon, Pencil, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GOOGLE_MAPS_API_KEY, BHOPAL_CENTER, DARK_MAP_STYLE } from '@/lib/mapsConfig';
import { toast } from 'sonner';

export interface PickedLocation {
  lat: number;
  lng: number;
  address: string;
  timestamp: string;
}

interface Props {
  value?: PickedLocation | null;
  onChange: (loc: PickedLocation) => void;
}

type Mode = 'gps' | 'map' | 'manual';

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`;
    const r = await fetch(url);
    const j = await r.json();
    return j?.results?.[0]?.formatted_address ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
}

export default function LocationPicker({ value, onChange }: Props) {
  const [mode, setMode] = useState<Mode>('gps');
  const [loading, setLoading] = useState(false);
  const [marker, setMarker] = useState<{ lat: number; lng: number }>(
    value ? { lat: value.lat, lng: value.lng } : BHOPAL_CENTER,
  );
  const [manualAddress, setManualAddress] = useState(value?.address ?? '');
  const triedGps = useRef(false);

  const useCurrent = async () => {
    if (!navigator.geolocation) {
      toast.error('GPS not supported, switching to manual');
      setMode('manual');
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const address = await reverseGeocode(lat, lng);
        setMarker({ lat, lng });
        onChange({ lat, lng, address, timestamp: new Date().toISOString() });
        setLoading(false);
        toast.success('Location captured');
      },
      () => {
        setLoading(false);
        toast.error('Permission denied — enter address manually');
        setMode('manual');
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  useEffect(() => {
    if (mode === 'gps' && !value && !triedGps.current) {
      triedGps.current = true;
      useCurrent();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const confirmMapPick = async () => {
    setLoading(true);
    const address = await reverseGeocode(marker.lat, marker.lng);
    onChange({ ...marker, address, timestamp: new Date().toISOString() });
    setLoading(false);
    toast.success('Location set');
  };

  const saveManual = () => {
    if (!manualAddress.trim()) {
      toast.error('Enter an address');
      return;
    }
    onChange({
      lat: marker.lat,
      lng: marker.lng,
      address: manualAddress.trim(),
      timestamp: new Date().toISOString(),
    });
    toast.success('Address saved');
  };

  const tabBtn = (id: Mode, label: string, Icon: typeof MapPin) => (
    <button
      type="button"
      onClick={() => setMode(id)}
      className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition ${
        mode === id
          ? 'bg-saffron/15 text-saffron border border-saffron/40'
          : 'bg-secondary/50 text-muted-foreground hover:text-foreground border border-transparent'
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-saffron/15 flex items-center justify-center">
          <MapPin className="w-4 h-4 text-saffron" />
        </div>
        <div>
          <div className="text-sm font-semibold">Complaint Location</div>
          <div className="text-[11px] text-muted-foreground">Help workers find the exact spot</div>
        </div>
      </div>

      <div className="flex gap-2">
        {tabBtn('gps', 'Current', Crosshair)}
        {tabBtn('map', 'On Map', MapIcon)}
        {tabBtn('manual', 'Manual', Pencil)}
      </div>

      {mode === 'gps' && (
        <div className="glass-card p-4 text-center">
          {loading ? (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-4">
              <Loader2 className="w-4 h-4 animate-spin" /> Detecting your location…
            </div>
          ) : value ? (
            <div className="text-sm text-foreground py-2">
              <CheckCircle2 className="w-5 h-5 text-india-green mx-auto mb-1.5" />
              <div className="font-medium">{value.address}</div>
              <div className="text-[11px] text-muted-foreground font-mono mt-1">
                {value.lat.toFixed(5)}, {value.lng.toFixed(5)}
              </div>
              <Button size="sm" variant="ghost" onClick={useCurrent} className="mt-2 text-xs">Re-detect</Button>
            </div>
          ) : (
            <Button onClick={useCurrent} className="bg-saffron text-saffron-foreground hover:bg-saffron/90 gap-2">
              <Crosshair className="w-4 h-4" /> Use Current Location
            </Button>
          )}
        </div>
      )}

      {mode === 'map' && (
        <div className="space-y-2">
          <div className="rounded-xl overflow-hidden border border-border/50" style={{ height: 240 }}>
            <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
              <Map
                defaultCenter={marker}
                defaultZoom={14}
                gestureHandling="greedy"
                styles={DARK_MAP_STYLE}
                onClick={(e) => {
                  const ll = e.detail.latLng;
                  if (ll) setMarker({ lat: ll.lat, lng: ll.lng });
                }}
                className="w-full h-full"
              >
                <Marker
                  position={marker}
                  draggable
                  onDragEnd={(e) => {
                    const ll = e.latLng;
                    if (ll) setMarker({ lat: ll.lat(), lng: ll.lng() });
                  }}
                />
              </Map>
            </APIProvider>
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="text-[11px] text-muted-foreground font-mono">
              {marker.lat.toFixed(5)}, {marker.lng.toFixed(5)}
            </div>
            <Button size="sm" onClick={confirmMapPick} disabled={loading} className="bg-saffron text-saffron-foreground hover:bg-saffron/90">
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Confirm location'}
            </Button>
          </div>
        </div>
      )}

      {mode === 'manual' && (
        <div className="space-y-2">
          <Input
            value={manualAddress}
            onChange={(e) => setManualAddress(e.target.value)}
            placeholder="House / street / landmark, ward, city"
            className="bg-secondary/50"
          />
          <Button onClick={saveManual} className="w-full bg-saffron text-saffron-foreground hover:bg-saffron/90">
            Save address
          </Button>
        </div>
      )}

      {value && mode !== 'gps' && (
        <div className="glass-card p-3 border-india-green/30 flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 text-india-green mt-0.5 shrink-0" />
          <div className="text-xs text-foreground flex-1 min-w-0">
            <div className="font-medium truncate">{value.address}</div>
            <div className="text-[10px] text-muted-foreground font-mono">
              {value.lat.toFixed(5)}, {value.lng.toFixed(5)} · {new Date(value.timestamp).toLocaleString()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
