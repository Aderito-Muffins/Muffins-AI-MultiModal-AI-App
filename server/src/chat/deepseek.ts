import { Request, Response } from "express";
import asyncHandler from "express-async-handler";

export const deepseek = asyncHandler(async (req: Request, res: Response) => {
  const models: any = {
    "chat-model-large": "accounts/fireworks/models/deepseek-v3", // Nome do modelo Fireworks
  };

  try {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      Connection: "keep-alive",
      "Cache-Control": "no-cache",
    });

    const { model, messages } = req.body;

    const response = await fetch(
      "https://api.fireworks.ai/inference/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.FIREWORKS_API_KEY}`,
        },
        body: JSON.stringify({
          model: models[model],
          messages,
          stream: true,
        }),
      }
    );

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let brokenLine = "";

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        let chunk = decoder.decode(value);
        if (brokenLine) {
          try {
            const parsed = JSON.parse(brokenLine);
            const { content } = parsed.choices[0].delta;
            if (content) {
              res.write(`data: ${JSON.stringify(content)}\n\n`);
            }
            brokenLine = "";
          } catch (err) {
            // Continue to accumulate broken data
          }
        }

        const lines = chunk.split("data: ");
        const parsedLines = lines
          .filter((line) => line && line !== "[DONE]")
          .filter((line) => {
            try {
              JSON.parse(line);
              return true;
            } catch (err) {
              if (!line.includes("[DONE]")) {
                brokenLine += line;
              }
              return false;
            }
          })
          .map((line) => JSON.parse(line));

        for (const parsedLine of parsedLines) {
          const { content } = parsedLine.choices[0].delta;
          if (content) {
            res.write(`data: ${JSON.stringify(content)}\n\n`);
          }
        }
      }
    }

    res.write("data: [DONE]\n\n");
  } catch (err) {
    console.error("Error:", err);
    res.status(500).send("An error occurred while processing the request.");
  }
});
