import SimpleSportPage from '@/components/sports/SimpleSportPage';
import { getSportConfig } from '@/lib/sportConfigs';

export default function DynamicSportPage({ params }: { params: { sportKey: string } }) {
  const config = getSportConfig(params.sportKey);
  
  return <SimpleSportPage config={config} />;
}
