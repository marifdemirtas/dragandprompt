import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn(key => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = String(value);
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    removeItem: jest.fn(key => {
      delete store[key];
    }),
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock window.prompt
const mockPrompt = jest.fn();
window.prompt = mockPrompt;

// Mock the RST converter utility functions
jest.mock('./utils/rstConverter', () => ({
  exportRST: jest.fn().mockResolvedValue({}),
  generateContextualExamples: jest.fn(),
  generateContextualExample: jest.fn(),
  generateGroupRST: jest.fn(),
}));

describe('App Group Management', () => {
  const testPlans = [
    { 
      id: '1', 
      plan_name: 'Loop Plan', 
      plan_metadata: { description: 'Test Loop' },
      group: 'Iteration'
    },
    { 
      id: '2', 
      plan_name: 'Conditional Plan', 
      plan_metadata: { description: 'Test Conditional' },
      group: 'Selection'
    },
    { 
      id: '3', 
      plan_name: 'Function Plan', 
      plan_metadata: { description: 'Test Function' }
    }
  ];
  
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    localStorage.getItem.mockImplementation(key => {
      if (key === 'programming-plans-autosave') {
        return JSON.stringify(testPlans);
      }
      return null;
    });
  });
  
  test('displays group tabs correctly', () => {
    render(<App />);
    
    // Check for default "All" tab
    expect(screen.getByText('All')).toBeInTheDocument();
    
    // Check for derived group tabs
    expect(screen.getByText('Iteration')).toBeInTheDocument();
    expect(screen.getByText('Selection')).toBeInTheDocument();
    
    // Check for "Ungrouped" tab (since one plan has no group)
    expect(screen.getByText('Ungrouped')).toBeInTheDocument();
  });
  
  test('allows creating a new group', async () => {
    mockPrompt.mockReturnValueOnce('New Group');
    
    render(<App />);
    
    // Click the "+" button to add a new group
    const addButton = screen.getByTestId('AddIcon').closest('button');
    fireEvent.click(addButton);
    
    // Check that prompt was called
    expect(mockPrompt).toHaveBeenCalledWith('Enter new group name:');
    
    // Check that the new group tab appears
    await waitFor(() => {
      expect(screen.getByText('New Group')).toBeInTheDocument();
    });
  });
  
  test('allows deleting an empty group', async () => {
    mockPrompt.mockReturnValueOnce('New Group');
    
    render(<App />);
    
    // Add a new group first
    const addButton = screen.getByTestId('AddIcon').closest('button');
    fireEvent.click(addButton);
    
    // Now find and click the delete button next to the new group
    await waitFor(() => {
      const newGroupTab = screen.getByText('New Group');
      const closeButton = newGroupTab.closest('div').querySelector('[aria-label="Remove group"]');
      fireEvent.click(closeButton);
    });
    
    // Check that the group is removed
    await waitFor(() => {
      expect(screen.queryByText('New Group')).not.toBeInTheDocument();
    });
  });
  
  test('filters plans by selected group tab', async () => {
    render(<App />);
    
    // Initially should show all plans
    expect(screen.getByText('Loop Plan')).toBeInTheDocument();
    expect(screen.getByText('Conditional Plan')).toBeInTheDocument();
    expect(screen.getByText('Function Plan')).toBeInTheDocument();
    
    // Click on Iteration tab
    const iterationTab = screen.getByText('Iteration');
    fireEvent.click(iterationTab);
    
    // Should only show plans from Iteration group
    expect(screen.getByText('Loop Plan')).toBeInTheDocument();
    expect(screen.queryByText('Conditional Plan')).not.toBeInTheDocument();
    expect(screen.queryByText('Function Plan')).not.toBeInTheDocument();
  });
  
  test('handles drag and drop plans between groups', async () => {
    render(<App />);
    
    // Simulate dragging a plan
    const cards = screen.getAllByText(/Plan/).map(el => el.closest('[draggable="true"]'));
    
    // Start dragging the Loop Plan
    fireEvent.dragStart(cards[0], {
      dataTransfer: {
        setData: jest.fn(),
        getData: jest.fn().mockReturnValue('1')  // plan id
      }
    });
    
    // Drop it on Selection group
    const selectionTab = screen.getByText('Selection');
    fireEvent.dragOver(selectionTab, {
      preventDefault: jest.fn(),
      dataTransfer: { types: ['text/plain'] }
    });
    
    fireEvent.drop(selectionTab, {
      preventDefault: jest.fn(),
      dataTransfer: {
        getData: jest.fn().mockReturnValue('1')  // plan id
      }
    });
    
    // Check that plans are updated in localStorage
    expect(localStorage.setItem).toHaveBeenCalled();
    expect(JSON.parse(localStorage.setItem.mock.calls[0][1])[0].group).toBe('Selection');
  });
}); 