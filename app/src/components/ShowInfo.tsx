import React, { useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

interface ShowInfoProps {
  message: string;
  type: "success" | "error" | "info";
  onClose: () => void;
}

const ShowInfo: React.FC<ShowInfoProps> = ({ message, type, onClose }) => {
  // Esconde a mensagem automaticamente após 5 segundos
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(); // Chama a função de fechar após o tempo
    }, 3000);

    return () => clearTimeout(timer); // Limpa o timer se o componente for desmontado
  }, [onClose]);

  return (
    <View
      style={[
        styles.container,
        type === "error" ? styles.error : styles.success,
      ]}
    >
      <Text style={styles.message}>{message}</Text>
      <TouchableOpacity onPress={onClose} style={styles.closeButton}>
        <Text style={styles.closeButtonText}>Fechar</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 50,
    left: 20,
    right: 20,
    padding: 10,
    borderRadius: 8,
    zIndex: 1000,
    alignItems: "center",
    justifyContent: "center",
  },
  success: {
    backgroundColor: "#28a745", // Verde
  },
  error: {
    backgroundColor: "#dc3545", // Vermelho
  },
  message: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
    textAlign: "center",
  },
  closeButton: {
    marginTop: 10,
    backgroundColor: "white",
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  closeButtonText: {
    color: "black",
    fontWeight: "bold",
  },
});

export default ShowInfo;
