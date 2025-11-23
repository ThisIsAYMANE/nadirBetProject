import SimpleSportPage from '@/components/sports/SimpleSportPage';

export default function BasketballPage() {
  return <SimpleSportPage config={{
    key: 'basketball',
    name: 'Basketball',
    icon: '🏀',
    description: 'Live NBA, EuroLeague & WNBA Odds',
    color: 'bg-orange-600'
  }} />;
}