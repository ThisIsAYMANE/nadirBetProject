import SimpleSportPage from '@/components/sports/SimpleSportPage';

export default function FootballPage() {
  return <SimpleSportPage config={{
    key: 'football',
    name: 'Football',
    icon: '⚽',
    description: 'Live Betting Odds & Arbitrage Opportunities',
    color: 'bg-green-600'
  }} />;
}