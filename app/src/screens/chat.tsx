import {
  View,
  Text,
  KeyboardAvoidingView,
  StyleSheet,
  TouchableHighlight,
  TextInput,
  ScrollView,
  ActivityIndicator,
  FlatList,
  Keyboard,
} from "react-native";
import "react-native-get-random-values";
import { useContext, useState, useRef } from "react";
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

  const handleChat = async () => {
    if (!input) return;
    Keyboard.dismiss();
    setLoading(true);

    const newMessage = { user: input, assistant: "" };
    setMessages((prev) => [...prev, newMessage]);

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 1);

    setInput("");

    const eventSourceArgs = {
      body: { prompt: input, model: chatType.label },
      type: getChatType(chatType),
    };

    const es = await getEventSource(eventSourceArgs);
    let localResponse = "";

    const listener = (event) => {
      if (event.type === "open") {
        setLoading(false);
      } else if (event.type === "message") {
        if (event.data !== "[DONE]") {
          // Certifique-se de que o dado é uma string
          let data;
          try {
            data = JSON.parse(event.data);
          } catch (error) {
            console.error("Erro ao fazer parse do event.data:", error);
            console.error("Conteúdo inválido recebido:", event.data);
            return;
          }
          const content = data.content || data.text || data.data || ""; // Extrai o conteúdo correto
          localResponse += content; // Concatena como string

          setMessages((prev) => {
            const updatedMessages = [...prev];
            updatedMessages[updatedMessages.length - 1].assistant =
              localResponse;
            return updatedMessages;
          });

          // Rola para o final da lista
          if (localResponse.length < 850) {
            scrollViewRef.current?.scrollToEnd({ animated: true });
          }
        } else {
          setLoading(false);
          setApiMessages(
            (prev) =>
              `${prev}\n\nPrompt: ${input}\n\nResponse: ${localResponse}`
          );
          es.close();
        }
      } else if (event.type === "error" || event.type === "exception") {
        console.error("Connection error:", event.message);
        setLoading(false);
      }
    };

    es.addEventListener("open", listener);
    es.addEventListener("message", listener);
    es.addEventListener("error", listener);
  };

  async function copyToClipboard(text) {
    await Clipboard.setStringAsync(text);
  }

  async function showClipboardActionsheet(text) {
    const cancelButtonIndex = 2;
    showActionSheetWithOptions(
      {
        options: ["Copy to clipboard", "Clear chat", "cancel"],
        cancelButtonIndex,
      },
      (selectedIndex) => {
        if (selectedIndex === Number(0)) {
          copyToClipboard(text);
        }
        if (selectedIndex === 1) {
          clearChat();
        }
      }
    );
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
          <Markdown style={styles.markdownStyle}>{item.assistant}</Markdown>
          <TouchableHighlight
            onPress={() => showClipboardActionsheet(item.assistant)}
            underlayColor="transparent"
          >
            <Ionicons name="apps" size={20} color={theme.textColor} />
          </TouchableHighlight>
        </View>
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior="padding"
      style={styles.container}
      keyboardVerticalOffset={110}
    >
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollContentContainer}
      >
        {messages.length === 0 && (
          <View style={styles.midChatInputWrapper}>
            <Text style={styles.assistantIntroText}>
              Sou o assistente Muffins AI, pronto para facilitar seu dia.
            </Text>
            <TextInput
              style={styles.midInput}
              placeholder="Mensagem"
              placeholderTextColor={theme.placeholderTextColor}
              onChangeText={setInput}
            />
            <TouchableHighlight
              onPress={handleChat}
              underlayColor="transparent"
            >
              <View style={styles.midButtonStyle}>
                <Ionicons
                  name="chatbox-ellipses-outline"
                  size={22}
                  color={theme.tintTextColor}
                />
                <Text style={styles.midButtonText}>
                  Iniciar Chat {chatType.name}
                </Text>
              </View>
            </TouchableHighlight>
            <Text style={styles.chatDescription}>
              Como posso ser útil para você hoje?
            </Text>
          </View>
        )}
        {messages.length > 0 && (
          <FlatList
            data={messages}
            renderItem={renderItem}
            scrollEnabled={false}
          />
        )}
        {loading && <ActivityIndicator style={styles.loadingContainer} />}
      </ScrollView>
      {messages.length > 0 && (
        <View style={styles.chatInputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Mensagem"
            placeholderTextColor={theme.placeholderTextColor}
            value={input}
            onChangeText={setInput}
          />
          <TouchableHighlight onPress={handleChat} underlayColor="transparent">
            <View style={styles.chatButton}>
              <Ionicons
                name="arrow-up-outline"
                size={20}
                color={theme.tintTextColor}
              />
            </View>
          </TouchableHighlight>
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
    scrollContentContainer: {
      flexGrow: 1,
    },
    midChatInputWrapper: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },
    assistantIntroText: {
      fontSize: 22,
      fontWeight: "bold",
      color: theme.tintTextColor,
      textAlign: "center",
      marginBottom: 20,
    },
    midInput: {
      width: "100%",
      borderWidth: 1,
      borderColor: theme.borderColor,
      borderRadius: 25,
      padding: 15,
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
      marginLeft: 10,
      fontSize: 16,
    },
    chatDescription: {
      color: theme.textColor,
      textAlign: "center",
      marginTop: 15,
      fontSize: 13,
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
      borderRadius: 8,
      borderTopRightRadius: 0,
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
    markdownStyle: {
      body: { color: theme.textColor, fontFamily: theme.regularFont },
      paragraph: { fontSize: 16 },
      heading1: { fontFamily: theme.semiBoldFont, marginVertical: 5 },
      heading2: { fontFamily: theme.semiBoldFont, marginVertical: 5 },
      heading3: { fontFamily: theme.mediumFont, marginVertical: 5 },
      heading4: { fontFamily: theme.mediumFont, marginVertical: 5 },
      heading5: { fontFamily: theme.mediumFont, marginVertical: 5 },
      heading6: { fontFamily: theme.mediumFont, marginVertical: 5 },
      list_item: { marginTop: 7, fontSize: 16 },
      code_inline: {
        color: theme.secondaryTextColor,
        backgroundColor: theme.secondaryBackgroundColor,
      },
      fence: {
        marginVertical: 5,
        padding: 10,
        backgroundColor: theme.secondaryBackgroundColor,
      },
      table: {
        marginTop: 7,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, .2)",
        borderRadius: 3,
      },
      blockquote: {
        backgroundColor: "#312e2e",
        borderLeftWidth: 4,
        marginLeft: 5,
        paddingHorizontal: 5,
      },
    },
  });
