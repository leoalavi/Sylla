import type { Metadata } from 'next';
import { ExplainTool } from '@/components/tools/ExplainTool';

export const metadata: Metadata = { title: 'Explain a concept' };

export default function ExplainPage() {
  return <ExplainTool />;
}
