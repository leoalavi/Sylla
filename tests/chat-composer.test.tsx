import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ChatComposer } from '@/components/chat/ChatComposer';
import { settingsStore, updateSettings } from '@/lib/sylla/stores/settings';
import { setDraft, useDraft } from '@/lib/sylla/stores/drafts';
import { renderHook } from '@testing-library/react';

beforeEach(() => {
  settingsStore.clear();
  setDraft('test', '');
});

function renderComposer(overrides: Partial<Parameters<typeof ChatComposer>[0]> = {}) {
  const onSend = vi.fn();
  const onStop = vi.fn();
  render(
    <ChatComposer
      draftKey="test"
      onSend={onSend}
      onStop={onStop}
      streaming={false}
      disabled={false}
      {...overrides}
    />,
  );
  return { onSend, onStop };
}

describe('ChatComposer', () => {
  it('sends on Enter and clears the draft', async () => {
    const user = userEvent.setup();
    const { onSend } = renderComposer();
    const box = screen.getByLabelText('Message Sylla');
    await user.type(box, 'hello sylla{Enter}');
    expect(onSend).toHaveBeenCalledWith('hello sylla');
    expect(box).toHaveValue('');
  });

  it('inserts a newline on Shift+Enter instead of sending', async () => {
    const user = userEvent.setup();
    const { onSend } = renderComposer();
    await user.type(screen.getByLabelText('Message Sylla'), 'line one{Shift>}{Enter}{/Shift}line two');
    expect(onSend).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Message Sylla')).toHaveValue('line one\nline two');
  });

  it('respects the "Enter sends" setting being off', async () => {
    updateSettings({ sendOnEnter: false });
    const user = userEvent.setup();
    const { onSend } = renderComposer();
    const box = screen.getByLabelText('Message Sylla');
    await user.type(box, 'thoughtful message{Enter}');
    expect(onSend).not.toHaveBeenCalled();
    await user.type(box, '{Control>}{Enter}{/Control}');
    expect(onSend).toHaveBeenCalledTimes(1);
  });

  it('does not send blank messages', async () => {
    const user = userEvent.setup();
    const { onSend } = renderComposer();
    await user.type(screen.getByLabelText('Message Sylla'), '   {Enter}');
    expect(onSend).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Send message' })).toBeDisabled();
  });

  it('shows Stop instead of Send while streaming, wired to onStop', async () => {
    const user = userEvent.setup();
    const { onSend, onStop } = renderComposer({ streaming: true });
    expect(screen.queryByRole('button', { name: 'Send message' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Stop generating' }));
    expect(onStop).toHaveBeenCalled();
    expect(onSend).not.toHaveBeenCalled();
  });

  it('persists drafts per conversation key', async () => {
    const user = userEvent.setup();
    renderComposer();
    await user.type(screen.getByLabelText('Message Sylla'), 'unfinished thought');
    const { result } = renderHook(() => useDraft('test'));
    expect(result.current).toBe('unfinished thought');
  });
});
