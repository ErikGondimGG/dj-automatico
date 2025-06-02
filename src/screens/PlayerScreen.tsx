import React from "react";
import { Button, Text, View } from "react-native";
import { useBPMDetector } from "../hooks/useBPMDetector";

const PlayerScreen = () => {
  const bpm = useBPMDetector();

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ fontSize: 24 }}>Seu BPM: {bpm}</Text>
      <Text style={{ fontSize: 18, marginTop: 20 }}>Música Atual: ...</Text>
      <Button
        title="Sincronizar com Spotify"
        onPress={() => {
          /* Lógica aqui */
        }}
      />
    </View>
  );
};
