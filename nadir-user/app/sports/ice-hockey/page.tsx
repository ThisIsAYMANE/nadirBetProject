import SimpleSportPage from '@/components/sports/SimpleSportPage';

export default function IceHockeyPage() {
  return <SimpleSportPage config={{
    key: 'ice-hockey',
    name: 'Ice Hockey',
    icon: '🏒',
    description: 'Live NHL Betting Odds',
    color: 'bg-blue-500'
  }} />;
}
