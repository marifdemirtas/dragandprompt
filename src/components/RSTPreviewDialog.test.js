import { render, screen, fireEvent } from '@testing-library/react';
import RSTPreviewDialog from './RSTPreviewDialog';

describe('RSTPreviewDialog Component', () => {
  const mockRstContent = `
Test Page
=========

This is a test preamble.

.. activecode:: test_q1
   :language: python
   :autograde: unittest

   Write a function that adds two numbers.
   ~~~~
   def add(a, b):
       # Your code here
       
   ====
   from unittest.gui import TestCaseGui
   
   class MyTests(TestCaseGui):
       def testOne(self):
           self.assertEqual(add(2, 3), 5, 'Test 1')
   
   MyTests().main()
  `;
  
  const mockProps = {
    open: true,
    onClose: jest.fn(),
    rstContent: mockRstContent,
    title: 'Test Page Preview'
  };
  
  test('renders RST content correctly', () => {
    render(<RSTPreviewDialog {...mockProps} />);
    
    expect(screen.getByText('Test Page Preview')).toBeInTheDocument();
    expect(screen.getByText('Test Page')).toBeInTheDocument();
    expect(screen.getByText('This is a test preamble.')).toBeInTheDocument();
    expect(screen.getByText('.. activecode:: test_q1')).toBeInTheDocument();
    expect(screen.getByText('Write a function that adds two numbers.')).toBeInTheDocument();
  });
  
  test('closes dialog when Close button is clicked', () => {
    render(<RSTPreviewDialog {...mockProps} />);
    
    fireEvent.click(screen.getByText('Close'));
    
    expect(mockProps.onClose).toHaveBeenCalled();
  });
  
  test('displays copy button that works correctly', () => {
    // Mock clipboard API
    const originalClipboard = navigator.clipboard;
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: jest.fn().mockResolvedValue(true) },
      configurable: true
    });
    
    render(<RSTPreviewDialog {...mockProps} />);
    
    fireEvent.click(screen.getByLabelText('Copy to clipboard'));
    
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockRstContent);
    
    // Restore original clipboard API
    Object.defineProperty(navigator, 'clipboard', {
      value: originalClipboard,
      configurable: true
    });
  });
}); 