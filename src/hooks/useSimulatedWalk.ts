import { useEffect, useState } from "react";

export const useSimulatedWalk = () => {
  const [accelerationData, setAccelerationData] = useState({
    x: 0,
    y: 0,
    z: 0,
  });

  useEffect(() => {
    const frequency = 1; // Hz (passos/segundo) ~108 BPM
    const amplitude = 1; // Intensidade do movimento
    let time = 0;

    const interval = setInterval(() => {
      time += 0.1; // Incremento de tempo (10x por segundo)

      // Padrão de movimento para caminhada (oscilação vertical + pequeno movimento lateral)
      const y = amplitude * Math.sin(2 * Math.PI * frequency * time);
      const x =
        amplitude * 0.3 * Math.sin(2 * Math.PI * 0.5 * frequency * time);
      const z = 0; // Eixo Z geralmente tem menos movimento

      // Adiciona pequeno ruído para simular variações naturais
      const noise = 0.2 * (Math.random() - 0.5);

      setAccelerationData({
        x: x + noise,
        y: y + noise,
        z: z,
      });
    }, 100); // 10 Hz (igual à frequência do sensor real)

    return () => clearInterval(interval);
  }, []);

  return accelerationData;
};
