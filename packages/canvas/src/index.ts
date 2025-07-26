export { InfiniteCanvas } from "./InfiniteCanvas";
export { useCanvasStore } from "./canvasStore";
export { useViewport } from "./hooks/useViewport";
export { PositionDisplay } from "./components/PositionDisplay";
export { Grid } from "./components/Grid";
export type {
	ViewBox,
	Position,
	DragState,
	CanvasTool,
	ToolState,
} from "./canvasStore";

// Plugin system exports
export { PluginManager } from "./core/PluginManager";
export { PluginAPIImpl } from "./core/PluginAPI";
export { EventBus } from "./core/EventBus";
export type * from "./plugin";

// Built-in plugins
export * from "./plugins";
