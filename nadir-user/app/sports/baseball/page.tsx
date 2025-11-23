import SimpleSportPage from '@/components/sports/SimpleSportPage';

export default function BaseballPage() {
  return <SimpleSportPage config={{
    key: 'baseball',
    name: 'Baseball',
    icon: '⚾',
    description: 'Live MLB Betting Odds',
    color: 'bg-red-600'
  }} />;
}
