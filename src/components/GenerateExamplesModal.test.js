import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GenerateExamplesModal from './GenerateExamplesModal';

// Mock functions
jest.mock('../utils/api', () => ({
  generateContextualExample: jest.fn().mockResolvedValue('Generated example content')
}));

describe('GenerateExamplesModal Component', () => {
  const mockPlans = [
    {
      id: '1',
      plan_name: 'Loop Plan',
      plan_metadata: { description: 'A plan for loops' },
      group: 'Iteration'
    },
    {
      id: '2',
      plan_name: 'Array Plan',
      plan_metadata: { description: 'A plan for arrays' },
      group: 'Iteration'
    },
    {
      id: '3',
      plan_name: 'Conditional Plan',
      plan_metadata: { description: 'A plan for conditionals' },
      group: 'Selection'
    },
    {
      id: '4',
      plan_name: 'Test Page',
      isTest: true,
      group: 'Tests'
    }
  ];

  const mockCachedExamples = {
    'Iteration': {
      context: 'This is a cached example context for Iteration',
      rstContent: 'RST content for Iteration'
    }
  };

  const mockProps = {
    open: true,
    onClose: jest.fn(),
    plans: mockPlans,
    onGenerateExample: jest.fn().mockResolvedValue(),
    onPreviewExample: jest.fn(),
    cachedExamples: mockCachedExamples
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders the modal with grouped plans', () => {
    render(<GenerateExamplesModal {...mockProps} />);
    
    expect(screen.getByText('Generate Contextual Examples')).toBeInTheDocument();
    expect(screen.getByText('Iteration')).toBeInTheDocument();
    expect(screen.getByText('Selection')).toBeInTheDocument();
    expect(screen.getByText('Loop Plan')).toBeInTheDocument();
    expect(screen.getByText('Conditional Plan')).toBeInTheDocument();
  });

  test('displays cached examples when available', () => {
    render(<GenerateExamplesModal {...mockProps} />);
    
    expect(screen.getByText('Iteration')).toBeInTheDocument();
    // Check for "cached" indicator
    const cachedChip = screen.getByText('Cached');
    expect(cachedChip).toBeInTheDocument();
  });

  test('allows entering user context for a group', async () => {
    render(<GenerateExamplesModal {...mockProps} />);
    
    // Find and expand the Selection group
    const expandButtons = screen.getAllByTestId('ExpandMoreIcon');
    fireEvent.click(expandButtons[1]); // Second group (Selection)
    
    // Enter context
    const contextField = screen.getByLabelText(/User Context/i);
    await userEvent.type(contextField, 'Custom context for conditionals');
    
    // Generate example
    const generateButton = screen.getAllByText('Generate')[1]; // Second generate button
    fireEvent.click(generateButton);
    
    expect(mockProps.onGenerateExample).toHaveBeenCalledWith(
      'Selection',
      expect.arrayContaining([mockPlans[2]]),
      'Custom context for conditionals'
    );
  });

  test('allows previewing cached examples', () => {
    render(<GenerateExamplesModal {...mockProps} />);
    
    // Find preview button for Iteration group
    const previewButton = screen.getByTestId('PreviewIcon').closest('button');
    fireEvent.click(previewButton);
    
    expect(mockProps.onPreviewExample).toHaveBeenCalledWith('Iteration');
  });

  test('closes modal when Close button is clicked', () => {
    render(<GenerateExamplesModal {...mockProps} />);
    
    const closeButton = screen.getByText('Close');
    fireEvent.click(closeButton);
    
    expect(mockProps.onClose).toHaveBeenCalled();
  });
}); 