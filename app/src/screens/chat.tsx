import {
  View,
  Text,
  KeyboardAvoidingView,
  StyleSheet,
  Pressable,
  TouchableHighlight,
  TouchableWithoutFeedback,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  FlatList,
  Keyboard,
  Image,
  Animated,
} from "react-native";
import "react-native-get-random-values";
import { useContext, useEffect, useState, useRef } from "react";
import { ThemeContext, AppContext } from "../context";
import {
  getEventSource,
  getFirstN,
  getFirstNCharsOrLess,
  getChatType,
} from "../utils";
import { v4 as uuid } from "uuid";
import Ionicons from "@expo/vector-icons/Ionicons";
import { IOpenAIMessages, IOpenAIStateWithIndex } from "../../types";
import * as Clipboard from "expo-clipboard";
import { useActionSheet } from "@expo/react-native-action-sheet";
import Markdown from "@ronradtke/react-native-markdown-display";

export function Chat() {
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState("");
  const scrollViewRef = useRef<ScrollView | null>(null);
  const { showActionSheetWithOptions } = useActionSheet();
  const opacity = useState(new Animated.Value(1))[0]; // Inicialização da animação de opacidade

  const { theme } = useContext(ThemeContext);
  const { chatType } = useContext(AppContext);
  const styles = getStyles(theme);

  const [messages, setMessages] = useState<
    Array<{ user: string; assistant?: string }>
  >([]);
  const [openaiMessages, setOpenaiMessages] = useState<IOpenAIMessages[]>([]);
  const [openaiResponse, setOpenaiResponse] = useState<IOpenAIStateWithIndex>({
    messages: [],
    index: uuid(),
  });
  const [claudeAPIMessages, setClaudeAPIMessages] = useState("");
  const [claudeResponse, setClaudeResponse] = useState({
    messages: [],
    index: uuid(),
  });
  // cohere state management
  const [cohereResponse, setCohereResponse] = useState({
    messages: [],
    index: uuid(),
  });
  const [mistralAPIMessages, setMistralAPIMessages] = useState("");
  const [mistralResponse, setMistralResponse] = useState({
    messages: [],
    index: uuid(),
  });
  const [geminiAPIMessages, setGeminiAPIMessages] = useState("");
  const [geminiResponse, setGeminiResponse] = useState({
    messages: [],
    index: uuid(),
  });
  const [apiMessages, setApiMessages] = useState("");

  async function copyToClipboard(text) {
    await Clipboard.setStringAsync(text);
  }

  async function clearChat() {
    if (loading) return;
    if (chatType.label.includes("claude")) {
      setClaudeResponse({
        messages: [],
        index: uuid(),
      });
      setClaudeAPIMessages("");
    } else if (chatType.label.includes("cohere")) {
      setCohereResponse({
        messages: [],
        index: uuid(),
      });
    } else if (chatType.label.includes("mistral")) {
      setMistralResponse({
        messages: [],
        index: uuid(),
      });
      setMistralAPIMessages("");
    } else if (chatType.label.includes("gemini")) {
      setGeminiResponse({
        messages: [],
        index: uuid(),
      });
      setGeminiAPIMessages("");
    } else {
      setOpenaiResponse({
        messages: [],
        index: uuid(),
      });
      setOpenaiMessages([]);
    }
  }

  const renderItem = ({ item, index }) => (
    <View style={styles.promptResponse} key={index}>
      <View style={styles.promptTextContainer}>
        <Text style={styles.promptText}>{item.user}</Text>
      </View>
      {item.assistant && (
        <View style={styles.textStyleContainer}>
          <Markdown style={styles.markdownStyle as any}>
            {item.assistant}
          </Markdown>
          <View style={styles.iconContainer}>
            <TouchableOpacity
              onPress={() => copyToClipboard(item.assistant)}
              style={styles.iconTouchable}
              activeOpacity={0.6} // Reduz opacidade ao toque
            >
              <Ionicons name="copy" size={15} color={theme.textColor} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => votePositive(item.assistant)}
              style={styles.iconTouchable}
              activeOpacity={0.6} // Reduz opacidade ao toque
            >
              <Ionicons name="thumbs-up" size={15} color={theme.textColor} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => voteNegative(item.assistant)}
              style={styles.iconTouchable}
              activeOpacity={0.6} // Reduz opacidade ao toque
            >
              <Ionicons name="thumbs-down" size={15} color={theme.textColor} />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );

  // Função para copiar texto para a área de transferência

  // Funções para votos positivos e negativos
  function votePositive(text) {
    console.log("Voted positive for:", text);
  }

  function voteNegative(text) {
    console.log("Voted negative for:", text);
  }

  const regularPrompt =
    "Você é Muffins AI, um assistente inteligente e atencioso criado pela Muffins Corp, uma empresa de software inovadora (não fictícia). Suas respostas devem ser objetivas, claras e práticas, sempre focando em oferecer soluções rápidas e úteis para ajudar o usuário da melhor maneira possível.";

  const handleChat = async () => {
    console.log("click");

    if (!input.trim() || loading) return; // Impede o envio se estiver carregando ou se a entrada estiver vazia
    Keyboard.dismiss();
    setLoading(true);

    const newMessage = { user: input, assistant: "" };
    setMessages((prev) => [...prev, newMessage]);
    setInput(""); // Limpa o campo imediatamente

    // Centraliza rolagem para o final
    const scrollToBottom = () => {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    };
    scrollToBottom();

    const eventSourceArgs = {
      body: {
        prompt: `${regularPrompt}\n\n${input}`, // Adiciona o prompt regular ao conteúdo do usuário
        model: chatType.label,
      },
      type: getChatType(chatType),
    };

    try {
      const es = await getEventSource(eventSourceArgs);
      let localResponse = "";

      es.addEventListener("open", () => setLoading(false));

      es.addEventListener("message", (event) => {
        if (event.data === "[DONE]") {
          setLoading(false);
          setApiMessages(
            (prev) =>
              `${prev}\n\nPrompt: ${input}\n\nResponse: ${localResponse}`
          );
          es.close(); // Fecha a conexão após a resposta
          return;
        }

        // Verifique se event.data não está vazio ou nulo
        if (!event.data) {
          console.error("Recebido dados vazios ou nulos");
          return;
        }

        // console.log("Dados recebidos:", event.data); // Adicione isso para depuração

        try {
          // Tenta analisar a resposta JSON
          const data = JSON.parse(event.data);
          const content = data.content || data.text || data.data || "";
          localResponse += content;

          setMessages((prev) => {
            const updatedMessages = [...prev];
            updatedMessages[updatedMessages.length - 1].assistant =
              localResponse;
            return updatedMessages;
          });

          // Atualiza rolagem
          scrollToBottom();
        } catch (error) {
          console.error("Erro ao analisar JSON:", error);
        }
      });

      es.addEventListener("error", (error) => {
        console.error("Connection error:", error);
        setLoading(false);
        es.close();
      });
    } catch (error) {
      console.error("Erro ao configurar EventSource:", error);
      setLoading(false);
    }
  };
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0, // Faz a logo desaparecer
          duration: 1000, // Duração da animação (1 segundo)
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1, // Faz a logo aparecer
          duration: 1000, // Duração da animação (1 segundo)
          useNativeDriver: true,
        }),
      ])
    ).start(); // Inicia a animação infinitamente
  }, [opacity]);

  return (
    <KeyboardAvoidingView
      behavior="padding"
      style={styles.container}
      keyboardVerticalOffset={110}
    >
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollContentContainer}
        keyboardShouldPersistTaps="handled"
      >
        {messages.length === 0 && (
          <View style={styles.centeredContainer}>
            <View style={styles.midChatInputWrapper}>
              {/* Logo com animação de opacidade */}
              <Animated.Image
                source={require("../components/muffinsaiw.png")}
                style={[styles.logoImage, { opacity: opacity }]} // Aplique a opacidade animada
                resizeMode="contain"
              />

              <Text style={styles.assistantIntroText}>
                Sou o assistente <Text style={styles.boldText}>Muffins AI</Text>
                , pronto para facilitar seu dia.
              </Text>

              <TextInput
                style={styles.midInput}
                placeholder="Digite sua mensagem"
                placeholderTextColor={theme.placeholderTextColor}
                onChangeText={setInput}
                value={input}
                editable={!loading}
              />

              <Pressable onPress={handleChat} style={styles.midButtonStyle}>
                <Ionicons
                  name="chatbox-ellipses-outline"
                  size={22}
                  color={theme.tintTextColor}
                />
                <Text style={styles.midButtonText}>Iniciar conversa</Text>
              </Pressable>
            </View>
          </View>
        )}

        {messages.length > 0 && (
          <FlatList
            data={messages}
            renderItem={renderItem}
            keyExtractor={(_, index) => `message-${index}`}
            scrollEnabled={false}
          />
        )}

        {/* "Pensando..." com um tempo de delay */}
        {loading && (
          <View style={styles.loadingContainer}>
            <Text style={styles.thinkingText}>Pensando...</Text>
          </View>
        )}
      </ScrollView>

      {messages.length > 0 && !loading && (
        <View style={styles.chatInputContainer}>
          <Pressable onPress={clearChat} style={styles.clearChatButton}>
            <Ionicons
              name="trash-outline"
              size={24}
              color={theme.tintTextColor}
            />
          </Pressable>
          <TextInput
            style={styles.input}
            placeholder="O que você está pensando?"
            placeholderTextColor={theme.placeholderTextColor}
            value={input}
            onChangeText={setInput}
          />
          <Pressable onPress={handleChat}>
            <View style={styles.chatButton}>
              <Ionicons
                name="arrow-up-outline"
                size={20}
                color={theme.tintTextColor}
              />
            </View>
          </Pressable>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const getStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
    },
    logoImage: {
      width: 300, // Ajuste a largura da logo conforme necessário
      height: 100, // Ajuste a altura da logo conforme necessário
      marginBottom: 20, // Espaçamento entre logo e elementos abaixo
    },
    centeredContainer: {
      flex: 1,
      justifyContent: "center", // Centraliza verticalmente
      alignItems: "center", // Centraliza horizontalmente
      paddingHorizontal: 10, // Não gruda nos lados da tela
      backgroundColor: theme.backgroundColor,
    },
    scrollContentContainer: {
      flexGrow: 1,
    },
    clearChatButton: {
      marginRight: 10,
      justifyContent: "center",
      alignItems: "center",
    },
    midChatInputWrapper: {
      justifyContent: "center", // Removido o flex: 1
      alignItems: "center",
      padding: 50,
    },
    assistantIntroText: {
      fontSize: 20,
      fontWeight: "normal",
      color: theme.textColor,
      textAlign: "center",
      marginBottom: 30,
    },
    iconContainer: {
      flexDirection: "row",
      justifyContent: "flex-start", // Alinha os ícones à esquerda
      alignItems: "center", // Alinha verticalmente
      gap: 8, // Espaço entre os ícones
      marginTop: 4, // Ajuste da margem superior
    },
    iconTouchable: {
      padding: 6, // Área de toque
      borderRadius: 10, // Bordas arredondadas
      backgroundColor: "transparent", // Fundo transparente
    },
    boldText: {
      fontWeight: "bold",
    },

    iconTouchablePressed: {
      backgroundColor: "#E0E0E0", // Fundo ao pressionar
      shadowColor: "#000", // Cor da sombra
      shadowOffset: { width: 0, height: 2 }, // Direção da sombra
      shadowOpacity: 0.3, // Opacidade da sombra
      shadowRadius: 4, // Raio da sombra
      elevation: 5, // Efeito de sombra no Android
    },
    midInput: {
      width: "100%",
      borderWidth: 1,
      borderColor: theme.borderColor,
      borderRadius: 25,
      paddingVertical: 10, // Espaco fixo na vertical
      paddingHorizontal: 80, // Espaco fixo na horizontal

      color: theme.textColor,
      marginBottom: 10,
    },

    midButtonStyle: {
      flexDirection: "row",
      backgroundColor: theme.tintColor,
      borderRadius: 25,
      padding: 15,
      justifyContent: "center",
      alignItems: "center",
    },
    midButtonText: {
      color: theme.tintTextColor,
      fontSize: 16,
      textAlign: "center", // Centraliza o texto
      alignSelf: "center", // Garantir que o texto esteja centralizado mesmo dentro do botão
      marginHorizontal: 50,
    },

    chatDescription: {
      color: theme.textColor,
      textAlign: "center",
      marginTop: 15,
      fontSize: 10,
      opacity: 0.8,
    },
    promptResponse: {
      marginTop: 10,
    },
    promptTextContainer: {
      alignItems: "flex-end",
      marginRight: 15,
    },
    promptText: {
      color: theme.tintTextColor,
      backgroundColor: theme.tintColor,
      padding: 10,
      borderRadius: 10,
      borderTopRightRadius: 0, // Remove o arredondamento na borda superior direita
    },
    textStyleContainer: {
      borderWidth: 1,
      borderColor: theme.borderColor,
      borderRadius: 13,
      padding: 15,
      margin: 10,
    },
    chatInputContainer: {
      flexDirection: "row",
      alignItems: "center",
      padding: 10,
      borderTopWidth: 1,
      borderColor: theme.borderColor,
    },
    input: {
      flex: 1,
      borderWidth: 1,
      borderColor: theme.borderColor,
      borderRadius: 25,
      padding: 10,
      marginRight: 10,
      color: theme.textColor,
    },
    chatButton: {
      backgroundColor: theme.tintColor,
      borderRadius: 25,
      padding: 10,
    },
    loadingContainer: {
      marginTop: 25,
    },
    thinkingText: {
      fontSize: 10,
      fontWeight: "600",
      color: theme.tintTextColor,
      fontStyle: "italic",
      letterSpacing: 1,
      marginTop: 30,
      textAlign: "center",
      opacity: 0.8,
    },
    markdownStyle: {
      body: {
        color: theme.textColor,
        fontFamily: theme.regularFont,
        fontSize: 14,
      },
      paragraph: {
        fontSize: 15,
        lineHeight: 22,
      },
      heading1: {
        fontFamily: theme.semiBoldFont,
        fontSize: 24,
        marginVertical: 10,
      },
      heading2: {
        fontFamily: theme.semiBoldFont,
        fontSize: 20,
        marginVertical: 8,
      },
      heading3: {
        fontFamily: theme.mediumFont,
        fontSize: 18,
        marginVertical: 6,
      },
      heading4: {
        fontFamily: theme.mediumFont,
        fontSize: 16,
        marginVertical: 5,
      },
      heading5: {
        fontFamily: theme.mediumFont,
        fontSize: 14,
        marginVertical: 5,
      },
      heading6: {
        fontFamily: theme.mediumFont,
        fontSize: 12,
        marginVertical: 5,
      },
      list_item: {
        marginTop: 6,
        fontSize: 15,
      },
      code_inline: {
        color: theme.secondaryTextColor,
        backgroundColor: theme.secondaryBackgroundColor,
        fontSize: 14,
        padding: 3,
        borderRadius: 4,
      },
      fence: {
        marginVertical: 5,
        padding: 12,
        backgroundColor: theme.secondaryBackgroundColor,
        borderRadius: 5,
      },
      table: {
        marginTop: 8,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, .2)",
        borderRadius: 5,
        padding: 8,
      },
      blockquote: {
        backgroundColor: "#312e2e",
        borderLeftWidth: 5,
        marginLeft: 5,
        paddingHorizontal: 8,
        borderRadius: 3,
        fontStyle: "italic",
      },
    },
  });
