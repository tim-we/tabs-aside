// a temporary fix for web-ext-types
// -> manually update node_modules/web-ext-types/global/index.d.ts line 761

interface Manifest {
	manifest_version: string,
	name: string,
	version: string,

	author: string,
	default_locale: string,
	description: string,
	permissions: string[],
	short_name: string,
	version_name: string
}