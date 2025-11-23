import StaticSportPage from '@/components/sports/StaticSportPage';

export default function HandballPage() {
  return <StaticSportPage config={{
    key: 'handball',
    name: 'Handball',
    icon: '🤾',
    description: 'European Leagues & Championships',
    color: 'bg-indigo-600'
  }} />;
}
