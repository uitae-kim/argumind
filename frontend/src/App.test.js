import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the start button before the game begins', () => {
  render(<App />);
  expect(screen.getByText(/start game/i)).toBeInTheDocument();
});
