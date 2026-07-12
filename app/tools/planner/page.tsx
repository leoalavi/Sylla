import type { Metadata } from 'next';
import { PlannerTool } from '@/components/tools/PlannerTool';

export const metadata: Metadata = { title: 'Study planner' };

export default function PlannerPage() {
  return <PlannerTool />;
}
