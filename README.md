Maven — AI Business Mentor for Freelancers

A no-BS business mentor that knows your niche, your rates, and your income goal — and gives you specific advice based on that.

What is this?
Maven is an AI business mentor built exclusively for freelancers. Not a general chatbot — it asks about your actual situation (your niche, what you're earning, what's blocking you) and gives advice specific to that. Think pricing strategy, finding clients, turning one-off projects into retainers, writing proposals that close.
It also has Wispr-style voice input so you can think out loud and get advice back instantly.
Live demo: maven-app-blue.vercel.app

Features

Personalised onboarding — asks 5 questions before giving any advice so responses are always specific to your situation
Voice input — tap the mic, speak your question, Maven responds (Chrome/Edge)
Streaming responses — answers appear in real time, no waiting
Markdown rendering — formatted advice, templates, and scripts rendered cleanly
Mobile friendly — works on any device


Tech stack
LayerToolFrontendReact + ViteAI modelLlama 3.3 70B via Groq APIBackend proxyVercel serverless functionsDeploymentVercel (free tier)Voice inputWeb Speech API

Getting started
Prerequisites

Node.js 18+
A free Groq API key

Installation
bash# clone the repo
git clone https://github.com/KLMonisha/Maven.git
cd maven

# install dependencies
npm install

# create your environment file
cp .env.example .env
Add your Groq API key to .env:
envGROQ_API_KEY=your_groq_api_key_here
bash# start the dev server
npm run dev
Open http://localhost:5173 and you're good to go.

Deployment
This project is set up for one-click deployment on Vercel.

Push to a private GitHub repo
Import the repo at vercel.com
Add GROQ_API_KEY to Vercel environment variables (Settings → Environment Variables)
Deploy — Vercel handles the rest

Every push to main auto-deploys. Your link stays the same.

Project structure
maven/
├── api/
│   └── chat.js          # Vercel serverless function — proxies Groq API calls
├── src/
│   └── App.jsx          # Main React app — all UI and logic
├── public/
│   └── index.html       # Meta tags and OG config
├── .env.example         # Environment variable template
├── .gitignore
├── package.json
└── vite.config.js

Security
The Groq API key is never exposed to the browser. All AI requests go through /api/chat.js — a Vercel serverless function that holds the key server-side. The frontend calls /api/chat, not Groq directly.
Never commit your .env file. It's in .gitignore by default.

Environment variables
VariableRequiredDescriptionGROQ_API_KEYYesYour Groq API key from console.groq.com

Roadmap

 Session memory — remember user context between visits
 Weekly check-in prompts
 Proposal generator — describe the project by voice, get a full draft
 Rate calculator — input your goals and expenses, get your minimum rate
 Document analysis — upload a brief or contract for Maven to review


Built by
K L Monisha (https://github.com/KLMonisha)

License
MIT — do whatever you want with it.
