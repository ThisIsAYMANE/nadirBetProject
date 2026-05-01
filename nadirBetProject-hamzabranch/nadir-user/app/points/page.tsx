'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PointsBalance from '@/components/dashboard/PointsBalance';

export default function PointsPage() {
  const router = useRouter();

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
    }
  }, [router]);

  return <PointsBalance />;
}
