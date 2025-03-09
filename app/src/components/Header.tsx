import { StyleSheet, View, TouchableOpacity } from "react-native";
import { useContext } from "react";
import { Icon } from "./Icon";
import { ThemeContext, AppContext } from "../../src/context";
import FontAwesome from "@expo/vector-icons/FontAwesome5";

export function Header() {
  const { theme } = useContext(ThemeContext);
  const { handlePresentModalPress } = useContext(AppContext);
  const styles = getStyles(theme);

  return (
    <View style={styles.container}>
      {/* Ícone de Histórico à Esquerda */}
      <TouchableOpacity
        style={styles.leftButton}
        activeOpacity={0.7}
        onPress={() => {
          console.log("Histórico clicado"); // Substitua com a lógica de histórico
        }}
      >
        <FontAwesome name="align-left" size={17} color={theme.textColor} />
      </TouchableOpacity>

      {/* Logomarca ao Centro */}
      <View style={styles.logoContainer}>
        <Icon size={34} fill={theme.textColor} />
      </View>

      {/* Ícone de Configurações à Direita */}
      <TouchableOpacity
        style={styles.rightButton}
        activeOpacity={0.7}
        onPress={handlePresentModalPress}
      >
        <FontAwesome name="ellipsis-h" size={20} color={theme.textColor} />
      </TouchableOpacity>
    </View>
  );
}

function getStyles(theme: any) {
  return StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 15,
      backgroundColor: theme.backgroundColor,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderColor,
      paddingHorizontal: 20,
      shadowColor: theme.textColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 5,
    },
    leftButton: {
      paddingVertical: 8,
      paddingHorizontal: 15,
      borderRadius: 25,
      backgroundColor: theme.buttonBackground,
      alignItems: "center",
      justifyContent: "center",
      elevation: 2,
    },
    logoContainer: {
      flex: 1,
      alignItems: "center",
    },
    rightButton: {
      paddingVertical: 8,
      paddingHorizontal: 15,
      borderRadius: 25,
      backgroundColor: theme.buttonBackground,
      alignItems: "center",
      justifyContent: "center",
      elevation: 2,
    },
  });
}
