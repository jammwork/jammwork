# Plugin API Reference

Complete reference for the Jammwork Plugin API, interfaces, and types.

## Core Interfaces

### Plugin

Main plugin interface that defines a plugin module.

```typescript
interface Plugin {
  id: string;           // Unique plugin identifier
  name: string;         // Display name
  version: string;      // Semantic version
  description?: string; // Plugin description
  author?: string;      // Plugin author
  activate(api: PluginAPI): void | Promise<void>;   // Activation function
  deactivate?(): void | Promise<void>;              // Optional cleanup function
}
```

**Example:**
```typescript
export const MyPlugin: Plugin = {
  id: 'my-plugin',
  name: 'My Plugin',
  version: '1.0.0',
  description: 'Does amazing things',
  author: 'Your Name',
  
  activate: async (api) => {
    // Plugin initialization
  },
  
  deactivate: async () => {
    // Cleanup
  }
};
```

### PluginAPI

Main interface for interacting with the canvas system.

```typescript
interface PluginAPI {
  // Tool registration
  registerTool(tool: ToolDefinition, options?: { secondary?: ToolDefinition[] }): Disposable;
  
  // Element management
  registerElementType(type: string, renderer: ElementRenderer): Disposable;
  createElement(element: Omit<Element, "id">): string;
  updateElement(id: string, updates: Partial<Element>): void;
  deleteElement(id: string): void;
  selectElement(id: string): void;
  deselectElement(id: string): void;
  clearSelection(): void;
  
  // UI components
  registerLayerComponent(component: React.ComponentType): Disposable;
  registerToolbarComponent(component: React.ComponentType): Disposable;
  registerContextMenuItems(items: ContextMenuItem[]): Disposable;
  
  // Event system
  on<T extends PluginEvent>(event: T, handler: (data: PluginEventData[T]) => void): Disposable;
  emit<T extends PluginEvent>(event: T, data: PluginEventData[T]): void;
  
  // Canvas state (read-only)
  getCanvasState(): Readonly<CanvasState>;
  getSelectedElements(): readonly string[];
  
  // Coordinate conversion
  screenToCanvas(screenPosition: { x: number; y: number }): { x: number; y: number };
  canvasToScreen(canvasPosition: { x: number; y: number }): { x: number; y: number };
  
  // Registry access
  getRegisteredTools(): Map<string, ToolDefinition>;
  getMainTools(): Map<string, ToolDefinition>;
  getSecondaryTools(mainToolId: string): ToolDefinition[];
  getLayerComponents(): React.ComponentType[];
  getElements(): Map<string, Element>;
  
  // Tool highlighting
  setToolHighlight(toolId: string, highlighted: boolean): void;
  isToolHighlighted(toolId: string): boolean;
  
  // Theme and context
  getAccentColor(): string;
  getUserId(): string;
  getRoomId(): string;
  
  // Real-time collaboration
  getYjsDocumentManager(): YjsDocumentManager;
  getAwareness(): Awareness;
}
```

## Tool System

### ToolDefinition

Defines a custom tool for the toolbar.

```typescript
interface ToolDefinition {
  id: string;                    // Unique tool identifier
  name: string;                  // Display name in toolbar
  icon: React.ReactNode;         // Tool icon (16x16 recommended)
  cursor?: string;               // CSS cursor when tool is active
  onActivate?(): void;           // Called when tool is selected
  onDeactivate?(): void;         // Called when tool is deselected
  onMouseDown?(event: MouseEvent, position: { x: number; y: number }): void;
  onMouseMove?(event: MouseEvent, position: { x: number; y: number }): void;
  onMouseUp?(event: MouseEvent, position: { x: number; y: number }): void;
  onKeyDown?(event: KeyboardEvent): void;
}
```

**Mouse Event Handling:**
- Positions are in screen coordinates - use `api.screenToCanvas()` to convert
- Events follow standard DOM MouseEvent interface
- All handlers are optional

