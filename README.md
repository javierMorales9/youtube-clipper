# YouTube Clipper — Submagic-style clip maker

## Overview

YouTube Clipper is a **Submagic clone** built as a side project to learn how short-form video tools are engineered: ingesting long-form YouTube videos, defining vertical clip edits, and producing ready-to-publish outputs (e.g., Shorts/TikTok). The core challenge is not “cutting a video”, but orchestrating a pipeline that deals with large media files, asynchronous processing, deterministic rendering, and a UI that can preview and serialize edits.

The project is also a **learning playground for embeddings and AI workflows**. The pipeline is designed to support transcription + embeddings and use them as building blocks for features like semantic search, segment suggestion/ranking, and other AI-assisted editing flows. The stack intentionally resembles a realistic system: a Next.js app (UI + API), PostgreSQL for persistent state, object storage for large assets, and a separate processor service for long-running video work.

## How it works

This section walks through the end-to-end flow using the UI screens in `docs/`:

- `docs/sources.png`
- `docs/suggestions.png`
- `docs/create_clip.png`
- `docs/final_clip.png`

### 1) Sources (ingest a long video)

![Sources](docs/sources.png)

**What happens in the UI**
- A YouTube URL is pasted into **Add Source**.
- A new Source appears in the grid and transitions through a processing state until it becomes ready.

**What happens in the system**
- The **application** persists a `Source` record in PostgreSQL and emits work for the processor to pick up.
- The **processor** downloads the original media using **yt-dlp** and produces normalized artifacts using **FFmpeg**.
- Artifacts are written to `FILES_PATH` (local dev) and/or uploaded to **S3** (optional), where they can be served via **CloudFront** if configured.

### 2) Suggestions (AI-assisted discovery)

![Suggestions](docs/suggestions.png)

**What happens in the UI**
- The **Suggestions** tab shows candidate segments with a short title/summary and a **time range**.
- A player + timeline allow quick preview of the surrounding context before creating a clip.

**What happens in the system**
- The processor calls **OpenAI** to generate a **transcript** for the source video.
- The transcript is chunked and the processor calls **OpenAI** again to generate **embeddings** per chunk.
- Embeddings are used to build suggestion candidates (semantic retrieval + ranking), producing time ranges and summaries that the UI can display.

> `OPENAI_API_KEY` is required because transcription and embeddings are mandatory for this flow.

### 3) Create clip (define a vertical edit)

![Create clip](docs/create_clip.png)

**What happens in the UI**
- A clip can be created from a suggestion (recommended) or manually.
- A layout preset is selected (e.g., **One**, **Column**, **Row**).
- Crop boxes are adjusted to frame the relevant subject(s).
- Styling options (display/theme) and subtitle/translation options can be configured.

**What happens in the system**
- The application stores a `Clip` definition (time range + layout + crop geometry + subtitle/theme options).
- Rendering is queued; the processor produces a deterministic output from the stored “render spec”.

### 4) Final clip (render + download)

![Final clip](docs/final_clip.png)

**What happens in the UI**
- A vertical clip is produced, previewable in the app and ready to download/publish.

**What happens in the system**
- FFmpeg renders the final output:
  - vertical composition (crop/scale + layout composition)
  - subtitle burn-in via **libass** (ASS subtitles)
  - encoding via **x264**
- The output is stored (local `FILES_PATH` and/or S3) and surfaced back to the UI.

## Repo layout

```
.
├─ application/        # Next.js app (UI + API)
├─ processor/          # Python processor (jobs: download/transcribe/render)
├─ docker-compose.yml  # Local/prod-ish orchestration
├─ cloudformation/     # AWS infra templates (optional)
├─ docs/               # Diagrams, notes, screenshots
└─ README.md
```

## Architecture

![Architecture](docs/architecture.png)

At a high level:

