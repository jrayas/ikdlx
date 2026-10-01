const root = document.documentElement;
const desktopLayout = window.matchMedia('(min-width: 72rem)');
const sidebars = [
	{
		name: 'left',
		label: 'navigation sidebar',
		selector: '.sidebar-pane',
		property: '--ikdlx-left-sidebar-width',
		storageKey: 'ikdlx-left-sidebar-width',
		defaultWidth: 300,
		minWidth: 240,
		maxWidth: 400,
	},
	{
		name: 'right',
		label: 'table of contents sidebar',
		selector: '.right-sidebar-panel .sl-container',
		property: '--ikdlx-right-sidebar-width',
		storageKey: 'ikdlx-right-sidebar-width',
		defaultWidth: 220,
		minWidth: 160,
		maxWidth: 360,
	},
];

function clamp(value, minimum, maximum) {
	return Math.min(maximum, Math.max(minimum, Math.round(value)));
}

function getSavedWidth(sidebar) {
	try {
		const savedWidth = localStorage.getItem(sidebar.storageKey);
		if (savedWidth !== null && Number.isFinite(Number(savedWidth))) {
			return clamp(Number(savedWidth), sidebar.minWidth, sidebar.maxWidth);
		}
	} catch {}
	return sidebar.defaultWidth;
}

function restoreSavedWidths() {
	for (const sidebar of sidebars) {
		root.style.setProperty(sidebar.property, `${getSavedWidth(sidebar)}px`);
	}
}

restoreSavedWidths();

function getRenderedWidth(target) {
	return Math.round(target.getBoundingClientRect().width);
}

function getMaximumWidth(sidebar, target) {
	if (sidebar.name === 'left') return sidebar.maxWidth;

	const savedWidth = root.style.getPropertyValue(sidebar.property);
	root.style.setProperty(sidebar.property, `${sidebar.maxWidth}px`);
	const maximum = getRenderedWidth(target);
	if (savedWidth) root.style.setProperty(sidebar.property, savedWidth);
	else root.style.removeProperty(sidebar.property);
	return Math.max(sidebar.minWidth, Math.min(sidebar.maxWidth, maximum));
}

function applyWidth(sidebar, target, handle, value, maximum, persist) {
	const width = clamp(value, sidebar.minWidth, maximum);
	root.style.setProperty(sidebar.property, `${width}px`);
	handle.setAttribute('aria-valuenow', String(getRenderedWidth(target)));
	if (persist) {
		try {
			localStorage.setItem(sidebar.storageKey, String(width));
		} catch {}
	}
}

let hoveredSidebar = null;
let pointerPosition = null;

function findSidebarAt(x, y) {
	return document.elementFromPoint(x, y)?.closest('.sidebar-pane, .right-sidebar-panel') ?? null;
}

document.addEventListener(
	'pointermove',
	(event) => {
		if (event.pointerType === 'touch') return;
		pointerPosition = { x: event.clientX, y: event.clientY };
		hoveredSidebar = findSidebarAt(event.clientX, event.clientY);
	},
	{ passive: true }
);

document.addEventListener('keydown', (event) => {
	if (!hoveredSidebar?.isConnected || !['ArrowDown', 'ArrowUp'].includes(event.key)) return;
	if (event.repeat || event.altKey || event.ctrlKey || event.metaKey) return;
	if (
		event.target instanceof Element &&
		event.target.closest('input, textarea, select, [contenteditable="true"], .ikdlx-sidebar-resizer')
	) {
		return;
	}

	const isNavigationSidebar = hoveredSidebar.matches('.sidebar-pane');
	const selector = isNavigationSidebar ? '.sidebar-content a[href]' : 'a[href]';
	const items = Array.from(hoveredSidebar.querySelectorAll(selector)).filter(
		(item) => item.getClientRects().length > 0 && getComputedStyle(item).visibility !== 'hidden'
	);
	if (!items.length) return;

	const focusedIndex = items.findIndex(
		(item) => item === document.activeElement || item.contains(document.activeElement)
	);
	const currentPageSelector = isNavigationSidebar ? '[aria-current="page"]' : '[aria-current="true"]';
	const selectedIndex = items.findIndex((item) => item.matches(currentPageSelector));
	const currentIndex = focusedIndex >= 0 ? focusedIndex : selectedIndex;
	const direction = event.key === 'ArrowDown' ? 1 : -1;
	const nextIndex = currentIndex < 0
		? direction > 0 ? 0 : items.length - 1
		: clamp(currentIndex + direction, 0, items.length - 1);

	event.preventDefault();
	const nextItem = items[nextIndex];
	nextItem.focus();
	if (nextIndex !== currentIndex) nextItem.click();
});

