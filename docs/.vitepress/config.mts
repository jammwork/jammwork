import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
	title: "Jammwork Docs",
	description: "Documentation website for Jammwork",
	themeConfig: {
		// https://vitepress.dev/reference/default-theme-config
		nav: [
			{ text: "Home", link: "/" },
			{ text: "Plugin Development", link: "/plugin-development/" },
			{ text: "API Reference", link: "/api/" },
		],

		sidebar: {
			"/plugin-development/": [
				{
					text: "Overview",
					items: [
						{ text: "Introduction", link: "/plugin-development/" },
						{
							text: "Getting Started",
							link: "/plugin-development/getting-started",
						},
						{
							text: "Plugin Architecture",
							link: "/plugin-development/architecture",
						},
					],
				},
				{
					text: "Core Concepts",
					items: [
						{ text: "Plugin API", link: "/plugin-development/api-reference" },
						{
							text: "Tools & Events",
							link: "/plugin-development/tools-events",
						},
						{ text: "Element System", link: "/plugin-development/elements" },
						{
							text: "UI Components",
							link: "/plugin-development/ui-components",
						},
					],
				},
				{
					text: "Advanced Features",
					items: [
						{
							text: "Real-time Collaboration",
							link: "/plugin-development/collaboration",
						},
						{
							text: "Secondary Toolbars",
							link: "/plugin-development/secondary-toolbars",
						},
						{
							text: "State Management",
							link: "/plugin-development/state-management",
						},
					],
				},
				{
					text: "Examples & Tutorials",
					items: [
						{
							text: "Basic Plugin",
							link: "/plugin-development/examples/basic-plugin",
						},
						{
							text: "Drawing Tools",
							link: "/plugin-development/examples/drawing-tools",
						},
						{
							text: "Shapes Plugin",
							link: "/plugin-development/examples/shapes-plugin",
						},
						{
							text: "Text Plugin",
							link: "/plugin-development/examples/text-plugin",
						},
					],
				},
				{
					text: "Best Practices",
					items: [
						{
							text: "Development Guidelines",
							link: "/plugin-development/best-practices",
						},
						{ text: "Performance", link: "/plugin-development/performance" },
						{ text: "Testing", link: "/plugin-development/testing" },
						{
							text: "Troubleshooting",
							link: "/plugin-development/troubleshooting",
						},
					],
				},
			],
		},

		socialLinks: [
			{ icon: "github", link: "https://github.com/jammwork/jammwork" },
		],

		search: {
			provider: "local",
		},

		footer: {
			message: "Released under the MIT License.",
			copyright: "Copyright © 2024 Jammwork",
		},
	},
});
