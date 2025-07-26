# Plugin Development Guide

This guide explains how to create custom plugins for the Infinite Canvas system.

## Overview

The plugin system allows you to extend the canvas with custom tools, UI components, and functionality without modifying the core canvas code. Plugins are self-contained modules that can register tools, add layer components, and interact with the canvas through a well-defined API.

## Plugin Architecture

### Core Concepts

- **Plugin**: A module that extends canvas functionality
- **PluginAPI**: Interface for interacting with the canvas system
- **ToolDefinition**: Configuration for custom drawing/interaction tools
- **LayerComponent**: React components that render on the canvas
- **EventBus**: Communication system for plugin events

## Creating a Basic Plugin

### 1. Plugin Structure

Create a new directory in `src/plugins/your-plugin-name/`:

```
src/plugins/your-plugin-name/
├── index.ts              # Main plugin export
├── YourPlugin.tsx        # Plugin definition
├── tools/               # Tool definitions (for complex plugins)
│   ├── tool1.ts         # Individual tool logic
│   └── tool2.ts         # Individual tool logic
├── renderers/           # Element renderers (for shape plugins)
│   ├── Renderer1.tsx    # SVG renderer components
│   └── Renderer2.tsx    # SVG renderer components
├── layers/              # Layer components
│   └── YourLayer.tsx    # Canvas layer component factory
├── stores/              # State management
│   └── store.ts         # Plugin-specific state
├── components/          # UI components
│   ├── YourPreview.tsx  # Preview components
│   └── YourLayer.tsx    # Canvas layer component
├── types.ts             # Plugin types (optional)
└── constants.ts         # Plugin constants (optional)
```

### 2. Basic Plugin Implementation

```typescript
// src/plugins/your-plugin-name/YourPlugin.tsx
import React from "react";
import type { Plugin, ToolDefinition, PluginAPI } from "../../plugin";
import { YourLayer } from "./components/YourLayer";

const createYourTool = (api: PluginAPI): ToolDefinition => ({
  id: "your-tool",
  name: "Your Tool",
  icon: <YourIcon size={16} />,
  cursor: "crosshair",

  onActivate: () => {
    console.log("Your tool activated");
  },

  onDeactivate: () => {
    console.log("Your tool deactivated");
  },

  onMouseDown: (event, position) => {
    // Handle mouse down events
    const canvasPosition = api.screenToCanvas(position);
    // Your tool logic here
  },

  onMouseMove: (event, position) => {
    // Handle mouse move events
    const canvasPosition = api.screenToCanvas(position);
    // Your tool logic here
  },

  onMouseUp: (event, position) => {
    // Handle mouse up events
    // Your tool logic here
  },

  onKeyDown: (event) => {
    // Handle keyboard shortcuts
    if (event.key === "Escape") {
      // Cancel current operation
    }
  },
});

export const YourPlugin: Plugin = {
  id: "your-plugin",
  name: "Your Plugin",
  version: "1.0.0",
  description: "Description of what your plugin does",
  author: "Your Name",

  activate: (api) => {
    // Register your tool
    const yourTool = createYourTool(api);
    api.registerTool(yourTool);

    // Register canvas layer component
    api.registerLayerComponent(YourLayer);

    // Listen to canvas events
    api.on("element:created", (data) => {
      console.log("Element created:", data.element);
    });

    console.log("Your plugin activated");
  },

  deactivate: () => {
    // Cleanup when plugin is deactivated
    console.log("Your plugin deactivated");
  },
};
```

### 3. Plugin State Management

Create a Zustand store for your plugin state:

```typescript
// src/plugins/your-plugin-name/store.ts
import { create } from "zustand";

interface YourPluginState {
  isActive: boolean;
  data: any[];
  // Your state properties
}

interface YourPluginActions {
  setActive: (active: boolean) => void;
  addData: (item: any) => void;
  // Your action methods
}

type YourPluginStore = YourPluginState & YourPluginActions;

export const useYourPluginStore = create<YourPluginStore>((set, get) => ({
  isActive: false,
  data: [],

  setActive: (active) => set({ isActive: active }),
  
  addData: (item) => set((state) => ({ 
    data: [...state.data, item] 
  })),
}));
```

### 4. Canvas Layer Component

Create a React component that renders on the canvas:

