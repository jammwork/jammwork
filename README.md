# Jammwork

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/jammwork/jammwork)

An infinite canvas collaborative web application built with React, TypeScript, and a powerful plugin system.

## Features

- **Infinite Canvas**: Zoom and pan through unlimited canvas space with smooth SVG rendering
- **Plugin Architecture**: Extensible plugin system for adding new tools and functionality  
- **Selection System**: Select, move, and resize elements with visual feedback
- **Drawing Tools**: Freehand drawing with selectable path elements
- **Shape Tools**: Create and manipulate geometric shapes
- **Collaborative Ready**: Built with collaboration features in mind

## Development

### Prerequisites

- Node.js 22+ 
- pnpm (v10)

### Getting Started

1. Clone the repository:
```bash
git clone https://github.com/jammwork/jammwork.git
cd jammwork
```

2. Install dependencies:
```bash
pnpm install
```

3. Start the development server:
```bash
npx nx dev web
```

4. Open [http://localhost:4200](http://localhost:4200) in your browser

## Architecture

The project is built as an Nx monorepo with the following structure:

- **`apps/web`** - Next.js web application
- **`packages/canvas`** - Core infinite canvas library
- **`packages/ui`** - Shared UI components (shadcn/ui)

### Canvas Package

The canvas package provides:

- **Core Canvas**: Infinite SVG canvas with zoom/pan capabilities
- **Plugin System**: Extensible architecture for adding tools and features
- **Selection System**: Element selection, movement, and resizing
- **Built-in Tools**: Drawing, shapes, and selection tools

## Plugin Development

Want to extend Jammwork with custom tools and features? Check out our comprehensive plugin development guide:

📖 **[Plugin Development Guide](./PLUGIN_DEVELOPMENT.md)**

The guide covers:
- Plugin architecture and API
- Creating custom tools and elements  
- Event system and lifecycle
- UI integration and best practices
- Complete examples and debugging tips

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT
