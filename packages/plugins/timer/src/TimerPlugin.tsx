import type { Plugin, PluginAPI } from "@jammwork/api";
import { TimerLayer } from "./components/TimerLayer";
import { TimerRenderer } from "./renderers/TimerRenderer";
import { useTimerStore } from "./timerStore";
import { createTimerTool } from "./tools/timerTool";
import type { TimerElementProperties } from "./types";

export const TimerPlugin: Plugin = {
	id: "timer-plugin",
	name: "Timer Plugin",
	version: "1.0.0",
	description:
		"Adds countdown timer functionality with real-time synchronization",

	activate: async (api: PluginAPI) => {
		const timerTool = createTimerTool(api);

		api.registerTool(timerTool);

		api.registerElementType("timer", {
			render: (element) => (
				<TimerRenderer
					element={element}
					api={api}
					onUpdate={(updates) => {
						const currentProperties =
							element.properties as unknown as TimerElementProperties;

						// If element is pinned, update the pinned element instead
						if (api.isPinned(element.id)) {
							const updatedElement = {
								...element,
								properties: {
									...currentProperties,
									...updates,
								},
							};
							api.updatePinnedElement(element.id, updatedElement);
						} else {
							api.updateElement(element.id, {
								properties: {
									...currentProperties,
									...updates,
								},
							});
						}
					}}
				/>
			),
			getBounds: (element) => ({
				x: element.x,
				y: element.y,
				width: element.width,
				height: element.height,
			}),
		});

		api.registerLayerComponent(() => <TimerLayer api={api} />);
	},

	deactivate: async () => {
		const { cancelCreating } = useTimerStore.getState();
		cancelCreating();
	},
};
