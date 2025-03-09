import React from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useLoading } from "./LoadingContext"; // Importa o hook do contexto

const CentralLoading: React.FC = () => {
  const { loading } = useLoading(); // Obtém o estado de loading

  if (!loading) return null; // Não renderiza nada se o loading for falso

  return (
    <View style={styles.overlay}>
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  loadingContainer: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default CentralLoading;
