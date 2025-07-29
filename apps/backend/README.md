# JammWork Server

A well-structured real-time collaboration server built with Hono and Yjs, featuring clean architecture and proper separation of concerns.

## Architecture

```
src/
├── app.ts                    # Main Hono application setup
├── config/
│   └── server.ts            # Server configuration
├── index.ts                 # Entry point
├── middleware/
│   └── cors.ts              # CORS middleware
├── routes/
│   ├── home.ts              # Home and health routes
│   └── index.ts             # API router setup
├── server.ts                # Server class with graceful shutdown
├── services/
│   └── yjs/
│       ├── document-manager.ts    # Yjs document and space management
│       ├── index.ts               # Main Yjs service
│       └── websocket-handler.ts   # WebSocket connection handling
├── types/
│   └── y-websocket.d.ts     # TypeScript definitions
└── utils/
    └── logger.ts            # Structured logging utility
```

## Services

- **HTTP Server**: `http://localhost:3000` (Hono)
- **WebSocket Server**: `ws://localhost:1234` (Yjs)

## Running

```bash
# Development
pnpm dev

# Build
pnpm build

# Production
pnpm start
```

## Configuration

Environment variables:
- `HTTP_PORT` - HTTP server port (default: 3000)
- `WS_PORT` - WebSocket server port (default: 1234)
- `LOG_LEVEL` - Logging level: debug, info, warn, error (default: info)
- `CORS_ORIGINS` - Comma-separated allowed origins
- `YJS_MAX_SPACES` - Maximum number of concurrent spaces (default: 1000)

## API Endpoints

### HTTP Endpoints
- `GET /` - Server info
- `GET /health` - Detailed health status
- `GET /api/stats` - Real-time server statistics

### WebSocket Endpoints
- `ws://localhost:1234/{spaceName}?userId={userId}` - Connect to a Yjs space
- Default space: `default-canvas`

## Usage with Canvas

```tsx
<InfiniteCanvas 
  backendUrl="ws://localhost:1234"
  userId="user-123"
  spaceId="my-canvas-space"
/>
```

## Features

- ✅ **Modular Architecture**: Clean separation of concerns
- ✅ **Multi-space Support**: Isolated document spaces
- ✅ **Real-time Sync**: Document and awareness synchronization
- ✅ **Health Monitoring**: Connection health checks and stats
- ✅ **Graceful Shutdown**: Proper cleanup on server stop
- ✅ **Structured Logging**: Configurable log levels
- ✅ **CORS Support**: Configurable cross-origin settings
- ✅ **Auto Cleanup**: Automatic removal of empty spaces
- ✅ **User Awareness**: Real-time user presence and cursors