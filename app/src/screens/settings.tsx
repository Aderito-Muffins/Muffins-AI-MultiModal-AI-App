import {
  View,
  Text,
  StyleSheet,
  TouchableHighlight,
  ScrollView,
  Dimensions,
  Image,
} from "react-native";
import { useContext } from "react";
import appConfig from "../../app.json";
import { AppContext, ThemeContext } from "../context";
import {
  AnthropicIcon,
  OpenAIIcon,
  CohereIcon,
  MistralIcon,
  GeminiIcon,
} from "../components/index";
import Constants from "expo-constants";
import FontAwesome from "@expo/vector-icons/FontAwesome5";
import { IIconProps } from "../../types";
import {
  MODELS,
  IMAGE_MODELS,
  ILLUSION_DIFFUSION_IMAGES,
} from "../../constants";
import * as themes from "../theme";

const { width } = Dimensions.get("window");
const models = Object.values(MODELS);
const imageModels = Object.values(IMAGE_MODELS);
const _themes = Object.values(themes).map((v) => ({
  name: v.name,
  label: v.label,
}));
const diffusionImages = Object.values(ILLUSION_DIFFUSION_IMAGES);

// Defina a versão do app
const APP_VERSION = "1.0.0";

export function Settings() {
  const { theme, setTheme, themeName } = useContext(ThemeContext);
  const {
    chatType,
    setChatType,
    setImageModel,
    imageModel,
    illusionImage,
    setIllusionImage,
  } = useContext(AppContext);

  const styles = getStyles(theme);

  function renderIcon({ type, props }: IIconProps) {
    if (type.includes("gpt")) {
      return <OpenAIIcon {...props} />;
    }
    if (type.includes("claude")) {
      return <AnthropicIcon {...props} />;
    }
    if (type.includes("cohere")) {
      return <CohereIcon {...props} />;
    }
    if (type.includes("mistral")) {
      return <MistralIcon {...props} />;
    }
    if (type.includes("gemini")) {
      return <GeminiIcon {...props} />;
    }
    if (type.includes("fastImage")) {
      return <FontAwesome name="images" {...props} />;
    }
    if (type.includes("removeBg")) {
      return <FontAwesome name="eraser" {...props} />;
    }
    if (type.includes("upscale")) {
      return <FontAwesome name="chevron-up" {...props} />;
    }
    if (type.includes("illusion")) {
      return <FontAwesome name="cubes" {...props} />;
    }
    return <FontAwesome name="images" {...props} />;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.titleContainer}>
        <Text style={styles.mainText}>Tema</Text>
      </View>
      {_themes.map((value, index) => (
        <TouchableHighlight
          key={index}
          underlayColor="transparent"
          onPress={() => {
            setTheme(value.label);
          }}
        >
          <View
            style={{
              ...styles.chatChoiceButton,
              ...getDynamicViewStyle(themeName, value.label, theme),
            }}
          >
            <Text
              style={{
                ...styles.chatTypeText,
                ...getDynamicTextStyle(themeName, value.label, theme),
              }}
            >
              {value.name}
            </Text>
          </View>
        </TouchableHighlight>
      ))}
      <View style={styles.titleContainer}>
        <Text style={styles.mainText}>Modelo de Chat</Text>
      </View>
      <View style={styles.buttonContainer}>
        {models.map((model, index) => {
          return (
            <TouchableHighlight
              key={index}
              underlayColor="transparent"
              onPress={() => {
                setChatType(model);
              }}
            >
              <View
                style={{
                  ...styles.chatChoiceButton,
                  ...getDynamicViewStyle(chatType.label, model.label, theme),
                }}
              >
                {renderIcon({
                  type: model.label,
                  props: {
                    theme,
                    size: 18,
                    style: { marginRight: 8 },
                    selected: chatType.label === model.label,
                  },
                })}
                <Text
                  style={{
                    ...styles.chatTypeText,
                    ...getDynamicTextStyle(chatType.label, model.label, theme),
                  }}
                >
                  {model.name}
                </Text>
              </View>
            </TouchableHighlight>
          );
        })}
      </View>

      {/* Exibe a versão do app no final */}
      <View style={styles.versionContainer}>
        <Text style={styles.mainText}>Versão {appConfig.expo.version}</Text>
        <Text style={styles.versionText}>
          Muffins AI, desenvolvida pela Muffins Corp
        </Text>
      </View>
    </ScrollView>
  );
}

function getDynamicTextStyle(baseType: string, type: string, theme: any) {
  if (type === baseType) {
    return {
      color: theme.tintTextColor,
    };
  } else return {};
}

function getDynamicViewStyle(baseType: string, type: string, theme: any) {
  if (type === baseType) {
    return {
      backgroundColor: theme.tintColor,
    };
  } else return {};
}

const getStyles = (theme: any) =>
  StyleSheet.create({
    illusionImage: {
      width: (width - 30) / 3,
      height: (width - 30) / 3,
      borderWidth: 4,
    },
    illusionImageContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginTop: 10,
    },
    buttonContainer: {
      marginBottom: 20,
    },
    container: {
      padding: 14,
      flex: 1,
      backgroundColor: theme.backgroundColor,
      paddingTop: 10,
    },
    contentContainer: {
      paddingBottom: 40,
    },
    titleContainer: {
      paddingVertical: 10,
      paddingHorizontal: 15,
      marginTop: 10,
    },
    chatChoiceButton: {
      padding: 15,
      borderRadius: 8,
      flexDirection: "row",
    },
    chatTypeText: {
      fontFamily: theme.semiBoldFont,
      color: theme.textColor,
    },
    mainText: {
      fontFamily: theme.boldFont,
      fontSize: 15,
      color: theme.textColor,
    },
    versionContainer: {
      paddingVertical: 20,
      paddingHorizontal: 15,
      marginTop: 130,
      alignItems: "center",
      backgroundColor: theme.versionBackgroundColor || theme.backgroundColor,
    },
    versionText: {
      fontFamily: theme.semiBoldFont,
      fontSize: 10,
      color: theme.textColor,
      marginBottom: 5,
      textAlign: "center",
    },
  });
