# PhysioScan AI - Local Setup Guide

Follow these steps to run PhysioScan AI on your own laptop.

## 1. Prerequisites

Ensure you have the following installed:
- **Node.js** (version 18 or higher): Download from [https://nodejs.org/](https://nodejs.org/)
- **Git** (optional, for cloning): Download from [https://git-scm.com/](https://git-scm.com/)

## 2. Get the Code

1.  **Download/Clone**:
    -   If you have the project files, copy them into a folder (e.g., `physioscan-ai`).
    -   Or clone the repository if available: `git clone <repository-url>`

2.  **Navigate to the folder**:
    Open your terminal (Command Prompt, PowerShell, or Terminal) and run:
    ```bash
    cd physioscan-ai
    ```

## 3. Install Dependencies

Run the following command to install all required libraries (React, Vite, Express, Google Gemini SDK, etc.):

```bash
npm install
```

## 4. Configure Environment Variables

1.  Create a new file named `.env` in the root of your project folder.
2.  Add your Google Gemini API key to this file:

    ```env
    GEMINI_API_KEY=your_actual_api_key_here
    ```

    *You can get a free API key from [Google AI Studio](https://aistudio.google.com/).*

## 5. Run the Application

### Development Mode (Recommended)
To start the development server with hot-reloading:

```bash
npm run dev
```

You should see output indicating the server is running, usually at:
`http://localhost:3000`

Open your browser and visit that URL to use the app!

### Production Mode
To build and run the optimized production version:

```bash
npm run build
npm start
```

## Troubleshooting

-   **Port already in use?**
    If port 3000 is busy, you may need to stop other running processes or modify the `PORT` variable in `server.ts`.

-   **API Errors?**
    Ensure your `GEMINI_API_KEY` is valid and has permissions enabled in Google AI Studio. Check the console logs for detailed error messages.

-   **Database Issues?**
    The app uses a local SQLite database (`health.db`). It will be created automatically when you start the server. If you encounter issues, try deleting the `health.db` file and restarting the server to regenerate it.
