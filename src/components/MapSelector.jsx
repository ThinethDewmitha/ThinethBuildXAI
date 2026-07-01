import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MapPin, Search, Loader2, Check, ArrowLeft, Globe, Crosshair } from 'lucide-react';

/**
 * MapSelector – Interactive Leaflet map for selecting construction site location.
 * Uses OpenStreetMap tiles (free, no API key needed).
 * Reverse geocodes the selected location via Nominatim.
 */
const NOMINATIM_HEADERS = {
    'Accept-Language': 'en',
    'User-Agent': 'BuildXAI/1.0 (https://thineth-buildx-ai.vercel.app; support@buildx.ai)',
};

const SUGGESTION_MIN_CHARS = 2;
const SUGGESTION_DEBOUNCE_MS = 400;
const FALLBACK_MAP_VIEW = { center: [20.5937, 78.9629], zoom: 5 };

function zoomForCountryCode(code) {
    const cc = (code || '').toUpperCase();
    const large = new Set(['US', 'CA', 'RU', 'CN', 'BR', 'AU', 'IN', 'AR', 'KZ', 'DZ', 'CD']);
    const small = new Set(['SG', 'MV', 'MT', 'BH', 'LU', 'MC', 'AD', 'SM', 'VA', 'LK', 'CY']);
    if (small.has(cc)) return 8;
    if (large.has(cc)) return 5;
    return 6;
}

async function detectConnectionRegion() {
    const providers = [
        async () => {
            const res = await fetch('https://ipwho.is/');
            if (!res.ok) throw new Error('ipwho unavailable');
            const data = await res.json();
            if (!data.success) throw new Error('ipwho failed');
            return {
                lat: Number(data.latitude),
                lng: Number(data.longitude),
                country: data.country,
                countryCode: data.country_code,
                city: data.city,
            };
        },
        async () => {
            const res = await fetch('https://get.geojs.io/v1/ip/geo.json');
            if (!res.ok) throw new Error('geojs unavailable');
            const data = await res.json();
            return {
                lat: Number(data.latitude),
                lng: Number(data.longitude),
                country: data.country,
                countryCode: data.country_code,
                city: data.city,
            };
        },
    ];

    for (const load of providers) {
        try {
            const region = await load();
            if (Number.isFinite(region.lat) && Number.isFinite(region.lng)) {
                return region;
            }
        } catch {
            // try next provider
        }
    }
    return null;
}

function suggestionPrimaryLabel(item) {
    const addr = item.address || {};
    return addr.city || addr.town || addr.village || addr.suburb || addr.county || item.display_name?.split(',')[0] || 'Location';
}

function suggestionSecondaryLabel(item) {
    const parts = (item.display_name || '').split(',').map((p) => p.trim()).filter(Boolean);
    if (parts.length <= 1) return '';
    return parts.slice(1).join(', ');
}

