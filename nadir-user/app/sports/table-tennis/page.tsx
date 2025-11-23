import StaticSportPage from '@/components/sports/StaticSportPage';

export default function TableTennisPage() {
  return <StaticSportPage config={{
    key: 'table-tennis',
    name: 'Table Tennis',
    icon: '🏓',
    description: 'Professional Table Tennis',
    color: 'bg-pink-600'
  }} />;
}
