import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Explanation } from '@/lib/sylla/types';

const explain = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/tools/explain',
}));

vi.mock('@/lib/sylla/ai', () => ({
  getStudyToolService: () => ({ providerName: 'mock', explain }),
}));

// Imported after the mocks so the tool sees the fake service.
const { ExplainTool } = await import('@/components/tools/ExplainTool');

const RESULT: Explanation = {
  id: 'e1',
  concept: 'recursion',
  depth: 'intermediate',
  markdown: '## recursion\n\nA function calling itself.',
  followUps: ['Give me practice questions on recursion'],
  createdAt: 0,
};

beforeEach(() => {
  explain.mockReset();
});

describe('ExplainTool', () => {
  it('validates the concept before calling the service', async () => {
    const user = userEvent.setup();
    render(<ExplainTool />);
    await user.click(screen.getByRole('button', { name: 'Explain it' }));
    expect(screen.getByText(/enter the concept/i)).toBeInTheDocument();
    expect(explain).not.toHaveBeenCalled();
  });

  it('shows a loading state, then the result with a mock badge', async () => {
    let resolve!: (value: Explanation) => void;
    explain.mockImplementation(() => new Promise<Explanation>((r) => (resolve = r)));
    const user = userEvent.setup();
    render(<ExplainTool />);

    await user.type(screen.getByLabelText('Concept to explain'), 'recursion');
    await user.click(screen.getByRole('button', { name: 'Explain it' }));

    expect(screen.getByText('Generating…')).toBeInTheDocument();
    expect(explain).toHaveBeenCalledWith(
      expect.objectContaining({ concept: 'recursion', depth: 'intermediate' }),
    );

    resolve(RESULT);
    expect(await screen.findByText('A function calling itself.')).toBeInTheDocument();
    expect(screen.getByText('Mock results (dev)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /start over/i })).toBeInTheDocument();
  });

  it('shows an error state with a working retry', async () => {
    explain.mockRejectedValueOnce(new Error('boom')).mockResolvedValueOnce(RESULT);
    const user = userEvent.setup();
    render(<ExplainTool />);

    await user.type(screen.getByLabelText('Concept to explain'), 'recursion');
    await user.click(screen.getByRole('button', { name: 'Explain it' }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/something went wrong/i);
    // The raw error message never reaches the UI.
    expect(alert).not.toHaveTextContent('boom');

    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('A function calling itself.')).toBeInTheDocument();
    expect(explain).toHaveBeenCalledTimes(2);
  });
});
