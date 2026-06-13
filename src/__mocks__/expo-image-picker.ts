export const MediaTypeOptions = {
  Images: 'Images',
  Videos: 'Videos',
  All: 'All',
} as const;

export const PermissionStatus = {
  GRANTED: 'granted',
  DENIED: 'denied',
  UNDETERMINED: 'undetermined',
} as const;

export const requestMediaLibraryPermissionsAsync = () =>
  Promise.resolve({ status: 'granted', granted: true });
export const requestCameraPermissionsAsync = () =>
  Promise.resolve({ status: 'granted', granted: true });

export const launchImageLibraryAsync = () => Promise.resolve({ canceled: true, assets: null });
export const launchCameraAsync = () => Promise.resolve({ canceled: true, assets: null });
