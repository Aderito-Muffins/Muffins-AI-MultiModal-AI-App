import "react-native-gesture-handler";
import { useState, useEffect, useRef } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { Main } from "./src/main";
import { useFonts } from "expo-font";
import { ThemeContext, AppContext } from "./src/context";
import * as themes from "./src/theme";
import { IMAGE_MODELS, MODELS, ILLUSION_DIFFUSION_IMAGES } from "./constants";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ChatModelModal } from "./src/components/index";
import { Model } from "./types";
import { DOMAIN } from "./constants";
import { ActionSheetProvider } from "@expo/react-native-action-sheet";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from "react-native";

import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { StyleSheet, LogBox } from "react-native";
import { AuthProvider } from "./src/auth/AuthContext";

LogBox.ignoreLogs([
  'Key "cancelled" in the image picker result is deprecated and will be removed in SDK 48, use "canceled" instead',
  "No native splash screen registered",
]);

export default function App() {
  const [theme, setTheme] = useState<string>("light");
  const [chatType, setChatType] = useState<Model>(MODELS.gptTurbo);
  const [_isLoggedIn, setIsLoggedIn] = useState<boolean>(false); // Iniciar como 'null' para aguardar a verificação
  const [imageModel, setImageModel] = useState<string>(
    IMAGE_MODELS.fastImage.label
  );
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [illusionImage, setIllusionImage] = useState<string>(
    ILLUSION_DIFFUSION_IMAGES.mediumSquares.label
  );
  const [fontsLoaded] = useFonts({
    "Geist-Regular": require("./assets/fonts/Geist-Regular.otf"),
    "Geist-Light": require("./assets/fonts/Geist-Light.otf"),
    "Geist-Bold": require("./assets/fonts/Geist-Bold.otf"),
    "Geist-Medium": require("./assets/fonts/Geist-Medium.otf"),
    "Geist-Black": require("./assets/fonts/Geist-Black.otf"),
    "Geist-SemiBold": require("./assets/fonts/Geist-SemiBold.otf"),
    "Geist-Thin": require("./assets/fonts/Geist-Thin.otf"),
    "Geist-UltraLight": require("./assets/fonts/Geist-UltraLight.otf"),
    "Geist-UltraBlack": require("./assets/fonts/Geist-UltraBlack.otf"),
  });

  console.log(_isLoggedIn);

  useEffect(() => {
    const configureStorage = async () => {
      try {
        const _theme = await AsyncStorage.getItem("rnai-theme");
        if (_theme) setTheme(_theme);

        const _chatType = await AsyncStorage.getItem("rnai-chatType");
        if (_chatType) setChatType(JSON.parse(_chatType));

        const _imageModel = await AsyncStorage.getItem("rnai-imageModel");
        if (_imageModel) setImageModel(_imageModel);

        const _isLoggedIn = await AsyncStorage.getItem("isLoggedIn");
        login();
      } catch (err) {
        console.log("Erro ao configurar o armazenamento:", err);
      }
    };

    configureStorage();
  }, []);

  const bottomSheetModalRef = useRef<BottomSheetModal>(null);

  function closeModal() {
    bottomSheetModalRef.current?.dismiss();
    setModalVisible(false);
  }

  function handlePresentModalPress() {
    if (modalVisible) {
      closeModal();
    } else {
      bottomSheetModalRef.current?.present();
      setModalVisible(true);
    }
  }

  function _setChatType(type) {
    setChatType(type);
    AsyncStorage.setItem("rnai-chatType", JSON.stringify(type));
  }

  function _setImageModel(model) {
    setImageModel(model);
    AsyncStorage.setItem("rnai-imageModel", model);
  }

  function _setTheme(theme) {
    setTheme(theme);
    AsyncStorage.setItem("rnai-theme", theme);
  }
  function _setLogged(boolean: boolean, token: string | null) {
    if (typeof boolean !== "boolean") {
      throw new Error("Invalid arguments passed to _setLogged");
    }

    setIsLoggedIn(boolean);
    if (token !== null) {
      AsyncStorage.setItem("authToken", token).catch((err) =>
        console.log("Erro ao armazenar token no AsyncStorage:", err)
      );
    }
  }

  const login = async (token?: string) => {
    if (!token) {
      setIsLoggedIn(false); // Directly set the state without calling _setLogged
      return;
    }

    try {
      const response = await fetch(`${DOMAIN}/api/auth/session`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 200) {
        const sessionData = await response.json();

        if (!sessionData || !sessionData.user) {
          console.error("Erro ao obter dados da sess o");
          setIsLoggedIn(false);
          await AsyncStorage.removeItem("authToken");
          await AsyncStorage.removeItem("isLoggedIn");
          return;
        }

        const expirationDate = new Date(sessionData.expires);
        const currentDate = new Date();

        if (currentDate > expirationDate) {
          setIsLoggedIn(false);
          await AsyncStorage.removeItem("authToken");
          await AsyncStorage.removeItem("isLoggedIn");
          console.log("Sess o expirada");
        } else {
          _setLogged(true, token);
          await AsyncStorage.setItem("isLoggedIn", "true");
          await AsyncStorage.setItem("authToken", token);
          await AsyncStorage.setItem(
            "userData",
            JSON.stringify(sessionData.user)
          );
          console.log("Login verificado com sucesso");
          console.log("Dados do usu rio:", sessionData.user);
        }
      } else {
        setIsLoggedIn(false);
        await AsyncStorage.removeItem("authToken");
        await AsyncStorage.removeItem("isLoggedIn");
        console.log("Token inv lido ou erro na requisi o");
      }
    } catch (error) {
      console.error("Erro ao verificar ou realizar login:", error);
      setIsLoggedIn(false);
      await AsyncStorage.removeItem("authToken");
      await AsyncStorage.removeItem("isLoggedIn");
    }
  };

  const bottomSheetStyles = getBottomsheetStyles(theme);

  // Aguarde o carregamento das fontes e o status de login
  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <AppContext.Provider
          value={{
            chatType,
            setChatType: _setChatType,
            handlePresentModalPress,
            imageModel,
            setImageModel: _setImageModel,
            closeModal,
            illusionImage,
            setIllusionImage,
          }}
        >
          <ThemeContext.Provider
            value={{
              theme: getTheme(theme),
              themeName: theme,
              setTheme: _setTheme,
            }}
          >
            <ActionSheetProvider>
              <NavigationContainer>
                {_isLoggedIn ? <LoginScreen login={login} /> : <Main />}
              </NavigationContainer>
            </ActionSheetProvider>
            <BottomSheetModalProvider>
              <BottomSheetModal
                handleIndicatorStyle={bottomSheetStyles.handleIndicator}
                handleStyle={bottomSheetStyles.handle}
                backgroundStyle={bottomSheetStyles.background}
                ref={bottomSheetModalRef}
                enableDynamicSizing={true}
                backdropComponent={(props) => (
                  <BottomSheetBackdrop {...props} disappearsOnIndex={-1} />
                )}
                enableDismissOnClose
                enablePanDownToClose
                onDismiss={() => setModalVisible(false)}
              >
                <BottomSheetView>
                  <ChatModelModal
                    handlePresentModalPress={handlePresentModalPress}
                  />
                </BottomSheetView>
              </BottomSheetModal>
            </BottomSheetModalProvider>
          </ThemeContext.Provider>
        </AppContext.Provider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

const getBottomsheetStyles = (theme) =>
  StyleSheet.create({
    background: {
      paddingHorizontal: 24,
      backgroundColor: theme.backgroundColor,
    },
    handle: {
      marginHorizontal: 15,
      backgroundColor: theme.backgroundColor,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
    },
    handleIndicator: {
      backgroundColor: "rgba(255, 255, 255, .3)",
    },
  });

function getTheme(theme: any) {
  let current;
  Object.keys(themes).forEach((_theme) => {
    if (_theme.includes(theme)) {
      current = themes[_theme];
    }
  });
  return current;
}

export const LoginScreen = ({ login }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const checkIfLoggedIn = async () => {
    try {
      const sessionResponse = await fetch(`${DOMAIN}/api/auth/session`);
      const sessionData = await sessionResponse.json();

      if (sessionData?.user) {
        // Usuário já está autenticado, redirecionar ou informar
        Alert.alert("Você já está logado.");
        return true; // Indica que o usuário já está autenticado
      }
    } catch (error) {
      console.error("Erro ao verificar sessão:", error);
    }

    return false; // Se não estiver logado, permite fazer o login
  };

  const handleLogin = async () => {
    try {
      console.log("Iniciando o processo de login...");

      // Obter o token CSRF
      console.log("Solicitando token CSRF...");
      const csrfResponse = await fetch(`${DOMAIN}/api/auth/csrf`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!csrfResponse.ok) {
        console.error(
          "Erro ao obter o token CSRF. Status:",
          csrfResponse.status
        );
        throw new Error("Erro ao obter CSRF Token");
      }

      const csrfData = await csrfResponse.json();
      const csrfToken = csrfData.csrfToken;
      console.log("CSRF Token obtido:", csrfToken);

      // Verificar se os cookies estão presentes na resposta
      const cookies = csrfResponse.headers.get("set-cookie");
      console.log("Cabeçalhos  recebidos:", csrfResponse);
      console.log("Cabeçalhos de cookies recebidos:", cookies);

      if (!cookies) {
        console.error("Erro: Nenhum cookie `set-cookie` encontrado.");
        throw new Error("Nenhum cookie CSRF foi enviado pelo servidor.");
      }

      // Filtrar o cookie CSRF token
      const csrfCookie = cookies
        .split(";")
        .find((cookie) => cookie.includes("authjs.csrf-token"));

      if (!csrfCookie) {
        console.error("Erro: Cookie CSRF não encontrado.");
        throw new Error("Cookie CSRF não encontrado.");
      }
      console.log("Cookie CSRF encontrado:", csrfCookie);

      // Enviar o login com o token CSRF no corpo e o cookie no cabeçalho
      console.log("Enviando credenciais para login...");
      const response = await fetch(`${DOMAIN}/api/auth/signin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: csrfCookie, // Usar o cookie do CSRF corretamente
        },
        body: JSON.stringify({
          csrfToken, // Envia o CSRF token no corpo
          email,
          password,
        }),
      });

      if (!response.ok) {
        console.error("Erro durante o login. Status:", response.status);
        const errorData = await response.json();
        console.error("Detalhes do erro:", errorData);
        Alert.alert("Erro", errorData?.message || "Erro ao autenticar");
        return;
      }

      const data = await response.json();
      console.log("Login bem-sucedido. Dados retornados:", data);

      // Redirecionar ou tratar o sucesso
      if (data.url) {
        console.log("Redirecionando para:", data.url);
        window.location.href = data.url;
      } else {
        console.warn("Nenhuma URL de redirecionamento fornecida.");
      }
    } catch (error) {
      console.error("Erro inesperado durante o login:", error);
      Alert.alert("Erro", "Erro de conexão ao autenticar.");
    }
  };

  const saveToken = async (token) => {
    try {
      await AsyncStorage.setItem("authToken", token); // Salva o token no AsyncStorage
    } catch (error) {
      console.error("Erro ao salvar o token:", error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.title}>Muffins AI</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="E-mail"
          style={styles.input}
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Senha"
          secureTextEntry
          style={styles.input}
        />
        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.buttonText}>Entrar</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  formContainer: {
    width: "80%",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
  },
  loginButton: {
    backgroundColor: "#007bff",
    padding: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
  },
});
