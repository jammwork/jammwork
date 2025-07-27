import { Button, useTheme } from "@jammwork/ui";
import { MoonIcon, SunIcon } from "lucide-react";

function ThemeToggle() {
	const { theme, setTheme } = useTheme();

	return (
		<Button
			variant="outline"
			size="icon"
			onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
		>
			{theme === "dark" ? (
				<SunIcon className="w-4 h-4" />
			) : (
				<MoonIcon className="w-4 h-4" />
			)}
			<span className="sr-only">Toggle theme</span>
		</Button>
	);
}

export default ThemeToggle;
