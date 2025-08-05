# Timer Plugin

Add live timer to the canvas.

## Installation

This plugin is part of the JammWork plugin ecosystem. It can be installed and used within JammWork's infinite canvas application.

## Usage

1. Activate the plugin in your JammWork application
2. Select the Timer tool from the toolbar
3. Click on the canvas to create Timer elements

## Development

To develop this plugin:

```bash
# Install dependencies
pnpm install

# Build the plugin
nx build @jammwork/plugin-timer

# Run tests
nx test @jammwork/plugin-timer
```

## Plugin Structure

- `TimerPlugin.tsx` - Main plugin definition and registration
- `TimerRenderer.tsx` - Component for rendering Timer elements
- `store.ts` - Plugin state management using Zustand

## Customization

You can customize this plugin by:

1. Modifying the element renderer in `TimerRenderer.tsx`
2. Adding new tool behaviors in `TimerPlugin.tsx`
3. Extending the state management in `store.ts`

## API Usage

This plugin uses the JammWork Plugin API:

- `api.registerElementType()` - Register custom element types
- `api.registerTool()` - Register tools in the toolbar
- `api.createElement()` - Create elements on the canvas
- `api.screenToCanvas()` - Convert screen coordinates to canvas coordinates

For more information about the Plugin API, see the [Plugin Development Documentation](../../../PLUGIN_DEVELOPMENT.md).