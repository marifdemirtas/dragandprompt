import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LLMKeyModal from './LLMKeyModal';

describe('LLMKeyModal Component', () => {
  const mockOnSave = jest.fn();
  const mockOnClose = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('renders modal with current API key', () => {
    const currentKey = "test-api-key-123";
    
    render(
      <LLMKeyModal
        open={true}
        currentKey={currentKey}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />
    );
    
    expect(screen.getByText(/API Key Configuration/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/API Key/i).value).toBe(currentKey);
  });
  
  test('saves updated API key when Save button is clicked', async () => {
    render(
      <LLMKeyModal
        open={true}
        currentKey=""
        onSave={mockOnSave}
        onClose={mockOnClose}
      />
    );
    
    const keyField = screen.getByLabelText(/API Key/i);
    await userEvent.type(keyField, 'new-api-key-456');
    
    fireEvent.click(screen.getByText('Save'));
    
    expect(mockOnSave).toHaveBeenCalledWith('new-api-key-456');
    expect(mockOnClose).toHaveBeenCalled();
  });
  
  test('closes modal without saving when Cancel button is clicked', async () => {
    render(
      <LLMKeyModal
        open={true}
        currentKey="test-key"
        onSave={mockOnSave}
        onClose={mockOnClose}
      />
    );
    
    const keyField = screen.getByLabelText(/API Key/i);
    await userEvent.clear(keyField);
    await userEvent.type(keyField, 'changed-but-not-saved');
    
    fireEvent.click(screen.getByText('Cancel'));
    
    expect(mockOnSave).not.toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });
  
  test('renders help text about API key usage', () => {
    render(
      <LLMKeyModal
        open={true}
        currentKey=""
        onSave={mockOnSave}
        onClose={mockOnClose}
      />
    );
    
    expect(screen.getByText(/This API key will be used/i)).toBeInTheDocument();
  });
  
  test('does not render when open prop is false', () => {
    render(
      <LLMKeyModal
        open={false}
        currentKey=""
        onSave={mockOnSave}
        onClose={mockOnClose}
      />
    );
    
    expect(screen.queryByText(/API Key Configuration/i)).not.toBeInTheDocument();
  });
}); 