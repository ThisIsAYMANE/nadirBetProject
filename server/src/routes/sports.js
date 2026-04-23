import express from 'express';
import apiSportsProxyService from '../services/APISportsProxyService.js';
import nbaService from '../services/NBAService.js';
import nflService from '../services/NFLService.js';
import oddsAPIService from '../services/OddsAPIService.js';

const router = express.Router();

/**
 * GET /api/sports/football
 * Returns upcoming fixtures for today (default endpoint for frontend)
 */
router.get('/football', async (req, res) => {
    try {
        const targetDate = req.query.date || new Date().toISOString().split('T')[0];
        const league = req.query.league ? parseInt(req.query.league) : null;
        const matches = await apiSportsProxyService.getFixtures(targetDate, league);
        res.json({ success: true, count: matches.length, matches: matches });
    } catch (error) {
        console.error('Error fetching API-Sports fixtures:', error);
        res.status(500).json({ success: false, error: 'Proxy error fetching fixtures' });
    }
});

/**
 * GET /api/sports/football/fixtures
 * Returns upcoming and recent fixtures for the specified date
 * query param: date (YYYY-MM-DD), default to today
 * query param: league (optional) - filter by league ID
 */
router.get('/football/fixtures', async (req, res) => {
    try {
        const targetDate = req.query.date || new Date().toISOString().split('T')[0];
        const league = req.query.league ? parseInt(req.query.league) : null;
        console.log(`[Sports] Getting fixtures for ${targetDate}, league: ${league}`);
        const matches = await apiSportsProxyService.getFixtures(targetDate, league);
        
        const matchesWithOdds = matches.filter(m => m.odds && (m.odds.home > 0 || m.odds.away > 0));
        console.log(`[Sports] Total matches: ${matches.length}, with odds: ${matchesWithOdds.length}`);
        
        res.json({ success: true, count: matches.length, matches: matches });
    } catch (error) {
        console.error('Error fetching API-Sports fixtures:', error);
        res.status(500).json({ success: false, error: 'Proxy error fetching fixtures' });
    }
});

/**
 * GET /api/sports/football/live
 * Returns currently live fixtures
 */
router.get('/football/live', async (req, res) => {
    try {
        const liveMatches = await apiSportsProxyService.getLiveFixtures();
        res.json({ success: true, count: liveMatches.length, data: liveMatches });
    } catch (error) {
        console.error('Error fetching API-Sports live fixtures:', error);
        res.status(500).json({ success: false, error: 'Proxy error fetching live fixtures' });
    }
});

/**
 * GET /api/sports/football/fixtures/:id
 * Returns detailed match center information including odds
 */
router.get('/football/fixtures/:id', async (req, res) => {
    try {
        const fixtureId = req.params.id;
        console.log(`[Sports] Fetching fixture details for ID: ${fixtureId}`);
        
        const matchData = await apiSportsProxyService.getFixtureDetails(fixtureId);
        
        console.log(`[Sports] Got fixture:`, matchData ? `${matchData.homeTeam} vs ${matchData.awayTeam}` : 'null');

        res.json({ success: true, count: 1, matches: [matchData] });
    } catch (error) {
        console.error(`Error fetching API-Sports fixture details for ${req.params.id}:`, error);
        res.status(500).json({ success: false, error: 'Proxy error fetching fixture details' });
    }
});

/**
 * GET /api/sports/football/leagues
 * Returns available leagues
 * query param: country (optional), season (optional)
 */
router.get('/football/leagues', async (req, res) => {
    try {
        const { country, season } = req.query;
        const leagues = await apiSportsProxyService.getLeagues(country, season ? parseInt(season) : null);
        res.json({ success: true, count: leagues.length, data: leagues });
    } catch (error) {
        console.error('Error fetching API-Sports leagues:', error);
        res.status(500).json({ success: false, error: 'Proxy error fetching leagues' });
    }
});

/**
 * GET /api/sports/football/teams
 * Returns teams for a league/season
 * query param: league (required), season (required)
 */
router.get('/football/teams', async (req, res) => {
    try {
        const { league, season } = req.query;
        if (!league || !season) {
            return res.status(400).json({ success: false, error: 'league and season are required' });
        }
        const teams = await apiSportsProxyService.getTeams(parseInt(league), parseInt(season));
        res.json({ success: true, count: teams.length, data: teams });
    } catch (error) {
        console.error('Error fetching API-Sports teams:', error);
        res.status(500).json({ success: false, error: 'Proxy error fetching teams' });
    }
});

/**
 * GET /api/sports/football/standings
 * Returns standings for a league/season
 * query param: league (required), season (required)
 */
