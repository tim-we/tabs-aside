export async function getCurrentWindowId() {
	let wnd = await browser.windows.getLastFocused({populate: false});

	return wnd ? wnd.id : browser.windows.WINDOW_ID_NONE;
}