import SimpleSportPage from '@/components/sports/SimpleSportPage';

export default function MMAPage() {
  return <SimpleSportPage config={{
    key: 'mma',
    name: 'MMA',
    icon: '🥋',
    description: 'Live UFC & Bellator Odds',
    color: 'bg-orange-700'
  }} />;
}