**Example:**
```typescript
const drawingTool: ToolDefinition = {
  id: 'drawing-tool',
  name: 'Drawing',
  icon: <Pencil size={16} />,
  cursor: 'crosshair',
  
  onActivate: () => {
    console.log('Drawing tool activated');
  },
  
  onMouseDown: (event, position) => {
    const canvasPos = api.screenToCanvas(position);
    // Start drawing at canvasPos
  },
  
  onMouseMove: (event, position) => {
    if (isDrawing) {
      const canvasPos = api.screenToCanvas(position);
      // Continue drawing to canvasPos
    }
  },
  
  onMouseUp: (event, position) => {
    // Finish drawing
  },
  
  onKeyDown: (event) => {
    if (event.key === 'Escape') {
      // Cancel current operation
    }
  }
};
```

### Secondary Toolbars

Register tools with secondary toolbars for grouping related functionality.

```typescript
// Register main tool with secondary tools
api.registerTool(
  {
    id: 'shapes',
    name: 'Shapes',
    icon: <Square size={16} />,
    // Default behavior (typically first secondary tool)
    onMouseDown: rectangleTool.onMouseDown,
  },
  {
    secondary: [rectangleTool, circleTool, triangleTool]
  }
);
```

**Secondary Toolbar Behavior:**
- Appears above main toolbar when main tool is selected
- Individual tools can be selected from secondary toolbar
- Main tool remains highlighted when secondary tools are active
- All tools are automatically registered and managed

## Element System

### Element

Basic element interface for canvas objects.

```typescript
interface Element {
  id: string;                          // Unique element identifier
  type: string;                        // Element type (for renderer lookup)
  x: number;                          // X position on canvas
  y: number;                          // Y position on canvas
  width: number;                      // Element width
  height: number;                     // Element height
  properties: Record<string, unknown>; // Custom properties
  locked?: boolean;                   // Whether element can be modified
  visible?: boolean;                  // Whether element is visible
  createdBy?: string;                 // User ID who created the element
}
```

### ElementRenderer

Defines how custom elements are rendered on the canvas.

```typescript
interface ElementRenderer {
  render(element: Element, context: RenderContext): React.ReactNode;
  getBounds(element: Element): { x: number; y: number; width: number; height: number };
  hitTest?(element: Element, point: { x: number; y: number }): boolean;
}
```

**RenderContext:**
```typescript
interface RenderContext {
  zoom: number;      // Current canvas zoom level
  selected: boolean; // Whether element is selected
  hovered: boolean;  // Whether element is hovered
}
```

**Example:**
```typescript
const rectangleRenderer: ElementRenderer = {
  render: (element, context) => (
    <rect
      x={element.x}
      y={element.y}
      width={element.width}
      height={element.height}
      fill={context.selected ? '#007bff' : '#333'}
      stroke={context.hovered ? '#ffa500' : 'none'}
      strokeWidth={2}
    />
  ),
  
  getBounds: (element) => ({
    x: element.x,
    y: element.y,
    width: element.width,
    height: element.height
  }),
  
  hitTest: (element, point) => {
    return point.x >= element.x && 
           point.x <= element.x + element.width &&
           point.y >= element.y && 
           point.y <= element.y + element.height;
  }
};
```

## Canvas State

### CanvasState

Read-only canvas state interface.

```typescript
interface CanvasState {
  viewBox: {
    x: number;      // Canvas viewport X offset
    y: number;      // Canvas viewport Y offset
    zoom: number;   // Current zoom level
  };
  dimensions: {
    width: number;  // Canvas container width
    height: number; // Canvas container height
  };
  elements: Map<string, Element>;  // All canvas elements
  selectedElements: string[];      // Currently selected element IDs
}
```

**Usage:**
```typescript
const canvasState = api.getCanvasState();
console.log('Current zoom:', canvasState.viewBox.zoom);
console.log('Element count:', canvasState.elements.size);
console.log('Selected:', canvasState.selectedElements.length);
```

## Event System

### PluginEvent

Available event types for the plugin system.

