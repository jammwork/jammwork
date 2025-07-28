# Getting Started

This guide will walk you through creating your first Jammwork plugin from scratch.

## Prerequisites

- Node.js 18+ and pnpm
- Basic knowledge of React and TypeScript
- Familiarity with the Jammwork canvas system

## Project Setup

### 1. Clone the Repository

```bash
git clone https://github.com/jammwork/jammwork.git
cd jammwork
pnpm install
```

### 2. Development Environment

Start the development server:

```bash
cd apps/frontend
pnpm dev
```

The canvas will be available at `http://localhost:4200` with hot reloading enabled.

## Creating Your First Plugin

### 1. Plugin Directory Structure

Create a new plugin directory:

```bash
mkdir -p src/plugins/hello-world
cd src/plugins/hello-world
```

Create the following structure:

```
src/plugins/hello-world/
├── index.ts              # Main export
├── HelloWorldPlugin.tsx  # Plugin definition  
├── components/
│   └── HelloLayer.tsx    # Canvas layer component
├── tools/
│   └── helloTool.ts      # Tool definition
└── store.ts              # Plugin state
```

### 2. Plugin Store

First, create the plugin store:

```typescript
// src/plugins/hello-world/store.ts
import { create } from 'zustand';

interface HelloWorldState {
  messages: Array<{
    id: string;
    x: number;
    y: number;
    text: string;
  }>;
  isActive: boolean;
}

interface HelloWorldActions {
  addMessage: (x: number, y: number, text: string) => void;
  setActive: (active: boolean) => void;
  clearMessages: () => void;
}

type HelloWorldStore = HelloWorldState & HelloWorldActions;

export const useHelloWorldStore = create<HelloWorldStore>((set) => ({
  messages: [],
  isActive: false,

  addMessage: (x, y, text) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          id: `hello-${Date.now()}`,
          x,
          y,
          text,
        },
      ],
    })),

  setActive: (active) => set({ isActive: active }),

  clearMessages: () => set({ messages: [] }),
}));
```

### 3. Canvas Layer Component

Create a layer component that renders on the canvas:

```typescript
// src/plugins/hello-world/components/HelloLayer.tsx
import React from 'react';
import { useHelloWorldStore } from '../store';

export const HelloLayer: React.FC = React.memo(() => {
  const { messages, isActive } = useHelloWorldStore();

  if (!isActive) return null;

  return (
    <g className="hello-world-layer">
      {messages.map((message) => (
        <text
          key={message.id}
          x={message.x}
          y={message.y}
          fill="#ff6b6b"
          fontSize="16"
          fontFamily="Arial, sans-serif"
          textAnchor="middle"
          dominantBaseline="middle"
          style={{
            filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))',
            cursor: 'default',
          }}
        >
          {message.text}
        </text>
      ))}
    </g>
  );
});

HelloLayer.displayName = 'HelloLayer';
```

### 4. Tool Definition

Create a tool that adds messages to the canvas:

```typescript
// src/plugins/hello-world/tools/helloTool.ts
import { MessageCircle } from 'lucide-react';
import type { ToolDefinition, PluginAPI } from '@jammwork/api';
import { useHelloWorldStore } from '../store';

const HELLO_MESSAGES = [
  'Hello, World! 👋',
  'Welcome to Jammwork! 🎉',
  'Plugin development rocks! 🚀',
  'Keep creating! ✨',
  'You\'re awesome! 💖',
];

export const createHelloTool = (api: PluginAPI): ToolDefinition => ({
  id: 'hello-world',
  name: 'Hello World',
  icon: React.createElement(MessageCircle, { size: 16 }),
  cursor: 'pointer',

  onActivate: () => {
    const { setActive } = useHelloWorldStore.getState();
    setActive(true);
    console.log('Hello World tool activated! 🎯');
  },

  onDeactivate: () => {
    const { setActive } = useHelloWorldStore.getState();
    setActive(false);
    console.log('Hello World tool deactivated! 👋');
  },

  onMouseDown: (event, position) => {
    // Convert screen coordinates to canvas coordinates
    const canvasPosition = api.screenToCanvas(position);
    
    // Get a random hello message
    const randomMessage = HELLO_MESSAGES[
      Math.floor(Math.random() * HELLO_MESSAGES.length)
    ];
    
    // Add the message to our store
    const { addMessage } = useHelloWorldStore.getState();
    addMessage(canvasPosition.x, canvasPosition.y, randomMessage);
    
    console.log(`Added message at (${canvasPosition.x}, ${canvasPosition.y}): ${randomMessage}`);
  },

  onKeyDown: (event) => {
    if (event.key === 'c' && !event.ctrlKey && !event.metaKey) {
      // Clear all messages when 'c' is pressed
      const { clearMessages } = useHelloWorldStore.getState();
      clearMessages();
      console.log('Cleared all hello messages! 🧹');
      event.preventDefault();
    }
  },
});
```

### 5. Main Plugin Definition

Create the main plugin file:

