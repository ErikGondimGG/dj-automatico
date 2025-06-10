import { Accelerometer } from "expo-sensors";
import { useEffect, useState } from "react";

type AccData = {
  x: number;
  y: number;
  z: number;
};

export function useAccelerometer() {
  const [accData, setAccData] = useState<AccData>({ x: 0, y: 0, z: 0 });

  useEffect(() => {
    let isMounted = true;

    const subscription = Accelerometer.addListener((data: AccData) => {
      if (isMounted) {
        setAccData({
          x: data.x,
          y: data.y,
          z: data.z,
        });
      }
    });

    Accelerometer.setUpdateInterval(100); // 10Hz

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, []);

  return accData;
}