```typescript
type PluginEvent = 
  | "element:created"    // Element was created
  | "element:updated"    // Element was modified
  | "element:deleted"    // Element was deleted
  | "element:selected"   // Element was selected
  | "element:deselected" // Element was deselected
  | "selection:changed"  // Selection state changed
  | "canvas:pan"         // Canvas was panned
  | "canvas:zoom"        // Canvas was zoomed
  | "tool:activated"     // Tool was activated
  | "tool:deactivated"   // Tool was deactivated
  | "plugin:loaded"      // Plugin was loaded
  | "plugin:unloaded"    // Plugin was unloaded
  | "plugin:activated"   // Plugin was activated
  | "plugin:deactivated"; // Plugin was deactivated
```

### PluginEventData

Event data interfaces for each event type.

```typescript
interface PluginEventData {
  "element:created": { element: Element };
  "element:updated": { id: string; element: Element; changes: Partial<Element> };
  "element:deleted": { id: string; element: Element };
  "element:selected": { id: string; element: Element };
  "element:deselected": { id: string; element: Element };
  "selection:changed": { selected: string[]; previous: string[] };
  "canvas:pan": { x: number; y: number; deltaX: number; deltaY: number };
  "canvas:zoom": { zoom: number; centerX: number; centerY: number };
  "tool:activated": { toolId: string; tool: ToolDefinition };
  "tool:deactivated": { toolId: string; tool: ToolDefinition };
  "plugin:loaded": { plugin: Plugin };
  "plugin:unloaded": { plugin: Plugin };
  "plugin:activated": { plugin: Plugin };
  "plugin:deactivated": { plugin: Plugin };
}
```

**Event Handling Examples:**
```typescript
// Listen to element creation
api.on('element:created', ({ element }) => {
  console.log('New element created:', element.type);
});

// Listen to selection changes
api.on('selection:changed', ({ selected, previous }) => {
  console.log(`Selection changed: ${previous.length} → ${selected.length}`);
});

// Listen to canvas zoom
api.on('canvas:zoom', ({ zoom, centerX, centerY }) => {
  console.log(`Zoomed to ${zoom}x at (${centerX}, ${centerY})`);
});

// Emit custom events
api.emit('element:updated', {
  id: elementId,
  element: updatedElement,
  changes: { x: newX, y: newY }
});
```

## UI Components

### Context Menu

```typescript
interface ContextMenuItem {
  id: string;                      // Unique item identifier
  label: string;                   // Display text
  icon?: React.ReactNode;          // Optional icon
  shortcut?: string;               // Keyboard shortcut text
  separator?: boolean;             // Whether to show separator after item
  submenu?: ContextMenuItem[];     // Nested menu items
  disabled?: boolean;              // Whether item is disabled
  onClick?(): void;                // Click handler
}
```

**Example:**
```typescript
api.registerContextMenuItems([
  {
    id: 'my-action',
    label: 'My Custom Action',
    icon: <Star size={16} />,
    shortcut: 'Ctrl+M',
    onClick: () => {
      // Custom action logic
    }
  },
  {
    id: 'separator-1',
    label: '',
    separator: true
  },
  {
    id: 'submenu',
    label: 'More Actions',
    submenu: [
      {
        id: 'sub-action-1',
        label: 'Sub Action 1',
        onClick: () => console.log('Sub action 1')
      }
    ]
  }
]);
```

## Real-time Collaboration

### YjsDocumentManager

Manages Yjs documents for real-time synchronization.

```typescript
interface YjsDocumentManager {
  getDocument(documentId: string): Y.Doc;      // Get or create document
  createDocument(documentId: string): Y.Doc;   // Create new document
  deleteDocument(documentId: string): void;    // Delete document
  getProvider(documentId: string): unknown;    // Get WebSocket provider
}
```

