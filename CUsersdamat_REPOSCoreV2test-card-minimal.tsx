import React from 'react';
import { render } from '@testing-library/react';
import { Card } from './src/components/Card';

describe('Card Minimal Test', () => {
  it('debug render structure', () => {
    const { container } = render(
      <Card className="custom-card">
        <div>Content</div>
      </Card>
    );
    
    console.log('Container:', container);
    console.log('Container innerHTML:', container.innerHTML);
    console.log('Container firstChild:', container.firstChild);
    console.log('Container firstChild className:', (container.firstChild as any)?.className);
    
    // Try to find the actual Card div
    const cardDiv = container.querySelector('.card-enhanced');
    console.log('Card div found:', cardDiv);
    console.log('Card div className:', cardDiv?.className);
  });
});
