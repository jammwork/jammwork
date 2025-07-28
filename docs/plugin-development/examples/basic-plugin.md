# Basic Plugin Example

This example demonstrates creating a simple plugin that adds clickable markers to the canvas.

## Overview

The Marker Plugin allows users to:
- Click on the canvas to place colored markers
- View markers as small circles with labels
- Clear all markers with a keyboard shortcut
- Cycle through different marker colors

## File Structure

```
src/plugins/marker-plugin/
├── index.ts
├── MarkerPlugin.tsx
├── components/
│   └── MarkerLayer.tsx
├── tools/
│   └── markerTool.ts
└── store.ts
```

## Implementation

### 1. Plugin Store

```typescript
// src/plugins/marker-plugin/store.ts
import { create } from 'zustand';

interface MarkerData {
  id: string;
  x: number;
  y: number;
  color: string;
  label: string;
  timestamp: number;
}

interface MarkerState {
  markers: MarkerData[];
  isActive: boolean;
  currentColor: string;
  colorIndex: number;
}

interface MarkerActions {
  addMarker: (x: number, y: number) => void;
  removeMarker: (id: string) => void;
  clearMarkers: () => void;
  setActive: (active: boolean) => void;
  nextColor: () => void;
}

type MarkerStore = MarkerState & MarkerActions;

const COLORS = [
  '#ff6b6b', // Red
  '#4ecdc4', // Teal
  '#45b7d1', // Blue
  '#96ceb4', // Green
  '#ffeaa7', // Yellow
  '#dda0dd', // Plum
  '#ffa07a', // Salmon
  '#98d8c8', // Mint
];

export const useMarkerStore = create<MarkerStore>((set, get) => ({
  markers: [],
  isActive: false,
  currentColor: COLORS[0],
  colorIndex: 0,

  addMarker: (x, y) => {
    const state = get();
    const newMarker: MarkerData = {
      id: `marker-${Date.now()}-${Math.random()}`,
      x,
      y,
      color: state.currentColor,
      label: `M${state.markers.length + 1}`,
      timestamp: Date.now(),
    };

    set((state) => ({
      markers: [...state.markers, newMarker],
    }));
  },

  removeMarker: (id) =>
    set((state) => ({
      markers: state.markers.filter((marker) => marker.id !== id),
    })),

  clearMarkers: () => set({ markers: [] }),

  setActive: (active) => set({ isActive: active }),

  nextColor: () =>
    set((state) => {
      const nextIndex = (state.colorIndex + 1) % COLORS.length;
      return {
        colorIndex: nextIndex,
        currentColor: COLORS[nextIndex],
      };
    }),
}));
```

### 2. Marker Tool

```typescript
// src/plugins/marker-plugin/tools/markerTool.ts
import React from 'react';
import { MapPin } from 'lucide-react';
import type { ToolDefinition, PluginAPI } from '@jammwork/api';
import { useMarkerStore } from '../store';

export const createMarkerTool = (api: PluginAPI): ToolDefinition => ({
  id: 'marker-tool',
  name: 'Marker',
  icon: React.createElement(MapPin, { size: 16 }),
  cursor: 'crosshair',

  onActivate: () => {
    const { setActive } = useMarkerStore.getState();
    setActive(true);
    console.log('Marker tool activated! Click to place markers.');
  },

  onDeactivate: () => {
    const { setActive } = useMarkerStore.getState();
    setActive(false);
    console.log('Marker tool deactivated.');
  },

  onMouseDown: (event, position) => {
    // Convert screen coordinates to canvas coordinates
    const canvasPosition = api.screenToCanvas(position);
    
    // Add marker at click position
    const { addMarker } = useMarkerStore.getState();
    addMarker(canvasPosition.x, canvasPosition.y);
    
    console.log(`Marker placed at (${canvasPosition.x.toFixed(1)}, ${canvasPosition.y.toFixed(1)})`);
    
    // Emit event for other plugins to react
    api.emit('element:created', {
      element: {
        id: `marker-${Date.now()}`,
        type: 'marker',
        x: canvasPosition.x,
        y: canvasPosition.y,
        width: 20,
        height: 20,
        properties: { tool: 'marker' },
      },
    });
  },

  onKeyDown: (event) => {
    const store = useMarkerStore.getState();
    
    switch (event.key) {
      case 'c':
        if (!event.ctrlKey && !event.metaKey) {
          // Clear all markers
          store.clearMarkers();
          console.log('All markers cleared!');
          event.preventDefault();
        }
        break;
        
      case 'Tab':
        // Cycle through colors
        store.nextColor();
        console.log(`Color changed to: ${store.currentColor}`);
        event.preventDefault();
        break;
        
      case 'Escape':
        // Deselect tool
        console.log('Marker tool cancelled');
        break;
    }
  },
});
```