```typescript
// src/plugins/your-plugin-name/components/YourLayer.tsx
import React from "react";
import { useYourPluginStore } from "../store";

export const YourLayer: React.FC = React.memo(() => {
  const { isActive, data } = useYourPluginStore();

  if (!isActive) return null;

  return (
    <g>
      {data.map((item, index) => (
        <circle
          key={index}
          cx={item.x}
          cy={item.y}
          r={5}
          fill="blue"
        />
      ))}
    </g>
  );
});
```

### 5. Plugin Export

```typescript
// src/plugins/your-plugin-name/index.ts
export { YourPlugin } from "./YourPlugin";
export { YourLayer } from "./components/YourLayer";
export { useYourPluginStore } from "./store";
```

## Secondary Toolbars

Secondary toolbars allow you to create tools that reveal additional tools when selected. This is useful for grouping related tools together, like shape tools.

### Creating Tools with Secondary Toolbars

The new API provides a clean way to register tools with secondary toolbars using the `registerTool` method with an options parameter:

```typescript
// Create individual tools
const rectangleTool: ToolDefinition = {
  id: "rectangle",
  name: "Rectangle",
  icon: <Square size={16} />,
  cursor: "crosshair",
  // ... tool implementation
};

const circleTool: ToolDefinition = {
  id: "circle", 
  name: "Circle",
  icon: <Circle size={16} />,
  cursor: "crosshair",
  // ... tool implementation
};

const triangleTool: ToolDefinition = {
  id: "triangle",
  name: "Triangle",
  icon: <Triangle size={16} />,
  cursor: "crosshair",
  // ... tool implementation
};

// Register the main tool with secondary tools using the new API
api.registerTool(
  {
    id: "shapes",
    name: "Shapes",
    icon: <Square size={16} />,
    cursor: "crosshair",
    // Default to first tool's behavior when shapes is selected
    onActivate: rectangleTool.onActivate,
    onDeactivate: rectangleTool.onDeactivate,
    onMouseDown: rectangleTool.onMouseDown,
    onMouseMove: rectangleTool.onMouseMove,
    onMouseUp: rectangleTool.onMouseUp,
    onKeyDown: rectangleTool.onKeyDown,
  },
  {
    secondary: [rectangleTool, circleTool, triangleTool],
  },
);
```

### Secondary Toolbar Behavior

- When the main tool is selected, a secondary toolbar appears above the main toolbar
- Users can select individual tools from the secondary toolbar
- The secondary toolbar remains visible when any secondary tool is active
- The main tool stays highlighted when secondary tools are selected, maintaining visual hierarchy
- Each secondary tool maintains its own behavior and state
- All tools (main and secondary) are automatically registered and managed by the API

## Plugin API Reference

### Core Methods

#### Tool Registration
```typescript
api.registerTool(
  tool: ToolDefinition, 
  options?: { secondary?: ToolDefinition[] }
): Disposable
```
Register a custom tool that appears in the toolbar. The `options` parameter allows you to specify secondary tools that will appear in a secondary toolbar when this tool is active.

#### UI Components
```typescript
api.registerLayerComponent(component: React.ComponentType): Disposable
api.registerToolbarComponent(component: React.ComponentType): Disposable
api.registerContextMenuItems(items: ContextMenuItem[]): Disposable
```

#### Coordinate Conversion
```typescript
api.screenToCanvas(screenPosition: {x: number, y: number}): {x: number, y: number}
api.canvasToScreen(canvasPosition: {x: number, y: number}): {x: number, y: number}
```

#### Canvas State
```typescript
api.getCanvasState(): Readonly<CanvasState>
api.getSelectedElements(): readonly string[]
```

#### Element Management
```typescript
api.createElement(element: Omit<Element, "id">): string
api.updateElement(id: string, updates: Partial<Element>): void
api.deleteElement(id: string): void
api.selectElement(id: string): void
api.deselectElement(id: string): void
api.clearSelection(): void
```

#### Element Type Registration
```typescript
api.registerElementType(type: string, renderer: ElementRenderer): Disposable
```

#### Theme and Styling
```typescript
api.getAccentColor(): string
```

#### Registry Access
```typescript
api.getRegisteredTools(): Map<string, ToolDefinition>
api.getMainTools(): Map<string, ToolDefinition>
api.getSecondaryTools(mainToolId: string): ToolDefinition[]
api.getLayerComponents(): React.ComponentType[]
api.getElements(): Map<string, Element>
```

