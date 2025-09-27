Muffins AI Mobile

Muffins AI Mobile is a cross-platform React Native app for iOS and Android that brings the power of Muffins AI to your phone.
It supports real-time LLM chat, image generation, and AI-powered tools, offering a fast and intuitive mobile experience.

Stay updated with new releases on the Muffins AI Blog
.

✨ Features

LLM Chat → Real-time conversations with multiple providers ( Gemini, DeepSeek, Llama, Playground).

Streaming Responses → Low latency, token-by-token AI replies.

AI Agents → Draft contracts, summarize documents, and run specialized workflows.

Image Generation → Create images from text prompts and edit them.

Advanced Search → Semantic search across knowledge bases and documents.

Multi-Theme Support → Switch between light, dark, and custom themes.

Cross-Platform → Runs on iOS and Android with one codebase.

🚀 Getting Started
Requirements

Node.js >= 18

React Native CLI or Expo

iOS or Android emulator / device

Installation
# Clone repo
git clone (https://github.com/Aderito-Muffins/muffins-ai-mobile.git)

cd muffins-ai-mobile

# Install dependencies
npm install

Running the app
# iOS
npm run ios

# Android
npm run android

Running the server (optional, for local dev)
cd server
npm run dev

⚙️ Environment Variables

Create a .env file in the project root:

MUFFINS_AI_API_KEY=your_api_key
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
MISTRAL_API_KEY=your_mistral_key
FAL_API_KEY=your_fal_key

🎨 Theming

Muffins AI Mobile includes several prebuilt themes.
Add a new one in app/src/theme.ts:

const muffins = {
  ...lightTheme,
  name: 'Muffins',
  label: 'muffins',
  tintColor: '#6a1b9a',
  textColor: '#ffffff',
  tabBarActiveTintColor: '#ab47bc',
  tabBarInactiveTintColor: '#ce93d8',
  placeholderTextColor: '#f3e5f5',
}


Export it at the bottom of the file:

export {
  lightTheme, darkTheme, muffins
}

📦 Roadmap

 Offline mode with local LLMs

 Push notifications for AI agent updates

 Voice input and text-to-speech responses

 Workspace sync with Muffins AI web app

📜 License

Muffins AI Mobile is developed by Adérito Muffins
.
All rights reserved © 2025 
