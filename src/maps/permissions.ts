export interface PermissionMapping {
  package: string;
  plistKey: string;
  /** If set, the check only triggers when this call pattern is also found in source */
  conditionalCall?: string;
  checkId: string;
  errorMessage: string;
}

export const PERMISSION_MAP: PermissionMapping[] = [
  {
    package: 'expo-location',
    plistKey: 'NSLocationWhenInUseUsageDescription',
    checkId: 'PERM-01',
    errorMessage:
      "NSLocationWhenInUseUsageDescription missing. You use expo-location but haven't declared why. Add to app.json infoPlist.",
  },
  {
    package: 'expo-location',
    plistKey: 'NSLocationAlwaysAndWhenInUseUsageDescription',
    conditionalCall: 'requestBackgroundPermissionsAsync',
    checkId: 'PERM-02',
    errorMessage:
      'NSLocationAlwaysAndWhenInUseUsageDescription missing. Background location requires this key.',
  },
  {
    package: 'expo-camera',
    plistKey: 'NSCameraUsageDescription',
    checkId: 'PERM-03',
    errorMessage:
      "NSCameraUsageDescription missing. You use expo-camera but haven't declared why. Add to app.json infoPlist.",
  },
  {
    package: 'expo-av',
    plistKey: 'NSMicrophoneUsageDescription',
    checkId: 'PERM-04',
    errorMessage: 'NSMicrophoneUsageDescription missing. Audio recording requires this key.',
  },
  {
    package: 'expo-microphone',
    plistKey: 'NSMicrophoneUsageDescription',
    checkId: 'PERM-04',
    errorMessage: 'NSMicrophoneUsageDescription missing. Audio recording requires this key.',
  },
  {
    package: 'expo-contacts',
    plistKey: 'NSContactsUsageDescription',
    checkId: 'PERM-05',
    errorMessage: 'NSContactsUsageDescription missing. Contacts access requires this key.',
  },
  {
    package: 'expo-media-library',
    plistKey: 'NSPhotoLibraryUsageDescription',
    checkId: 'PERM-06',
    errorMessage: 'NSPhotoLibraryUsageDescription missing. Photo library access requires this key.',
  },
  {
    package: 'expo-media-library',
    plistKey: 'NSPhotoLibraryAddUsageDescription',
    conditionalCall: 'saveToLibraryAsync',
    checkId: 'PERM-07',
    errorMessage:
      'NSPhotoLibraryAddUsageDescription missing. Saving to photo library requires this key.',
  },
  {
    package: 'expo-calendar',
    plistKey: 'NSCalendarsUsageDescription',
    checkId: 'PERM-08',
    errorMessage: 'NSCalendarsUsageDescription missing. Calendar access requires this key.',
  },
  {
    package: 'expo-face-detector',
    plistKey: 'NSFaceIDUsageDescription',
    checkId: 'PERM-09',
    errorMessage: 'NSFaceIDUsageDescription missing. Face ID requires this key.',
  },
  {
    package: 'expo-local-authentication',
    plistKey: 'NSFaceIDUsageDescription',
    checkId: 'PERM-09',
    errorMessage: 'NSFaceIDUsageDescription missing. Face ID / biometrics requires this key.',
  },
  {
    package: 'expo-tracking-transparency',
    plistKey: 'NSUserTrackingUsageDescription',
    checkId: 'PERM-09',
    errorMessage: 'NSUserTrackingUsageDescription missing. User tracking requires this key.',
  },
  {
    package: 'expo-sensors',
    plistKey: 'NSMotionUsageDescription',
    checkId: 'PERM-09',
    errorMessage: 'NSMotionUsageDescription missing. Motion sensor access requires this key.',
  },
  {
    package: 'expo-speech-recognition',
    plistKey: 'NSSpeechRecognitionUsageDescription',
    checkId: 'PERM-09',
    errorMessage:
      'NSSpeechRecognitionUsageDescription missing. Speech recognition requires this key.',
  },
  {
    package: 'expo-bluetooth',
    plistKey: 'NSBluetoothAlwaysUsageDescription',
    checkId: 'PERM-09',
    errorMessage: 'NSBluetoothAlwaysUsageDescription missing. Bluetooth access requires this key.',
  },
  {
    package: 'expo-health',
    plistKey: 'NSHealthShareUsageDescription',
    checkId: 'PERM-09',
    errorMessage: 'NSHealthShareUsageDescription missing. Health data access requires this key.',
  },
];

export const PLACEHOLDER_VALUES = new Set([
  'todo',
  'placeholder',
  'your reason here',
  'add reason here',
  'describe why',
]);
