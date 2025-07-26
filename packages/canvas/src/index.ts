export { InfiniteCanvas } from "./InfiniteCanvas";
export { useCanvasStore } from "./stores/canvasStore";
export { useViewport } from "./hooks/useViewport";
export { PositionDisplay } from "./components/PositionDisplay";
export { Grid } from "./components/Grid";
export type {
	ViewBox,
	Position,
	DragState,
	CanvasTool,
	ToolState,
} from "./stores/canvasStore";

// Plugin system exports
export { PluginManager } from "./core/PluginManager";
export { PluginAPIImpl } from "./core/PluginAPI";
export { EventBus } from "./core/EventBus";
export type * from "./types/plugin";

// Built-in plugins
export * from "./plugins";