function createHandle(sidebar, target) {
	if (target.querySelector(`.ikdlx-sidebar-resizer--${sidebar.name}`)) return;

	const handle = document.createElement('button');
	handle.type = 'button';
	handle.className = `ikdlx-sidebar-resizer ikdlx-sidebar-resizer--${sidebar.name}`;
	handle.setAttribute('role', 'separator');
	handle.setAttribute('aria-orientation', 'vertical');
	handle.setAttribute('aria-label', `Resize ${sidebar.label}`);
	handle.setAttribute('aria-valuemin', String(sidebar.minWidth));
	handle.setAttribute('aria-valuemax', String(sidebar.maxWidth));
	handle.setAttribute('aria-valuenow', String(getRenderedWidth(target)));
	handle.title = 'Drag to resize, use Left/Right arrows, or double-click to reset';

	let drag;
	handle.addEventListener('pointerdown', (event) => {
		if (event.button !== 0) return;
		event.preventDefault();
		drag = {
			pointerId: event.pointerId,
			startX: event.clientX,
			startWidth: getRenderedWidth(target),
			maximum: getMaximumWidth(sidebar, target),
		};
		handle.setPointerCapture(event.pointerId);
	});

	handle.addEventListener('pointermove', (event) => {
		if (!drag || drag.pointerId !== event.pointerId) return;
		applyWidth(sidebar, target, handle, drag.startWidth + event.clientX - drag.startX, drag.maximum, false);
	});

	function finishDrag(event) {
		if (!drag || drag.pointerId !== event.pointerId) return;
		try {
			handle.releasePointerCapture(event.pointerId);
		} catch {}
		applyWidth(sidebar, target, handle, getRenderedWidth(target), drag.maximum, true);
		drag = undefined;
	}

	handle.addEventListener('pointerup', finishDrag);
	handle.addEventListener('pointercancel', finishDrag);
	handle.addEventListener('keydown', (event) => {
		const currentWidth = getRenderedWidth(target);
		const maximum = getMaximumWidth(sidebar, target);
		const step = event.shiftKey ? 32 : 12;
		if (event.key === 'ArrowRight') applyWidth(sidebar, target, handle, currentWidth + step, maximum, true);
		else if (event.key === 'ArrowLeft') applyWidth(sidebar, target, handle, currentWidth - step, maximum, true);
		else if (event.key === 'Home') applyWidth(sidebar, target, handle, sidebar.minWidth, maximum, true);
		else if (event.key === 'End') applyWidth(sidebar, target, handle, maximum, maximum, true);
		else return;
		event.preventDefault();
	});

	handle.addEventListener('dblclick', () => {
		root.style.removeProperty(sidebar.property);
		try {
			localStorage.removeItem(sidebar.storageKey);
		} catch {}
		handle.setAttribute('aria-valuenow', String(getRenderedWidth(target)));
	});

	target.append(handle);
}

function mountHandles() {
	if (!desktopLayout.matches) return;
	for (const sidebar of sidebars) {
		const target = document.querySelector(sidebar.selector);
		if (target) createHandle(sidebar, target);
	}
}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', mountHandles, { once: true });
} else {
	mountHandles();
}
desktopLayout.addEventListener('change', mountHandles);
document.addEventListener('astro:after-swap', () => {
	restoreSavedWidths();
	mountHandles();
	if (pointerPosition) hoveredSidebar = findSidebarAt(pointerPosition.x, pointerPosition.y);
});
