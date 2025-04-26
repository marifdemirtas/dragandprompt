import { render, screen, fireEvent } from '@testing-library/react';
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

// Mock the RST converter utility functions
jest.mock('./utils/rstConverter', () => ({
  exportRST: jest.fn().mockResolvedValue({}),
  generateContextualExamples: jest.fn(),
  generateContextualExample: jest.fn(),
  generateGroupRST: jest.fn(),
}));

describe('App Component', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });


  test('renders main action buttons when no plans exist', () => {
    render(<App />);
    
    expect(screen.getByText(/Upload JSON/i)).toBeInTheDocument();
    expect(screen.getByText(/Export JSON/i)).toBeInTheDocument();
    expect(screen.getByText(/Export RST/i)).toBeInTheDocument();
    expect(screen.getByText(/Add Test/i)).toBeInTheDocument();
    
    // Export buttons should be disabled when no plans exist
    expect(screen.getByText(/Export JSON/i).closest('button')).toBeDisabled();
    expect(screen.getByText(/Export RST/i).closest('button')).toBeDisabled();
  });

  test('displays plans from localStorage on initial load', () => {
    const testPlans = [
      { id: '1', plan_name: 'Test Plan 1', plan_metadata: { description: 'Test Description' } }
    ];
    
    localStorage.getItem.mockReturnValueOnce(JSON.stringify(testPlans));
    
    render(<App />);
    // Since PlanCards would be rendered, we'd check for the plan name
    expect(screen.getByText(/Test Plan 1/i)).toBeInTheDocument();
  });
});