```typescript
// src/plugins/hello-world/HelloWorldPlugin.tsx
import React from 'react';
import type { Plugin, PluginAPI } from '@jammwork/api';
import { createHelloTool } from './tools/helloTool';
import { HelloLayer } from './components/HelloLayer';

export const HelloWorldPlugin: Plugin = {
  id: 'hello-world-plugin',
  name: 'Hello World Plugin',
  version: '1.0.0',
  description: 'A simple plugin that adds hello messages to the canvas',
  author: 'Jammwork Team',

  activate: async (api: PluginAPI) => {
    console.log('🚀 Activating Hello World Plugin...');

    try {
      // Register our custom tool
      const helloTool = createHelloTool(api);
      const toolDisposable = api.registerTool(helloTool);

      // Register our canvas layer component
      const layerDisposable = api.registerLayerComponent(HelloLayer);

      // Listen to canvas events for debugging
      const eventDisposable = api.on('element:created', (data) => {
        console.log('🎨 Element created:', data.element);
      });

      console.log('✅ Hello World Plugin activated successfully!');
      console.log('💡 Click on the canvas to add hello messages!');
      console.log('💡 Press "c" to clear all messages!');

      // Store disposables for cleanup (in a real plugin, you'd want to track these)
      (globalThis as any).__helloWorldDisposables = [
        toolDisposable,
        layerDisposable,
        eventDisposable,
      ];

    } catch (error) {
      console.error('❌ Failed to activate Hello World Plugin:', error);
      throw error;
    }
  },

  deactivate: async () => {
    console.log('👋 Deactivating Hello World Plugin...');
    
    try {
      // Cleanup disposables
      const disposables = (globalThis as any).__helloWorldDisposables;
      if (disposables) {
        disposables.forEach((disposable: any) => disposable?.dispose?.());
        delete (globalThis as any).__helloWorldDisposables;
      }

      // Clear plugin state
      const { clearMessages, setActive } = useHelloWorldStore.getState();
      clearMessages();
      setActive(false);

      console.log('✅ Hello World Plugin deactivated successfully!');
    } catch (error) {
      console.error('❌ Failed to deactivate Hello World Plugin:', error);
    }
  },
};
```

### 6. Plugin Export

Create the index file:

```typescript
// src/plugins/hello-world/index.ts
export { HelloWorldPlugin } from './HelloWorldPlugin';
export { HelloLayer } from './components/HelloLayer';
export { useHelloWorldStore } from './store';
export { createHelloTool } from './tools/helloTool';
```

## Testing Your Plugin

### 1. Register the Plugin

Add your plugin to the canvas component:

```typescript
// In your canvas usage
import { HelloWorldPlugin } from './plugins/hello-world';

<InfiniteCanvas 
  plugins={[HelloWorldPlugin]}
  // ... other props
/>
```

### 2. Try It Out

1. **Start the development server** - The plugin will be automatically loaded
2. **Look for the tool** - You should see a "Hello World" tool with a MessageCircle icon in the toolbar
3. **Activate the tool** - Click on the Hello World tool button
4. **Click on the canvas** - Random hello messages should appear where you click
5. **Clear messages** - Press the 'c' key to clear all messages

### 3. Development Tips

- **Hot Reloading** - Changes to your plugin files will trigger automatic reloads
- **Console Logging** - Check the browser console for plugin activation messages and debugging info
- **State Inspection** - Use React DevTools to inspect the Zustand store state

## Understanding the Code

### Plugin API Integration

Your plugin integrates with the canvas through the `PluginAPI`:

- **`api.registerTool()`** - Adds tools to the toolbar
- **`api.registerLayerComponent()`** - Adds components that render on the canvas
- **`api.screenToCanvas()`** - Converts mouse coordinates to canvas coordinates
- **`api.on()`** - Listens to canvas events

### Event Handling

Tools can handle mouse and keyboard events:

- **`onMouseDown`** - Handle click events
- **`onMouseMove`** - Handle mouse movement (useful for drawing)
- **`onMouseUp`** - Handle mouse release
- **`onKeyDown`** - Handle keyboard shortcuts

### State Management

Use Zustand for plugin-specific state:

- Keep plugin state separate from canvas state
- Use TypeScript interfaces for type safety
- Follow the store pattern for actions and state

## Next Steps

Now that you have a working plugin, explore more advanced features:

- **[Plugin Architecture](./architecture)** - Understand the plugin system design
- **[API Reference](./api-reference)** - Complete API documentation
- **[Real-time Collaboration](./collaboration)** - Add collaborative features
- **[Examples](./examples/shapes-plugin)** - Learn from more complex examples

## Common Issues

### Plugin Not Loading

- Check that the plugin is properly exported from `index.ts`
- Verify the plugin is added to the `plugins` array
- Look for console errors during activation

### Tool Not Appearing

- Ensure `api.registerTool()` is called during activation
- Check that the tool has required properties (`id`, `name`, `icon`)
- Verify there are no JavaScript errors

### Events Not Working

- Make sure event handlers are properly defined in the tool
- Check that coordinates are converted using `api.screenToCanvas()`
- Verify the tool is active when testing events

Ready to build something amazing? Check out our [examples](./examples/basic-plugin) for more inspiration!