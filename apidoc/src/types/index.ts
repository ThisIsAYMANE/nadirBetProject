export interface ApiResponse<T> {
  get: string;
  parameters: Record<string, unknown>;
  errors: ApiErrorType[];
  results: number;
  paging: Paging;
  response: T;
}

export interface Paging {
  current: number;
  total: number;
}

export interface ApiErrorType {
  [key: string]: string;
}

export interface TimezoneResponse {
  get: string;
  parameters: unknown[];
  errors: ApiErrorType[];
  results: number;
  paging: Paging;
  response: string[];
}

export interface Country {
  name: string;
  code: string;
  flag: string;
}

export interface CountriesResponse {
  get: string;
  parameters: { name?: string; code?: string; search?: string };
  errors: ApiErrorType[];
  results: number;
  paging: Paging;
  response: Country[];
}

export interface Season {
  year: number;
  start: string;
  end: string;
  current: boolean;
  coverage: SeasonCoverage;
}

export interface SeasonCoverage {
  fixtures: {
    events: boolean;
    lineups: boolean;
    statistics_fixtures: boolean;
    statistics_players: boolean;
  };
  standings: boolean;
  players: boolean;
  top_scorers: boolean;
  top_assists: boolean;
  top_cards: boolean;
  injuries: boolean;
  predictions: boolean;
  odds: boolean;
}

export interface League {
  id: number;
  name: string;
  type: 'League' | 'Cup';
  logo: string;
}

export interface LeaguesResponse {
  get: string;
  parameters: {
    id?: number;
    name?: string;
    country?: string;
    code?: string;
    season?: number;
    team?: number;
    type?: string;
    current?: string;
    search?: string;
    last?: number;
  };
  errors: ApiErrorType[];
  results: number;
  paging: Paging;
  response: Array<{
    league: League;
    country: Country;
    seasons: Season[];
  }>;
}

export interface SeasonsResponse {
  get: string;
  parameters: unknown[];
  errors: ApiErrorType[];
  results: number;
  paging: Paging;
  response: number[];
}

export interface Team {
  id: number;
  name: string;
  code: string;
  country: string;
  founded: number | null;
  national: boolean;
  logo: string;
}

export interface Venue {
  id: number;
  name: string;
  address: string;
  city: string;
  country: string;
  capacity: number;
  surface: string;
  image: string;
}

export interface TeamsResponse {
  get: string;
  parameters: {
    id?: number;
    name?: string;
    league?: number;
    season?: number;
    country?: string;
    code?: string;
    venue?: number;
    search?: string;
  };
  errors: ApiErrorType[];
  results: number;
  paging: Paging;
  response: Array<{
    team: Team;
    venue: Venue | null;
  }>;
}

export interface TeamStatistics {
  played: { home: number; away: number; total: number };
  wins: { home: number; away: number; total: number };
  draws: { home: number; away: number; total: number };
  losses: { home: number; away: number; total: number };
}

export interface GoalsStatistics {
  for: {
    total: { home: number; away: number; total: number };
    average: { home: string; away: string; total: string };
    minute: Record<string, { total: number | null; percentage: string | null }>;
  };
  against: {
    total: { home: number; away: number; total: number };
    average: { home: string; away: string; total: string };
    minute: Record<string, { total: number | null; percentage: string | null }>;
  };
}

export interface TeamStatisticsResponse {
  get: string;
  parameters: {
    league: number;
    season: number;
    team: number;
    date?: string;
  };
  errors: ApiErrorType[];
  results: number;
  paging: Paging;
  response: {
    league: League;
    team: Team;
    fixtures: TeamStatistics;
    goals: GoalsStatistics;
    biggest: {
      streak: { wins: string; draws: string; losses: string };
      wins: { home: string; away: string };
      loses: { home: string; away: string };
      goals: { against: { home: number; away: number }; for: { home: number; away: number } };
    };
    clean_sheet: { home: number; away: number; total: number };
    failed_to_score: { home: number; away: number; total: number };
    penalty: {
      scored: { total: number; percentage: string };
      missed: { total: number; percentage: string };
      total: number;
    };
    lineups: Array<{ formation: string; played: number }>;
    cards: Record<string, { total: number | null; percentage: string | null }>;
  };
}

export interface TeamSeasonsResponse {
  get: string;
  parameters: { team: number };
  errors: ApiErrorType[];
  results: number;
  paging: Paging;
  response: number[];
}

export interface TeamsCountriesResponse {
  get: string;
  parameters: unknown[];
  errors: ApiErrorType[];
  results: number;
  paging: Paging;
  response: Country[];
}

