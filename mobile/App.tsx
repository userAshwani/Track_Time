import { StatusBar } from 'expo-status-bar';

import HomeScreen from './screens/HomeScreen';

export default function App() {
  return (
    <>
      <HomeScreen />
      <StatusBar style="light" />
    </>
  );
}
