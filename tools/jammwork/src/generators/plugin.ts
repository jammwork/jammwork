import * as path from "node:path";
import { formatFiles, generateFiles, names, type Tree } from "@nx/devkit";
import type { PluginGeneratorSchema } from "./schema";

export async function pluginGenerator(
	tree: Tree,
	options: PluginGeneratorSchema,
) {
	const { className, propertyName } = names(options.name);
	const projectRoot = `packages/plugins/${options.name}`;
	const packageName = `@jammwork/plugin-${options.name}`;

	// Add default values
	const normalizedOptions = {
		...options,
		author: options.author || "JammWork",
		icon: options.icon || "Circle",
		className,
		propertyName,
		packageName,
	};

	generateFiles(
		tree,
		path.join(__dirname, "files"),
		projectRoot,
		normalizedOptions,
	);
	await formatFiles(tree);
}

export default pluginGenerator;