export interface VenueResponse {
  get: string;
  parameters: {
    id?: number;
    name?: string;
    city?: string;
    country?: string;
    search?: string;
  };
  errors: ApiErrorType[];
  results: number;
  paging: Paging;
  response: Venue[];
}

export interface FixtureStatus {
  long: string;
  short: string;
  extra: string | null;
}

export interface FixturePeriods {
  first: number | null;
  second: number | null;
}

export interface FixtureVenue {
  id: number;
  name: string;
  city: string;
}

export interface Fixture {
  id: number;
  referee: string | null;
  timezone: string;
  date: string;
  timestamp: number;
  periods: FixturePeriods;
  venue: FixtureVenue;
  status: FixtureStatus;
}

export interface TeamScore {
  home: number | null;
  away: number | null;
}

export interface Score {
  halftime: TeamScore;
  fulltime: TeamScore;
  extratime: TeamScore;
  penalty: TeamScore;
}

export interface FixtureTeam {
  id: number;
  name: string;
  logo: string;
  winner: boolean | null;
}

export interface FixturesResponse {
  get: string;
  parameters: {
    id?: number;
    ids?: string;
    live?: string;
    date?: string;
    league?: number;
    season?: number;
    team?: number;
    last?: number;
    next?: number;
    from?: string;
    to?: string;
    round?: string;
    status?: string;
    venue?: number;
    timezone?: string;
  };
  errors: ApiErrorType[];
  results: number;
  paging: Paging;
  response: Array<{
    fixture: Fixture;
    league: League;
    teams: { home: FixtureTeam; away: FixtureTeam };
    goals: TeamScore;
    score: Score;
  }>;
}

export interface RoundsResponse {
  get: string;
  parameters: {
    league: number;
    season: number;
    current?: boolean;
    dates?: boolean;
    timezone?: string;
  };
  errors: ApiErrorType[];
  results: number;
  paging: Paging;
  response: string[] | Array<{ round: string; round_start: string; round_end: string }>;
}

export interface HeadToHeadResponse {
  get: string;
  parameters: {
    h2h: string;
    date?: string;
    league?: number;
    season?: number;
    last?: number;
    next?: number;
    from?: string;
    to?: string;
    status?: string;
    venue?: number;
    timezone?: string;
  };
  errors: ApiErrorType[];
  results: number;
  paging: Paging;
  response: FixturesResponse['response'];
}

export interface FixtureStatistics {
  type: string;
  value: number | string;
}

export interface FixtureStatisticsTeam {
  team: { id: number; name: string; logo: string };
  statistics: FixtureStatistics[];
}

export interface FixtureStatisticsResponse {
  get: string;
  parameters: {
    fixture: number;
    team?: number;
    type?: string;
    half?: boolean;
  };
  errors: ApiErrorType[];
  results: number;
  paging: Paging;
  response: FixtureStatisticsTeam[];
}

export interface FixtureEventTime {
  elapsed: number;
  extra: number | null;
}

export interface FixtureEventPlayer {
  id: number;
  name: string;
}

export interface FixtureEvent {
  time: FixtureEventTime;
  team: { id: number; name: string; logo: string };
  player: FixtureEventPlayer;
  assist: FixtureEventPlayer | null;
  type: string;
  detail: string;
  comments: string | null;
}

export interface FixtureEventsResponse {
  get: string;
  parameters: { fixture: number; team?: number; player?: number; type?: string };
  errors: ApiErrorType[];
  results: number;
  paging: Paging;
  response: FixtureEvent[];
}

export interface LineupPlayer {
  player: {
    id: number;
    name: string;
    number: number;
    pos: string;
    grid: string;
  };
}

export interface LineupTeam {
  team: { id: number; name: string; logo: string };
  formation: string;
  startXI: LineupPlayer[];
  substitutes: LineupPlayer[];
}

export interface FixtureLineupsResponse {
  get: string;
  parameters: { fixture: number; team?: number; player?: number };
  errors: ApiErrorType[];
  results: number;
  paging: Paging;
  response: LineupTeam[];
}

export interface FixturePlayerStats {
  player: {
    id: number;
    name: string;
    photo: string;
  };
  statistics: Array<{
    games: { minutes: number | null; number: number | null; position: string; rating: string | null };
    offsides: number | null;
    shots: { total: number | null; on: number | null };
    goals: { total: number | null; conceded: number | null; assists: number | null };
    passes: { total: number | null; key: number | null; accuracy: number | null };
    tackles: { total: number | null; blocks: number | null; interceptions: number | null };
    duels: { total: number | null; won: number | null };
    dribbles: { attempts: number | null; success: number | null; past: number | null };
    fouls: { drawn: number | null; committed: number | null };
    cards: { yellow: number | null; red: number | null };
    penalty: { won: number | null; scored: number | null; missed: number | null; saved: number | null };
  }>;
}

