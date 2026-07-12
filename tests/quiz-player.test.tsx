import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { QuizPlayer } from '@/components/tools/QuizPlayer';
import type { Quiz } from '@/lib/sylla/types';

const QUIZ: Quiz = {
  id: 'q1',
  topic: 'Gravity',
  unitId: null,
  createdAt: 0,
  questions: [
    {
      id: 'mcq1',
      kind: 'multiple-choice',
      prompt: 'What goes up…',
      options: ['must come down', 'stays up', 'turns left', 'evaporates'],
      correctIndex: 0,
      explanation: 'Because gravity.',
    },
    {
      id: 'sa1',
      kind: 'short-answer',
      prompt: 'Describe gravity briefly.',
      sampleAnswer: 'A force of attraction between masses.',
      explanation: 'Compare with the sample.',
    },
  ],
};

describe('QuizPlayer', () => {
  it('requires an answer before checking', () => {
    render(<QuizPlayer quiz={QUIZ} />);
    expect(screen.getByRole('button', { name: 'Check answer' })).toBeDisabled();
  });

  it('gives correct feedback and explanation for a right MCQ answer', async () => {
    const user = userEvent.setup();
    render(<QuizPlayer quiz={QUIZ} />);
    await user.click(screen.getByRole('radio', { name: /must come down/i }));
    await user.click(screen.getByRole('button', { name: 'Check answer' }));
    expect(screen.getByText('Correct!')).toBeInTheDocument();
    expect(screen.getByText('Because gravity.')).toBeInTheDocument();
  });

  it('gives negative feedback for a wrong MCQ answer', async () => {
    const user = userEvent.setup();
    render(<QuizPlayer quiz={QUIZ} />);
    await user.click(screen.getByRole('radio', { name: /stays up/i }));
    await user.click(screen.getByRole('button', { name: 'Check answer' }));
    expect(screen.getByText('Not quite.')).toBeInTheDocument();
  });

  it('reveals the sample answer for short-answer questions', async () => {
    const user = userEvent.setup();
    render(<QuizPlayer quiz={QUIZ} />);
    await user.click(screen.getByRole('radio', { name: /must come down/i }));
    await user.click(screen.getByRole('button', { name: 'Check answer' }));
    await user.click(screen.getByRole('button', { name: 'Next question' }));

    await user.type(screen.getByLabelText(/describe gravity/i), 'pulls things together');
    await user.click(screen.getByRole('button', { name: 'Check answer' }));
    expect(screen.getByText('A force of attraction between masses.')).toBeInTheDocument();
  });

  it('shows the score at the end and can retry', async () => {
    const user = userEvent.setup();
    render(<QuizPlayer quiz={QUIZ} />);
    await user.click(screen.getByRole('radio', { name: /must come down/i }));
    await user.click(screen.getByRole('button', { name: 'Check answer' }));
    await user.click(screen.getByRole('button', { name: 'Next question' }));
    await user.type(screen.getByLabelText(/describe gravity/i), 'attraction');
    await user.click(screen.getByRole('button', { name: 'Check answer' }));
    await user.click(screen.getByRole('button', { name: 'See results' }));

    expect(screen.getByText('Quiz complete')).toBeInTheDocument();
    expect(screen.getByText('1 / 1')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /try again/i }));
    expect(screen.getByText('Question 1 of 2')).toBeInTheDocument();
  });
});
