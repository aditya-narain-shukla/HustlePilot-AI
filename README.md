# ✳ HustlePilot AI

### Work smarter. Earn better.

HustlePilot AI is an open-source, privacy-first productivity assistant
built for freelancers, independent creators, and small business owners.

It helps users draft client proposals, create product listings, write
marketing copy, and calculate basic project pricing.

The goal is simple: spend less time on repetitive business tasks and
more time delivering work that earns money.

---

## 🚀 Features

### 1. Client Proposal Writer
- Turn project briefs into structured proposal drafts.
- Organise deliverables, workflow, timelines, and next steps.
- Make it easier to prepare a professional client response.

### 2. Product Listing Assistant
- Draft product titles and descriptions.
- Highlight benefits and potential customer needs.
- Prepare content for online stores and marketplaces.

### 3. Marketing Copy Generator
- Create promotional captions and marketing drafts.
- Generate headline ideas and calls to action.
- Adapt the writing tone to your audience.

### 4. Pricing Assistant
- Estimate labour costs using hours and hourly rates.
- Include additional project expenses.
- Add a configurable-in-code 10% contingency allowance.
- Present a starting estimate, not a guaranteed market price.

### 5. Local Open-Weight AI
- Connect to Ollama's local API.
- Choose a model available on your computer.
- Generate content without a hosted AI provider.
- Fall back to labelled demo templates when local AI is unavailable.

### 6. Export and Usability
- Copy generated drafts.
- Download drafts as text files.
- Use the responsive dashboard on desktop and mobile.
- Save local AI connection settings in browser storage.

---

## 🧠 Why Open Innovation Matters

HustlePilot AI is designed to support open-weight AI models through
Ollama rather than depending on a proprietary cloud AI API.

This approach provides several advantages:

**Privacy and control**

When local inference is working correctly, the prompt is sent to the
Ollama server running on the user's own computer. The project does not
send prompts to a third-party hosted AI provider.

**Lower ongoing inference costs**

There is no per-request fee from a hosted AI provider when using a
locally running model. Users still need suitable hardware and may incur
electricity and setup costs.

**Model choice**

Users can select compatible models available through Ollama. Different
models can produce different results, so the best model depends on
hardware, writing quality, language, and response speed.

**Less vendor lock-in**

The project is built around ordinary HTML, CSS, and JavaScript.
Its model connection can be adapted to other compatible local inference
systems without rebuilding the entire interface.

**Offline potential**

After the website files and model are available locally, supported
workflows can operate without internet access. External fonts and other
online resources may still require internet unless downloaded or replaced.

### An honest comparison with closed AI APIs

A hosted AI API may provide stronger results, easier deployment, and
less demanding hardware requirements.

A local model may provide more direct data control, predictable
inference costs, and freedom to experiment with different models.

HustlePilot AI does not claim that local models are always more accurate
or better than commercial alternatives. The right choice depends on the
user's workload and priorities.

---

## 🛠️ Technology Stack

- HTML5
- CSS3
- Vanilla JavaScript
- Ollama local API
- Open-weight language models compatible with Ollama

No frontend framework or paid API key is required.

---

## 📂 Project Structure

HustlePilot-AI/
├── index.html
├── style.css
├── script.js
└── README.md

---

## ▶️ Run the Project

### Step 1: Open the website

Open `index.html` in your browser to explore the interface and use
the demo templates and pricing calculator.

### Step 2: Install Ollama for local AI

Download Ollama from:

https://ollama.com/

### Step 3: Download a model

Open a terminal and run:

```bash
ollama pull qwen2.5:3b