### 3. Marker Layer Component

```typescript
// src/plugins/marker-plugin/components/MarkerLayer.tsx
import React from 'react';
import { useMarkerStore } from '../store';

export const MarkerLayer: React.FC = React.memo(() => {
  const { markers, isActive } = useMarkerStore();

  // Only render when tool is active or markers exist
  if (!isActive && markers.length === 0) return null;

  return (
    <g className="marker-layer">
      {markers.map((marker) => (
        <g key={marker.id}>
          {/* Marker circle */}
          <circle
            cx={marker.x}
            cy={marker.y}
            r={8}
            fill={marker.color}
            stroke="#fff"
            strokeWidth={2}
            style={{
              filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))',
              cursor: 'pointer',
            }}
          />
          
          {/* Marker label */}
          <text
            x={marker.x}
            y={marker.y - 15}
            textAnchor="middle"
            fontSize="12"
            fontFamily="Arial, sans-serif"
            fill="#333"
            fontWeight="bold"
            style={{
              filter: 'drop-shadow(1px 1px 2px rgba(255,255,255,0.8))',
              pointerEvents: 'none',
            }}
          >
            {marker.label}
          </text>
          
          {/* Subtle pulse animation for newest marker */}
          {Date.now() - marker.timestamp < 2000 && (
            <circle
              cx={marker.x}
              cy={marker.y}
              r={8}
              fill="none"
              stroke={marker.color}
              strokeWidth={1}
              opacity={0.6}
            >
              <animate
                attributeName="r"
                values="8;16;8"
                dur="1s"
                repeatCount="2"
              />
              <animate
                attributeName="opacity"
                values="0.6;0;0.6"
                dur="1s"
                repeatCount="2"
              />
            </circle>
          )}
        </g>
      ))}
      
      {/* Color indicator when tool is active */}
      {isActive && (
        <g>
          <circle
            cx={20}
            cy={20}
            r={12}
            fill={useMarkerStore.getState().currentColor}
            stroke="#fff"
            strokeWidth={2}
            style={{
              filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))',
            }}
          />
          <text
            x={20}
            y={45}
            textAnchor="middle"
            fontSize="10"
            fontFamily="Arial, sans-serif"
            fill="#666"
          >
            Current Color
          </text>
        </g>
      )}
    </g>
  );
});

MarkerLayer.displayName = 'MarkerLayer';
```

### 4. Main Plugin

```typescript
// src/plugins/marker-plugin/MarkerPlugin.tsx
import React from 'react';
import type { Plugin, PluginAPI } from '@jammwork/api';
import { createMarkerTool } from './tools/markerTool';
import { MarkerLayer } from './components/MarkerLayer';
import { useMarkerStore } from './store';

export const MarkerPlugin: Plugin = {
  id: 'marker-plugin',
  name: 'Marker Plugin',
  version: '1.0.0',
  description: 'Add colored markers to the canvas with labels',
  author: 'Jammwork Team',

  activate: async (api: PluginAPI) => {
    console.log('🎯 Activating Marker Plugin...');

    try {
      // Create and register the marker tool
      const markerTool = createMarkerTool(api);
      const toolDisposable = api.registerTool(markerTool);

      // Register the marker layer component
      const layerDisposable = api.registerLayerComponent(MarkerLayer);

      // Listen to canvas events
      const eventDisposables = [
        // Log when elements are created
        api.on('element:created', ({ element }) => {
          if (element.properties?.tool === 'marker') {
            console.log('📍 Marker element created');
          }
        }),

        // Log selection changes
        api.on('selection:changed', ({ selected }) => {
          console.log(`📋 Selection changed: ${selected.length} items`);
        }),

        // React to canvas zoom for debugging
        api.on('canvas:zoom', ({ zoom }) => {
          console.log(`🔍 Canvas zoomed to ${zoom.toFixed(2)}x`);
        }),
      ];

      // Store disposables for cleanup
      (globalThis as any).__markerPluginDisposables = [
        toolDisposable,
        layerDisposable,
        ...eventDisposables,
      ];

      console.log('✅ Marker Plugin activated successfully!');
      console.log('💡 Usage:');
      console.log('   - Click to place markers');
      console.log('   - Press Tab to change color');
      console.log('   - Press C to clear all markers');

    } catch (error) {
      console.error('❌ Failed to activate Marker Plugin:', error);
      throw error;
    }
  },

  deactivate: async () => {
    console.log('👋 Deactivating Marker Plugin...');

    try {
      // Cleanup disposables
      const disposables = (globalThis as any).__markerPluginDisposables;
      if (disposables) {
        disposables.forEach((disposable: any) => disposable?.dispose?.());
        delete (globalThis as any).__markerPluginDisposables;
      }

      // Reset plugin state
      const { clearMarkers, setActive } = useMarkerStore.getState();
      clearMarkers();
      setActive(false);

      console.log('✅ Marker Plugin deactivated successfully!');
    } catch (error) {
      console.error('❌ Failed to deactivate Marker Plugin:', error);
    }
  },
};
```

