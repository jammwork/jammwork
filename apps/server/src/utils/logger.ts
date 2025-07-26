type LogLevel = "info" | "warn" | "error" | "debug";

class Logger {
	private logLevel: LogLevel = "info";

	setLogLevel(level: LogLevel) {
		this.logLevel = level;
	}

	private shouldLog(level: LogLevel): boolean {
		const levels: Record<LogLevel, number> = {
			debug: 0,
			info: 1,
			warn: 2,
			error: 3,
		};
		return levels[level] >= levels[this.logLevel];
	}

	private formatMessage(level: LogLevel, message: string, meta?: any): string {
		const timestamp = new Date().toISOString();
		const metaStr = meta ? ` ${JSON.stringify(meta)}` : "";
		return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
	}

	debug(message: string, meta?: any) {
		if (this.shouldLog("debug")) {
			console.log(this.formatMessage("debug", message, meta));
		}
	}

	info(message: string, meta?: any) {
		if (this.shouldLog("info")) {
			console.log(this.formatMessage("info", message, meta));
		}
	}

	warn(message: string, meta?: any) {
		if (this.shouldLog("warn")) {
			console.warn(this.formatMessage("warn", message, meta));
		}
	}

	error(message: string, meta?: any) {
		if (this.shouldLog("error")) {
			console.error(this.formatMessage("error", message, meta));
		}
	}
}

export const logger = new Logger();
