# Jammwork - Claude Development Instructions

## Project Overview
Jammwork is an infinite canvas collaborative web application built with React, TypeScript, and a powerful plugin system. It provides real-time collaboration capabilities using Yjs synchronization and WebSocket connections.

## Architecture
The project is structured as an Nx monorepo:

- **`apps/backend`** - Backend server for real-time collaboration (Express + Yjs + WebSocket)
- **`apps/frontend`** - Frontend web application (Vite + React)
- **`packages/canvas`** - Core infinite canvas library with plugin system
- **`packages/ui`** - Shared UI components (shadcn/ui)
- **`packages/api`** - Plugin API types and interfaces
- **`packages/plugin-screenshare`** - Example screen sharing plugin

## Development Commands

### Setup
```bash
pnpm install
```

### Development
```bash
# Start frontend dev server (http://localhost:5173)
pnpm dev:frontend

# Start backend server (http://localhost:3001)  
pnpm dev:backend

# Start both frontend and backend
pnpm dev
```

### Testing
```bash
# Run all tests
pnpm test

# Run specific package tests
nx test @jammwork/canvas
nx test @jammwork/ui
```

### Building
```bash
# Build all packages
pnpm build

# Build specific package
nx build @jammwork/canvas
```

## Core Features

1. **Infinite Canvas**: SVG-based canvas with smooth zoom/pan capabilities
2. **Plugin Architecture**: Extensible system for adding custom tools and functionality
3. **Real-time Collaboration**: Multi-user editing with Yjs synchronization
4. **Selection System**: Element selection, movement, and resizing with visual feedback
5. **Built-in Tools**: Drawing, shapes, and selection tools
6. **Secondary Toolbars**: Grouped tools that reveal additional options

## Plugin Development

The plugin system is the core extensibility mechanism. Plugins can:

- Register custom tools with mouse/keyboard event handlers
- Add canvas layer components for rendering
- Create element types with custom renderers
- Access real-time collaboration APIs (Yjs documents, user awareness)
- Control tool highlighting and secondary toolbars

### Plugin Structure
```
packages/plugins/your-plugin-name/src/
   index.ts              # Main plugin export
   YourPlugin.tsx        # Plugin definition
   tools/               # Tool definitions
   renderers/           # Element renderers
   layers/              # Layer components
   stores/              # State management
   components/          # UI components
```

### Key Plugin APIs
- `api.registerTool(tool, options)` - Register tools with optional secondary toolbar
- `api.registerMenuItem(item)` - Add menu items to top-right area of canvas
- `api.setToolHighlight(toolId, highlighted)` - Control tool highlighting
- `api.createElement/updateElement/deleteElement` - Element management (auto-syncs in real-time)
- `api.getYjsDocumentManager()` - Access collaboration documents
- `api.getAwareness()` - Access user presence system
- `api.screenToCanvas/canvasToScreen` - Coordinate conversion

## Development Guidelines

### Code Style
- Use TypeScript with strict typing
- Follow existing code conventions and patterns
- Use Zustand for state management
- Prefer React.memo for performance-critical components
- Always use the Plugin API instead of direct store access

### Real-time Collaboration
- Always use `api.createElement()`, `api.updateElement()`, `api.deleteElement()` for element operations
- Element changes automatically sync to all connected users
- Use Yjs documents for plugin-specific synchronized data
- Handle graceful degradation when collaboration is unavailable

### Performance
- Use React.memo for layer components
- Memoize expensive calculations
- Clean up event listeners in plugin deactivate()
- Implement virtualization for large element sets

### Testing
- Add tests for new functionality
- Test plugin integration with the core system
- Verify real-time collaboration features work correctly

## File Locations

### Core Canvas
- Main canvas component: `packages/canvas/src/InfiniteCanvas.tsx`
- Plugin system: `packages/canvas/src/plugin/`
- Built-in tools: `packages/canvas/src/tools/`

### UI Components
- Shared components: `packages/ui/src/components/`

### Example Plugins
- Drawing plugin: `packages/canvas/src/plugins/drawing/`
- Shapes plugin: `packages/canvas/src/plugins/shapes/`
- Screen share plugin: `packages/plugin-screenshare/`

### Backend
- Yjs WebSocket server: `apps/backend/src/services/yjs/`
- Document management: `apps/backend/src/services/yjs/document-manager.ts`

## Common Tasks

### Adding a New Plugin
1. Create plugin directory structure in `packages/plugins/your-plugin-name/src/`
2. Implement Plugin interface with activate/deactivate
3. Register tools, layers, menu items, and event listeners
4. Add to built-in plugins or pass as external plugin
5. Test integration and real-time features

### Adding Menu Items
Plugins can add custom components to the top-right area of the canvas:

```typescript
// Register a menu item
api.registerMenuItem({
  id: "my-plugin-menu",
  component: MyMenuComponent,
  position: "top-right",
  order: 10 // Lower values appear first (optional, defaults to 100)
});

// Example menu component
const MyMenuComponent: React.FC = () => (
  <button className="bg-white rounded-lg p-2 shadow-sm">
    My Button
  </button>
);
```

Menu items are automatically sorted by their `order` property and rendered alongside built-in elements like the theme toggle and member list.

### Debugging Plugin Issues
- Check `api.getRegisteredTools()` for tool registration
- Monitor plugin events with `api.on('plugin:activated', ...)`
- Verify element operations with canvas state events
- Use browser dev tools for WebSocket connection issues

### Performance Optimization
- Profile render performance with React DevTools
- Check for unnecessary re-renders in layer components
- Monitor memory usage with many elements
- Use Chrome DevTools for WebSocket traffic analysis

For comprehensive plugin development documentation, see [PLUGIN_DEVELOPMENT.md](./PLUGIN_DEVELOPMENT.md).