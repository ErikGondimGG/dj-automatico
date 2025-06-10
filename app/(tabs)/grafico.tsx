import WalkGraph from "@/src/components/graficos/walkGraph";
import { useAccelerometer } from "@/src/hooks/useAccelerometer";
import { useSimulatedWalk } from "@/src/hooks/useSimulatedWalk";
import React from "react";
import { View } from "react-native";

const GraficosMovimento = () => {
  const simulatedAccData = useSimulatedWalk();
  const accData = useAccelerometer();

  return (
    <View style={{ flex: 1 }}>
      <WalkGraph accData={accData} />
    </View>
  );
};

GraficosMovimento.displayName = "GraficosMovimento";

export default GraficosMovimento;
