import { Request, Response } from "express";
import asyncHandler from "express-async-handler";

type ModelName = "llama-2-13b-chat" | "llama-2-7b-chat";

const models: Record<string, ModelName> = {
  llama13b: "llama-2-13b-chat",
  llama7b: "llama-2-7b-chat",
};

interface RequestBody {
  prompt: string;
  model: keyof typeof models;
}

export const llama = asyncHandler(async (req: Request, res: Response) => {
  try {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      Connection: "keep-alive",
      "Cache-Control": "no-cache",
    });

    const { prompt, model }: RequestBody = req.body;

    if (!prompt || !models[model]) {
      res.status(400).send({ error: "Invalid prompt or model name" });
      return;
    }

    const response = await fetch(
      "https://api.fireworks.ai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.FIREWORKS_API_KEY || ""}`,
        },
        body: JSON.stringify({
          model: models[model],
          messages: [{ role: "user", content: prompt }],
          max_tokens: 4096,
          stream: true,
        }),
      }
    );

    const decoder = new TextDecoder();
    const reader = response.body?.getReader();

    if (reader) {
      let index = 0;

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        let chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        const parsedLines = lines
          .filter((line) => line.startsWith("data: "))
          .map((line) => JSON.parse(line.replace("data: ", "")));

        for (const parsedLine of parsedLines) {
          if (parsedLine && parsedLine.choices?.length) {
            res.write(
              `data: ${JSON.stringify(parsedLine.choices[0].delta)}\n\n`
            );
          }
        }
      }

      res.write("data: [DONE]\n\n");
      res.end();
    }
  } catch (err) {
    console.error("Error in llamaChat: ", err);
    res.write("data: [DONE]\n\n");
    res.end();
  }
});