export interface FixturePlayersResponse {
  get: string;
  parameters: { fixture: number; team?: number };
  errors: ApiErrorType[];
  results: number;
  paging: Paging;
  response: Array<{
    team: { id: number; name: string; logo: string };
    players: FixturePlayerStats[];
  }>;
}

export interface StandingGroup {
  group: string | null;
  stage: string;
  table: StandingTable[];
}

export interface StandingTable {
  rank: number;
  team: { id: number; name: string; logo: string };
  points: number;
  goalsDiff: number;
  group: string | null;
  form: string;
  status: string;
  description: string | null;
  all: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: { for: number; against: number };
  };
  home: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: { for: number; against: number };
  };
  away: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: { for: number; against: number };
  };
}

export interface StandingsResponse {
  get: string;
  parameters: { league?: number; season: number; team?: number };
  errors: ApiErrorType[];
  results: number;
  paging: Paging;
  response: Array<{
    league: League & { season: number };
    standings: StandingGroup[];
  }>;
}

export interface Player {
  id: number;
  name: string;
  firstname: string;
  lastname: string;
  age: number;
  birth: { date: string; place: string; country: string };
  nationality: string;
  height: string | null;
  weight: string | null;
  injured: boolean;
  joined: string | null;
  photo: string;
}

export interface PlayerStats {
  league: League & { season: number };
  team: Team;
  games: { appearences: number | null; minutes: number | null; number: number | null; position: string; rating: string | null };
  shots: { total: number | null; on: number | null };
  goals: { total: number | null; conceded: number | null; assists: number | null };
  passes: { total: number | null; key: number | null; accuracy: number | null };
  tackles: { total: number | null; blocks: number | null; interceptions: number | null };
  duels: { total: number | null; won: number | null };
  dribbles: { attempts: number | null; success: number | null; past: number | null };
  fouls: { drawn: number | null; committed: number | null };
  cards: { yellow: number | null; yellowred: number | null; red: number | null };
  penalty: { scored: number | null; missed: number | null; saved: number | null };
}

export interface PlayersResponse {
  get: string;
  parameters: {
    id?: number;
    name?: string;
    team?: number;
    league?: number;
    season?: number;
    search?: string;
  };
  errors: ApiErrorType[];
  results: number;
  paging: Paging;
  response: Array<{
    player: Player;
    statistics: PlayerStats[];
  }>;
}

export interface PlayerSeasonsResponse {
  get: string;
  parameters: { player: number };
  errors: ApiErrorType[];
  results: number;
  paging: Paging;
  response: number[];
}

export interface PlayerProfilesResponse {
  get: string;
  parameters: { page?: number; search?: string };
  errors: ApiErrorType[];
  results: number;
  paging: Paging;
  response: Array<{ player: Player }>;
}

export interface PlayerSquadsResponse {
  get: string;
  parameters: { team: number; season?: number };
  errors: ApiErrorType[];
  results: number;
  paging: Paging;
  response: Array<{
    team: Team;
    players: Player[];
  }>;
}

export interface PlayerTeamsResponse {
  get: string;
  parameters: { player: number };
  errors: ApiErrorType[];
  results: number;
  paging: Paging;
  response: Array<{
    team: Team;
    seasons: number[];
  }>;
}

export interface TopScorer {
  player: Player;
  statistics: Array<{
    league: League & { season: number };
    team: Team;
    goals: number;
    assists: number | null;
    penalty_goals: number | null;
  }>;
}

export interface TopScorersResponse {
  get: string;
  parameters: { league?: number; season: number };
  errors: ApiErrorType[];
  results: number;
  paging: Paging;
  response: TopScorer[];
}

export interface TopAssistsResponse {
  get: string;
  parameters: { league?: number; season: number };
  errors: ApiErrorType[];
  results: number;
  paging: Paging;
  response: Array<{
    player: Player;
    statistics: Array<{
      league: League & { season: number };
      team: Team;
      assists: number | null;
    }>;
  }>;
}

export interface TopYellowCardsResponse {
  get: string;
  parameters: { league?: number; season: number };
  errors: ApiErrorType[];
  results: number;
  paging: Paging;
  response: Array<{
    player: Player;
    statistics: Array<{
      league: League & { season: number };
      team: Team;
      yellow_cards: number | null;
    }>;
  }>;
}

