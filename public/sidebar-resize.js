const root = document.documentElement;
const desktopLayout = window.matchMedia('(min-width: 72rem)');
const property = '--ikdlx-left-sidebar-width';
const storageKey = 'ikdlx-left-sidebar-width';
const defaultWidth = 300;
const minWidth = 240;
const maxWidth = 400;

function clamp(width) {
	return Math.min(maxWidth, Math.max(minWidth, Math.round(width)));
}

function getSavedWidth() {
	try {
		const savedWidth = localStorage.getItem(storageKey);
		if (savedWidth !== null && Number.isFinite(Number(savedWidth))) return clamp(Number(savedWidth));
	} catch {}
	return defaultWidth;
}

function getRenderedWidth(target) {
	return Math.round(target.getBoundingClientRect().width);
}

function applyWidth(target, handle, width, persist) {
	const nextWidth = clamp(width);
	root.style.setProperty(property, `${nextWidth}px`);
	handle.setAttribute('aria-valuenow', String(getRenderedWidth(target)));
	if (persist) {
		try {
			localStorage.setItem(storageKey, String(nextWidth));
		} catch {}
	}
}

function mountHandle() {
	if (!desktopLayout.matches) return;
	const target = document.querySelector('.sidebar-pane');
	if (!target || target.querySelector('.ikdlx-left-sidebar-resizer')) return;

	const handle = document.createElement('button');
	handle.type = 'button';
	handle.className = 'ikdlx-left-sidebar-resizer';
	handle.setAttribute('role', 'separator');
	handle.setAttribute('aria-orientation', 'vertical');
	handle.setAttribute('aria-label', 'Resize navigation sidebar');
	handle.setAttribute('aria-valuemin', String(minWidth));
	handle.setAttribute('aria-valuemax', String(maxWidth));
	handle.setAttribute('aria-valuenow', String(getRenderedWidth(target)));
	handle.title = 'Drag to resize, use Left/Right arrows, or double-click to reset';

	let drag;
	handle.addEventListener('pointerdown', (event) => {
		if (event.button !== 0) return;
		event.preventDefault();
		drag = { pointerId: event.pointerId, startX: event.clientX, startWidth: getRenderedWidth(target) };
		handle.setPointerCapture(event.pointerId);
	});

	handle.addEventListener('pointermove', (event) => {
		if (!drag || drag.pointerId !== event.pointerId) return;
		applyWidth(target, handle, drag.startWidth + event.clientX - drag.startX, false);
	});

	function finishDrag(event) {
		if (!drag || drag.pointerId !== event.pointerId) return;
		try {
			handle.releasePointerCapture(event.pointerId);
		} catch {}
		applyWidth(target, handle, getRenderedWidth(target), true);
		drag = undefined;
	}

	handle.addEventListener('pointerup', finishDrag);
	handle.addEventListener('pointercancel', finishDrag);
	handle.addEventListener('keydown', (event) => {
		const currentWidth = getRenderedWidth(target);
		if (event.key === 'ArrowRight') applyWidth(target, handle, currentWidth + 12, true);
		else if (event.key === 'ArrowLeft') applyWidth(target, handle, currentWidth - 12, true);
		else if (event.key === 'Home') applyWidth(target, handle, minWidth, true);
		else if (event.key === 'End') applyWidth(target, handle, maxWidth, true);
		else return;
		event.preventDefault();
	});

	handle.addEventListener('dblclick', () => {
		root.style.removeProperty(property);
		try {
			localStorage.removeItem(storageKey);
		} catch {}
		handle.setAttribute('aria-valuenow', String(getRenderedWidth(target)));
	});

	target.append(handle);
}

function restoreWidth() {
	root.style.setProperty(property, `${getSavedWidth()}px`);
}

restoreWidth();
if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', mountHandle, { once: true });
} else {
	mountHandle();
}
desktopLayout.addEventListener('change', mountHandle);
document.addEventListener('astro:after-swap', () => {
	restoreWidth();
	mountHandle();
});
