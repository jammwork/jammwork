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
│   ├── spaces.ts            # Space management routes
│   └── index.ts             # API router setup
├── server.ts                # Server class with graceful shutdown
├── services/
│   ├── database/
│   │   └── index.ts         # LowDB database service
│   ├── space/
│   │   └── index.ts         # Space business logic service
│   └── yjs/
│       ├── document-manager.ts    # Yjs document and space management
│       ├── index.ts               # Main Yjs service
│       └── websocket-handler.ts   # WebSocket connection handling
├── types/
│   ├── space.ts             # Space-related type definitions
│   └── y-websocket.d.ts     # TypeScript definitions
└── utils/
    └── logger.ts            # Structured logging utility
```

## Services

- **HTTP Server**: `http://localhost:3000` (Hono)
- **WebSocket Server**: `ws://localhost:1234` (Yjs)
- **Database**: `./data/db.json` (LowDB)

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

#### Health & Info
- `GET /` - Server info
- `GET /health` - Detailed health status
- `GET /api/stats` - Real-time server statistics

#### Space Management API

Base URL: `http://localhost:3000/api/spaces`

##### Create Space
**POST** `/api/spaces`

Creates a new collaboration space with specified plugins.

**Request Body:**
```json
{
  "name": "My Collaboration Space",
  "description": "A space for team collaboration",
  "pluginIds": ["drawing", "shapes", "screenshare"],
  "createdBy": "user123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "space_1703123456789_abc123def",
    "name": "My Collaboration Space",
    "description": "A space for team collaboration",
    "pluginIds": ["drawing", "shapes", "screenshare"],
    "createdAt": "2023-12-21T10:30:56.789Z",
    "updatedAt": "2023-12-21T10:30:56.789Z",
    "createdBy": "user123",
    "isActive": true
  }
}
```

##### Get All Spaces
**GET** `/api/spaces`

Retrieves all spaces with optional filtering.

**Query Parameters:**
- `active` (optional): Filter by active status (`true`/`false`)
- `pluginId` (optional): Filter spaces by plugin ID

**Examples:**
```
GET /api/spaces                    # Get all spaces
GET /api/spaces?active=true        # Get only active spaces
GET /api/spaces?pluginId=drawing   # Get spaces with drawing plugin
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "space_1703123456789_abc123def",
      "name": "My Collaboration Space",
      "description": "A space for team collaboration",
      "pluginIds": ["drawing", "shapes"],
      "createdAt": "2023-12-21T10:30:56.789Z",
      "updatedAt": "2023-12-21T10:30:56.789Z",
      "createdBy": "user123",
      "isActive": true
    }
  ]
}
```

##### Get Space by ID
**GET** `/api/spaces/:id`

Retrieves a specific space by its ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "space_1703123456789_abc123def",
    "name": "My Collaboration Space",
    "description": "A space for team collaboration",
    "pluginIds": ["drawing", "shapes"],
    "createdAt": "2023-12-21T10:30:56.789Z",
    "updatedAt": "2023-12-21T10:30:56.789Z",
    "createdBy": "user123",
    "isActive": true
  }
}
```

##### Update Space
**PUT** `/api/spaces/:id`

Updates an existing space.

**Request Body:**
```json
{
  "name": "Updated Space Name",
  "description": "Updated description",
  "pluginIds": ["drawing", "screenshare"],
  "isActive": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "space_1703123456789_abc123def",
    "name": "Updated Space Name",
    "description": "Updated description",
    "pluginIds": ["drawing", "screenshare"],
    "createdAt": "2023-12-21T10:30:56.789Z",
    "updatedAt": "2023-12-21T11:45:12.345Z",
    "createdBy": "user123",
    "isActive": false
  }
}
```

##### Delete Space
**DELETE** `/api/spaces/:id`

Deletes a space.

**Response:**
```json
{
  "success": true,
  "message": "Space deleted successfully"
}
```

### WebSocket Endpoints
- `ws://localhost:1234/{spaceName}?userId={userId}` - Connect to a Yjs space
- Default space: `default-canvas`

## Error Responses

All API endpoints return error responses in the following format:

```json
{
  "success": false,
  "error": "Error message description"
}
```

**Common HTTP Status Codes:**
- `400` - Bad Request (validation errors)
- `404` - Not Found (space not found)
- `500` - Internal Server Error

## Data Validation

### Space Creation/Update Rules
- **Name**: Required, max 100 characters
- **Description**: Optional, max 500 characters
- **Plugin IDs**: Required, must be a non-empty array
- **Created By**: Required, non-empty string

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
- ✅ **Space Management**: Full CRUD operations for spaces
- ✅ **Plugin System**: Support for multiple plugins per space
- ✅ **Health Monitoring**: Connection health checks and stats
- ✅ **Graceful Shutdown**: Proper cleanup on server stop
- ✅ **Structured Logging**: Configurable log levels
- ✅ **CORS Support**: Configurable cross-origin settings
- ✅ **Auto Cleanup**: Automatic removal of empty spaces
- ✅ **User Awareness**: Real-time user presence and cursors
- ✅ **Data Persistence**: LowDB-based space storage