**New Methods for Secondary Toolbar Support:**
- `getMainTools()`: Returns only the main tools that appear in the primary toolbar
- `getSecondaryTools(mainToolId)`: Returns the secondary tools associated with a main tool

#### Event System
```typescript
api.on<T extends PluginEvent>(event: T, handler: (data: PluginEventData[T]) => void): Disposable
api.emit<T extends PluginEvent>(event: T, data: PluginEventData[T]): void
```

### Available Events

- `element:created` - Element was created
- `element:updated` - Element was modified  
- `element:deleted` - Element was removed
- `element:selected` - Element was selected
- `element:deselected` - Element was deselected
- `selection:changed` - Selection state changed
- `canvas:pan` - Canvas was panned
- `canvas:zoom` - Canvas was zoomed
- `tool:activated` - Tool was activated
- `tool:deactivated` - Tool was deactivated

## Best Practices

### 1. Plugin Independence
- Don't import the core canvas store directly
- Use the PluginAPI for all canvas interactions
- Keep plugin state separate from canvas state

### 2. Performance
- Use React.memo for layer components
- Memoize expensive calculations
- Clean up event listeners in deactivate()

### 3. State Management
- Use Zustand for plugin-specific state
- Don't mutate canvas state directly
- Use the PluginAPI for state changes

### 4. Error Handling
```typescript
activate: (api) => {
  try {
    // Plugin initialization
    const tool = createYourTool(api);
    api.registerTool(tool);
  } catch (error) {
    console.error("Failed to activate plugin:", error);
  }
}
```

### 5. Keyboard Shortcuts
```typescript
onKeyDown: (event) => {
  // Check for conflicts with existing shortcuts
  if (event.key === "p" && !event.ctrlKey && !event.metaKey) {
    // Your shortcut logic
    event.preventDefault();
  }
}
```

## Example: Text Plugin

Here's a complete example of a text plugin:

```typescript
// src/plugins/text/TextPlugin.tsx
import React from "react";
import { Type } from "lucide-react";
import type { Plugin, ToolDefinition, PluginAPI } from "../../plugin";
import { TextLayer } from "./components/TextLayer";
import { useTextStore } from "./store";

const createTextTool = (api: PluginAPI): ToolDefinition => ({
  id: "text",
  name: "Text",
  icon: <Type size={16} />,
  cursor: "text",

  onMouseDown: (event, position) => {
    const canvasPosition = api.screenToCanvas(position);
    const { addText } = useTextStore.getState();
    
    const text = prompt("Enter text:");
    if (text) {
      addText({
        id: `text-${Date.now()}`,
        x: canvasPosition.x,
        y: canvasPosition.y,
        content: text,
        fontSize: 16,
        color: "#000000",
      });
    }
  },
});

export const TextPlugin: Plugin = {
  id: "text",
  name: "Text Tool",
  version: "1.0.0",
  description: "Add text elements to the canvas",
  author: "Canvas Team",

  activate: (api) => {
    const textTool = createTextTool(api);
    api.registerTool(textTool);
    api.registerLayerComponent(TextLayer);
  },

  deactivate: () => {
    const { clearTexts } = useTextStore.getState();
    clearTexts();
  },
};
```

## Loading Your Plugin

### As Built-in Plugin
Add your plugin to the built-in plugins array in `usePluginSystem.ts`:

```typescript
const builtInPlugins = [DrawingPlugin, YourPlugin];
```

### As External Plugin
Pass your plugin when creating the InfiniteCanvas:

```typescript
<InfiniteCanvas plugins={[YourPlugin]} />
```

## Debugging

### Plugin Events
Listen to plugin lifecycle events:
```typescript
api.on("plugin:activated", ({ plugin }) => {
  console.log("Plugin activated:", plugin.name);
});
```

### Tool Registration
Check if your tool is registered:
```typescript
const tools = api.getRegisteredTools();
console.log("Registered tools:", Array.from(tools.keys()));
```

### Canvas State
Monitor canvas state changes:
```typescript
api.on("element:created", ({ element }) => {
  console.log("Element created:", element);
});
```

## Advanced Features

### Custom Context Menu
```typescript
api.registerContextMenuItems([
  {
    id: "your-action",
    label: "Your Action",
    icon: <YourIcon />,
    onClick: () => {
      // Your action logic
    },
  },
]);
```

