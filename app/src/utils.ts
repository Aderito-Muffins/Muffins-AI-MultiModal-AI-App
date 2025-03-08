import { DOMAIN } from "../constants";
import EventSource from "react-native-sse";
import { Model } from "../types";

export function getEventSource({
  headers,
  body,
  type,
}: {
  headers?: any;
  body: any;
  type: string;
}) {
  const es = new EventSource(`${DOMAIN}/chat/${type}`, {
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    method: "POST",
    body: JSON.stringify(body),
  });
  console.log(type);

  return es;
}
export async function getApiMuffins({
  headers,
  body,
  type,
}: {
  headers?: Record<string, string>;
  body: {
    messages: Array<{ content: string; role: string }>;
    model: string;
  };
  type: string;
}) {
  try {
    // Validação do corpo da requisição
    if (!body || !body.messages || !body.model) {
      throw new Error("Invalid request body");
    }
    const selectedChatModel = body.model;

    // Configuração dos headers
    const requestHeaders = {
      "Content-Type": "application/json",
      ...headers,
    };

    // Configuração da URL
    const url = `${DOMAIN}/api/chat/${type}`;

    // Faz a requisição para a API
    const response = await fetch(url, {
      method: "POST",
      headers: requestHeaders,
      body: JSON.stringify({
        messages: body.messages, // Mensagens no formato esperado
        selectedChatModel, // Modelo selecionado
      }),
    });

    // Validação da resposta
    if (!response.ok) {
      throw new Error(`API request failed with status: ${response.status}`);
    }

    // Consumir o stream da resposta
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("Response body is not readable");
    }

    const decoder = new TextDecoder("utf-8");
    let result = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      result += decoder.decode(value, { stream: true });
    }

    console.log("Streamed response:", result);
    return result; // Retorna a resposta processada
  } catch (error) {
    console.error("Error in getApiMuffins:", error);
    throw new Error("Failed to process API request");
  }
}

export function getFirstNCharsOrLess(text: string, numChars: number = 1000) {
  if (text.length <= numChars) {
    return text;
  }
  return text.substring(0, numChars);
}

export function getFirstN({
  messages,
  size = 10,
}: {
  size?: number;
  messages: any[];
}) {
  if (messages.length > size) {
    const firstN = new Array();
    for (let i = 0; i < size; i++) {
      firstN.push(messages[i]);
    }
    return firstN;
  } else {
    return messages;
  }
}

export function getChatType(type: Model) {
  console.log(type);
  if (type.label.includes("gpt")) {
    return "gpt";
  }
  if (type.label.includes("cohere")) {
    return "cohere";
  }
  if (type.label.includes("mistral")) {
    return "mistral";
  }
  if (type.label.includes("deepSeek") || type.name.includes("DeepSeek")) {
    return "deepseek";
  }
  if (type.label.includes("llama") || type.name.includes("Llama")) {
    return "llama";
  }
  if (type.label.includes("gemini")) {
    return "gemini";
  } else return "claude";
}
