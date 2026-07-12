import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { FlashcardViewer } from '@/components/tools/FlashcardViewer';
import type { FlashcardSet } from '@/lib/sylla/types';

const SET: FlashcardSet = {
  id: 'set1',
  topic: 'Cells',
  unitId: null,
  createdAt: 0,
  cards: [
    { id: 'c1', front: 'Q one', back: 'A one' },
    { id: 'c2', front: 'Q two', back: 'A two' },
    { id: 'c3', front: 'Q three', back: 'A three' },
  ],
};

describe('FlashcardViewer', () => {
  it('shows the first question with progress', () => {
    render(<FlashcardViewer set={SET} />);
    expect(screen.getByText('Q one')).toBeInTheDocument();
    expect(screen.getByText('Card 1 of 3')).toBeInTheDocument();
  });

  it('flips between front and back on click', async () => {
    const user = userEvent.setup();
    render(<FlashcardViewer set={SET} />);
    await user.click(screen.getByRole('button', { pressed: false, name: /reveal answer/i }));
    expect(screen.getByText('A one')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { pressed: true }));
    expect(screen.getByText('Q one')).toBeInTheDocument();
  });

  it('navigates with next/previous and clamps at the ends', async () => {
    const user = userEvent.setup();
    render(<FlashcardViewer set={SET} />);
    const prev = screen.getByRole('button', { name: 'Previous card' });
    const next = screen.getByRole('button', { name: 'Next card' });

    expect(prev).toBeDisabled();
    await user.click(next);
    expect(screen.getByText('Q two')).toBeInTheDocument();
    await user.click(next);
    expect(screen.getByText('Q three')).toBeInTheDocument();
    expect(next).toBeDisabled();
  });

  it('unflips when moving to another card', async () => {
    const user = userEvent.setup();
    render(<FlashcardViewer set={SET} />);
    await user.click(screen.getByRole('button', { name: /reveal answer/i }));
    expect(screen.getByText('A one')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Next card' }));
    expect(screen.getByText('Q two')).toBeInTheDocument();
    expect(screen.queryByText('A two')).not.toBeInTheDocument();
  });

  it('supports arrow-key navigation', async () => {
    const user = userEvent.setup();
    render(<FlashcardViewer set={SET} />);
    screen.getByRole('button', { name: /reveal answer/i }).focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByText('Q two')).toBeInTheDocument();
    await user.keyboard('{ArrowLeft}');
    expect(screen.getByText('Q one')).toBeInTheDocument();
  });

  it('reset returns to the first card in original order', async () => {
    const user = userEvent.setup();
    render(<FlashcardViewer set={SET} />);
    await user.click(screen.getByRole('button', { name: 'Next card' }));
    await user.click(screen.getByRole('button', { name: /reset/i }));
    expect(screen.getByText('Card 1 of 3')).toBeInTheDocument();
    expect(screen.getByText('Q one')).toBeInTheDocument();
  });
});
