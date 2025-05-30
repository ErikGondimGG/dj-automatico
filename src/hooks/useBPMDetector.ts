import { Accelerometer } from "expo-sensors";
import { useEffect, useState } from "react";

export const useBPMDetector = () => {
  const [bpm, setBpm] = useState(0);

  useEffect(() => {
    let lastUpdate = 0;
    let stepCount = 0;
    let lastY = 0;

    const handleAcceleration = ({ y }: { y: number }) => {
      const now = Date.now();

      // Detecta mudança significativa no eixo Y
      if (Math.abs(y - lastY) > 0.5) {
        stepCount++;

        // Calcula BPM a cada 15 segundos
        if (now - lastUpdate > 15000) {
          const calculatedBpm = (stepCount / 15) * 60;
          setBpm(Math.round(calculatedBpm));
          stepCount = 0;
          lastUpdate = now;
        }
      }
      lastY = y;
    };

    Accelerometer.addListener(handleAcceleration);
    Accelerometer.setUpdateInterval(100); // 10x por segundo

    return () => Accelerometer.removeAllListeners();
  }, []);

  return bpm;
};
