# AI News Daily

A modern, newspaper-style web application for daily AI news summaries.

## Features

- **Dynamic Newspaper Interface**: Flip through pages like a real newspaper using `react-pageflip`.
- **Daily Summaries**: Designed to display daily AI news summaries (e.g., from ChatGPT).
- **Audio Playback**: Built-in text-to-speech (Web Speech API fallback, supports external audio URLs).
- **Save & Organize**: Save articles to your personal collection (Supabase backend).
- **Modern Design**: Glassmorphism, elegant typography, and responsive layout.

## Setup

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Supabase Setup**:
    -   Create a new project on [Supabase](https://supabase.com).
    -   Run the SQL commands in `supabase_schema.sql` in the Supabase SQL Editor to create tables and policies.
    -   Copy `.env.local.example` to `.env.local` and fill in your Supabase URL and Anon Key.

3.  **Run Locally**:
    ```bash
    npm run dev
    ```

4.  **Nano Banana 2.0 & Audio**:
    -   The app is configured to display images and play audio from URLs provided in the database.
    -   To fully automate generation, you would need a backend script (e.g., a Supabase Edge Function) to:
        -   Fetch daily summaries.
        -   Generate images using Nano Banana 2.0 (or Google Gemini/Imagen).
        -   Generate audio using Google Cloud TTS or ElevenLabs.
        -   Insert the data into the `news` table.

## Tech Stack

-   **Framework**: Next.js 14 (App Router)
-   **Styling**: CSS Modules (Vanilla CSS)
-   **Database**: Supabase
-   **Animations**: Framer Motion, React PageFlip
-   **Icons**: Lucide React
