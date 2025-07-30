# Mind map Plugin

Mind map like Whimsical

## Installation

This plugin is part of the JammWork plugin ecosystem. It can be installed and used within JammWork's infinite canvas application.

## Usage

1. Activate the plugin in your JammWork application
2. Select the Mind map tool from the toolbar
3. Click on the canvas to create Mind map elements

## Development

To develop this plugin:

```bash
# Install dependencies
pnpm install

# Build the plugin
nx build @jammwork/plugin-mindmap

# Run tests
nx test @jammwork/plugin-mindmap
```

## Plugin Structure

- `MindmapPlugin.tsx` - Main plugin definition and registration
- `MindmapRenderer.tsx` - Component for rendering Mind map elements
- `store.ts` - Plugin state management using Zustand

## Customization

You can customize this plugin by:

1. Modifying the element renderer in `MindmapRenderer.tsx`
2. Adding new tool behaviors in `MindmapPlugin.tsx`
3. Extending the state management in `store.ts`

## API Usage

This plugin uses the JammWork Plugin API:

- `api.registerElementType()` - Register custom element types
- `api.registerTool()` - Register tools in the toolbar
- `api.createElement()` - Create elements on the canvas
- `api.screenToCanvas()` - Convert screen coordinates to canvas coordinates

For more information about the Plugin API, see the [Plugin Development Documentation](../../../PLUGIN_DEVELOPMENT.md).