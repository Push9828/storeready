import * as Location from 'expo-location';

export async function startTracking() {
  await Location.requestBackgroundPermissionsAsync();
}