export interface TopRedCardsResponse {
  get: string;
  parameters: { league?: number; season: number };
  errors: ApiErrorType[];
  results: number;
  paging: Paging;
  response: Array<{
    player: Player;
    statistics: Array<{
      league: League & { season: number };
      team: Team;
      red_cards: number | null;
    }>;
  }>;
}

export interface Injury {
  player: Player;
  team: Team;
  fixture: Fixture;
  league: League & { season: number };
  injuries: {
    type: string;
    status: string;
    start: string | null;
    end: string | null;
  };
}

export interface InjuriesResponse {
  get: string;
  parameters: {
    fixture?: number;
    league?: number;
    season?: number;
    team?: number;
    player?: number;
    ids?: string;
  };
  errors: ApiErrorType[];
  results: number;
  paging: Paging;
  response: Injury[];
}

export interface Prediction {
  predictions: {
    advice: string;
    winner: { id: number; name: string; logo: string } | null;
    win_or_draw: boolean;
    goals: { home: string | null; away: string | null };
  };
  league: League;
  teams: { home: FixtureTeam; away: FixtureTeam };
  analysis: string;
}

export interface PredictionsResponse {
  get: string;
  parameters: { fixture: number };
  errors: ApiErrorType[];
  results: number;
  paging: Paging;
  response: Prediction[];
}

export interface Coach {
  id: number;
  name: string;
  firstname: string;
  lastname: string;
  age: number;
  birth: { date: string; place: string; country: string };
  nationality: string;
  photo: string;
}

export interface CoachsResponse {
  get: string;
  parameters: { id?: number; name?: string; team?: number; search?: string };
  errors: ApiErrorType[];
  results: number;
  paging: Paging;
  response: Coach[];
}

export interface Transfer {
  date: string;
  type: string;
  teams: {
    in: { id: number; name: string; logo: string };
    out: { id: number; name: string; logo: string };
  };
}

export interface TransfersResponse {
  get: string;
  parameters: { player: number };
  errors: ApiErrorType[];
  results: number;
  paging: Paging;
  response: Transfer[];
}

export interface Trophy {
  league: string;
  country: string;
  club: { id: number; name: string; logo: string };
  position: string;
  season: string;
}

export interface TrophiesResponse {
  get: string;
  parameters: { player?: number; coach?: number; players?: string; coachs?: string };
  errors: ApiErrorType[];
  results: number;
  paging: Paging;
  response: Trophy[];
}

export interface Sidelined {
  player: Player;
  team: Team;
  reason: string;
  start_date: string | null;
  end_date: string | null;
}

export interface SidelinedResponse {
  get: string;
  parameters: { player?: number; coach?: number; players?: string; coachs?: string };
  errors: ApiErrorType[];
  results: number;
  paging: Paging;
  response: Sidelined[];
}

export interface OddsBookmaker {
  id: number;
  name: string;
}

export interface OddsBetValue {
  value: string;
  odd: string;
}

export interface OddsBet {
  id: number;
  name: string;
  values: OddsBetValue[];
}

export interface OddsBookmakerBets {
  bookmaker: OddsBookmaker;
  bets: OddsBet[];
}

export interface OddsResponse {
  get: string;
  parameters: { fixture: number; bookmaker?: number; bet?: number };
  errors: ApiErrorType[];
  results: number;
  paging: Paging;
  response: Array<{
    fixture: { id: number; timezone: string; date: string };
    bookmakers: OddsBookmakerBets[];
  }>;
}

export interface LiveOddsResponse {
  get: string;
  parameters: { league?: number };
  errors: ApiErrorType[];
  results: number;
  paging: Paging;
  response: OddsResponse['response'];
}

export interface OddsMappingResponse {
  get: string;
  parameters: unknown;
  errors: ApiErrorType[];
  results: number;
  paging: Paging;
  response: Array<{ bookmaker: OddsBookmaker; bets: { id: number; name: string }[] }>;
}

export interface BookmakersResponse {
  get: string;
  parameters: unknown;
  errors: ApiErrorType[];
  results: number;
  paging: Paging;
  response: OddsBookmaker[];
}

export interface BetsResponse {
  get: string;
  parameters: unknown;
  errors: ApiErrorType[];
  results: number;
  paging: Paging;
  response: Array<{ id: number; name: string }>;
}

export interface StatusResponse {
  get: string;
  parameters: unknown[];
  errors: ApiErrorType[];
  results: number;
  paging: Paging;
  response: {
    account: { firstname: string; lastname: string; email: string };
    subscription: { plan: string; end: string; active: boolean };
    requests: { current: number; limit_day: number };
  };
}

export interface RequestOptions {
  cache?: boolean;
  cacheTTL?: number;
}