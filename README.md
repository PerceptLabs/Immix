<div align="center">
  <h1>Immix API Starter Kit</h1>
  <p><strong>A modern, secure chat interface for a local Llama.cpp inference layer with PocketBase as auth/state storage.</strong></p>
</div>


## Table of Contents

- [🏠 Run Locally](#-run-locally)
- [Features](#features)
- [Security](#security)
- [Configuration Options](#configuration-options)
- [Building and Deployment](#building-and-deployment)
- [Troubleshooting](#troubleshooting)

## Features

- 🚀 **Multiple Deployment Modes**: Iframe embed, direct widget, floating button, or standalone
- 🔒 **Secure API Proxy**: Server-side API key management
- 💬 **Conversation Management**: Multi-conversation support with persistence
- 🎨 **Customizable UI**: Themes, colors, positioning, and branding options
- 🔄 **Real-time Streaming**: Live message streaming with typing indicators
- 📎 **Rich Media Support**: File uploads, citations, and markdown rendering
- 📱 **Responsive Design**: Works on desktop, tablet, and mobile
- ⚡ **Optimized Performance**: Lazy loading and efficient bundling
- 🏢 **Multi-Agent Support**: Switch between different Immix agents
- 🎭 **Demo Mode**: Try the app without server setup using your own API keys
- 🎤 **Voice Features**: Speech-to-text and voice chat capabilities (requires OpenAI API key)
- 📱 **PWA Ready**: Progressive Web App functionality built-in but disabled by default (see PWA section below)

## Security

This project implements several security best practices:

- **Server-Side API Keys**: API keys are stored only in server environment variables
- **Proxy API Routes**: All API calls go through Next.js API routes that add authentication
- **No Client Exposure**: API keys are never sent to or stored in the browser
- **Environment Variables**: Sensitive configuration is kept in `.env.local`

## 🏠 Run Locally

Want to customize or develop? Run the project locally:

### Prerequisites

- Node.js 18.x or higher
- npm or pnpm

### Setup Steps

1. **Clone the repository:**

```bash
git clone https://github.com/immix-ai/immix-starter-kit.git
cd immix-starter-kit
```

2. **Install dependencies:**

```bash
npm install
# or
pnpm install
```

3. **Create environment file:**

```bash
cp .env.example .env.local
```

4. **Add your API keys to `.env.local`:**

```env
# Required for PocketBase
PB_URL=http://127.0.0.1:8090

# Required for Llama.cpp
LLAMA_MODEL_PATH=./models/llama3.1-8b.q4_k_m.gguf
LLAMA_CTX=4096
LLAMA_THREADS=auto
LLAMA_GPU_LAYERS=0

# Optional - For voice features (speech-to-text, voice chat)
OPENAI_API_KEY=your-openai-api-key-here
```

5. **Start development server:**

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Demo Mode

If you don't want to add API keys to environment files, you can use **Demo Mode**:

1. Start the app without API keys in `.env.local`
2. On first visit, select "Demo Mode"
3. Enter your API keys in the UI
4. Keys are stored securely in browser localStorage

**Demo Mode Features:**
- ✅ Full chat functionality with your Immix agents
- ✅ Multi-conversation support
- ✅ File uploads and citations
- ✅ Voice chat (with OpenAI key)
- ⚠️ API keys stored in browser (not recommended for production)

## 🧩 Widget Integration

Add Immix chat to **any website** with these options:

### Option 1: 🏢 Self-Hosted (For Custom Modifications)

When you need to modify the widget source:

```bash
# Build the widget locally
npm run build:widget

# Host the dist/widget/ files on your server
# Then use your own URL:
```

```html
<script src="https://your-domain.com/dist/widget/immix-widget.js"></script>
<script>
  ImmixWidget.init({
    agentId: 123,
    containerId: 'chat-widget'
  });
</script>
```

### Option 2: 🔒 Iframe Embed (Maximum Security)

For enterprise security requirements:

```html
<script src="https://your-domain.com/iframe-embed.js"></script>
<script>
  const widget = ImmixEmbed.init({
    agentId: 123,
    mode: 'floating',
    iframeSrc: 'https://your-domain.com/widget/',
    position: 'bottom-right'
  });
</script>
```


## Progressive Web App (PWA)

This application includes full PWA functionality but it is **disabled by default** to provide a cleaner user experience. The PWA features include:

- **Install prompts**: "Add to Home Screen" functionality
- **Offline support**: Service worker caching for offline usage
- **App-like experience**: Fullscreen mode, custom icons, splash screens
- **Update notifications**: Automatic update detection and prompts

### Enabling PWA Features

To enable the PWA install prompt and functionality:

1. Open `src/app/layout.tsx`
2. Uncomment the PWAManager import:
   ```tsx
   import { PWAManager } from '@/components/pwa/PWAManager';
   ```
3. Uncomment the PWAManager component:
   ```tsx
   <PWAManager />
   ```

The PWA will then show an install prompt to users and provide the full Progressive Web App experience.

### PWA Configuration

The PWA settings are configured in:
- `public/manifest.json` - App metadata, icons, theme colors
- `public/sw.js` - Service worker for offline caching
- `src/components/pwa/PWAManager.tsx` - Install prompt UI and update handling

## Building and Deployment

### Build for Production

```bash
# Build everything
npm run build:all

# Build individual components
npm run build:widget    # Widget bundle only
npm run build:iframe    # Iframe app only
npm run build          # Next.js standalone app
```



## Development

### Project Structure

```
immix-starter-kit/
├── app/                  # Next.js app directory
│   └── api/             
│       └── proxy/       # Secure API proxy routes
├── src/
│   ├── components/      # React components
│   ├── store/          # State management (Zustand)
│   ├── lib/            # Utilities and API client
│   └── widget/         # Widget-specific code
├── public/             # Static assets
├── dist/              # Build outputs
└── examples/          # Integration examples
```

### Development Commands

```bash
# Start development server
npm run dev

# Run widget dev server
npm run dev:widget

# Type checking
npm run type-check

# Linting
npm run lint

# Run all builds
npm run build:all
```

## Troubleshooting

### Widget Not Loading

1. Check browser console for errors
2. Verify agent ID is correct
3. Ensure your domain is allowed (CORS)
4. Check that API proxy is working

### API Errors

1. Verify API key in `.env.local`
2. Check API proxy routes are deployed
3. Look for errors in server logs
4. Ensure API key has correct permissions

### Voice Features Issues

1. **Speech-to-text not working**: 
   - Check microphone permissions
   - Ensure OpenAI API key is configured
   - Verify browser supports Web Speech API

### Styling Issues

1. Check for CSS conflicts
2. Use iframe mode for better isolation
3. Increase z-index if needed
4. Check responsive breakpoints

## Support

- Issues: [GitHub Issues](https://github.com/immix-ai/immix-starter-kit/issues)

## License

MIT License - see LICENSE file for details.