import fetch from 'node-fetch';

const BASE_URL = process.env.NBA_API_BASE_URL || 'https://v2.nba.api-sports.io';
const API_KEY = process.env.NBA_API_KEY || '303e4402fcec0c684084b2b79a2b6338';

class NBAService {
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
            throw new Error(`NBA API error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
    }

    _transformGame(game) {
        const teams = game.teams || {};
        const scores = game.scores || {};
        
        // NBA API uses "home" and "visitors" instead of "home" and "away"
        const homeTeam = teams.home?.name || 'Home Team';
        const awayTeam = teams.visitors?.name || 'Away Team';
        
        let status = 'upcoming';
        let isLive = false;
        
        // NBA status: 1=NS (Not Started), 2=Live, 3=Finished, 4=Postponed, etc.
        if (game.status?.short === 2) {
            status = 'live';
            isLive = true;
        } else if (game.status?.short === 3) {
            status = 'finished';
        }

        const homeScore = parseInt(scores.home?.points || 0);
        const awayScore = parseInt(scores.visitors?.points || 0);
        
        // NBA API doesn't provide odds - we need a different source
        // For now, show games without odds so users can see upcoming games
        const hasOdds = false;
        
        return {
            id: String(game.id),
            homeTeam,
            awayTeam,
            sport: 'basketball_nba',
            league: 'NBA',
            startTime: game.date?.start || new Date().toISOString(),
            status,
            isLive,
            homeScore: homeScore > 0 ? homeScore : undefined,
            awayScore: awayScore > 0 ? awayScore : undefined,
            odds: {
                home: 0,
                away: 0
            },
            markets: []
        };
    }

    async getGames(date = null, season = '2024') {
        const params = { season };
        if (date) params.date = date;

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

        return this._transformGame(game);
    }

    async getTeams(season = '2024') {
        const data = await this._request('/teams', { season });
        return data.response || [];
    }

    async getStandings(season = '2024') {
        const data = await this._request('/standings', { season });
        return data.response || [];
    }
}

export default new NBAService();