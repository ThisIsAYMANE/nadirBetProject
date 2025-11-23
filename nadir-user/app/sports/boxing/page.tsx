import SimpleSportPage from '@/components/sports/SimpleSportPage';

export default function BoxingPage() {
  return <SimpleSportPage config={{
    key: 'boxing',
    name: 'Boxing',
    icon: '🥊',
    description: 'Live Championship Fight Odds',
    color: 'bg-red-700'
  }} />;
}
