import SimpleSportPage from '@/components/sports/SimpleSportPage';

export default function AmericanFootballPage() {
  return <SimpleSportPage config={{
    key: 'american-football',
    name: 'American Football',
    icon: '🏈',
    description: 'Live NFL & NCAA Betting Odds',
    color: 'bg-blue-600'
  }} />;
}
