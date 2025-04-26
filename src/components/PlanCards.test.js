import { render, screen, fireEvent } from '@testing-library/react';
import PlanCards from './PlanCards';

describe('PlanCards Component', () => {
  const mockPlans = [
    {
      id: '1',
      plan_name: 'Loop Plan',
      plan_metadata: { description: 'A plan for looping through items' },
      group: 'Iteration'
    },
    {
      id: '2',
      plan_name: 'Conditional Plan',
      plan_metadata: { description: 'A plan for conditional logic' },
      group: 'Selection'
    }
  ];
  
  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();
  const mockOnDragStart = jest.fn();
  const mockOnDrop = jest.fn();
  
  test('renders plan cards correctly', () => {
    render(
      <PlanCards
        plans={mockPlans}
        onEditPlan={mockOnEdit}
        onDeletePlan={mockOnDelete}
        onDragStart={mockOnDragStart}
        onDrop={mockOnDrop}
        draggedOver={null}
      />
    );
    
    expect(screen.getByText('Loop Plan')).toBeInTheDocument();
    expect(screen.getByText('Conditional Plan')).toBeInTheDocument();
    expect(screen.getByText('A plan for looping through items')).toBeInTheDocument();
    expect(screen.getByText('A plan for conditional logic')).toBeInTheDocument();
  });
  
  test('calls onEditPlan when edit button is clicked', () => {
    render(
      <PlanCards
        plans={mockPlans}
        onEditPlan={mockOnEdit}
        onDeletePlan={mockOnDelete}
        onDragStart={mockOnDragStart}
        onDrop={mockOnDrop}
        draggedOver={null}
      />
    );
    
    const editButtons = screen.getAllByLabelText('Edit');
    fireEvent.click(editButtons[0]);
    
    expect(mockOnEdit).toHaveBeenCalledWith(mockPlans[0]);
  });
  
  test('calls onDeletePlan when delete button is clicked', () => {
    render(
      <PlanCards
        plans={mockPlans}
        onEditPlan={mockOnEdit}
        onDeletePlan={mockOnDelete}
        onDragStart={mockOnDragStart}
        onDrop={mockOnDrop}
        draggedOver={null}
      />
    );
    
    const deleteButtons = screen.getAllByLabelText('Delete');
    fireEvent.click(deleteButtons[1]);
    
    expect(mockOnDelete).toHaveBeenCalledWith(mockPlans[1].id);
  });
  
  test('handles drag and drop events correctly', () => {
    render(
      <PlanCards
        plans={mockPlans}
        onEditPlan={mockOnEdit}
        onDeletePlan={mockOnDelete}
        onDragStart={mockOnDragStart}
        onDrop={mockOnDrop}
        draggedOver="1"
      />
    );
    
    const cards = screen.getAllByTestId('plan-card');
    
    // Simulate drag start
    fireEvent.dragStart(cards[0]);
    expect(mockOnDragStart).toHaveBeenCalledWith(mockPlans[0].id);
    
    // Simulate drop
    fireEvent.drop(cards[1]);
    expect(mockOnDrop).toHaveBeenCalledWith(mockPlans[1].id);
  });
}); 