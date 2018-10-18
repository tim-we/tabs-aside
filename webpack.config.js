module.exports = {
	mode: "development",
	devtool: "source-map",

	entry: {
		background: "./ts/background/background.ts",
		bmSelector: "./ts/bookmark-selector/Controller.ts",
		menu: "./ts/browserAction/menu.ts",
		options: "./ts/options/OptionsPage.ts",
		sidebar: "./ts/sidebar/sidebar.ts",
		tabSelector: "./ts/tab-selector/TabSelector.ts",
		privileged: "./ts/extension-pages/privileged.ts"
	},

	output: {
		path: __dirname + "/dist/js",
		filename: "[name].js"
	},

	resolve: {
		// Add '.ts' as a resolvable extension.
		extensions: [".ts", ".js"]
	},

	module: {
		rules: [
			// all files with a '.ts' or '.tsx' extension will be handled by 'ts-loader'
			{ test: /\.tsx?$/, loader: "ts-loader" }
		]
	}
}