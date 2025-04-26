import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TestPageModal from './TestPageModal';

// Mock the API call function
jest.mock('../utils/api', () => ({
  generateSuggestion: jest.fn().mockResolvedValue('Suggested content')
}));

describe('TestPageModal Component', () => {
  const mockTest = {
    id: 'test-1',
    plan_name: 'Test Exercise Page',
    isTest: true,
    preamble: 'This is a test preamble',
    questions: [
      {
        type: 'Active Code',
        stem: 'Write a function that adds two numbers',
        initialCode: 'def add(a, b):\n    # Your code here',
        testCases: 'add(2, 3) -> 5\nadd(-1, 1) -> 0'
      }
    ]
  };
  
  const mockOnSave = jest.fn();
  const mockOnClose = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('renders test page details correctly', () => {
    render(
      <TestPageModal 
        test={mockTest} 
        onSave={mockOnSave} 
        onClose={mockOnClose} 
      />
    );
    
    expect(screen.getByText(/Edit Test Page: Test Exercise Page/i)).toBeInTheDocument();
    expect(screen.getByText(/This is a test preamble/i)).toBeInTheDocument();
    expect(screen.getByText(/Write a function that adds two numbers/i)).toBeInTheDocument();
  });
  
  test('allows editing the preamble', async () => {
    render(
      <TestPageModal 
        test={mockTest} 
        onSave={mockOnSave} 
        onClose={mockOnClose} 
      />
    );
    
    const preambleField = screen.getByLabelText(/Preamble/i);
    await userEvent.clear(preambleField);
    await userEvent.type(preambleField, 'Updated preamble text');
    
    fireEvent.click(screen.getByText('Save'));
    
    expect(mockOnSave).toHaveBeenCalledWith(
      expect.objectContaining({
        preamble: 'Updated preamble text'
      })
    );
  });
  
  test('allows adding a new Active Code question', async () => {
    render(
      <TestPageModal 
        test={mockTest} 
        onSave={mockOnSave} 
        onClose={mockOnClose} 
      />
    );
    
    // Open new question form
    fireEvent.click(screen.getByText('Add Question'));
    
    // Select Active Code type
    const typeSelect = screen.getByLabelText(/Question Type/i);
    await userEvent.click(typeSelect);
    await userEvent.click(screen.getByText('Active Code'));
    
    // Fill in question details
    await userEvent.type(screen.getByLabelText(/Question Text/i), 'New question');
    await userEvent.type(screen.getByLabelText(/Initial Code/i), 'def new_function():');
    await userEvent.type(screen.getByLabelText(/Test Cases/i), 'new_function() -> None');
    
    // Add the question
    fireEvent.click(screen.getByText('Add'));
    
    // Save the test page
    fireEvent.click(screen.getByText('Save'));
    
    // Verify onSave was called with updated questions array
    expect(mockOnSave).toHaveBeenCalledWith(
      expect.objectContaining({
        questions: expect.arrayContaining([
          expect.objectContaining({
            type: 'Active Code',
            stem: 'New question'
          })
        ])
      })
    );
  });
  
  test('allows removing a question', async () => {
    render(
      <TestPageModal 
        test={mockTest} 
        onSave={mockOnSave} 
        onClose={mockOnClose} 
      />
    );
    
    // Find and click the delete button for the question
    const deleteButtons = screen.getAllByTestId('DeleteIcon');
    fireEvent.click(deleteButtons[0]);
    
    // Save the changes
    fireEvent.click(screen.getByText('Save'));
    
    // Verify onSave was called with empty questions array
    expect(mockOnSave).toHaveBeenCalledWith(
      expect.objectContaining({
        questions: []
      })
    );
  });
}); 