**Usage Example:**
```typescript
// Get Yjs document for plugin data
const yjsManager = api.getYjsDocumentManager();
const pluginDoc = yjsManager.getDocument('my-plugin-data');

// Use Yjs shared types
const sharedArray = pluginDoc.getArray('items');
const sharedMap = pluginDoc.getMap('settings');

// Add data (syncs to all users)
sharedArray.push(['Hello from plugin!']);
sharedMap.set('color', '#ff0000');

// Listen to changes from other users
sharedArray.observe(() => {
  console.log('Plugin data updated by another user');
});
```

### Awareness

Access to user presence and awareness information.

```typescript
// Get awareness instance
const awareness = api.getAwareness();

// Get current users in the room
const users = Array.from(awareness.getStates().values());

// Set local awareness state
awareness.setLocalStateField('myPlugin', {
  status: 'active',
  tool: 'drawing',
  color: '#ff0000'
});

// Listen for user changes
awareness.on('change', () => {
  const updatedUsers = Array.from(awareness.getStates().values());
  console.log(`${updatedUsers.length} users in room`);
});
```

## Utility Functions

### Coordinate Conversion

```typescript
// Convert screen coordinates to canvas coordinates
const canvasPos = api.screenToCanvas({ x: mouseX, y: mouseY });

// Convert canvas coordinates to screen coordinates  
const screenPos = api.canvasToScreen({ x: elementX, y: elementY });
```

### Registry Access

```typescript
// Get all registered tools
const allTools = api.getRegisteredTools();

// Get only main toolbar tools
const mainTools = api.getMainTools();

// Get secondary tools for a main tool
const secondaryTools = api.getSecondaryTools('shapes');

// Get registered layer components
const layers = api.getLayerComponents();

// Get all canvas elements
const elements = api.getElements();
```

### Tool Highlighting

```typescript
// Highlight tool (independent of selection)
api.setToolHighlight('screen-share', true);

// Check if tool is highlighted
const isHighlighted = api.isToolHighlighted('screen-share');

// Remove highlight
api.setToolHighlight('screen-share', false);
```

## Disposable Pattern

All registration methods return a `Disposable` for cleanup:

```typescript
interface Disposable {
  dispose(): void;
}
```

**Usage:**
```typescript
const toolDisposable = api.registerTool(myTool);
const layerDisposable = api.registerLayerComponent(MyLayer);

// Later, during plugin deactivation:
toolDisposable.dispose();
layerDisposable.dispose();
```

## TypeScript Tips

### Type-safe Event Handling

```typescript
// Type-safe event listener
api.on('element:created', (data) => {
  // data is automatically typed as { element: Element }
  console.log('Created element:', data.element.type);
});

// Type-safe event emission
api.emit('element:updated', {
  id: 'element-1',
  element: myElement,
  changes: { x: 100 } // Partial<Element>
});
```

### Generic Element Types

```typescript
interface MyCustomElement extends Element {
  type: 'my-custom-type';
  properties: {
    color: string;
    radius: number;
  };
}

// Type-safe element creation
const elementId = api.createElement({
  type: 'my-custom-type',
  x: 100,
  y: 100,
  width: 50,
  height: 50,
  properties: {
    color: '#ff0000',
    radius: 25
  }
} as Omit<MyCustomElement, 'id'>);
```

## Error Handling

### Safe Plugin Activation

```typescript
export const MyPlugin: Plugin = {
  // ... plugin config
  
  activate: async (api) => {
    try {
      // Plugin initialization
      const disposables = [];
      
      disposables.push(api.registerTool(myTool));
      disposables.push(api.registerLayerComponent(MyLayer));
      
      // Store disposables for cleanup
      (this as any).__disposables = disposables;
      
    } catch (error) {
      console.error('Failed to activate plugin:', error);
      throw error; // Re-throw to indicate activation failure
    }
  },
  
  deactivate: async () => {
    try {
      // Cleanup disposables
      const disposables = (this as any).__disposables || [];
      disposables.forEach(d => d.dispose?.());
      
    } catch (error) {
      console.error('Failed to deactivate plugin:', error);
    }
  }
};
```

This completes the Plugin API reference. For practical examples, see the [Examples section](./examples/basic-plugin).