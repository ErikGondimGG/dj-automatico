import { Accelerometer, AccelerometerMeasurement } from "expo-sensors";
import { useEffect, useRef, useState } from "react";
import { useSimulatedWalk } from "./useSimulatedWalk";

export const useBPMDetector = () => {
  const [bpm, setBpm] = useState(0);
  const bufferRef = useRef<number[]>([]);
  const peaksRef = useRef<number[]>([]);
  const lastPeakRef = useRef<number>(0);
  const simulatedAccData = useSimulatedWalk();

  useEffect(() => {
    const WINDOW_SIZE = 30; // 3 segundos de dados (10 Hz)
    const REFRACTORY_PERIOD = 300; // 300ms entre batimentos
    const MIN_PEAK_DISTANCE = 300; // distância mínima entre picos (ms)
    const MAX_HISTORY = 5; // Quantidade de intervalos guardados

    const handleAcceleration = (acc: AccelerometerMeasurement) => {
      const now = Date.now();
      // const { x, y, z } = acc;
      const { x, y, z } = simulatedAccData;

      // 1. Calcular a magnitude do vetor
      const magnitude = Math.sqrt(x * x + y * y + z * z);

      // 2. Atualizar buffer de amostras
      bufferRef.current = [
        ...bufferRef.current.slice(-WINDOW_SIZE + 1),
        magnitude,
      ];

      if (bufferRef.current.length < WINDOW_SIZE) return;

      // 3. Calcular limiar dinâmico (média + 1.5 * desvio padrão)
      const avg = bufferRef.current.reduce((s, v) => s + v, 0) / WINDOW_SIZE;
      const std = Math.sqrt(
        bufferRef.current.reduce((s, v) => s + Math.pow(v - avg, 2), 0) /
          WINDOW_SIZE
      );
      const threshold = avg + 1.5 * std;

      // 4. Detectar picos
      const currentSample = bufferRef.current[WINDOW_SIZE - 1];
      const previousSample = bufferRef.current[WINDOW_SIZE - 2];

      if (
        currentSample > threshold &&
        currentSample > previousSample &&
        now - lastPeakRef.current > REFRACTORY_PERIOD
      ) {
        // 5. Registrar novo pico
        if (lastPeakRef.current !== 0) {
          const interval = now - lastPeakRef.current;

          // Filtrar intervalos válidos
          if (interval > MIN_PEAK_DISTANCE) {
            peaksRef.current = [
              ...peaksRef.current.slice(-MAX_HISTORY + 1),
              interval,
            ];
          }
        }

        lastPeakRef.current = now;

        // 6. Calcular BPM se tiver dados suficientes
        if (peaksRef.current.length > 1) {
          const avgInterval =
            peaksRef.current.reduce((sum, val) => sum + val, 0) /
            peaksRef.current.length;

          const currentBpm = Math.round(60000 / avgInterval);
          setBpm(currentBpm);
        }
      }
    };

    // Configurar accelerômetro
    Accelerometer.setUpdateInterval(100); // 10 Hz
    const subscription = Accelerometer.addListener(handleAcceleration);

    return () => subscription.remove();
  }, [simulatedAccData]);

  return bpm;
};
