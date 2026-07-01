export const REQUIRED_PHOTO_IDS = ['front', 'left', 'right', 'ground'];

export const PHOTO_LABELS = {
  front: 'Front View',
  left: 'Left Side',
  right: 'Right Side',
  ground: 'Ground Close-up',
  drone: 'Drone View (aerial top-down)',
};

export function countRequiredPhotos(photos = {}) {
  return REQUIRED_PHOTO_IDS.filter((id) => photos[id]).length;
}

export function hasAllRequiredPhotos(photos = {}) {
  return countRequiredPhotos(photos) === REQUIRED_PHOTO_IDS.length;
}
