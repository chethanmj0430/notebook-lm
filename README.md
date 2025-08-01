# NotebookLM - AI PDF Chat Application

This is a full-stack web application that allows users to upload PDF documents and then ask questions about their content using an AI chat interface. Both the frontend user interface and the backend API logic (for PDF processing and AI interactions) are built entirely within the **Next.js framework**.

The project is structured as a monorepo, with the frontend-related code residing in `notebooklm-frontend` and backend/API-related code (likely within Next.js API routes) in `notebooklm-backend-nextjs`, all managed under a single Git repository.

## Features

-   **PDF Upload:** Securely upload PDF documents to the Next.js backend API routes for processing.
-   **AI Chat:** Interact with an AI model (e.g., Google Gemini, OpenAI GPT) by asking questions and receiving answers based on the content of the uploaded PDF. All AI calls are handled securely on the server-side via Next.js API routes.
-   **Chat History Persistence:** Chat conversations are saved and persisted locally in the user's browser (using `localStorage`) across sessions.
-   **Dynamic Theming:** Seamlessly switch between beautiful light and dark modes for the entire user interface.
-   **Intelligent Chat Management:**
    * "Clear Chat" button to reset the conversation and loaded PDF.
    * Automatic chat clearing and a new greeting when a new PDF is uploaded, ensuring a fresh context.
    * Chat input is intelligently disabled when no PDF is loaded.
    * Clear indicators for upload progress and AI response loading states.

## Prerequisites

Before you begin, ensure you have the following installed on your machine:

* **Git:** For cloning the repository and version control.
* **Node.js (LTS version recommended):** e.g., 18.x or 20.x. This includes `npm` (Node Package Manager).
* **npm** or **Yarn:** For managing project dependencies.

## Installation

Follow these steps to set up and run the application locally.

### 1. Clone the Repository

First, clone this repository to your local machine:

git clone [https://github.com/chethanmj0430/notebook-lm.git](https://github.com/chethanmj0430/notebook-lm.git)
cd notebook-lm # Navigate into the cloned project directory


### 2\. Install Dependencies

Navigate into the root of the project where the main `package.json` file is located (which should be the `notebook-lm` directory after cloning).


npm install
# Or if you prefer Yarn:
# yarn install


### 3\. Configure Environment Variables (Crucial for API Keys\!)

This project relies on environment variables, particularly for your AI API key. **These should NEVER be committed to Git.**

**a. For Local Development:**

Create a file named `.env.local` in the **root directory of your project** (the same directory as `package.json`).

Add your AI API key and any other necessary environment variables here.

Example `.env.local` content:

# Google Gemini API Key (Used by your Next.js API routes for server-side AI calls)
GOOGLE_API_KEY=your_google_gemini_api_key_here

# Or if using OpenAI:
# OPENAI_API_KEY=your_openai_api_key_here

# Example of a PUBLIC variable (if you had one, for client-side use)
# NEXT_PUBLIC_ANALYTICS_ID=UA-XXXXX


**Important Security Note:**

  * Variables in `.env.local` **without** the `NEXT_PUBLIC_` prefix (like `GOOGLE_API_KEY`) are **only accessible on the server-side** (e.g., within Next.js API routes, `getServerSideProps` functions). This ensures your sensitive API keys are never exposed to the client-side browser.
  * Ensure your `.gitignore` file contains `.env*.local` to prevent these files from being committed to Git.

**b. For Production Deployment:**

When deploying your application to a hosting platform (like Vercel, Netlify, Render, etc.), you will need to **set these environment variables directly within your hosting provider's dashboard or configuration interface.** This securely injects them into your production environment without storing them in your code repository.

## Running the Application

Ensure you have completed the installation and environment variable setup.

To start the Next.js development server:

npm run dev
# Or if you use Yarn:
# yarn dev


The application will typically open in your web browser at `http://localhost:3000` (or the next available port if 3000 is in use).

## Usage

1.  **Upload PDF:** On the application's home page, drag and drop a PDF file into the designated area or click "Browse Files" to select one.
2.  **Chat:** Once the PDF is uploaded and its name appears in the header, type your questions into the chat input field and press Enter or click "Send."
3.  **Clear Chat:** Use the "Clear Chat" button in the header to reset the conversation and clear the loaded PDF.
4.  **Toggle Theme:** Use the sun/moon button in the header to switch between light and dark modes.

## Project Structure

This project adopts a monorepo-like structure within a single Next.js application, organizing code logically into `frontend` and `backend` concerns.

notebook-lm/
├── .git/                 # Git repository metadata (hidden)
├── node_modules/         # Node.js dependencies (ignored by Git)
├── public/               # Static assets (e.g., images, icons)
├── src/                  # Main application source code
│   ├── app/              # Likely contains core Angular-like components (e.g., theme, services)
│   │   ├── chat-interface/    # Components related to the chat UI
│   │   ├── pdf-upload/        # Components related to PDF uploading
│   │   ├── services/          # Shared Angular-like services (pdf.service.ts, theme.service.ts)
│   │   └── ...
│   ├── pages/            # Next.js Pages Router (or root of App Router)
│   │   ├── api/          # **Your Backend API routes go here** (e.g., chat.ts, upload.ts)
│   │   │   ├── chat.ts
│   │   │   └── upload.ts
│   │   ├── _app.tsx      # Custom App component for Next.js
│   │   ├── index.tsx     # Main application page
│   │   └── ...
│   ├── styles/           # Global styles and CSS variables (e.g., styles.scss or global.css)
│   └── ...
├── notebooklm-backend-nextjs/  # This directory likely holds specific backend-related logic
│   └── ...                  # (e.g., PDF parsing utils, AI model integrations) that
│                            # are then imported into `pages/api` routes.
├── notebooklm-frontend/        # This directory likely holds specific frontend-related logic
│   └── ...                  # (e.g., complex UI components, custom hooks) that
│                            # are then imported into `src/app` or `src/pages`.
├── .env.local            # Local environment variables (ignored by Git)
├── .gitignore            # Specifies intentionally untracked files to ignore
├── package.json          # Node.js dependencies and scripts
├── next.config.js        # Next.js configuration
├── tsconfig.json         # TypeScript configuration
├── README.md             # This file
└── ...

## Future Enhancements (Ideas)

  * Implement user authentication and personalized PDF storage.
  * Allow chatting with multiple PDFs or collections of documents.
  * Explore advanced prompt engineering techniques or integrate with different AI models.
  * Add real-time chat updates using WebSockets.
  * Improve error handling with more detailed user feedback and logging.
  * Implement pagination or lazy loading for very long chat histories.

