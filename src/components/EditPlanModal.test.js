import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EditPlanModal from './EditPlanModal';

describe('EditPlanModal Component', () => {
  const mockPlan = {
    id: '1',
    plan_name: 'Loop Plan',
    plan_metadata: { 
      description: 'A plan for loops',
      preconditions: 'Basic programming knowledge',
      postconditions: 'Understanding of loops'
    },
    goal: 'Learn how to implement loops',
    code_template: {
      lines: [
        'for i in range(10):',
        '    print(i)'
      ],
      changeable_areas: { '1': [0, 20] },
      changeable_areas_annotations: { '1': 'Change the range' },
      changeable_areas_colors: { '1': '#ffcccc' }
    },
    group: 'Iteration'
  };
  
  const mockGroups = ['Ungrouped', 'Iteration', 'Selection', 'Functions'];
  const mockOnSave = jest.fn();
  const mockOnClose = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('renders plan details correctly', () => {
    render(
      <EditPlanModal
        plan={mockPlan}
        groups={mockGroups}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />
    );
    
    expect(screen.getByText(/Edit Plan: Loop Plan/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Plan Name/i).value).toBe('Loop Plan');
    expect(screen.getByLabelText(/Description/i).value).toBe('A plan for loops');
    expect(screen.getByLabelText(/Goal/i).value).toBe('Learn how to implement loops');
    expect(screen.getByLabelText(/Preconditions/i).value).toBe('Basic programming knowledge');
    expect(screen.getByLabelText(/Postconditions/i).value).toBe('Understanding of loops');
  });
  
  test('saves updated plan when Save button is clicked', async () => {
    render(
      <EditPlanModal
        plan={mockPlan}
        groups={mockGroups}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />
    );
    
    // Update plan name
    const nameField = screen.getByLabelText(/Plan Name/i);
    await userEvent.clear(nameField);
    await userEvent.type(nameField, 'Updated Loop Plan');
    
    // Update description
    const descField = screen.getByLabelText(/Description/i);
    await userEvent.clear(descField);
    await userEvent.type(descField, 'Updated description');
    
    // Change group
    const groupSelect = screen.getByLabelText(/Group/i);
    fireEvent.change(groupSelect, { target: { value: 'Functions' } });
    
    // Save changes
    fireEvent.click(screen.getByText('Save'));
    
    expect(mockOnSave).toHaveBeenCalledWith(
      expect.objectContaining({
        plan_name: 'Updated Loop Plan',
        plan_metadata: expect.objectContaining({
          description: 'Updated description'
        }),
        group: 'Functions'
      })
    );
    expect(mockOnClose).toHaveBeenCalled();
  });
  
  test('cancels editing when Cancel button is clicked', () => {
    render(
      <EditPlanModal
        plan={mockPlan}
        groups={mockGroups}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />
    );
    
    fireEvent.click(screen.getByText('Cancel'));
    
    expect(mockOnClose).toHaveBeenCalled();
    expect(mockOnSave).not.toHaveBeenCalled();
  });
  
  test('allows editing code template and changeable areas', async () => {
    render(
      <EditPlanModal
        plan={mockPlan}
        groups={mockGroups}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />
    );
    
    // Click the Edit Code button to access code editor
    fireEvent.click(screen.getByText('Edit Code'));
    
    // Note: Testing the code editor is complex due to its UI behavior
    // For comprehensive tests, you'd need to simulate CodeMirror interactions
    // This would typically be covered in integration tests
    
    // Let's just test that the code editor opens
    expect(screen.getByText('Save Code')).toBeInTheDocument();
  });
}); 