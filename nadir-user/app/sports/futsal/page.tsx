import StaticSportPage from '@/components/sports/StaticSportPage';

export default function FutsalPage() {
  return <StaticSportPage config={{
    key: 'futsal',
    name: 'Futsal',
    icon: '⚽',
    description: 'Indoor Football Leagues',
    color: 'bg-teal-600'
  }} />;
}
