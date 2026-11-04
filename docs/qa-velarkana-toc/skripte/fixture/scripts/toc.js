// \0rolldown/runtime.js
var __esmMin = (fn, res, err) => () => {
	if (err) throw err[0];
	try {
		return fn && (res = fn(fn = 0)), res;
	} catch (e) {
		throw err = [e], e;
	}
};
var __commonJSMin = (cb, mod) => () => (mod || (cb((mod = { exports: {} }).exports, mod, mod.exports), cb = null), mod.exports);
// src/scripts/toc.ts
var require_toc = /* @__PURE__ */ __commonJSMin((() => {
	/**
	* Automatisches Seiten-Inhaltsverzeichnis — clientseitige Ergänzung.
	*
	* Wird als gebündeltes `<script>` der Komponente `TableOfContents.astro`
	* ausgeliefert. Grenzen und Regeln: `docs/velarkana-toc/spezifikation.md` §6.5
	* (Scroll-Spy) und §6.11 (nur bei `dynamic` werden IDs ergänzt und die Liste
	* neu aufgebaut); Gestaltung: `docs/velarkana-toc/02-komponenten-spezifikation.md`
	* §4.
	*
	* Bewusste Grenzen:
	*  - kein `preventDefault` auf Ankerlinks und kein eigenes Smooth-Scrolling;
	*    Positionierung und Bewegung übernehmen `scroll-padding-top` und
	*    `scroll-behavior` aus `css/design-system.css` (§6.5 Nr. 9);
	*  - genau ein `aria-current="location"`, zusätzlich die Klasse `is-active`;
	*  - ohne `dynamic` liest das Skript keine Überschriften aus dem DOM und
	*    erzeugt keine IDs; die serverseitige Liste bleibt maßgeblich.
	*
	* Der Slug-Algorithmus wird nur im `dynamic`-Pfad nachgeladen (dynamischer
	* Import), damit der Pilot ohne `github-slugger` im Client-Bundle auskommt.
	*/
	const DESKTOP_QUERY = "(min-width: 1200px)";
	/** Abstand der Scroll-Linie unter dem Header (§6.5 Nr. 1). */
	const SPY_EXTRA_PX = 24;
	/** Überschriften, die kein Verzeichnisziel sind (§6.1 Nr. 3). */
	const SKIP_SELECTOR = ".sr-only, [hidden], [aria-hidden=\"true\"], [data-toc-skip]";
	const SCOPE_SELECTOR = "[data-toc-scope]";
	/** Fragment einer Anker-URL ohne Prozentkodierung; toleriert defekte URLs. */
	function decodeFragment(href) {
		const raw = href.replace(/^#/, "");
		try {
			return decodeURIComponent(raw);
		} catch {
			return raw;
		}
	}
	function readLevels(root) {
		const levels = (root.dataset.tocLevels ?? "").split(",").map((value) => Number.parseInt(value.trim(), 10)).filter((value) => Number.isInteger(value) && value >= 2 && value <= 6);
		return levels.length > 0 ? levels : [2, 3];
	}
	function readMinHeadings(root) {
		const parsed = Number.parseInt(root.dataset.tocMin ?? "", 10);
		return Number.isInteger(parsed) && parsed >= 0 ? parsed : 3;
	}
	/**
	* Baut die Liste aus den Überschriften im Scope neu auf und ergänzt fehlende
	* IDs (§6.11). Die Funktion läuft nur, wenn die Komponente
	* `data-toc-dynamic="true"` gesetzt hat.
	*/
	async function rebuildFromScope(root) {
		const body = root.querySelector("[data-toc-body]");
		const scope = document.querySelector(SCOPE_SELECTOR);
		if (!body || !scope) return false;
		const { buildTocTree, flattenToc, normalizeTocText, renderTocList } = await import("./toc-B-NMyQQ2.js");
		const levels = new Set(readLevels(root));
		const elements = [...scope.querySelectorAll("h2, h3, h4, h5, h6")].filter((heading) => {
			if (!levels.has(Number.parseInt(heading.tagName.slice(1), 10))) return false;
			if (heading.closest(SKIP_SELECTOR)) return false;
			return normalizeTocText(heading.textContent ?? "").length > 0;
		});
		if (elements.length === 0) {
			root.remove();
			return false;
		}
		const existingIds = [...document.querySelectorAll("[id]")].map((element) => element.id);
		const tree = buildTocTree(elements.map((heading) => ({
			depth: Number.parseInt(heading.tagName.slice(1), 10),
			slug: heading.id,
			text: heading.textContent ?? ""
		})), {
			levels: readLevels(root),
			minHeadings: readMinHeadings(root),
			dynamic: true
		}, existingIds);
		if (!tree) {
			root.remove();
			return false;
		}
		flattenToc(tree.items).forEach((node, index) => {
			const heading = elements[index];
			if (heading && !heading.id) heading.id = node.slug;
		});
		body.innerHTML = renderTocList(tree.items);
		return true;
	}
	function collectTargets(root) {
		const targets = [];
		for (const link of root.querySelectorAll(".page-toc__link")) {
			const id = decodeFragment(link.getAttribute("href") ?? "");
			if (!id) continue;
			const heading = document.getElementById(id);
			if (!heading) continue;
			targets.push({
				id,
				heading,
				link
			});
		}
		return targets;
	}
	async function initToc(root) {
		if (root.dataset.tocDynamic === "true") {
			if (!await rebuildFromScope(root)) return;
		}
		const details = root.querySelector("[data-toc-details]");
		const body = root.querySelector("[data-toc-body]");
		const targets = collectTargets(root);
		if (!details || !body || targets.length === 0) return;
		const mediaQuery = window.matchMedia(DESKTOP_QUERY);
		let userToggled = false;
		const headerHeight = () => Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-height")) || 100;
		const applyViewportState = () => {
			if (mediaQuery.matches) {
				if (!details.open) details.open = true;
			} else if (!userToggled) details.open = false;
			updateOverflow();
		};
		let offsets = [];
		const measure = () => {
			offsets = targets.map(({ id, heading }) => ({
				id,
				top: heading.getBoundingClientRect().top + window.scrollY
			}));
		};
		let lastActive = null;
		const setActive = (id) => {
			if (id === lastActive) return;
			lastActive = id;
			let activeLink = null;
			for (const target of targets) if (target.id === id) {
				target.link.setAttribute("aria-current", "location");
				target.link.classList.add("is-active");
				activeLink = target.link;
			} else {
				target.link.removeAttribute("aria-current");
				target.link.classList.remove("is-active");
			}
			if (activeLink && body.clientHeight > 0 && body.scrollHeight > body.clientHeight + 1) {
				const linkBox = activeLink.getBoundingClientRect();
				const bodyBox = body.getBoundingClientRect();
				if (linkBox.top < bodyBox.top || linkBox.bottom > bodyBox.bottom) activeLink.scrollIntoView({
					block: "nearest",
					inline: "nearest",
					behavior: "auto"
				});
			}
		};
		const computeActive = () => {
			const line = window.scrollY + headerHeight() + SPY_EXTRA_PX;
			let activeId = offsets.length > 0 ? offsets[0].id : null;
			for (const item of offsets) if (item.top <= line + 1) activeId = item.id;
			else break;
			if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2 && offsets.length > 0) activeId = offsets[offsets.length - 1].id;
			return activeId;
		};
		let spyLockedUntil = 0;
		let scheduled = false;
		const updateOverflow = () => {
			if (!(body.scrollHeight > body.clientHeight + 1)) {
				body.removeAttribute("data-overflow");
				return;
			}
			const atTop = body.scrollTop <= 1;
			const atEnd = body.scrollTop + body.clientHeight >= body.scrollHeight - 1;
			body.dataset.overflow = atTop ? "bottom" : atEnd ? "top" : "both";
		};
		const runActive = () => {
			if (!scheduled) return;
			scheduled = false;
			if (Date.now() < spyLockedUntil) return;
			const id = computeActive();
			if (id) setActive(id);
			updateOverflow();
		};
		const onScroll = () => {
			if (scheduled) return;
			scheduled = true;
			window.requestAnimationFrame(runActive);
			window.setTimeout(runActive, 120);
		};
		const markHashTarget = () => {
			const id = decodeFragment(window.location.hash);
			if (!id) return false;
			if (!targets.some((target) => target.id === id)) return false;
			setActive(id);
			return true;
		};
		applyViewportState();
		mediaQuery.addEventListener("change", applyViewportState);
		details.addEventListener("toggle", () => {
			userToggled = details.open;
			measure();
			onScroll();
			updateOverflow();
		});
		const onResize = () => {
			measure();
			onScroll();
		};
		window.addEventListener("scroll", onScroll, { passive: true });
		window.addEventListener("resize", onResize, { passive: true });
		window.addEventListener("hashchange", () => {
			spyLockedUntil = 0;
			markHashTarget();
			onScroll();
		});
		body.addEventListener("scroll", updateOverflow, { passive: true });
		root.addEventListener("click", (event) => {
			if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
			const link = event.target instanceof Element ? event.target.closest(".page-toc__link") : null;
			if (!(link instanceof HTMLAnchorElement)) return;
			if (!mediaQuery.matches) details.open = false;
			const id = decodeFragment(link.getAttribute("href") ?? "");
			const target = document.getElementById(id);
			if (!target) return;
			window.setTimeout(() => {
				target.setAttribute("tabindex", "-1");
				target.focus({ preventScroll: true });
			}, 0);
		});
		if ("ResizeObserver" in window) {
			new ResizeObserver(updateOverflow).observe(body);
			const scope = document.querySelector(SCOPE_SELECTOR);
			if (scope) new ResizeObserver(onResize).observe(scope);
		}
		measure();
		if (window.location.hash && markHashTarget()) spyLockedUntil = Date.now() + 700;
		else setActive(computeActive() ?? targets[0].id);
		if (document.fonts?.ready) document.fonts.ready.then(() => {
			measure();
			onScroll();
		});
	}
	for (const root of document.querySelectorAll("[data-toc]")) initToc(root);
}));
export default require_toc();
export { __esmMin as t };
