import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QuickExitButton } from './src/components/safety/QuickExitButton';

describe('QuickExitButton Minimal Test', () => {
  it('should render without crashing', () => {
    const { container } = render(<QuickExitButton />);
    console.log('Container HTML:', container.innerHTML);
    expect(container.firstChild).toBeTruthy();
  });
});