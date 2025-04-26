import { exportRST, generateActiveCode } from './rstConverter';

// Mock fetch for API calls
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ content: 'Generated example content' }),
  })
);

describe('RST Converter Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateActiveCode', () => {
    test('generates correct activecode directive with test cases', () => {
      const questionId = 'test_question_1';
      const question = {
        stem: 'Write a function to add two numbers',
        initialCode: 'def add(a, b):\n    pass',
        testCases: 'add(2, 3) -> 5\nadd(-1, 1) -> 0',
        solutionCode: 'def add(a, b):\n    return a + b'
      };

      const result = generateActiveCode(questionId, question);

      // Check basic structure
      expect(result).toContain('.. activecode:: test_question_1');
      expect(result).toContain(':language: python');
      expect(result).toContain(':autograde: unittest');
      
      // Check question content
      expect(result).toContain('Write a function to add two numbers');
      expect(result).toContain('def add(a, b):\n    pass');
      
      // Check test cases
      expect(result).toContain('self.assertEqual(add(2, 3), 5, \'Test 1\')');
      expect(result).toContain('self.assertEqual(add(-1, 1), 0, \'Test 2\')');
      
      // Check solution
      expect(result).toContain('.. solution::');
      expect(result).toContain('def add(a, b):\n      return a + b');
    });

    test('generates activecode without tests when no test cases provided', () => {
      const questionId = 'test_question_2';
      const question = {
        stem: 'Experiment with this code',
        initialCode: 'print("Hello, world!")'
      };

      const result = generateActiveCode(questionId, question);

      expect(result).toContain('.. activecode:: test_question_2');
      expect(result).toContain(':language: python');
      expect(result).not.toContain(':autograde: unittest');
      expect(result).not.toContain('TestCaseGui');
      expect(result).toContain('print("Hello, world!")');
    });
  });

  // Additional tests could be added for exportRST and other functions
  // but they require more complex mocking due to API calls
}); 