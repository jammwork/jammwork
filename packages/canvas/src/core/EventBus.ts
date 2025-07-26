import mitt, { type Emitter } from "mitt";
import type { Disposable, PluginEvent, PluginEventData } from "../plugin";

export class EventBus {
	private emitter: Emitter<PluginEventData>;

	constructor() {
		this.emitter = mitt<PluginEventData>();
	}

	on<T extends PluginEvent>(
		event: T,
		handler: (data: PluginEventData[T]) => void,
	): Disposable {
		this.emitter.on(event, handler);

		return {
			dispose: () => {
				this.emitter.off(event, handler);
			},
		};
	}

	emit<T extends PluginEvent>(event: T, data: PluginEventData[T]): void {
		this.emitter.emit(event, data);
	}

	removeAllListeners(event?: PluginEvent): void {
		if (event) {
			this.emitter.off(event);
		} else {
			this.emitter.all.clear();
		}
	}
}
