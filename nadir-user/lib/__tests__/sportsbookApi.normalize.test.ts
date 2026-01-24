import {
  normalizeSport,
  type RawSport,
} from '../sportsbookApi';

function makeSport(partial: Partial<RawSport>): RawSport {
  return {
    key: 'soccer_example_league',
    group: 'Soccer',
    title: 'Example League',
    description: 'Example',
    active: true,
    has_outrights: false,
    ...partial,
  };
}

// This is a small, ad-hoc test file intended to be run manually (e.g. with ts-node)
async function run() {
  console.log('Running sportsbookApi.normalize tests...');

  // Soccer EFL Cup should be football category, not american-football
  const eflCup = makeSport({
    key: 'soccer_england_efl_cup',
    group: 'Soccer',
    title: 'EFL Cup',
    description: 'League Cup',
  });
  const normEfl = normalizeSport(eflCup);
  if (!normEfl) throw new Error('EFL Cup was filtered out unexpectedly');
  if (normEfl.category !== 'football') {
    throw new Error(`Expected EFL Cup category "football", got "${normEfl.category}"`);
  }

  // NFL Super Bowl Winner should be american-football and outright
  const superBowl = makeSport({
    key: 'americanfootball_nfl_super_bowl_winner',
    group: 'American Football',
    title: 'NFL Super Bowl Winner',
    description: 'Super Bowl Winner 2025/2026',
    has_outrights: true,
  });
  const normSuperBowl = normalizeSport(superBowl);
  if (!normSuperBowl) throw new Error('Super Bowl Winner was filtered out unexpectedly');
  if (normSuperBowl.category !== 'american-football') {
    throw new Error(
      `Expected Super Bowl Winner category "american-football", got "${normSuperBowl.category}"`,
    );
  }
  if (!normSuperBowl.isOutright) {
    throw new Error('Expected Super Bowl Winner to be marked as outright');
  }

  // Politics should be filtered out entirely by DISABLED_KEYS / ENABLED_GROUPS
  const politics = makeSport({
    key: 'politics_us_presidential_election_winner',
    group: 'Politics',
    title: 'US Presidential Elections Winner',
    description: '2028 US Presidential Election Winner',
    has_outrights: true,
  });
  const normPolitics = normalizeSport(politics);
  if (normPolitics) {
    throw new Error('Politics market should have been filtered out');
  }

  console.log('✅ sportsbookApi.normalize tests passed.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

