import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the landing call-to-action before a game begins', () => {
  render(<App />);
  // The redesigned landing leads with the "토론 시작" primary button.
  expect(screen.getByRole('button', { name: /토론 시작/ })).toBeInTheDocument();
});
