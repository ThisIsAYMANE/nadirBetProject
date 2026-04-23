import fetch from 'node-fetch';
import db from '../database/db.js';

const BASE_URL = process.env.SPORTMONKS_API_URL || 'https://api.sportmonks.com/v3';

class SportMonksSyncService {
    constructor() {
        this.apiKey = process.env.SPORTMONKS_TOKEN;
    }

    getHeaders() {
        if (!this.apiKey) {
            console.warn('⚠️ SPORTMONKS_TOKEN is not set. Service operations will fail.');
        }
        return {
            'Authorization': this.apiKey, // Assuming v3 accepts header auth or query param
            'Accept': 'application/json'
        };
    }

    async _fetchPaginated(endpoint, options = {}) {
        if (!this.apiKey) throw new Error('SPORTMONKS_API_KEY is missing');

        let allData = [];
        let page = 1;
        let hasMore = true;

        const includes = options.include ? `&include=${options.include}` : '';

        while (hasMore) {
            const url = `${BASE_URL}${endpoint}${endpoint.includes('?') ? '&' : '?'}api_token=${this.apiKey}&page=${page}${includes}`;
            console.log(`[SportMonks Sync] Fetching ${url}`);

            try {
                const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
                if (!res.ok) {
                    throw new Error(`SportMonks API Error ${res.status}: ${await res.text()}`);
                }

                const json = await res.json();
                const data = json.data || [];
                allData = allData.concat(data);

                const pagination = json.pagination;
                if (pagination && pagination.has_more) {
                    page++;
                } else {
                    hasMore = false;
                }

                // Rate limiting consideration (e.g. max 3000 requests/hour depending on plan)
                // Add a small delay if needed here.
            } catch (err) {
                console.error(`[SportMonks Sync] Error fetching page ${page}:`, err);
                throw err;
            }
        }

        return allData;
    }

    async syncContinents() {
        console.log('🔄 Syncing Continents...');
        const data = await this._fetchPaginated('/core/continents');

        db.transaction(() => {
            const stmt = db.prepare('INSERT OR REPLACE INTO sm_continents (id, name, code, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)');
            for (const item of data) {
                stmt.run(item.id, item.name, item.code || null);
            }
        });
        console.log(`✅ Synced ${data.length} Continents`);
        return data.length;
    }

    async syncCountries() {
        console.log('🔄 Syncing Countries...');
        const data = await this._fetchPaginated('/core/countries');

        db.transaction(() => {
            const stmt = db.prepare('INSERT OR REPLACE INTO sm_countries (id, continent_id, name, image_path, updated_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)');
            for (const item of data) {
                stmt.run(item.id, item.continent_id || null, item.name, item.image_path || null);
            }
        });
        console.log(`✅ Synced ${data.length} Countries`);
        return data.length;
    }

    async syncLeagues() {
        console.log('🔄 Syncing Leagues...');
        const data = await this._fetchPaginated('/football/leagues');

        db.transaction(() => {
            const stmt = db.prepare('INSERT OR REPLACE INTO sm_leagues (id, country_id, name, active, type, image_path, updated_at) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)');
            for (const item of data) {
                stmt.run(item.id, item.country_id || null, item.name, item.active ? 1 : 0, item.type || null, item.image_path || null);
            }
        });
        console.log(`✅ Synced ${data.length} Leagues`);
        return data.length;
    }

    async syncMarkets() {
        // Sportmonks Bookmakers & Markets are usually under /odds/markets
        console.log('🔄 Syncing Markets...');
        const data = await this._fetchPaginated('/football/markets');

        db.transaction(() => {
            const stmt = db.prepare('INSERT OR REPLACE INTO sm_markets (id, name, description, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)');
            for (const item of data) {
                stmt.run(item.id, item.name, item.description || null);
            }
        });
        console.log(`✅ Synced ${data.length} Markets`);
        return data.length;
    }

    async syncBookmakers() {
        console.log('🔄 Syncing Bookmakers...');
        const data = await this._fetchPaginated('/football/bookmakers');

        db.transaction(() => {
            const stmt = db.prepare('INSERT OR REPLACE INTO sm_bookmakers (id, name, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)');
            for (const item of data) {
                stmt.run(item.id, item.name);
            }
        });
        console.log(`✅ Synced ${data.length} Bookmakers`);
        return data.length;
    }

    // Full Sync Orchestrator
    async syncAllCoreData() {
        console.log('🚀 Starting Full SportMonks Core Sync...');
        try {
            await this.syncContinents();
            await this.syncCountries();
            await this.syncLeagues();
            await this.syncMarkets();
            await this.syncBookmakers();
            console.log('🎉 Full SportMonks Core Sync Complete!');
        } catch (err) {
            console.error('❌ Full Sync Failed:', err);
        }
    }
}

export default new SportMonksSyncService();
