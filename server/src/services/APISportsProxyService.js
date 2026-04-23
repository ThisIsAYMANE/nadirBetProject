import fetch from 'node-fetch';

const BASE_URL = process.env.APISPORTS_BASE_URL || 'https://v3.football.api-sports.io';
const API_KEY = process.env.APISPORTS_API_KEY || '303e4402fcec0c684084b2b79a2b6338';

class APISportsProxyService {
    constructor() {
        this.apiKey = API_KEY;
    }

    getHeaders() {
        return {
            'x-apisports-key': this.apiKey,
            'Accept': 'application/json'
        };
    }

    async _request(endpoint, params = {}) {
        const url = new URL(`${BASE_URL}${endpoint}`);
        
        if (Object.keys(params).length > 0) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    url.searchParams.append(key, String(value));
                }
            });
        }

        const response = await fetch(url.toString(), {
            headers: this.getHeaders()
        });

        if (!response.ok) {
            throw new Error(`API-Sports error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
    }

    /**
     * Transform API-Sports fixture to frontend Match interface
     */
    _transformFixture(fixture) {
        const teams = fixture.teams || {};
        const scores = fixture.scores || {};
        const time = fixture.time || {};
        
        const homeTeam = teams.home?.name || 'Home Team';
        const awayTeam = teams.away?.name || 'Away Team';
        
        let status = 'upcoming';
        let isLive = false;
        
        if (['LIVE', 'HT', 'ET', 'PEN', 'BREAK', '1H', '2H'].includes(time.status)) {
            status = 'live';
            isLive = true;
        } else if (['FT', 'AET', 'PEN'].includes(time.status)) {
            status = 'finished';
        }

        let homeOdds = 0, drawOdds = 0, awayOdds = 0;

        if (fixture.odds && fixture.odds.length > 0) {
            const odd = fixture.odds.find(o => o.bookmaker === 1) || fixture.odds[0];
            if (odd && odd.h2h) {
                homeOdds = parseFloat(odd.h2h[0]) || 0;
                drawOdds = parseFloat(odd.h2h[1]) || 0;
                awayOdds = parseFloat(odd.h2h[2]) || 0;
            }
        }
        
        return {
            id: String(fixture.fixture?.id || fixture.id),
            homeTeam,
            awayTeam,
            sport: 'football',
            league: fixture.league?.name || 'Unknown League',
            startTime: fixture.fixture?.date || new Date().toISOString(),
            status,
            isLive,
            homeScore: isLive ? parseInt(scores.home || 0) : undefined,
            awayScore: isLive ? parseInt(scores.away || 0) : undefined,
            minute: time.minute,
            odds: {
                home: homeOdds,
                draw: drawOdds,
                away: awayOdds
            },
            markets: (homeOdds > 0 || drawOdds > 0 || awayOdds > 0) ? [
                { key: 'h2h', name: 'Match Winner', outcomes: [
                    { name: homeTeam, price: homeOdds },
                    { name: 'Draw', price: drawOdds },
                    { name: awayTeam, price: awayOdds }
                ]}
            ] : []
        };
    }

    /**
     * Get fixtures for a specific date and optional league
     * @param {string} date - YYYY-MM-DD format
     * @param {number} league - Optional league ID
     */
    async getFixtures(date, league = null) {
        const params = {
            date,
            league: league ? parseInt(league) : undefined,
            timezone: 'utc'
        };

        console.log(`[APISports] Request params:`, JSON.stringify(params));
        
        const data = await this._request('/fixtures', params);
        const fixtures = data.response || [];
        
        console.log(`[APISports] Got ${fixtures.length} fixtures for ${date}`);
        
        const transformed = fixtures.map(f => this._transformFixture(f));
        
        const withOdds = transformed.filter(f => f.odds && (f.odds.home > 0 || f.odds.draw > 0 || f.odds.away > 0));
        console.log(`[APISports] Matches with odds: ${withOdds.length}`);
        
        return withOdds;
    }

    /**
     * Get live fixtures (matches currently in progress)
     */
    async getLiveFixtures() {
        const params = {
            live: 'all',
            timezone: 'utc'
        };

        const data = await this._request('/fixtures', params);
        const fixtures = data.response || [];
        
        const transformed = fixtures.map(f => this._transformFixture(f));
        
        return transformed.filter(f => f.odds && (f.odds.home > 0 || f.odds.draw > 0 || f.odds.away > 0));
    }

    /**
     * Get detailed fixture information including odds
     * @param {string|number} fixtureId 
     */
    async getFixtureDetails(fixtureId) {
        const fixtureIdNum = typeof fixtureId === 'string' ? parseInt(fixtureId) : fixtureId;
        console.log(`[APISports] Getting fixture details for ID: ${fixtureIdNum}`);

        const fixtureData = await this._request('/fixtures', { id: fixtureIdNum });
        const fixture = fixtureData.response?.[0];
        
        if (!fixture) {
            console.log(`[APISports] Fixture not found: ${fixtureId}`);
            throw new Error(`Fixture not found: ${fixtureId}`);
        }

        console.log(`[APISports] Got fixture: ${fixture.teams?.home?.name} vs ${fixture.teams?.away?.name}`);
        
        const matchBase = this._transformFixture(fixture);
        console.log(`[APISports] Transformed match, odds:`, matchBase.odds);

        try {
            const oddsData = await this._request('/odds', { fixture: fixtureIdNum });
            const oddsResponse = oddsData.response?.[0];
            
            console.log(`[APISports] Odds response:`, oddsResponse ? 'has data' : 'empty');
            console.log(`[APISports] Bookmakers:`, oddsResponse?.bookmakers?.length || 0);
            
            const markets = [];
            
            if (oddsResponse && oddsResponse.bookmakers && oddsResponse.bookmakers.length > 0) {
                const bookmaker = oddsResponse.bookmakers.find(b => b.id === 1) || oddsResponse.bookmakers[0];
                console.log(`[APISports] Found bookmaker:`, bookmaker?.name, 'with', bookmaker?.bets?.length, 'bets');
                
                if (bookmaker && bookmaker.bets) {
                    for (const bet of bookmaker.bets) {
                        if (!bet.values || bet.values.length === 0) continue;
                        
                        const values = bet.values;
                        
                        if (bet.name === 'Match Winner') {
                            const homeOdd = parseFloat(values.find(v => v.value === 'Home')?.odd) || 0;
                            const drawOdd = parseFloat(values.find(v => v.value === 'Draw')?.odd) || 0;
                            const awayOdd = parseFloat(values.find(v => v.value === 'Away')?.odd) || 0;
                            if (homeOdd > 0 || drawOdd > 0 || awayOdd > 0) {
                                markets.push({
                                    key: 'h2h',
                                    name: 'Match Winner',
                                    outcomes: [
                                        { name: matchBase.homeTeam, price: homeOdd },
                                        { name: 'Draw', price: drawOdd },
                                        { name: matchBase.awayTeam, price: awayOdd }
                                    ]
                                });
                                if (!matchBase.odds.home) {
                                    matchBase.odds = { home: homeOdd, draw: drawOdd, away: awayOdd };
                                }
                            }
                        }
                        else if (bet.name === 'Double Chance') {
                            const homeDrawOdd = parseFloat(values.find(v => v.value === 'Home/Draw')?.odd) || 0;
                            const homeAwayOdd = parseFloat(values.find(v => v.value === 'Home/Away')?.odd) || 0;
                            const awayDrawOdd = parseFloat(values.find(v => v.value === 'Draw/Away')?.odd) || 0;
                            if (homeDrawOdd > 0 || homeAwayOdd > 0 || awayDrawOdd > 0) {
                                markets.push({
                                    key: 'double_chance',
                                    name: 'Double Chance',
                                    outcomes: [
                                        { name: `${matchBase.homeTeam} or Draw`, price: homeDrawOdd },
                                        { name: `${matchBase.homeTeam} or ${matchBase.awayTeam}`, price: homeAwayOdd },
                                        { name: `${matchBase.awayTeam} or Draw`, price: awayDrawOdd }
                                    ]
                                });
                            }
                        }
                        else if (bet.name === 'Both Teams Score') {
                            const yesOdd = parseFloat(values.find(v => v.value === 'Yes')?.odd) || 0;
                            const noOdd = parseFloat(values.find(v => v.value === 'No')?.odd) || 0;
                            if (yesOdd > 0 || noOdd > 0) {
                                markets.push({
                                    key: 'btts',
                                    name: 'Both Teams To Score',
                                    outcomes: [
                                        { name: 'Yes', price: yesOdd },
                                        { name: 'No', price: noOdd }
                                    ]
                                });
                            }
                        }
                        else if (bet.name === 'Goals Over/Under') {
                            const overOdd = parseFloat(values.find(v => v.value === 'Over 2.5')?.odd) || 0;
                            const underOdd = parseFloat(values.find(v => v.value === 'Under 2.5')?.odd) || 0;
                            if (overOdd > 0 || underOdd > 0) {
                                markets.push({
                                    key: 'totals',
                                    name: 'Total 2.5 Goals',
                                    outcomes: [
                                        { name: 'Over 2.5', price: overOdd },
                                        { name: 'Under 2.5', price: underOdd }
                                    ]
                                });
                            }
                        }
                        else if (bet.name === 'Asian Handicap') {
                            const homeLine = values.find(v => v.value?.includes('Home'));
                            const awayLine = values.find(v => v.value?.includes('Away'));
                            if (homeLine && awayLine) {
                                const homeOdd = parseFloat(homeLine.odd) || 0;
                                const awayOdd = parseFloat(awayLine.odd) || 0;
                                if (homeOdd > 0 || awayOdd > 0) {
                                    const line = homeLine.value?.replace('Home ', '') || '0';
                                    markets.push({
                                        key: 'spreads',
                                        name: `Asian Handicap ${line}`,
                                        outcomes: [
                                            { name: matchBase.homeTeam, price: homeOdd },
                                            { name: matchBase.awayTeam, price: awayOdd }
                                        ]
                                    });
                                }
                            }
                        }
                    }
                }
            }
            
            if (markets.length > 0) {
                matchBase.markets = markets;
            }
        } catch (err) {
            console.warn('[APISportsProxy] Could not fetch odds:', err.message);
        }

        return matchBase;
    }

    /**
     * Get available leagues
     * @param {string} country - Optional country code
     * @param {number} season - Optional season year
     */
    async getLeagues(country = null, season = null) {
        const params = {};
        
        if (country) params.country = country;
        if (season) params.season = season;
        if (!country && !season) params.current = 'true';

        const data = await this._request('/leagues', params);
        return data.response || [];
    }

    /**
     * Get teams for a league/season
     * @param {number} league - League ID
     * @param {number} season - Season year
     */
    async getTeams(league, season) {
        const params = { league, season };
        
        const data = await this._request('/teams', params);
        return data.response || [];
    }

    /**
     * Get standings for a league/season
     * @param {number} league - League ID
     * @param {number} season - Season year
     */
    async getStandings(league, season) {
        const params = { league, season };
        
        const data = await this._request('/standings', params);
        return data.response || [];
    }

    /**
     * Get head-to-head fixtures between two teams
     * @param {number} team1Id 
     * @param {number} team2Id 
     */
    async getHeadToHead(team1Id, team2Id) {
        const params = { h2h: `${team1Id}-${team2Id}` };
        
        const data = await this._request('/fixtures', params);
        const fixtures = data.response || [];
        
        return fixtures.map(f => this._transformFixture(f));
    }

    /**
     * Get API status (remaining requests, etc.)
     */
    async getStatus() {
        const data = await this._request('/status');
        return data.response || [];
    }
}

export default new APISportsProxyService();