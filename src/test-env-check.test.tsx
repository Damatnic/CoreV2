import React from 'react';
import { render, screen } from '@testing-library/react';

describe('Test Environment Check', () => {
  it('should render a simple div', () => {
    render(<div>Hello World</div>);
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });
  
  it('should render a button', () => {
    render(<button>Click me</button>);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
  
  it('should render inside root element', () => {
    const { container } = render(<div data-testid="test">Test Content</div>);
    expect(container.querySelector('[data-testid="test"]')).toBeInTheDocument();
  });
});