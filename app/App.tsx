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
import { LoadingProvider, useLoading } from "./src/components/LoadingContext"; // Importa o provider
import CentralLoading from "./src/components/CentralLoading";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
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
import ShowInfo from "./src/components/ShowInfo";

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
  const { setLoading } = useLoading();
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
  const configureStorage = async () => {
    try {
      // Recupera e configura o tema
      const _theme = await AsyncStorage.getItem("rnai-theme");
      if (_theme) setTheme(_theme);

      // Recupera e configura o tipo de chat
      const _chatType = await AsyncStorage.getItem("rnai-chatType");
      if (_chatType) setChatType(JSON.parse(_chatType));

      // Recupera e configura o modelo de imagem
      const _imageModel = await AsyncStorage.getItem("rnai-imageModel");
      if (_imageModel) setImageModel(_imageModel);

      // Verifica se o usuário está logado e valida o token
      const _isLoggedIn = await AsyncStorage.getItem("isLoggedIn");
      const token = await AsyncStorage.getItem("authToken");

      if (_isLoggedIn === "true" && token) {
        const isTokenValid = await validateToken(token);

        if (!isTokenValid) {
          console.warn("Token expirado ou inválido.");
          setIsLoggedIn(false); // Define como não logado
          return;
        }

        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
      }
    } catch (err) {
      console.error("Erro ao configurar o armazenamento:", err);
      setIsLoggedIn(false); // Em caso de erro, considera como não logado
    }
  };
  const validateToken = async (token: string): Promise<boolean> => {
    // Define o estado de loading

    try {
      console.log("Iniciando check de token...");

      // Ativa o loading
      setLoading(true);

      const response = await fetch(`${DOMAIN}/auth/check`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        try {
          const data = await response.json();

          // Verifica se o campo `data` e `isValid` existem e retorna o valor correto
          return data?.data?.isValid ?? false; // Retorna `false` caso `isValid` não seja encontrado
        } catch (error) {
          console.error("Erro ao processar a resposta JSON:", error);
          return false; // Retorna `false` caso haja erro no parsing
        }
      } else {
        console.error("Erro na resposta da API:", response.status);
        try {
          const errorData = await response.json();
          console.error("Detalhes do erro:", errorData);
        } catch (error) {
          console.error("Erro ao ler o corpo da resposta de erro:", error);
        }
        return false; // Retorna `false` se a resposta não for `ok`
      }
    } catch (error) {
      console.error("Erro ao validar o token:", error);
      return false;
    } finally {
      // Desativa o loading
      setLoading(false);
    }
  };

  useEffect(() => {
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
      <LoadingProvider>
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
                  {!_isLoggedIn ? (
                    <LoginScreen login={login} setIsLoggedIn={setIsLoggedIn} />
                  ) : (
                    <Main />
                  )}
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
          <CentralLoading />
        </AuthProvider>
      </LoadingProvider>
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
interface ShowInfo {
  message: string;
  type: string;
}

const LoginScreen = ({ login, setIsLoggedIn }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false); // Estado para controlar o loading
  const [showInfo, setShowInfo] = useState<ShowInfo | null>(null); // Estado para controlar a exibição do alerta customizado

  const validateEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  };

  const handleLogin = async () => {
    // Validação de campos vazios
    if (!email || !password) {
      setShowInfo({
        message: "Por favor, preencha todos os campos.",
        type: "error",
      });
      return;
    }

    // Ajuste de formato do email (remoção de espaços, transformação para minúsculas)
    const trimmedEmail = email.trim().toLowerCase(); // Remove espaços e coloca tudo em minúsculas

    // Validação de formato de email
    if (!validateEmail(trimmedEmail)) {
      setShowInfo({
        message: "Por favor, insira um endereço de email válido.",
        type: "error",
      });
      return;
    }

    setLoading(true); // Ativa o estado de carregamento

    try {
      console.log("Iniciando o processo de login...");

      const response = await fetch(`${DOMAIN}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: trimmedEmail, // Envia o email ajustado
          password,
        }),
      });

      if (!response.ok) {
        console.error("Erro durante o login. Status:", response.status);
        const errorData = await response.json();
        console.error("Detalhes do erro:", errorData);
        setShowInfo({
          message: errorData?.message || "Erro ao autenticar",
          type: "error",
        });
        setLoading(false); // Desativa o estado de carregamento
        return;
      }

      const data = await response.json();
      console.log("Login bem-sucedido. Dados retornados:", data);

      if (data.data.token) {
        await saveToken(data.data.token);
        console.log("Token salvo com sucesso.");
        setShowInfo({ message: "Login bem-sucedido!", type: "success" });
      } else {
        console.warn("Nenhum token fornecido na resposta.");
        setShowInfo({
          message: "Resposta inválida do servidor.",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Erro inesperado durante o login:", error);
      setShowInfo({ message: "Erro de conexão ao autenticar.", type: "error" });
    } finally {
      setLoading(false); // Desativa o estado de carregamento, independentemente do sucesso ou erro
    }
  };

  const saveToken = async (token) => {
    try {
      await AsyncStorage.setItem("authToken", token); // Salva o token no AsyncStorage
      await AsyncStorage.setItem("isLoggedIn", "true"); // Define o estado de login como true
      setIsLoggedIn(true); // Atualiza o estado para redirecionar para a tela principal
    } catch (error) {
      console.error("Erro ao salvar o token:", error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.title}>Muffins AI</Text>

        <Text style={styles.subtitle}>Entrar</Text>
        <Text style={styles.description}>
          Use seu email e senha para entrar
        </Text>

        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Endereço de Email"
          placeholderTextColor="#ccc"
          style={styles.input}
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Senha"
          secureTextEntry
          placeholderTextColor="#ccc"
          style={styles.input}
        />

        {/* Exibe um botão de login ou o indicador de carregamento, se estiver carregando */}
        <TouchableOpacity
          style={styles.loginButton}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator
              size="small"
              color="black"
              style={styles.buttonText}
            />
          ) : (
            <Text style={styles.buttonText}>Entrar</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.signupText}>
          Não tem uma conta? <Text style={styles.linkText}>Cadastre-se</Text>{" "}
          gratuitamente.
        </Text>
      </View>

      <Text style={styles.footer}>
        Muffins AI, desenvolvida pela{" "}
        <Text style={styles.linkText}>Muffins Corp</Text>.
      </Text>
      <Text style={styles.footerCopy}>Todos os direitos reservados.</Text>

      {/* Exibe o alerta customizado, se necessário */}
      {showInfo && (
        <ShowInfo
          message={showInfo.message}
          type={showInfo.type}
          onClose={() => setShowInfo(null)}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "black",
  },
  formContainer: {
    width: "80%",
    padding: 20,
    backgroundColor: "black",
    borderRadius: 10,
    elevation: 5,
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
    marginBottom: 20,
  },
  subtitle: {
    color: "white",
    fontSize: 18,
    marginBottom: 5,
  },
  description: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: "center",
    color: "#777",
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    color: "white",
    backgroundColor: "#333",
  },
  loginButton: {
    backgroundColor: "white",
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginVertical: 15,
  },
  buttonText: {
    color: "#000",
    textAlign: "center",
    fontWeight: "bold",
    width: 200,
  },
  signupText: {
    fontSize: 12,
    color: "#555",
    textAlign: "center",
  },
  linkText: {
    color: "white",
  },
  footer: {
    marginTop: 100,
    fontSize: 12,
    color: "#aaa",
    textAlign: "center",
  },
  footerCopy: {
    fontSize: 12,
    color: "#aaa",
    textAlign: "center",
  },
});
