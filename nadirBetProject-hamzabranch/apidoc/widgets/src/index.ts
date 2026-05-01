import { AxiosInstance } from 'axios';

export interface ApiSportsConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
}

export interface WidgetConfig {
  key: string;
  sport?: string;
  lang?: string;
  theme?: string;
  timezone?: string;
  showLogos?: boolean;
  logoUrl?: string;
  showErrors?: boolean;
  favorite?: boolean;
}

export type WidgetType = 
  | 'config' | 'games' | 'game' | 'league' | 'leagues' 
  | 'standings' | 'team' | 'player' | 'h2h'
  | 'races' | 'race' | 'driver'
  | 'fights' | 'fight' | 'fighter';

export class APISports {
  private client: AxiosInstance;
  public config: WidgetConfig;

  constructor(config: ApiSportsConfig) {
    this.client = require('axios').create({
      baseURL: config.baseUrl || 'https://widgets.api-sports.io/3.1.0',
      timeout: config.timeout || 10000
    });
    this.config = {
      key: config.apiKey,
      sport: 'football',
      lang: 'en',
      theme: 'white',
      timezone: 'utc',
      showLogos: false,
      showErrors: false,
      favorite: false
    };
  }

  setSport(sport: string) { this.config.sport = sport; return this; }
  setLanguage(lang: string) { this.config.lang = lang; return this; }
  setTheme(theme: string) { this.config.theme = theme; return this; }
  setTimezone(timezone: string) { this.config.timezone = timezone; return this; }
  setShowLogos(show: boolean) { this.config.showLogos = show; return this; }
  setLogoUrl(url: string) { this.config.logoUrl = url; return this; }
  setShowErrors(show: boolean) { this.config.showErrors = show; return this; }

  renderWidget(type: WidgetType, params: Record<string, unknown> = {}): string {
    const attrs = Object.entries({ ...this.config, ...params })
      .map(([k, v]) => `data-${k}="${v}"`)
      .join(' ');
    return `<api-sports-widget data-type="${type}" ${attrs}></api-sports-widget>`;
  }

  games(params?: Record<string, unknown>) { return this.renderWidget('games', params); }
  game(gameId: number, params?: Record<string, unknown>) { return this.renderWidget('game', { 'game-id': gameId, ...params }); }
  league(leagueId: number, params?: Record<string, unknown>) { return this.renderWidget('league', { 'data-league': leagueId, ...params }); }
  leagues(params?: Record<string, unknown>) { return this.renderWidget('leagues', params); }
  standings(leagueId: number, season: string, params?: Record<string, unknown>) { 
    return this.renderWidget('standings', { 'data-league': leagueId, 'data-season': season, ...params }); 
  }
  team(teamId: number, params?: Record<string, unknown>) { return this.renderWidget('team', { 'team-id': teamId, ...params }); }
  player(playerId: number, params?: Record<string, unknown>) { return this.renderWidget('player', { 'player-id': playerId, ...params }); }
  h2h(h2h: string, params?: Record<string, unknown>) { return this.renderWidget('h2h', { 'data-h2h': h2h, ...params }); }
  races(params?: Record<string, unknown>) { return this.renderWidget('races', params); }
  race(raceId: number, params?: Record<string, unknown>) { return this.renderWidget('race', { 'race-id': raceId, ...params }); }
  fights(params?: Record<string, unknown>) { return this.renderWidget('fights', params); }
  fight(fightId: number, params?: Record<string, unknown>) { return this.renderWidget('fight', { 'fight-id': fightId, ...params }); }

  getScript(): string {
    return '<script type="module" src="https://widgets.api-sports.io/3.1.0/widgets.js"></script>';
  }

  getConfigWidget(): string {
    const attrs = Object.entries(this.config)
      .map(([k, v]) => `data-${k}="${v}"`)
      .join(' ');
    return `<api-sports-widget data-type="config" ${attrs}></api-sports-widget>`;
  }
}

export default APISports;