export default function MapSelector({ onLocationConfirm, onBack }) {
    const mapContainerRef = useRef(null);
    const mapRef = useRef(null);
    const markerRef = useRef(null);
    const searchWrapRef = useRef(null);
    const searchDebounceRef = useRef(null);
    const searchAbortRef = useRef(null);
    const [location, setLocation] = useState(null);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searching, setSearching] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [suggestionsOpen, setSuggestionsOpen] = useState(false);
    const [suggestionsLoading, setSuggestionsLoading] = useState(false);
    const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
    const [gpsLoading, setGpsLoading] = useState(false);
    const [gpsError, setGpsError] = useState('');
    const [connectionRegion, setConnectionRegion] = useState(null);
    const [regionDetecting, setRegionDetecting] = useState(true);

    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current) return;

        const L = window.L;
        if (!L) {
            console.error('Leaflet not loaded');
            return;
        }

        const map = L.map(mapContainerRef.current, {
            center: [20, 0],
            zoom: 2,
            zoomControl: true,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19,
        }).addTo(map);

        map.on('click', async (e) => {
            const { lat, lng } = e.latlng;
            placeMarker(map, lat, lng);
            await reverseGeocode(lat, lng);
        });

        mapRef.current = map;

        let cancelled = false;
        setRegionDetecting(true);
        detectConnectionRegion()
            .then((region) => {
                if (cancelled || !mapRef.current) return;
                if (region) {
                    mapRef.current.flyTo(
                        [region.lat, region.lng],
                        zoomForCountryCode(region.countryCode),
                        { animate: true, duration: 1.2 },
                    );
                    setConnectionRegion(region);
                } else {
                    mapRef.current.setView(FALLBACK_MAP_VIEW.center, FALLBACK_MAP_VIEW.zoom);
                }
            })
            .finally(() => {
                if (!cancelled) setRegionDetecting(false);
            });

        return () => {
            cancelled = true;
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, []);

    const placeMarker = (map, lat, lng) => {
        const L = window.L;
        if (markerRef.current) {
            markerRef.current.setLatLng([lat, lng]);
        } else {
            const customIcon = L.divIcon({
                html: '<div style="font-size:2rem;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.5))">📍</div>',
                className: 'custom-pin',
                iconSize: [30, 40],
                iconAnchor: [15, 40],
            });
            markerRef.current = L.marker([lat, lng], { icon: customIcon }).addTo(map);
        }
        map.setView([lat, lng], Math.max(map.getZoom(), 14));
    };

    const reverseGeocode = async (lat, lng) => {
        setLoading(true);
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
                { headers: NOMINATIM_HEADERS }
            );
            const data = await res.json();
            const addr = data.address || {};

            setLocation({
                lat: parseFloat(lat.toFixed(6)),
                lng: parseFloat(lng.toFixed(6)),
                address: data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
                city: addr.city || addr.town || addr.village || addr.county || '',
                state: addr.state || '',
                country: addr.country || '',
                region: `${addr.state || ''}, ${addr.country || ''}`.replace(/^, /, ''),
                postcode: addr.postcode || '',
            });
        } catch (err) {
            setLocation({
                lat: parseFloat(lat.toFixed(6)),
                lng: parseFloat(lng.toFixed(6)),
                address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
                city: '', state: '', country: '', region: '', postcode: '',
            });
        }
        setLoading(false);
    };

    const applyPlaceResult = async (result) => {
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);
        const map = mapRef.current;
        if (map) {
            placeMarker(map, lat, lng);
            map.setView([lat, lng], 16);
            await reverseGeocode(lat, lng);
        }
        setSearchQuery(result.display_name || '');
        setSuggestions([]);
        setSuggestionsOpen(false);
        setActiveSuggestionIndex(-1);
    };

    const fetchSuggestions = useCallback(async (query, countryCode) => {
        if (searchAbortRef.current) searchAbortRef.current.abort();
        searchAbortRef.current = new AbortController();
        setSuggestionsLoading(true);
        const countryFilter = countryCode
            ? `&countrycodes=${encodeURIComponent(String(countryCode).toLowerCase())}`
            : '';
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1${countryFilter}`,
                { headers: NOMINATIM_HEADERS, signal: searchAbortRef.current.signal },
            );
            const results = await res.json();
            setSuggestions(Array.isArray(results) ? results : []);
            setSuggestionsOpen(true);
            setActiveSuggestionIndex(-1);
        } catch (err) {
            if (err.name !== 'AbortError') {
                setSuggestions([]);
            }
        } finally {
            setSuggestionsLoading(false);
        }
    }, []);

    useEffect(() => {
        const query = searchQuery.trim();
        if (query.length < SUGGESTION_MIN_CHARS) {
            setSuggestions([]);
            setSuggestionsLoading(false);
            return undefined;
        }

        if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
        searchDebounceRef.current = setTimeout(() => {
            fetchSuggestions(query, connectionRegion?.countryCode);
        }, SUGGESTION_DEBOUNCE_MS);

        return () => {
            if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
        };
    }, [searchQuery, fetchSuggestions, connectionRegion?.countryCode]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (searchWrapRef.current && !searchWrapRef.current.contains(e.target)) {
                setSuggestionsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectSuggestion = async (item) => {
        setSearching(true);
        try {
            await applyPlaceResult(item);
        } finally {
            setSearching(false);
        }
    };

    const handleSearchKeyDown = (e) => {
        if (!suggestionsOpen || suggestions.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveSuggestionIndex((i) => Math.min(i + 1, suggestions.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveSuggestionIndex((i) => Math.max(i - 1, 0));
        } else if (e.key === 'Enter' && activeSuggestionIndex >= 0) {
            e.preventDefault();
            selectSuggestion(suggestions[activeSuggestionIndex]);
        } else if (e.key === 'Escape') {
            setSuggestionsOpen(false);
            setActiveSuggestionIndex(-1);
        }
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        if (suggestionsOpen && activeSuggestionIndex >= 0 && suggestions[activeSuggestionIndex]) {
            await selectSuggestion(suggestions[activeSuggestionIndex]);
            return;
        }

        setSearching(true);
        try {
            const countryFilter = connectionRegion?.countryCode
                ? `&countrycodes=${encodeURIComponent(String(connectionRegion.countryCode).toLowerCase())}`
                : '';
            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1&addressdetails=1${countryFilter}`,
                { headers: NOMINATIM_HEADERS },
            );
            const results = await res.json();
            if (results.length > 0) {
                await applyPlaceResult(results[0]);
            }
        } catch (err) {
            console.warn('Search failed:', err);
        }
        setSearching(false);
    };

    const useDeviceGps = () => {
        if (!navigator.geolocation) {
            setGpsError('Geolocation is not supported on this device or browser.');
            return;
        }

        setGpsLoading(true);
        setGpsError('');

        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const { latitude, longitude } = pos.coords;
                const map = mapRef.current;
                if (map) {
                    placeMarker(map, latitude, longitude);
                    await reverseGeocode(latitude, longitude);
                }
                setGpsLoading(false);
            },
            (err) => {
                const messages = {
                    1: 'Location permission denied. Allow location access in your browser settings, then try again.',
                    2: 'Could not detect your position. Move outdoors or use search instead.',
                    3: 'GPS request timed out. Try again.',
                };
                setGpsError(messages[err.code] || 'Could not get your location.');
                setGpsLoading(false);
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
        );
    };

    const handleConfirm = () => {
        if (location) onLocationConfirm(location);
    };

    const handleSkip = () => {
        onLocationConfirm(null);
    };

    return (
        <div className="map-selector-container animate-in">
            <div className="map-header">
                <div className="welcome-badge"><MapPin size={14} /> Step 1 of 4</div>
                <h2>Select Your Construction Site</h2>
                <p>Click on the map, search for an address, or use <strong>My GPS</strong> to mark your construction site. This helps us give accurate soil, climate, and regional recommendations.</p>
            </div>

            {(regionDetecting || connectionRegion) && (
                <p className="map-region-hint" role="status">
                    {regionDetecting ? (
                        <><Loader2 size={14} className="spin" /> Detecting your country from connection…</>
                    ) : (
                        <>
                            <Globe size={14} />
                            Map centered on <strong>{connectionRegion.country}</strong>
                            {connectionRegion.city ? ` · near ${connectionRegion.city}` : ''}
                        </>
                    )}
                </p>
            )}

            {/* Search Bar */}
            <form className="map-search-bar" onSubmit={handleSearch}>
                <div className="map-search-input-wrap" ref={searchWrapRef}>
                    <input
                        type="text"
                        className="form-input"
                        placeholder={
                            connectionRegion
                                ? `Search in ${connectionRegion.country} (city, town, or address)`
                                : 'Search a location (e.g., Chennai, India or an address)'
                        }
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setSuggestionsOpen(true);
                        }}
                        onFocus={() => {
                            if (suggestions.length > 0) setSuggestionsOpen(true);
                        }}
                        onKeyDown={handleSearchKeyDown}
                        role="combobox"
                        aria-expanded={suggestionsOpen && suggestions.length > 0}
                        aria-autocomplete="list"
                        aria-controls="map-search-suggestions"
                    />
                    {suggestionsLoading && (
                        <span className="map-search-input-spinner" aria-hidden="true">
                            <Loader2 size={16} className="spin" />
                        </span>
                    )}
                    {suggestionsOpen && searchQuery.trim().length >= SUGGESTION_MIN_CHARS && (
                        <ul
                            id="map-search-suggestions"
                            className="map-search-suggestions"
                            role="listbox"
                        >
                            {suggestions.length === 0 && !suggestionsLoading && (
                                <li className="map-search-suggestion map-search-suggestion--empty">
                                    No places found — try a city or full address
                                </li>
                            )}
                            {suggestions.map((item, index) => (
                                <li key={item.place_id || `${item.lat}-${item.lon}-${index}`}>
                                    <button
                                        type="button"
                                        className={`map-search-suggestion${index === activeSuggestionIndex ? ' active' : ''}`}
                                        role="option"
                                        aria-selected={index === activeSuggestionIndex}
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => selectSuggestion(item)}
                                    >
                                        <MapPin size={14} className="map-search-suggestion-icon" />
                                        <span>
                                            <span className="map-search-suggestion-main">{suggestionPrimaryLabel(item)}</span>
                                            {suggestionSecondaryLabel(item) && (
                                                <span className="map-search-suggestion-meta">{suggestionSecondaryLabel(item)}</span>
                                            )}
                                        </span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <button
                    type="button"
                    className="btn btn-secondary map-gps-btn"
                    onClick={useDeviceGps}
                    disabled={gpsLoading}
                    title="Use your device GPS"
                >
                    {gpsLoading
                        ? <Loader2 size={16} className="spin" />
                        : <><Crosshair size={16} /> My GPS</>}
                </button>
                <button type="submit" className="btn btn-primary" disabled={searching}>
                    {searching ? <Loader2 size={16} className="spin" /> : <><Search size={16} /> Search</>}
                </button>
            </form>
            {gpsError && (
                <p className="map-gps-error" role="alert">{gpsError}</p>
            )}

            {/* Map Container */}
            <div className="map-wrapper">
                <div ref={mapContainerRef} className="map-container" />

                <button
                    type="button"
                    className="map-locate-btn"
                    onClick={useDeviceGps}
                    disabled={gpsLoading}
                    title="Center map on my location"
                    aria-label="Use my GPS location"
                >
                    {gpsLoading ? <Loader2 size={18} className="spin" /> : <Crosshair size={18} />}
                </button>

                {/* Location Info Overlay */}
                {location && (
                    <div className="map-location-card glass-card">
                        <div className="location-card-header">
                            <span className="location-pin-icon"><MapPin size={18} /></span>
                            <div>
                                <div className="location-title">Selected Location</div>
                                <div className="location-coords">{location.lat}, {location.lng}</div>
                            </div>
                        </div>
                        <div className="location-address">{location.address}</div>
                        {location.region && (
                            <div className="location-region"><Globe size={14} /> Region: {location.region}</div>
                        )}
                    </div>
                )}

                {loading && (
                    <div className="map-loading-overlay">
                        <div className="loader-spinner" style={{ width: '24px', height: '24px' }} />
                        <span>Getting location info...</span>
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="map-actions">
                {onBack && (
                    <button type="button" className="btn btn-secondary" onClick={onBack}><ArrowLeft size={16} /> Back</button>
                )}
                <button className="btn btn-secondary" onClick={handleSkip}>
                    Skip — I'll enter manually
                </button>
                <button
                    className="btn btn-primary btn-large"
                    disabled={!location}
                    onClick={handleConfirm}
                >
                    <Check size={16} /> Confirm Location & Continue
                </button>
            </div>
        </div>
    );
}