- **application/** (Next.js) exposes the UI and server endpoints (tRPC) to create sources/clips and track processing state.
- **PostgreSQL** acts as the source of truth for entities + processing status.
- **processor/** runs long tasks (YouTube download, analysis/transcription, rendering) outside the web request lifecycle.
- **S3 + optional CloudFront** store and serve large assets (sources, renders, previews), typically via presigned URLs.

## Tech stack

### application/
- Next.js + React
- tRPC + TanStack Query
- PostgreSQL + Drizzle ORM (drizzle-kit)
- AWS SDK (S3 + optional Batch/SNS hooks depending on deployment)
- UI/Editor tooling: video.js, Konva/react-konva, canvas
- Uploads: tus-js-client (resumable uploads)
- Validation: Zod + @t3-oss/env-nextjs
- Tests: Jest

### processor/
- Python (Poetry-managed)
- Flask (HTTP server used by the processor runtime)
- yt-dlp for YouTube downloading
- FFmpeg compiled with:
  - **libx264** (H.264)
  - **libass** (ASS subtitles)
  - **libmp3lame** (audio)
  - HLS support required by some sources

## How to use

### Development (recommended workflow)

#### 1) Start Postgres
Use your local Postgres or docker-compose (see below). The app expects:

- `DATABASE_URL=postgres://.../youtube_clipper`

#### 2) Run the web app (application/)
From `application/`:

```bash
npm install
npm run db:push
npm run dev
```

#### 3) Run the processor (processor/)
From `processor/`:

```bash
poetry install
ENV=dev poetry run python3 src/main.py
```

> The processor needs **yt-dlp** and **ffmpeg** available in its runtime environment. If you are running it outside Docker, make sure they are installed and on PATH. FFmpeg must be compiled with **libx264** and **libass**. Check `processor/Dockerfile` for a working build recipe.

### Production / “prod-like” (Docker Compose)

The repo includes a top-level `docker-compose.yml`. The intended flow is:

```bash
docker compose up -d --build
docker compose logs -f
```

Typical services:
- Postgres
- application (Next.js)
- processor (Python)

> If your compose file uses S3/CloudFront, either point it to real AWS resources or swap in a local alternative. The app is designed around object storage semantics.

## Environment variables

**Do not commit real secrets.** Use `.env` files locally and your platform secret manager in production.  
Recommended approach: create `application/.env` and `processor/.env` based on the templates below.

### application/.env (example)

AWS is optional in development if you run in “local files” mode. If S3 is enabled, the app will use it for storing/serving assets.

```env
DATABASE_URL="postgres://postgres:1234@localhost:5432/youtube_clipper"
NODE_ENV="development"
SECRET="change-me"

# Feature toggles
HLS=true

# AWS (only if S3 integration is enabled)
AWS_REGION="eu-west-1"
SOURCE_BUCKET="your-bucket-name"
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
CLOUDFRONT_URL="https://your-distribution.cloudfront.net"

# Optional: used for some YouTube-related flows (if enabled in your build)
GOOGLE_API_KEY="..."
```

### processor/.env (example)

`OPENAI_API_KEY` is **required**. It is used to:
- **transcribe** source videos
- generate **embeddings** that power semantic workflows (e.g., search/suggestions/ranking)

`FILES_PATH` should point to the same folder that the web app serves (by default `application/public/files`), so both services see the same artifacts when working locally.

```env
DATABASE_URL="postgresql://postgres:1234@localhost:5432/youtube_clipper"
HOST_NAME="127.0.0.1"
PORT="8080"

# Shared artifacts folder (sources, intermediate files, renders)
FILES_PATH="../application/public/files"

# AWS (required if the processor uploads/reads assets from S3 in your setup)
AWS_REGION="eu-west-1"
SOURCE_BUCKET="your-bucket-name"
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
CLOUDFRONT_URL="https://your-distribution.cloudfront.net"

# Required: transcription + embeddings
OPENAI_API_KEY="..."
```

## Processor image notes (FFmpeg from source)

The processor Dockerfile compiles FFmpeg from source to ensure required codecs/libs are enabled:

- Builds **x264**
- Builds **FFmpeg** with: `--enable-shared --enable-gpl --enable-libx264 --enable-libmp3lame --enable-libass`

If you see errors like:
- `ffmpeg is not installed`
- HLS fragment 403s when downloading

…it usually means the runtime does not see FFmpeg or `yt-dlp` is outdated. In Docker, this is typically solved by ensuring the compiled FFmpeg is installed and reachable (and keeping `yt-dlp` up to date inside the Poetry env).

## Quick troubleshooting

### yt-dlp downloads fail with HLS fragment 403
Common causes:
- `yt-dlp` version too old for current YouTube player changes
- FFmpeg not available → `yt-dlp` falls back to `hlsnative` and becomes fragile

Things to try:
- Update `yt-dlp` inside the Poetry environment:
  ```bash
  poetry run python -m pip install -U yt-dlp
  ```
- Prefer ffmpeg for HLS:
  - add `--hls-prefer-ffmpeg` and/or `--ffmpeg-location /path/to/ffmpeg` to the download command
