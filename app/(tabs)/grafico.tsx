import WalkGraph from "@/src/components/graficos/walkGraph";
import { useSimulatedWalk } from "@/src/hooks/useSimulatedWalk";
import React from "react";
import { View } from "react-native";

const GraficosMovimento = () => {
  const simulatedAccData = useSimulatedWalk();

  // Simulação de dados (substituir por dados reais)

  return (
    <View style={{ flex: 1 }}>
      <WalkGraph accData={simulatedAccData} />
    </View>
  );
};

GraficosMovimento.displayName = "GraficosMovimento";

export default GraficosMovimento;
