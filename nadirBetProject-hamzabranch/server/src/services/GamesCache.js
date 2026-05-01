import casinoApiService from './CasinoApiService.js';

const SLOTEGRATOR_MAX_PER_PAGE = 50;
const REFRESH_INTERVAL_MS = 4 * 60 * 60 * 1000; // 4 hours
const MAX_PAGES = 500; // safety limit (~25,000 games max)

class GamesCache {
    constructor() {
        this.allGames = [];       // full flattened game list
        this.isReady = false;     // true once first full load completes
        this.isLoading = false;   // true while a load is in progress
        this.loadedAt = null;     // Date of last successful load
        this.totalPages = 0;
        this.loadedPages = 0;
        this.loadingCount = 0;    // games collected so far (during warm-up)
        this._refreshTimer = null;
    }

    /**
     * Start loading all games in the background.
     * Safe to call multiple times — ignores if already loading.
     */
    startLoading() {
        if (this.isLoading) return;
        this._loadAll().catch((err) => {
            console.error('[GamesCache] Background load failed:', err.message);
            this.isLoading = false;
        });
        // Schedule periodic refresh
        if (!this._refreshTimer) {
            this._refreshTimer = setInterval(() => {
                console.log('[GamesCache] Starting scheduled refresh...');
                this._loadAll().catch((err) =>
                    console.error('[GamesCache] Scheduled refresh failed:', err.message)
                );
            }, REFRESH_INTERVAL_MS);
        }
    }

    async _loadAll() {
        this.isLoading = true;
        this.loadedPages = 0;
        this.loadingCount = 0;
        console.log('[GamesCache] Starting parallel game catalog load...');

        // How many pages to fetch at once.
        // Staging allows 100 req/s; production allows 1 req/s.
        // Use 10 for a safe balance that works on both.
        const BATCH_SIZE = 10;

        try {
            // ── Step 1: fetch page 1 to discover total page count ──────────────
            const firstResponse = await casinoApiService.getGames({
                page: 1,
                perPage: SLOTEGRATOR_MAX_PER_PAGE,
                expand: 'tags,parameters,images',
            });

            const firstItems = firstResponse.items || [];
            if (firstItems.length === 0) {
                console.warn('[GamesCache] Page 1 returned 0 games — aborting load.');
                this.isLoading = false;
                return;
            }

            // Commit page 1 immediately so the cache is partially usable right away
            this.allGames = [...firstItems];
            this.loadingCount = this.allGames.length;
            this.loadedPages = 1;
            this.isReady = true; // partial data is better than nothing
            this.loadedAt = new Date();

            const totalPageCount = Math.min(
                firstResponse._meta?.pageCount ?? MAX_PAGES,
                MAX_PAGES
            );
            console.log(`[GamesCache] Page 1 loaded (${firstItems.length} games). Total pages: ${totalPageCount}. Fetching remaining pages in batches of ${BATCH_SIZE}...`);

            // ── Step 2: fetch all remaining pages in parallel batches ───────────
            const remainingPages = [];
            for (let p = 2; p <= totalPageCount; p++) remainingPages.push(p);

            for (let i = 0; i < remainingPages.length; i += BATCH_SIZE) {
                const batch = remainingPages.slice(i, i + BATCH_SIZE);

                const batchResults = await Promise.all(
                    batch.map((p) =>
                        casinoApiService.getGames({
                            page: p,
                            perPage: SLOTEGRATOR_MAX_PER_PAGE,
                            expand: 'tags,parameters,images',
                        }).catch((err) => {
                            console.warn(`[GamesCache] Page ${p} failed: ${err.message}`);
                            return { items: [] };
                        })
                    )
                );

                // Merge batch results into the live cache immediately
                const batchGames = batchResults.flatMap((r) => r.items || []);
                this.allGames = [...this.allGames, ...batchGames];
                this.loadedPages = batch[batch.length - 1];
                this.loadingCount = this.allGames.length;
                this.loadedAt = new Date();

                const pagesLoaded = 1 + i + batch.length;
                console.log(`[GamesCache] Batch done — ${this.allGames.length} games loaded (pages 1–${this.loadedPages} of ${totalPageCount})`);

                // Stop early if any batch returned a truly partial page
                // (means no more data even if pageCount said more existed)
                const anyPartial = batchResults.some(
                    (r) => (r.items || []).length > 0 && (r.items || []).length < SLOTEGRATOR_MAX_PER_PAGE
                );
                if (anyPartial && pagesLoaded >= totalPageCount - BATCH_SIZE) break;
            }

            this.totalPages = this.loadedPages;
            console.log(
                `[GamesCache] ✅ Fully loaded — ${this.allGames.length} games from ${this.loadedPages} pages (${new Date().toISOString()})`
            );
        } catch (err) {
            console.error(`[GamesCache] Load error:`, err.message);
            // Keep whatever partial data we have — isReady stays true if we got page 1
        } finally {
            this.isLoading = false;
        }
    }


    /**
     * Get filtered + paginated games from cache.
     * @param {object} opts
     * @param {string|null} opts.provider  - provider name (case-insensitive)
     * @param {string|null} opts.device    - 'desktop' | 'mobile'
     * @param {string|null} opts.type      - game type string
     * @param {number}      opts.page      - 1-based page number
     * @param {number}      opts.perPage   - items per page (max 50)
     * @returns {{ items: object[], _meta: object }}
     */
    getFiltered({ provider = null, device = null, type = null, page = 1, perPage = 50 } = {}) {
        const normalize = (s) => (s == null ? '' : String(s).toLowerCase().trim());

        let results = this.allGames;

        // Provider filter (case-insensitive exact match)
        if (provider) {
            const want = normalize(provider);
            results = results.filter((g) => g.provider && normalize(g.provider) === want);
        }

        // Device filter
        if (device) {
            const isMobile = normalize(device) === 'mobile';
            results = results.filter((g) => (g.is_mobile === 1) === isMobile);
        }

        // Type filter — "Live Casino" also matches games with has_lobby=1
        if (type) {
            const wantType = String(type).trim();
            if (wantType === 'Live Casino') {
                results = results.filter(
                    (g) =>
                        (g.type && String(g.type).toLowerCase().includes('live')) ||
                        g.has_lobby === 1
                );
            } else {
                results = results.filter(
                    (g) => g.type && String(g.type).trim() === wantType
                );
            }
        }

        const totalCount = results.length;
        const targetPerPage = Math.min(perPage, SLOTEGRATOR_MAX_PER_PAGE);
        const pageCount = Math.max(1, Math.ceil(totalCount / targetPerPage));
        const safePage = Math.max(1, Math.min(page, pageCount));
        const skip = (safePage - 1) * targetPerPage;
        const items = results.slice(skip, skip + targetPerPage);

        return {
            items,
            _meta: {
                totalCount,
                pageCount,
                currentPage: safePage,
                perPage: targetPerPage,
            },
            _links: {},
        };
    }

    getStatus() {
        return {
            isReady: this.isReady,
            isLoading: this.isLoading,
            totalGames: this.isReady ? this.allGames.length : this.loadingCount,
            loadedPages: this.loadedPages,
            loadedAt: this.loadedAt ? this.loadedAt.toISOString() : null,
        };
    }
}

export default new GamesCache();
