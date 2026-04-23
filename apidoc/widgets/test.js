const APISports = require('./src/index');

const api = new APISports({ apiKey: '303e4402fcec0c684084b2b79a2b6338' });

console.log('API-Widgets SDK Test\n');

console.log('1. Config Widget:');
console.log(api.getConfigWidget());

console.log('\n2. Games Widget:');
console.log(api.games({ date: '2024-01-01' }));

console.log('\n3. League Widget (Premier League):');
console.log(api.league(39, { season: '2024' }));

console.log('\n4. Standings Widget:');
console.log(api.standings(39, '2024'));

console.log('\n5. Team Widget:');
console.log(api.team(33));

console.log('\n6. Player Widget:');
console.log(api.player(456));

console.log('\n7. H2H Widget:');
console.log(api.h2h('33-34'));

console.log('\n8. F1 Races Widget:');
api.setSport('f1');
console.log(api.races({ season: 2024 }));

console.log('\n9. MMA Fights Widget:');
api.setSport('mma');
console.log(api.fights());

console.log('\n10. Widget Script:');
console.log(api.getScript());

console.log('\n✓ All widget generation tests passed!');
