import React, { useRef, useState } from 'react';

const PHOTO_SLOTS = [
    {
        id: 'front',
        label: 'Front View',
        icon: '🏠',
        description: 'Photo from the front',
        guide: 'Stand 15-20 feet away facing the front of the site. Include the full width of the plot, any existing structures, roads, or boundaries.',
        tips: ['Stand straight, don\'t tilt the camera', 'Include the ground and sky', 'Take during daylight']
    },
    {
        id: 'left',
        label: 'Left Side',
        icon: '⬅️',
        description: 'Photo from the left side',
        guide: 'Stand at the left side of the plot looking at the right edge. Capture the full depth and any neighboring structures.',
        tips: ['Show the boundary clearly', 'Include vegetation if any', 'Capture the slope if present']
    },
    {
        id: 'right',
        label: 'Right Side',
        icon: '➡️',
        description: 'Photo from the right side',
        guide: 'Stand at the right side of the plot looking at the left edge. Show the terrain and any adjacent buildings or roads.',
        tips: ['Capture drainage direction', 'Show nearby buildings', 'Include access road if visible']
    },
    {
        id: 'ground',
        label: 'Ground Close-up',
        icon: '🌱',
        description: 'Close-up of the soil',
        guide: 'Crouch down and take a close photo of the ground surface. This helps the AI determine soil type and texture.',
        tips: ['Get within 2-3 feet of the ground', 'Show soil color and texture', 'Include any visible cracks or stones', 'Add a coin/pen for scale reference']
    },
];

export default function PhotoUpload({ onPhotosUpdate, photos = {} }) {
    const fileInputRef = useRef(null);
    const cameraInputRef = useRef(null);
    const [activeSlot, setActiveSlot] = useState(null);
    const [previews, setPreviews] = useState({});
    const [showGuide, setShowGuide] = useState(true);

    const handleFile = (file) => {
        if (!file || !activeSlot) return;

        const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
        if (!validTypes.includes(file.type)) {
            alert('Please upload a photo (JPEG, PNG, or WebP format).');
            return;
        }

        if (file.size > 20 * 1024 * 1024) {
            alert('File too large. Please upload an image under 20MB.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            setPreviews(prev => ({ ...prev, [activeSlot]: e.target.result }));
        };
        reader.readAsDataURL(file);

        const updatedPhotos = { ...photos, [activeSlot]: file };
        onPhotosUpdate(updatedPhotos);
        setActiveSlot(null);
    };

    const handleSlotClick = (slotId) => {
        setActiveSlot(slotId);
        fileInputRef.current?.click();
    };

    const handleCameraClick = (slotId) => {
        setActiveSlot(slotId);
        cameraInputRef.current?.click();
    };

    const handleRemovePhoto = (slotId, e) => {
        e.stopPropagation();
        const updatedPreviews = { ...previews };
        delete updatedPreviews[slotId];
        setPreviews(updatedPreviews);

        const updatedPhotos = { ...photos };
        delete updatedPhotos[slotId];
        onPhotosUpdate(updatedPhotos);
    };

    const uploadedCount = Object.keys(photos).length;

    return (
        <div className="photo-upload-container animate-in">
            <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="image/*"
                onChange={(e) => handleFile(e.target.files[0])}
            />
            <input
                type="file"
                ref={cameraInputRef}
                style={{ display: 'none' }}
                accept="image/*"
                capture="environment"
                onChange={(e) => handleFile(e.target.files[0])}
            />

            {/* Photo Guide Banner */}
            {showGuide && (
                <div className="photo-guide-banner glass-card">
                    <div className="guide-header">
                        <span className="guide-icon">📸</span>
                        <div>
                            <strong>Photo Guide — How to take good site photos</strong>
                            <p>Good photos help the AI accurately analyze your soil type, terrain, and surroundings.</p>
                        </div>
                        <button className="guide-close" onClick={() => setShowGuide(false)}>✕</button>
                    </div>
                    <div className="guide-tips-grid">
                        <div className="guide-tip">✅ Take photos during <strong>daylight</strong></div>
                        <div className="guide-tip">✅ Hold the camera <strong>steady</strong> (no blur)</div>
                        <div className="guide-tip">✅ Include <strong>full width</strong> of the plot</div>
                        <div className="guide-tip">✅ Show the <strong>ground surface</strong> clearly</div>
                        <div className="guide-tip">❌ Don't use <strong>zoomed-in</strong> photos</div>
                        <div className="guide-tip">❌ Don't use <strong>filtered</strong> or edited photos</div>
                    </div>
                </div>
            )}

            {/* Progress indicator */}
            <div className="upload-progress">
                <div className="upload-progress-bar">
                    <div className="upload-progress-fill" style={{ width: `${(uploadedCount / 4) * 100}%` }} />
                </div>
                <span className="upload-progress-text">{uploadedCount} of 4 photos uploaded</span>
            </div>

            <div className="upload-grid">
                {PHOTO_SLOTS.map((slot) => (
                    <div
                        key={slot.id}
                        className={`photo-slot glass-card ${previews[slot.id] ? 'has-image' : ''}`}
                        onClick={() => !previews[slot.id] && handleSlotClick(slot.id)}
                    >
                        {previews[slot.id] ? (
                            <>
                                <img src={previews[slot.id]} alt={slot.label} className="slot-preview" />
                                <div className="slot-overlay">
                                    <button className="btn-icon" onClick={(e) => handleRemovePhoto(slot.id, e)}>🗑️</button>
                                    <button className="btn-icon" onClick={() => handleSlotClick(slot.id)}>🔄</button>
                                </div>
                                <div className="slot-done-badge">✓</div>
                            </>
                        ) : (
                            <div className="slot-empty">
                                <div className="slot-icon">{slot.icon}</div>
                                <div className="slot-label">{slot.label}</div>
                                <div className="slot-guide">{slot.guide}</div>
                                <div className="slot-tips">
                                    {slot.tips.map((tip, i) => (
                                        <span key={i} className="slot-tip-tag">💡 {tip}</span>
                                    ))}
                                </div>
                                <div className="slot-actions">
                                    <button className="btn btn-secondary btn-sm" onClick={(e) => { e.stopPropagation(); handleSlotClick(slot.id); }}>📁 Gallery</button>
                                    <button className="btn btn-secondary btn-sm" onClick={(e) => { e.stopPropagation(); handleCameraClick(slot.id); }}>📷 Camera</button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