### 5. Plugin Export

```typescript
// src/plugins/marker-plugin/index.ts
export { MarkerPlugin } from './MarkerPlugin';
export { MarkerLayer } from './components/MarkerLayer';
export { useMarkerStore } from './store';
export { createMarkerTool } from './tools/markerTool';

// Type exports for external use
export type { MarkerData } from './store';
```

## Usage

### 1. Register the Plugin

```typescript
import { MarkerPlugin } from './plugins/marker-plugin';

<InfiniteCanvas 
  plugins={[MarkerPlugin]}
  // ... other props
/>
```

### 2. User Interaction

1. **Activate Tool**: Click the Marker tool in the toolbar (MapPin icon)
2. **Place Markers**: Click anywhere on the canvas to place markers
3. **Change Color**: Press Tab to cycle through different colors
4. **Clear Markers**: Press 'C' to remove all markers
5. **Deactivate**: Select another tool or press Escape

### 3. Visual Features

- **Colored Circles**: Each marker appears as a colored circle with white border
- **Labels**: Sequential labels (M1, M2, M3, etc.)
- **Pulse Animation**: New markers pulse briefly when created
- **Color Indicator**: Shows current marker color when tool is active
- **Drop Shadows**: Subtle shadows for depth

## Key Concepts Demonstrated

### State Management
- Uses Zustand for plugin-specific state
- Separates state from canvas state
- Implements actions for state modifications

### Tool Integration
- Proper tool lifecycle (activate/deactivate)
- Mouse event handling with coordinate conversion
- Keyboard shortcuts for enhanced UX

### Canvas Rendering
- SVG-based layer component
- Conditional rendering based on tool state
- CSS animations for visual feedback

### Event System
- Listens to canvas events
- Emits events for other plugins
- Proper event cleanup on deactivation

### Plugin Lifecycle
- Safe activation with error handling
- Proper cleanup on deactivation
- Resource management with disposables

## Extending the Plugin

### Add Marker Deletion

```typescript
// In MarkerLayer.tsx, add click handler to markers
<circle
  // ... existing props
  onClick={() => {
    const { removeMarker } = useMarkerStore.getState();
    removeMarker(marker.id);
  }}
/>
```

### Add Marker Persistence

```typescript
// In store.ts, add persistence
const useMarkerStore = create<MarkerStore>()(
  persist(
    (set, get) => ({
      // ... existing store
    }),
    {
      name: 'marker-plugin-storage',
      partialize: (state) => ({ markers: state.markers }),
    }
  )
);
```

### Add Context Menu

```typescript
// In MarkerPlugin.tsx activation
api.registerContextMenuItems([
  {
    id: 'clear-markers',
    label: 'Clear All Markers',
    icon: <Trash size={16} />,
    onClick: () => {
      const { clearMarkers } = useMarkerStore.getState();
      clearMarkers();
    },
  },
]);
```

This basic plugin demonstrates the fundamental concepts of Jammwork plugin development. You can use it as a starting point for more complex plugins.

## Next Steps

- **[Drawing Tools Example](./drawing-tools)** - Learn about path drawing and complex interactions
- **[Shapes Plugin Example](./shapes-plugin)** - Understand secondary toolbars and element types
- **[Real-time Collaboration](../collaboration)** - Add collaborative features to your plugins