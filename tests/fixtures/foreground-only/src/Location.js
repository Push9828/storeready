import * as Location from 'expo-location'

export async function getLocation() {
  await Location.requestForegroundPermissionsAsync()
}
