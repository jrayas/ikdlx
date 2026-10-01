import { pagefindUserConfig } from 'virtual:starlight/pagefind-config';

const mountedSearches = new WeakSet();
const mountingSearches = new WeakSet();

async function mountPagefind() {
	const element = document.querySelector('#starlight__search');
	const search = element?.closest('site-search');
	if (!element || !search || mountedSearches.has(element) || mountingSearches.has(element)) return;

	mountingSearches.add(element);
	try {
		const { PagefindUI } = await import('@pagefind/default-ui');
		let translations = {};
		try {
			translations = JSON.parse(search.dataset.translations || '{}');
		} catch {}

		const formatURL = search.hasAttribute('data-strip-trailing-slash')
			? (path) => path.replace(/(.)\/(#.*)?$/, '$1$2')
			: (path) => path;

		new PagefindUI({
			...pagefindUserConfig,
			element: '#starlight__search',
			baseUrl: import.meta.env.BASE_URL,
			bundlePath: import.meta.env.BASE_URL.replace(/\/$/, '') + '/pagefind/',
			showImages: false,
			translations,
			showSubResults: true,
			processResult: (result) => {
				result.url = formatURL(result.url);
				result.sub_results = result.sub_results.map((subResult) => ({
					...subResult,
					url: formatURL(subResult.url),
				}));
				return result;
			},
		});
		mountedSearches.add(element);
	} finally {
		mountingSearches.delete(element);
	}
}

document.addEventListener('astro:page-load', mountPagefind);
if (document.readyState === 'complete') {
	void mountPagefind();
} else {
	document.addEventListener('DOMContentLoaded', () => void mountPagefind(), { once: true });
}