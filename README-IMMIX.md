# Immix API Starter Kit

This is a starter kit for building a chat application with a React/Next.js front end, a local Node.js (Llama.cpp) inference layer, and PocketBase for authentication and state storage.

## Getting Started

### Prerequisites

- Node.js >= 18
- npm or pnpm
- Docker (for PocketBase)

### 1. Set up PocketBase

1.  Create a `docker-compose.yml` file with the following content:

    ```yml
    version: '3.8'
    services:
      pocketbase:
        image: 'ghcr.io/muchobien/pocketbase:latest'
        ports:
          - '8090:8090'
        volumes:
          - './pb_data:/pb_data'
    ```

2.  Run `docker-compose up` to start the PocketBase server.

3.  Open your browser and navigate to `http://127.0.0.1:8090/_/`.

4.  Create an admin account.

5.  Run the initialization script to create the required collections:

    ```bash
    PB_URL=http://127.0.0.1:8090 \
    PB_ADMIN_EMAIL=<your-admin-email> \
    PB_ADMIN_PASSWORD=<your-admin-password> \
    node scripts/pocketbase/init.js
    ```

### 2. Set up the Application

1.  Install the dependencies:

    ```bash
    npm install
    ```

2.  Create a `.env.local` file by copying `.env.example`:

    ```bash
    cp .env.example .env.local
    ```

3.  Update `.env.local` with your PocketBase URL and other settings.

### 3. Download a Model

1.  Create a `models` directory:

    ```bash
    mkdir models
    ```

2.  Download a GGUF model and place it in the `models` directory. You can find models on Hugging Face. For example, to download the Llama 3.1 8B model:

    ```bash
    npx node-llama-cpp pull --dir ./models TheBloke/Llama-3.1-8B-Instruct-GGUF
    ```

3.  Update the `LLAMA_MODEL_PATH` in your `.env.local` file to point to the downloaded model file.

### 4. Run the Application

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## API

### Authentication

- `POST /api/auth/register`: Register a new user.
- `POST /api/auth/login`: Log in a user.

### Conversations

- `GET /api/conversations`: Get a list of conversations for the authenticated user.
- `POST /api/conversations`: Create a new conversation.

### Messages

- `GET /api/messages`: Get a list of messages for a conversation.
- `POST /api/messages`: Create a new message.

### Agent

- `POST /api/agent/chat`: Start a chat stream.

### Models

- `GET /api/models`: Get a list of available models.
- `POST /api/models/switch`: Switch the active model.

## License

MIT
