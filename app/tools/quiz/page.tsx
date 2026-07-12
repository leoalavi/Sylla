import type { Metadata } from 'next';
import { QuizTool } from '@/components/tools/QuizTool';

export const metadata: Metadata = { title: 'Quiz & practice questions' };

export default function QuizPage() {
  return <QuizTool />;
}
