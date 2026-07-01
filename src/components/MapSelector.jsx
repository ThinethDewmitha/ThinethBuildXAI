import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Search, Loader2, Check, ArrowLeft, Globe, Crosshair } from 'lucide-react';

/**
 * MapSelector – Interactive Leaflet map for selecting construction site location.
 * Uses OpenStreetMap tiles (free, no API key needed).
 * Reverse geocodes the selected location via Nominatim.
 */
export default function MapSelector({ onLocationConfirm, onBack }) {
    const mapContainerRef = useRef(null);
    const mapRef = useRef(null);
    const markerRef = useRef(null);
    const [location, setLocation] = useState(null);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searching, setSearching] = useState(false);
    const [gpsLoading, setGpsLoading] = useState(false);
    const [gpsError, setGpsError] = useState('');

    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current) return;

        const L = window.L;
        if (!L) {
            console.error('Leaflet not loaded');
            return;
        }

        // Initialize map centered on a default location (India center)
        const map = L.map(mapContainerRef.current, {
            center: [20.5937, 78.9629],
            zoom: 5,
            zoomControl: true,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19,
        }).addTo(map);

        // Click handler
        map.on('click', async (e) => {
            const { lat, lng } = e.latlng;
            placeMarker(map, lat, lng);
            await reverseGeocode(lat, lng);
        });

        mapRef.current = map;

        return () => {
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
                { headers: { 'Accept-Language': 'en' } }
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

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        setSearching(true);
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1&addressdetails=1`,
                { headers: { 'Accept-Language': 'en' } }
            );
            const results = await res.json();
            if (results.length > 0) {
                const r = results[0];
                const lat = parseFloat(r.lat);
                const lng = parseFloat(r.lon);
                const map = mapRef.current;
                if (map) {
                    placeMarker(map, lat, lng);
                    map.setView([lat, lng], 16);
                    await reverseGeocode(lat, lng);
                }
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

            {/* Search Bar */}
            <form className="map-search-bar" onSubmit={handleSearch}>
                <input
                    type="text"
                    className="form-input"
                    placeholder="Search a location (e.g., Chennai, India or an address)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
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
