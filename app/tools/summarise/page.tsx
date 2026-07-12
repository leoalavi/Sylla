import type { Metadata } from 'next';
import { SummariseTool } from '@/components/tools/SummariseTool';

export const metadata: Metadata = { title: 'Summarise material' };

export default function SummarisePage() {
  return <SummariseTool />;
}
