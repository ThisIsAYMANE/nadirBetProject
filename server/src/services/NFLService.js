import fetch from 'node-fetch';

const BASE_URL = process.env.NFL_API_BASE_URL || 'https://v1.american-football.api-sports.io';
const API_KEY = process.env.NFL_API_KEY || '303e4402fcec0c684084b2b79a2b6338';

class NFLService {
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
            throw new Error(`NFL API error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
    }

    _transformGame(game) {
        const teams = game.teams || {};
        const scores = game.scores || {};
        
        const homeTeam = teams.home?.name || 'Home Team';
        const awayTeam = teams.away?.name || 'Away Team';
        
        let status = 'upcoming';
        let isLive = false;
        
        if (game.status?.short === 'IN PLAY' || game.status?.short === 'HALFTIME') {
            status = 'live';
            isLive = true;
        } else if (game.status?.short === 'FINISHED') {
            status = 'finished';
        }

        let homeOdds = 0, drawOdds = 0, awayOdds = 0;
        let markets = [];

        if (game.odds && game.odds.length > 0) {
            const odd = game.odds.find(o => o.bookmaker === 1) || game.odds[0];
            if (odd && odd.h2h) {
                homeOdds = parseFloat(odd.h2h[0]) || 0;
                drawOdds = parseFloat(odd.h2h[1]) || 0;
                awayOdds = parseFloat(odd.h2h[2]) || 0;
                
                if (homeOdds > 0 || drawOdds > 0 || awayOdds > 0) {
                    markets.push({
                        key: 'h2h',
                        name: 'Money Line',
                        outcomes: [
                            { name: homeTeam, price: homeOdds },
                            { name: 'Draw', price: drawOdds },
                            { name: awayTeam, price: awayOdds }
                        ]
                    });
                }
            }
        }
        
        return {
            id: String(game.id),
            homeTeam,
            awayTeam,
            sport: 'american-football_nfl',
            league: game.league?.name || 'NFL',
            startTime: game.date || new Date().toISOString(),
            status,
            isLive,
            homeScore: isLive ? parseInt(scores.home?.points || 0) : undefined,
            awayScore: isLive ? parseInt(scores.away?.points || 0) : undefined,
            odds: { home: homeOdds, draw: drawOdds, away: awayOdds },
            markets
        };
    }

    async getGames(date = null, season = null) {
        const params = {};
        if (date) params.date = date;
        if (season) params.season = season;

        const data = await this._request('/games', params);
        const games = data.response || [];
        
        return games.map(g => this._transformGame(g)).slice(0, 50);
    }

    async getGameDetails(gameId) {
        const data = await this._request('/games', { id: parseInt(gameId) });
        const game = data.response?.[0];
        
        if (!game) {
            throw new Error(`Game not found: ${gameId}`);
        }

        // Fetch odds for detailed game
        const oddsData = await this._request('/odds', { game: parseInt(gameId) });
        const oddsResponse = oddsData.response?.[0];
        
        const matchBase = this._transformGame(game);
        
        if (oddsResponse && oddsResponse.odds && oddsResponse.odds.length > 0) {
            const markets = [];
            const bookmaker = oddsResponse.odds.find(o => o.bookmaker === 1) || oddsResponse.odds[0];
            
            if (bookmaker && bookmaker.h2h) {
                const homeOdds = parseFloat(bookmaker.h2h[0]) || 0;
                const drawOdds = parseFloat(bookmaker.h2h[1]) || 0;
                const awayOdds = parseFloat(bookmaker.h2h[2]) || 0;
                
                markets.push({
                    key: 'h2h',
                    name: 'Money Line',
                    outcomes: [
                        { name: matchBase.homeTeam, price: homeOdds },
                        { name: 'Draw', price: drawOdds },
                        { name: matchBase.awayTeam, price: awayOdds }
                    ]
                });
                matchBase.odds = { home: homeOdds, draw: drawOdds, away: awayOdds };
            }
            
            matchBase.markets = markets;
        }
        
        return matchBase;
    }

    async getTeams(season = '2024') {
        const data = await this._request('/teams', { season });
        return data.response || [];
    }

    async getStandings(season = '2024') {
        const data = await this._request('/standings', { season });
        return data.response || [];
    }

    async getFavorites(season = '2024') {
        const data = await this._request('/favorites', { season });
        return data.response || [];
    }
}

export default new NFLService();