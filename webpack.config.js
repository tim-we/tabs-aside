module.exports = {
	mode: "development",
	devtool: "source-map",

	entry: {
		sidebar: "./src/sidebar/sidebar.ts",
		background: "./src/background/background.ts",
		popupMenu: "./src/browserAction/menu.ts",
		popupTabSelector: "./src/browserAction/tab-selector.ts",
		options: "./src/options/options.ts"
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