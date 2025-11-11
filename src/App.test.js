import { render, screen } from '@testing-library/react';
import App from './App';

test('renders battle header', () => {
  render(<App />);
  const header = screen.getByText(/simple battle \(lab 5\)/i);
  expect(header).toBeInTheDocument();
});
