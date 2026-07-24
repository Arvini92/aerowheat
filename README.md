# AeroWheat — Angular Browser Diagnostic Portal

An enterprise-grade, browser-native computer vision & diagnostic interface built with **Angular** and **ONNX Runtime Web**. AeroWheat enables real-time, zero-backend wheat leaf disease detection directly on the client side using WebAssembly and WebGPU execution backends, augmented with Hugging Face client-side WebGPU LLMs (e.g., `Qwen2.5-Coder` / `Qwen` models via `@huggingface/transformers`) and local Retrieval-Augmented Generation (RAG) vector/knowledge services for automated agronomic insights.

---

## 🌟 Key Features

* **In-Browser ML Inference:** Runs exported YOLO detection models (`.onnx`) locally using `onnxruntime-web` with zero server bandwidth or backend dependencies.
* **Smart Preprocessing:** Automatic letterboxing, **640×640** tensor normalization, and client-side Non-Maximum Suppression (NMS) bounding box calculation.
* **Client-Side RAG Architecture:** Vectorized local agronomic knowledge retriever (`RagService`) that builds context-aware prompts directly in the browser.
* **In-Browser Hugging Face LLM Integration:** Executes lightweight, client-side open models (Qwen-family models via Hugging Face Transformers) directly in WebGPU / WebAssembly with optional cloud API fallback for heavy queries.
* **Client-First Privacy & Offline Readiness:** Leaf images, canvas frame calculations, and local RAG context lookups remain strictly on the user's local machine.
* **Modern Angular Architecture:** Built with Angular standalone components, signals, RxJS reactive streams, and custom design-system primitives for high-FPS canvas overlays and interactive reporting.

---

## 🏗️ Architecture Overview

```text
               ┌──────────────────────────────┐
               │    Local Leaf Image Upload   │
               └──────────────┬───────────────┘
                              │
                      [ Canvas Pipeline ]
                              │
               ┌──────────────┴───────────────┐
               │    Letterbox to 640 x 640    │
               └──────────────┬───────────────┘
                              │
               ┌──────────────┴───────────────┐
               │   ONNX WebAssembly / WebGPU  │ ──► [ Local best.onnx ]
               └──────────────┬───────────────┘
                              │
              [ Bounding Boxes & Class Probabilities ]
                              │
      ┌───────────────────────┴───────────────────────┐
      │                                               │
┌─────▼─────────────────────────┐   ┌─────────────────▼─────────────┐
│ High-FPS Canvas Bounding Box  │   │  Local RAG Knowledge Engine   │
│ Overlay (Healthy/Rust/Sept)   │   │     (rag.service.ts)          │
└───────────────────────────────┘   └─────────────────┬─────────────┘
                                                      │
                                    ┌─────────────────▼─────────────┐
                                    │ Hugging Face In-Browser LLM   │
                                    │ (Qwen model via transformers) │
                                    └───────────────────────────────┘
```

## 📋 Prerequisites

Before running the application, ensure you have the following installed:

* **Node.js** (v18.x or later recommended)
* **npm** (v9.x or later)
* A valid **Gemini API Key** (for diagnostic copilot features) (Optional)
* A WebGPU / WebAssembly capable browser (e.g., Chrome, Edge) for local model execution. (Optional)
---

## 🚀 Quick Start (Run Locally)

### 1. Clone & Install Dependencies
*(Under 2 min)*

Clone the repository and install all required Node modules:
```bash
git clone [https://github.com/your-org/AeroWheat.git](https://github.com/your-org/AeroWheat.git)
cd AeroWheat
npm install
```

2. Configure Environment Keys
(1 min)

(Optional) Update a .env file in the root directory (or update the existing template) and add your Gemini API key:
```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

Ensure your client-side model assets are present in the assets folder:

Model path: src/assets/models/best.onnx

Hugging Face Transformers models and local RAG indexes will load directly via the browser runtime upon initializing the Chat Bot component.

3. Build & Start Development Server
(Runs on http://localhost:4200)

Build the project assets and spin up the Angular development server:
```bash
ng serve
```

Navigate your browser to http://localhost:4200/. The app will automatically reload if you change any source files.

## 💻 Tech Stack

* **Framework:** Angular (Standalone Components, Signals, RxJS)
* **Computer Vision Inference:** `onnxruntime-web` (YOLO `.onnx` execution on WebAssembly/WebGPU)
* **In-Browser LLM & Hugging Face Pipeline:** `@huggingface/transformers` (Qwen execution directly in browser)
* **Local RAG System:** Custom client-side vector lookup & agronomic knowledge retriever (`RagService`)
* **Styling & UI Components:** Custom Glassmorphism SCSS Design System / Tailwind CSS

---

## 📜 Scripts Reference

| Command | Action |
| :--- | :--- |
| `npm run dev` | Starts the Angular development server (`ng serve`). |
| `npm run build` | Builds the production bundle with optimized WebAssembly assets. |
| `npm run watch` | Builds and watches for changes across application modules. |
| `npm run test` | Executes unit tests via Jasmine / Karma. |
