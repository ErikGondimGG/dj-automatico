import React, { useEffect, useRef, useState } from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import Svg, { G, Line, Path } from "react-native-svg";

const GRAPH_WIDTH = Dimensions.get("window").width - 32;
const GRAPH_HEIGHT = 300;
const MAX_POINTS = 100; // 10 segundos de dados a 10Hz
const Y_SCALE = 50; // Fator de escala para visualização

type AccDataPoint = {
  x: number;
  y: number;
  z: number;
};

type WalkSimulationProps = {
  accData: AccDataPoint;
};

const WalkGraph: React.FC<WalkSimulationProps> = ({ accData }) => {
  const dataHistory = useRef<AccDataPoint[]>([]);
  const [paths, setPaths] = useState({
    x: `M0 ${GRAPH_HEIGHT / 2}`,
    y: `M0 ${GRAPH_HEIGHT / 2}`,
    z: `M0 ${GRAPH_HEIGHT / 2}`,
  });

  const lastUpdate = useRef(0);
  const frameRef = useRef(0);

  // Atualização otimizada usando requestAnimationFrame
  useEffect(() => {
    // Adiciona novo ponto aos dados históricos
    dataHistory.current = [...dataHistory.current, accData];

    // Mantém apenas os últimos pontos
    if (dataHistory.current.length > MAX_POINTS) {
      dataHistory.current = dataHistory.current.slice(-MAX_POINTS);
    }

    // Atualiza o gráfico na taxa de quadros ideal
    const update = (timestamp: number) => {
      // Limita a 30 FPS (33ms por frame)
      if (timestamp - lastUpdate.current > 33) {
        updatePaths();
        lastUpdate.current = timestamp;
      }
      frameRef.current = requestAnimationFrame(update);
    };

    frameRef.current = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(frameRef.current);
    };
  }, [accData]);

  const updatePaths = () => {
    if (dataHistory.current.length === 0) return;

    const pointSpacing = GRAPH_WIDTH / MAX_POINTS;
    let newPathX = `M0 ${GRAPH_HEIGHT / 2}`;
    let newPathY = `M0 ${GRAPH_HEIGHT / 2}`;
    let newPathZ = `M0 ${GRAPH_HEIGHT / 2}`;

    dataHistory.current.forEach((point, i) => {
      const xPos = i * pointSpacing;
      newPathX += ` L${xPos} ${GRAPH_HEIGHT / 2 - point.x * Y_SCALE}`;
      newPathY += ` L${xPos} ${GRAPH_HEIGHT / 2 - point.y * Y_SCALE}`;
      newPathZ += ` L${xPos} ${GRAPH_HEIGHT / 2 - point.z * Y_SCALE}`;
    });

    setPaths({
      x: newPathX,
      y: newPathY,
      z: newPathZ,
    });
  };

  // Linhas de referência
  const referenceLines = Array.from({ length: 5 }, (_, i) => (
    <Line
      key={i}
      x1="0"
      y1={(GRAPH_HEIGHT / 4) * i}
      x2={GRAPH_WIDTH}
      y2={(GRAPH_HEIGHT / 4) * i}
      stroke="#eee"
      strokeWidth="1"
    />
  ));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Monitor de Caminhada</Text>

      <View style={styles.graphContainer}>
        <Svg width={GRAPH_WIDTH} height={GRAPH_HEIGHT}>
          <G>
            {referenceLines}
            <Path d={paths.x} stroke="#FF6B6B" strokeWidth="2" fill="none" />
            <Path d={paths.y} stroke="#4ECDC4" strokeWidth="2" fill="none" />
            <Path d={paths.z} stroke="#FFE66D" strokeWidth="2" fill="none" />
          </G>
        </Svg>
      </View>

      <View style={styles.valuesContainer}>
        <View style={styles.valueItem}>
          <Text style={[styles.valueLabel, { color: "#FF6B6B" }]}>Eixo X</Text>
          <Text>{accData.x.toFixed(3)} g</Text>
        </View>
        <View style={styles.valueItem}>
          <Text style={[styles.valueLabel, { color: "#4ECDC4" }]}>Eixo Y</Text>
          <Text>{accData.y.toFixed(3)} g</Text>
        </View>
        <View style={styles.valueItem}>
          <Text style={[styles.valueLabel, { color: "#FFE66D" }]}>Eixo Z</Text>
          <Text>{accData.z.toFixed(3)} g</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  graphContainer: {
    height: GRAPH_HEIGHT,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#fafafa",
  },
  valuesContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#f8f9fa",
    borderRadius: 10,
    padding: 16,
  },
  valueItem: {
    alignItems: "center",
  },
  valueLabel: {
    fontWeight: "bold",
    marginBottom: 4,
  },
});

export default React.memo(WalkGraph);
