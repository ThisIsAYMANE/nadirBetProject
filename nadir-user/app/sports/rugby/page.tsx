import SimpleSportPage from '@/components/sports/SimpleSportPage';

export default function RugbyPage() {
  return <SimpleSportPage config={{
    key: 'rugby',
    name: 'Rugby',
    icon: '🏉',
    description: 'Live Rugby League & Union Odds',
    color: 'bg-purple-600'
  }} />;
}
