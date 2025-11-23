import SimpleSportPage from '@/components/sports/SimpleSportPage';

export default function CricketPage() {
  return <SimpleSportPage config={{
    key: 'cricket',
    name: 'Cricket',
    icon: '🏏',
    description: 'Live Test, ODI & T20 Odds',
    color: 'bg-green-700'
  }} />;
}