router.get('/football/standings', async (req, res) => {
    try {
        const { league, season } = req.query;
        if (!league || !season) {
            return res.status(400).json({ success: false, error: 'league and season are required' });
        }
        const standings = await apiSportsProxyService.getStandings(parseInt(league), parseInt(season));
        res.json({ success: true, count: standings.length, data: standings });
    } catch (error) {
        console.error('Error fetching API-Sports standings:', error);
        res.status(500).json({ success: false, error: 'Proxy error fetching standings' });
    }
});

/**
 * GET /api/sports/football/h2h
 * Returns head-to-head fixtures between two teams
 * query param: h2h (team1-team2 format)
 */
router.get('/football/h2h', async (req, res) => {
    try {
        const { h2h } = req.query;
        if (!h2h || !h2h.includes('-')) {
            return res.status(400).json({ success: false, error: 'h2h parameter must be in format team1-team2' });
        }
        const [team1, team2] = h2h.split('-').map(Number);
        const fixtures = await apiSportsProxyService.getHeadToHead(team1, team2);
        res.json({ success: true, count: fixtures.length, data: fixtures });
    } catch (error) {
        console.error('Error fetching API-Sports h2h fixtures:', error);
        res.status(500).json({ success: false, error: 'Proxy error fetching h2h fixtures' });
    }
});

/**
 * GET /api/sports/status
 * Returns API status and quota info
 */
router.get('/status', async (req, res) => {
    try {
        const status = await apiSportsProxyService.getStatus();
        res.json({ success: true, data: status });
    } catch (error) {
        console.error('Error fetching API-Sports status:', error);
        res.status(500).json({ success: false, error: 'Proxy error fetching status' });
    }
});

/**
 * GET /api/sports/basketball_nba
 * Returns NBA games for current season
 */
router.get('/basketball_nba', async (req, res) => {
    try {
        const season = req.query.season || '2024';
        const games = await nbaService.getGames(null, season);
        res.json({ success: true, count: games.length, matches: games });
    } catch (error) {
        console.error('Error fetching NBA games:', error);
        res.status(500).json({ success: false, error: 'Proxy error fetching NBA games' });
    }
});

/**
 * GET /api/sports/basketball_nba/games
 * Returns NBA games by date
 */
router.get('/basketball_nba/games', async (req, res) => {
    try {
        const date = req.query.date || null;
        const season = req.query.season || '2024';
        const games = await nbaService.getGames(date, season);
        res.json({ success: true, count: games.length, matches: games });
    } catch (error) {
        console.error('Error fetching NBA games:', error);
        res.status(500).json({ success: false, error: 'Proxy error fetching NBA games' });
    }
});

/**
 * GET /api/sports/basketball_nba/games/:id
 * Returns detailed NBA game information
 */
router.get('/basketball_nba/games/:id', async (req, res) => {
    try {
        const gameId = req.params.id;
        const gameData = await nbaService.getGameDetails(gameId);
        res.json({ success: true, count: 1, matches: [gameData] });
    } catch (error) {
        console.error(`Error fetching NBA game details for ${req.params.id}:`, error);
        res.status(500).json({ success: false, error: 'Proxy error fetching game details' });
    }
});

/**
 * GET /api/sports/basketball_nba/teams
 * Returns NBA teams
 */
router.get('/basketball_nba/teams', async (req, res) => {
    try {
        const season = req.query.season || '2024';
        const teams = await nbaService.getTeams(season);
        res.json({ success: true, count: teams.length, teams });
    } catch (error) {
        console.error('Error fetching NBA teams:', error);
        res.status(500).json({ success: false, error: 'Proxy error fetching NBA teams' });
    }
});

/**
 * GET /api/sports/basketball_nba/standings
 * Returns NBA standings
 */
router.get('/basketball_nba/standings', async (req, res) => {
    try {
        const season = req.query.season || '2024';
        const standings = await nbaService.getStandings(season);
        res.json({ success: true, count: standings.length, standings });
    } catch (error) {
        console.error('Error fetching NBA standings:', error);
        res.status(500).json({ success: false, error: 'Proxy error fetching NBA standings' });
    }
});

/**
 * GET /api/sports/american-football_nfl
 * Returns NFL games for current season
 */
router.get('/american-football_nfl', async (req, res) => {
    try {
        const season = req.query.season || '2024';
        const games = await nflService.getGames(null, season);
        const withOdds = games.filter(g => g.odds && (g.odds.home > 0 || g.odds.draw > 0 || g.odds.away > 0));
        res.json({ success: true, count: withOdds.length, matches: withOdds });
    } catch (error) {
        console.error('Error fetching NFL games:', error);
        res.status(500).json({ success: false, error: 'Proxy error fetching NFL games' });
    }
});

