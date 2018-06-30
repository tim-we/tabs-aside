module.exports = {
	mode: "development",
	devtool: "source-map",

	entry: {
		sidebar: "./ts/sidebar/sidebar.ts",
		background: "./ts/background/background.ts",
		menu: "./ts/browserAction/menu.ts",
		tabSelector: "./ts/browserAction/tab-selector.ts",
		options: "./ts/options/options-page.ts"
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