import fetch from 'node-fetch';
import { transformSportMonksOdds } from '../utils/transformSportMonksOdds.js';

const BASE_URL = process.env.SPORTMONKS_API_URL || 'https://api.sportmonks.com/v3';

class SportMonksProxyService {
    constructor() {
        this.apiKey = process.env.SPORTMONKS_TOKEN;
    }

    /**
     * Transforms a SportMonks v3 fixture into the frontend Match interface
     * @param {Object} fixture - Raw SportMonks fixture
     */
    _transformFixture(fixture) {
        // Determine status
        // SportMonks states: NS (Not Started), LIVE, HT, FT, etc.
        const stateName = fixture.state?.name || 'NS';
        let status = 'upcoming';
        let isLive = false;

        if (['LIVE', 'HT', 'ET', 'PEN', 'BREAK'].includes(stateName)) {
            status = 'live';
            isLive = true;
        } else if (['FT', 'AET', 'FT_PEN'].includes(stateName)) {
            status = 'finished';
        } else if (['CANCL', 'POSTP', 'INT', 'ABAN', 'DELAY'].includes(stateName)) {
            status = 'cancelled';
        }

        // Participants (Teams)
        const participants = fixture.participants || [];
        const homeTeamInfo = participants.find(p => p.meta?.location === 'home') || participants[0];
        const awayTeamInfo = participants.find(p => p.meta?.location === 'away') || participants[1];

        // Scores
        const scores = fixture.scores || [];
        // Current score type is usually 'CURRENT' or 'FT'
        const currentScoreEvent = scores.find(s => s.description === 'CURRENT') || scores[0];
        const homeScore = currentScoreEvent?.score?.participant === 'home' ? currentScoreEvent.score.goals : undefined;
        const awayScore = currentScoreEvent?.score?.participant === 'away' ? currentScoreEvent.score.goals : undefined;

        return {
            id: String(fixture.id),
            homeTeam: homeTeamInfo?.name || 'Unknown Home',
            awayTeam: awayTeamInfo?.name || 'Unknown Away',
            sport: 'football',
            league: fixture.league?.name || 'Unknown League',
            startTime: fixture.starting_at || new Date().toISOString(),
            status,
            isLive,
            homeScore: isLive ? (homeScore || 0) : undefined,
            awayScore: isLive ? (awayScore || 0) : undefined,
            minute: fixture.minute || undefined,
            // Odds will be enriched later if requested, for now return empty or default
            odds: { home: 0, draw: 0, away: 0 }
        };
    }

    /**
     * Fetch fixtures for a specific date
     * @param {string} date - YYYY-MM-DD
     */
    async getFixturesByDate(date) {
        if (!this.apiKey) {
            console.warn('SPORTMONKS_API_KEY is not configured');
            return [];
        }

        const url = `${BASE_URL}/football/fixtures/date/${date}?api_token=${this.apiKey}&include=participants;state;league;scores`;

        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error(`API error: ${res.status}`);
            const json = await res.json();

            const rawFixtures = json.data || [];
            return rawFixtures.map(f => this._transformFixture(f));
        } catch (err) {
            console.error('[SportMonksProxyService] getFixturesByDate Error:', err);
            return [];
        }
    }

    /**
     * Fetch currently live fixtures
     */
    async getLiveFixtures() {
        if (!this.apiKey) {
            console.warn('SPORTMONKS_API_KEY is not configured');
            return [];
        }

        const url = `${BASE_URL}/football/fixtures/schedules/live?api_token=${this.apiKey}&include=participants;state;league;scores;minute`;

        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error(`API error: ${res.status}`);
            const json = await res.json();

            const rawFixtures = json.data || [];
            return rawFixtures.map(f => this._transformFixture(f));
        } catch (err) {
            console.error('[SportMonksProxyService] getLiveFixtures Error:', err);
            return [];
        }
    }

    /**
     * Fetch detailed fixture data (including odds, events, stats, lineups)
     * @param {string} fixtureId 
     */
    async getFixtureDetails(fixtureId) {
        if (!this.apiKey) {
            throw new Error('SPORTMONKS_API_KEY is not configured');
        }

        try {
            // 1. Fetch the match details
            const matchUrl = `${BASE_URL}/football/fixtures/${fixtureId}?api_token=${this.apiKey}&include=participants;state;league;scores;events;lineups.details;statistics`;
            const matchRes = await fetch(matchUrl);
            if (!matchRes.ok) throw new Error(`API error fetching fixture: ${matchRes.status}`);
            const matchJson = await matchRes.json();

            const rawFixture = matchJson.data;
            if (!rawFixture) throw new Error("Fixture not found");

            const matchBase = this._transformFixture(rawFixture);

            // Extract detailed info
            matchBase.events = rawFixture.events || [];
            matchBase.lineups = rawFixture.lineups || [];
            matchBase.statistics = rawFixture.statistics || [];

            // 2. Fetch the pre-match odds
            const oddsUrl = `${BASE_URL}/football/odds/pre-match/fixtures/${fixtureId}?api_token=${this.apiKey}`;
            const oddsRes = await fetch(oddsUrl);
            let markets = [];
            if (oddsRes.ok) {
                const oddsJson = await oddsRes.json();
                const rawOdds = oddsJson.data || [];
                // Extract raw markets array from the response. Typically SportMonks returns them nested under bookmakers.
                // We'll pass the raw data and let transformSportMonksOdds flatten it.
                markets = transformSportMonksOdds(rawOdds, matchBase.homeTeam, matchBase.awayTeam);
            }

            matchBase.markets = markets;

            // Extract primary odds manually if H2H is present to put in base `odds` obj
            const h2hMarket = markets.find(m => m.key === 'h2h');
            if (h2hMarket) {
                const homeOdds = h2hMarket.outcomes.find(o => o.name === matchBase.homeTeam)?.price || 0;
                const drawOdds = h2hMarket.outcomes.find(o => o.name === 'Draw')?.price || 0;
                const awayOdds = h2hMarket.outcomes.find(o => o.name === matchBase.awayTeam)?.price || 0;
                matchBase.odds = { home: homeOdds, draw: drawOdds, away: awayOdds };
            }

            return matchBase;
        } catch (err) {
            console.error('[SportMonksProxyService] getFixtureDetails Error:', err);
            throw err;
        }
    }
}

export default new SportMonksProxyService();