/**
 * GET /api/sports/american-football_nfl/games
 * Returns NFL games by date
 */
router.get('/american-football_nfl/games', async (req, res) => {
    try {
        const date = req.query.date || null;
        const season = req.query.season || '2024';
        const games = await nflService.getGames(date, season);
        const withOdds = games.filter(g => g.odds && (g.odds.home > 0 || g.odds.draw > 0 || g.odds.away > 0));
        res.json({ success: true, count: withOdds.length, matches: withOdds });
    } catch (error) {
        console.error('Error fetching NFL games:', error);
        res.status(500).json({ success: false, error: 'Proxy error fetching NFL games' });
    }
});

/**
 * GET /api/sports/american-football_nfl/games/:id
 * Returns detailed NFL game
 */
router.get('/american-football_nfl/games/:id', async (req, res) => {
    try {
        const gameId = req.params.id;
        const gameData = await nflService.getGameDetails(gameId);
        res.json({ success: true, count: 1, matches: [gameData] });
    } catch (error) {
        console.error(`Error fetching NFL game details for ${req.params.id}:`, error);
        res.status(500).json({ success: false, error: 'Proxy error fetching game details' });
    }
});

/**
 * GET /api/sports/american-football_nfl/teams
 * Returns NFL teams
 */
router.get('/american-football_nfl/teams', async (req, res) => {
    try {
        const season = req.query.season || '2024';
        const teams = await nflService.getTeams(season);
        res.json({ success: true, count: teams.length, teams });
    } catch (error) {
        console.error('Error fetching NFL teams:', error);
        res.status(500).json({ success: false, error: 'Proxy error fetching NFL teams' });
    }
});

/**
 * GET /api/sports/american-football_nfl/standings
 * Returns NFL standings
 */
router.get('/american-football_nfl/standings', async (req, res) => {
    try {
        const season = req.query.season || '2024';
        const standings = await nflService.getStandings(season);
        res.json({ success: true, count: standings.length, standings });
    } catch (error) {
        console.error('Error fetching NFL standings:', error);
        res.status(500).json({ success: false, error: 'Proxy error fetching NFL standings' });
    }
});

/**
 * GET /api/sports/odds-api/basketball_nba
 * Returns NBA odds from The Odds API
 */
router.get('/odds-api/basketball_nba', async (req, res) => {
    try {
        const regions = req.query.regions || 'us';
        const markets = req.query.markets || 'h2h';
        
        const oddsData = await oddsAPIService.getOddsForSport('basketball_nba', {
            regions,
            markets,
            oddsFormat: 'decimal'
        });
        
        const matches = (oddsData || []).map(event => {
            const homeTeam = event.home_team;
            const awayTeam = event.away_team;
            
            let homeOdds = 0, awayOdds = 0;
            const marketOutcomes = [];
            
            if (event.bookmakers && event.bookmakers.length > 0) {
                const bm = event.bookmakers[0];
                const h2h = bm.markets?.find(m => m.key === 'h2h');
                
                if (h2h && h2h.outcomes) {
                    const homeOutcome = h2h.outcomes.find(o => o.name === homeTeam);
                    const awayOutcome = h2h.outcomes.find(o => o.name === awayTeam);
                    
                    homeOdds = parseFloat(homeOutcome?.price) || 0;
                    awayOdds = parseFloat(awayOutcome?.price) || 0;
                    
                    if (homeOdds > 0 || awayOdds > 0) {
                        marketOutcomes.push({
                            key: 'h2h',
                            name: 'Money Line',
                            outcomes: [
                                { name: homeTeam, price: homeOdds },
                                { name: awayTeam, price: awayOdds }
                            ]
                        });
                    }
                }
            }
            
            return {
                id: String(event.id),
                homeTeam,
                awayTeam,
                sport: 'basketball_nba',
                league: 'NBA',
                startTime: event.commence_at || new Date().toISOString(),
                status: 'upcoming',
                isLive: false,
                odds: { home: homeOdds, away: awayOdds },
                markets: marketOutcomes
            };
        }).filter(m => m.markets && m.markets.length > 0);
        
        res.json({ success: true, count: matches.length, matches });
    } catch (error) {
        console.error('Error fetching NBA odds from Odds API:', error);
        res.status(500).json({ success: false, error: 'Proxy error fetching NBA odds' });
    }
});

export default router;
