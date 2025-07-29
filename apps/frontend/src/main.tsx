import { ThemeProvider, Toaster } from "@jammwork/ui";
import { QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import * as ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { queryClient } from "./lib/queryClient";

import "@fontsource/ubuntu/400.css";
import "@fontsource/ubuntu/500.css";
import "@fontsource/ubuntu/700.css";

const root = ReactDOM.createRoot(
	document.getElementById("root") as HTMLElement,
);

root.render(
	<StrictMode>
		<QueryClientProvider client={queryClient}>
			<ThemeProvider>
				<BrowserRouter>
					<App />
				</BrowserRouter>
				<Toaster theme="system" />
			</ThemeProvider>
		</QueryClientProvider>
	</StrictMode>,
);
