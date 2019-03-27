let focusHistory:number[] = [];

export async function init():Promise<void> {
	let windows = await browser.windows.getAll();
	let current = await browser.windows.getLastFocused({
		populate: false
	});

	if(current.type !== "normal") {
		throw new Error("[TA] Unexpected window type");
	}

	focusHistory = windows.filter(wnd => wnd.type === "normal")
		.filter(wnd => wnd.id !== current.id)
		.map(wnd => wnd.id);
	focusHistory.unshift(current.id);

	// event listeners

	browser.windows.onRemoved.addListener(removedWndId => {
		focusHistory = focusHistory.filter(wndId => wndId !== removedWndId);
	});

	browser.windows.onCreated.addListener(wnd => {
		if(wnd.type === "normal") {
			focusHistory.push(wnd.id);
		}
	});

	browser.windows.onFocusChanged.addListener(async (focusedWndId) => {
		let wnd = await browser.windows.get(focusedWndId);

		if(wnd.type === "normal") {
			focusHistory = focusHistory.filter(wndId => focusedWndId);
			focusHistory.unshift(focusedWndId);
		}
	});
}

type WindowId = number;

export function get(index:number):WindowId {
	if(focusHistory.length > index) {
		return focusHistory[index];
	} else {
		return browser.windows.WINDOW_ID_NONE;
	}
}

export function getPreviousWindow():WindowId {
	return get(1);
}
