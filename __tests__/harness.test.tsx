import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

describe('ui jest harness', () => {
  it('runs the ui project', () => {
    expect(true).toBe(true);
  });

  // Known limitation: RN 0.83 new-arch host components can render to a null
  // stub under jest-expo ~55. Keep a render smoke test wired but skipped until
  // resolved (see docs/BLUEPRINT.md §9).
  it.skip('renders a host component', () => {
    render(<Text>hello</Text>);
    expect(screen.getByText('hello')).toBeOnTheScreen();
  });
});