### Custom Toolbar Components
```typescript
const YourToolbarComponent = () => (
  <button onClick={() => console.log("Custom button clicked")}>
    Custom Action
  </button>
);

api.registerToolbarComponent(YourToolbarComponent);
```

### Element Interaction
```typescript
// Create custom elements
const elementId = api.createElement({
  type: "your-element",
  x: 100,
  y: 100,
  width: 50,
  height: 50,
  properties: { color: "red" },
});

// Update elements
api.updateElement(elementId, { x: 150 });

// Select elements
api.selectElement(elementId);
```

## Modular Plugin Development

For complex plugins with multiple tools or shapes, consider using a modular structure:

### Tool Separation
```typescript
// src/plugins/shapes/tools/rectangleTool.ts
import { Square } from "lucide-react";
import type { PluginAPI, ToolDefinition } from "../../../plugin";

export const createRectangleTool = (api: PluginAPI): ToolDefinition => ({
  id: "rectangle",
  name: "Rectangle", 
  icon: <Square size={16} />,
  cursor: "crosshair",
  // Tool implementation...
});
```

### Complete Plugin Example with Secondary Toolbar

Here's how the shapes plugin uses the new API structure:

```typescript
// src/plugins/shapes/ShapesPlugin.tsx
import React from "react";
import { Square } from "lucide-react";
import type { Plugin, PluginAPI } from "../../plugin";
import { createRectangleTool } from "./tools/rectangleTool";
import { createCircleTool } from "./tools/circleTool";
import { createTriangleTool } from "./tools/triangleTool";

export const ShapesPlugin: Plugin = {
  id: "shapes-plugin",
  name: "Shapes Plugin",
  version: "1.0.0",
  description: "Adds rectangle, circle, and triangle creation functionality",

  activate: async (api: PluginAPI) => {
    // Create individual tools
    const rectangleTool = createRectangleTool(api);
    const circleTool = createCircleTool(api);
    const triangleTool = createTriangleTool(api);

    // Register the main shapes tool with secondary tools
    api.registerTool(
      {
        id: "shapes",
        name: "Shapes",
        icon: <Square size={16} />,
        cursor: "crosshair",
        // Default to rectangle tool behavior when shapes is selected
        onActivate: rectangleTool.onActivate,
        onDeactivate: rectangleTool.onDeactivate,
        onMouseDown: rectangleTool.onMouseDown,
        onMouseMove: rectangleTool.onMouseMove,
        onMouseUp: rectangleTool.onMouseUp,
        onKeyDown: rectangleTool.onKeyDown,
      },
      {
        secondary: [rectangleTool, circleTool, triangleTool],
      },
    );

    // Register element types and other components...
  },

  deactivate: async () => {
    // Cleanup logic...
  },
};
```

### Renderer Separation
```typescript
// src/plugins/shapes/renderers/RectangleRenderer.tsx
import type React from "react";
import type { Element } from "../../../plugin";

export const RectangleRenderer: React.FC<{ element: Element }> = ({ element }) => {
  const { x, y, width, height, properties } = element;
  
  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      fill={properties.fill as string}
      stroke={properties.stroke as string}
      strokeWidth={properties.strokeWidth as number}
    />
  );
};
```

### Layer Factory Pattern
```typescript
// src/plugins/shapes/layers/RectangleLayer.tsx
import type React from "react";
import type { Element, PluginAPI } from "../../../plugin";
import { RectangleRenderer } from "../renderers/RectangleRenderer";

export const createRectangleLayer = (api: PluginAPI): React.FC => () => {
  const elements = api.getElements();
  const rectangles = Array.from(elements.values()).filter(
    (element): element is Element => element.type === "rectangle",
  );

  return (
    <g className="rectangles-layer">
      {rectangles.map((element) => (
        <RectangleRenderer key={element.id} element={element} />
      ))}
    </g>
  );
};
```

### Benefits of Modular Structure

1. **Maintainability**: Easy to find and modify specific functionality
2. **Reusability**: Components can be used in other plugins
3. **Testing**: Individual components can be tested in isolation
4. **Collaboration**: Multiple developers can work on different parts
5. **Code Organization**: Logical separation of concerns

This guide should help you create powerful and well-integrated plugins for the Infinite Canvas system!