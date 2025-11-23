import SimpleSportPage from '@/components/sports/SimpleSportPage';

export default function TennisPage() {
  return <SimpleSportPage config={{
    key: 'tennis',
    name: 'Tennis',
    icon: '🎾',
    description: 'Live ATP, WTA & Grand Slam Odds',
    color: 'bg-yellow-600'
  }} />;
}
