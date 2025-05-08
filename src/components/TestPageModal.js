import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  IconButton,
  ToggleButtonGroup,
  ToggleButton,
  Paper,
  CircularProgress,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import QuizIcon from '@mui/icons-material/Quiz';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import ShortTextIcon from '@mui/icons-material/ShortText';
import ReorderIcon from '@mui/icons-material/Reorder';
import TouchAppIcon from '@mui/icons-material/TouchApp';
import CodeIcon from '@mui/icons-material/Code';
import { Editor } from "@monaco-editor/react";
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';

const TestPageModal = ({ test, onSave, onClose }) => {
  const [editedTest, setEditedTest] = useState({ ...test });
  const [newQuestionType, setNewQuestionType] = useState(null);
  const [newQuestion, setNewQuestion] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [llmKey, setLlmKey] = useState(() => {
    const LLM_KEY_STORAGE = 'llm-api-key';
    return localStorage.getItem(LLM_KEY_STORAGE) || "";
  });

  const questionTypeIcons = {
    "MCQ": <QuizIcon />,
    "True/False": <CheckBoxIcon />,
    "Fill in the Blank": <ShortTextIcon />,
    "Parsons Problem": <ReorderIcon />,
    "Clickable Areas": <TouchAppIcon />,
    "Active Code": <CodeIcon />,
  };

  const handleSave = () => {
    onSave(editedTest);
    onClose();
  };

  const handleAddQuestion = () => {
    if (newQuestionType && Object.keys(newQuestion).length > 0) {
      setEditedTest(prev => ({
        ...prev,
        questions: [...(prev.questions || []), {
          type: newQuestionType,
          ...newQuestion
        }]
      }));
      setNewQuestionType(null);
      setNewQuestion({});
    }
  };

  const handleRemoveQuestion = (index) => {
    setEditedTest(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }));
  };

  const handleSuggestPreamble = async () => {
    if (!editedTest.preamble?.trim()) {
      alert("Please enter a brief description of the exercise first.");
      return;
    }

    setIsGenerating(true);
    const [apiKey, targetUri] = llmKey.split('|');

    try {
      const prompt = `Given this brief description of a programming exercise:

"${editedTest.preamble}"

Generate a concise but engaging preamble (max 2 paragraphs) that introduces this exercise. You can include:
- A clear explanation of the problem/task
- The key concepts being tested
- Example scenarios if helpful
- Optional: one relevant image placeholder using format: image[alt text]
- Optional: one small table if it helps explain the concept, using this RST format:
  +------------+------------+-----------+
  | Header 1   | Header 2   | Header 3  |
  +============+============+===========+
  | cell 1     | cell 2     | cell 3    |
  +------------+------------+-----------+

Keep the text concise but informative. Do not use RST directives except for tables.
Do not include backticks or code blocks in the response.`;

      const response = await fetch(targetUri, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": apiKey
        },
        body: JSON.stringify({
          model: "gpt-4",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7
        })
      });

      if (!response.ok) throw new Error('API request failed');
      
      const data = await response.json();
      const suggestedPreamble = data.choices[0].message.content.trim();
      
      setEditedTest(prev => ({
        ...prev,
        preamble: suggestedPreamble
      }));
    } catch (error) {
      console.error("Error generating preamble:", error);
      alert("Failed to generate preamble. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSuggestQuestion = async () => {
    if (!editedTest.preamble?.trim() || !newQuestionType) {
      alert("Please enter a preamble and select a question type first.");
      return;
    }

    setIsGenerating(true);
    const [apiKey, targetUri] = llmKey.split('|');

    try {
      const prompt = `Given this programming exercise preamble:

"${editedTest.preamble}"

Generate a ${newQuestionType} question that tests the concepts described in the preamble.

The response should be a JSON object with these fields (depending on question type):

For MCQ:
{
  "stem": "question text",
  "correct": "correct answer",
  "distractors": ["wrong1", "wrong2", "wrong3"],
  "feedback": ["feedback1", "feedback2", "feedback3"]
}

For True/False:
{
  "stem": "statement to evaluate",
  "label": "True or False",
  "feedback": "feedback for wrong answer"
}

For Fill in the Blank:
{
  "stem": "question text",
  "area": "text to fill in"
}

For Parsons Problem:
{
  "stem": "instructions",
  "blocks": [{"text": "code line 1"}, {"text": "code line 2", "isDistractor": true}],
  "correctOrder": [0, 2, 1]
}

For Clickable Areas:
{
  "stem": "instructions",
  "areas": ["area1", "area2", "area3"]
}

For Active Code:
{
  "stem": "instructions",
  "initialCode": "starter code",
  "solutionCode": "solution code",
  "testCases": "input1 -> output1\ninput2 -> output2"
}

Return only the JSON object, no additional text or formatting.`;

      const response = await fetch(targetUri, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": apiKey
        },
        body: JSON.stringify({
          model: "gpt-4",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7
        })
      });

      if (!response.ok) throw new Error('API request failed');
      
      const data = await response.json();
      const suggestedQuestion = JSON.parse(data.choices[0].message.content.trim());
      
      setNewQuestion(suggestedQuestion);
    } catch (error) {
      console.error("Error generating question:", error);
      alert("Failed to generate question. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const renderQuestionInputs = () => {
    switch (newQuestionType) {
      case "MCQ":
        return (
          <Box sx={{ p: 2 }}>
            <TextField
              label="Question Stem"
              fullWidth
              margin="normal"
              multiline
              rows={2}
              value={newQuestion.stem || ''}
              onChange={(e) =>
                setNewQuestion((prev) => ({ ...prev, stem: e.target.value }))
              }
            />
            <Box sx={{ mt: 2 }}>
              <TextField
                label="Correct Answer"
                fullWidth
                margin="normal"
                value={newQuestion.correct || ''}
                onChange={(e) =>
                  setNewQuestion((prev) => ({ ...prev, correct: e.target.value }))
                }
              />
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2">Distractors and Feedback:</Typography>
                <Typography variant="caption" color="text.secondary">
                  Enter incorrect options and optional feedback for each
                </Typography>
                {(newQuestion.distractors || ['']).map((distractor, idx) => (
                  <Box key={idx} sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <TextField
                      label={`Distractor ${idx + 1}`}
                      size="small"
                      value={distractor}
                      onChange={(e) => {
                        const newDistractors = [...(newQuestion.distractors || [''])];
                        newDistractors[idx] = e.target.value;
                        setNewQuestion((prev) => ({
                          ...prev,
                          distractors: newDistractors
                        }));
                      }}
                    />
                    <TextField
                      label="Feedback (optional)"
                      size="small"
                      value={(newQuestion.feedback || [])[idx] || ''}
                      onChange={(e) => {
                        const newFeedback = [...(newQuestion.feedback || [])];
                        newFeedback[idx] = e.target.value;
                        setNewQuestion((prev) => ({
                          ...prev,
                          feedback: newFeedback
                        }));
                      }}
                    />
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => {
                        const newDistractors = [...(newQuestion.distractors || [])];
                        const newFeedback = [...(newQuestion.feedback || [])];
                        newDistractors.splice(idx, 1);
                        newFeedback.splice(idx, 1);
                        setNewQuestion((prev) => ({
                          ...prev,
                          distractors: newDistractors,
                          feedback: newFeedback
                        }));
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                ))}
                <Button
                  startIcon={<AddCircleOutlineIcon />}
                  onClick={() => {
                    setNewQuestion((prev) => ({
                      ...prev,
                      distractors: [...(prev.distractors || []), ''],
                      feedback: [...(prev.feedback || []), '']
                    }));
                  }}
                  sx={{ mt: 1 }}
                >
                  Add Distractor
                </Button>
              </Box>
            </Box>
          </Box>
        );

      case "True/False":
        return (
          <Box sx={{ p: 2 }}>
            <TextField
              label="Statement"
              fullWidth
              margin="normal"
              multiline
              rows={2}
              value={newQuestion.stem || ''}
              onChange={(e) =>
                setNewQuestion((prev) => ({ ...prev, stem: e.target.value }))
              }
            />
            <Box sx={{ mt: 2 }}>
              <ToggleButtonGroup
                value={newQuestion.label}
                exclusive
                onChange={(e, value) =>
                  setNewQuestion((prev) => ({ ...prev, label: value }))
                }
              >
                <ToggleButton value="True">True</ToggleButton>
                <ToggleButton value="False">False</ToggleButton>
              </ToggleButtonGroup>
              <TextField
                label="Feedback for wrong answer (optional)"
                fullWidth
                margin="normal"
                value={newQuestion.feedback || ''}
                onChange={(e) =>
                  setNewQuestion((prev) => ({ ...prev, feedback: e.target.value }))
                }
                helperText="This feedback will be shown when student selects the wrong option"
              />
            </Box>
          </Box>
        );

      case "Fill in the Blank":
        return (
          <Box sx={{ p: 2 }}>
            <TextField
              label="Question Stem"
              fullWidth
              margin="normal"
              multiline
              rows={2}
              value={newQuestion.stem || ''}
              helperText="Describe what needs to be filled in"
              onChange={(e) =>
                setNewQuestion((prev) => ({ ...prev, stem: e.target.value }))
              }
            />
            <TextField
              label="Area (what should be filled)"
              fullWidth
              margin="normal"
              value={newQuestion.area || ''}
              onChange={(e) =>
                setNewQuestion((prev) => ({ ...prev, area: e.target.value }))
              }
            />
          </Box>
        );

      case "Parsons Problem": 
        return (
          <Box sx={{ p: 2 }}>
            <TextField
              label="Instructions"
              fullWidth
              margin="normal"
              multiline
              rows={2}
              value={newQuestion.stem || ''}
              helperText="Describe how to arrange the code blocks"
              onChange={(e) =>
                setNewQuestion((prev) => ({ ...prev, stem: e.target.value }))
              }
            />
            
            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
              Code Blocks (one per line):
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={5}
              placeholder="def my_function():\n    statement1\n    statement2"
              value={newQuestion.blocks ? 
                newQuestion.blocks.map(b => typeof b === 'object' ? b.text : b).join('\n') : 
                ''}
              onChange={(e) => {
                const lines = e.target.value.split('\n').map(line => ({
                  text: line,
                  isDistractor: false
                }));
                setNewQuestion(prev => ({
                  ...prev,
                  blocks: lines,
                  correctOrder: lines.map((_, i) => i)
                }));
              }}
            />
            
            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
              Correct Order (comma-separated indices, 0-based):
            </Typography>
            <TextField
              fullWidth
              size="small"
              helperText="Example: 0,2,1,3 (where numbers represent the indices of blocks above)"
              value={newQuestion.correctOrder ? newQuestion.correctOrder.join(',') : ''}
              onChange={(e) => {
                const orderStr = e.target.value;
                const orderArr = orderStr.split(',')
                  .map(num => parseInt(num.trim()))
                  .filter(num => !isNaN(num));
                setNewQuestion(prev => ({ ...prev, correctOrder: orderArr }));
              }}
            />
            
            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
              Distractor Blocks (optional, one per line):
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={2}
              placeholder="print('Distractor line')\nreturn False"
              value={newQuestion.distractors || ''}
              onChange={(e) => {
                setNewQuestion(prev => ({
                  ...prev,
                  distractors: e.target.value
                }));
              }}
              helperText="These incorrect code blocks will be mixed in with the correct ones"
            />
          </Box>
        );

      case "Clickable Areas":
        return (
          <Box sx={{ p: 2 }}>
            <TextField
              label="Instructions"
              fullWidth
              margin="normal"
              multiline
              rows={2}
              value={newQuestion.stem || ''}
              helperText="Describe what areas should be clicked"
              onChange={(e) =>
                setNewQuestion((prev) => ({ ...prev, stem: e.target.value }))
              }
            />
            <TextField
              label="Areas to Click (comma-separated)"
              fullWidth
              margin="normal"
              value={Array.isArray(newQuestion.areas) ? newQuestion.areas.join(', ') : newQuestion.areas || ''}
              onChange={(e) => {
                const areas = e.target.value.split(',').map(a => a.trim()).filter(a => a);
                setNewQuestion(prev => ({ ...prev, areas }));
              }}
              helperText="Enter the names of areas that should be clicked, separated by commas"
            />
          </Box>
        );

      case "Active Code":
        return (
          <Box sx={{ p: 2 }}>
            <TextField
              label="Question Instructions"
              fullWidth
              margin="normal"
              multiline
              rows={2}
              value={newQuestion.stem || ''}
              onChange={(e) =>
                setNewQuestion((prev) => ({ ...prev, stem: e.target.value }))
              }
            />
            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
              Initial Code:
            </Typography>
            <Editor
              height="200px"
              defaultLanguage="python"
              value={newQuestion.initialCode || ''}
              onChange={(value) =>
                setNewQuestion((prev) => ({ ...prev, initialCode: value }))
              }
              options={{
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontSize: 14,
              }}
            />
            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
              Solution Code (Optional):
            </Typography>
            <Editor
              height="200px"
              defaultLanguage="python"
              value={newQuestion.solutionCode || ''}
              onChange={(value) =>
                setNewQuestion((prev) => ({ ...prev, solutionCode: value }))
              }
              options={{
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontSize: 14,
              }}
            />
            <TextField
              label="Test Cases (one per line)"
              fullWidth
              margin="normal"
              multiline
              rows={3}
              value={newQuestion.testCases || ''}
              onChange={(e) =>
                setNewQuestion((prev) => ({ ...prev, testCases: e.target.value }))
              }
              helperText="Enter test cases in format: input -> expected_output"
            />
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>Edit Test Page: {editedTest.plan_name}</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
            <TextField
              label="Preamble"
              fullWidth
              multiline
              rows={4}
              margin="normal"
              value={editedTest.preamble || ''}
              onChange={(e) =>
                setEditedTest(prev => ({ ...prev, preamble: e.target.value }))
              }
              helperText="Provide context and explanation for this test/exercise page"
            />
            <Button
              variant="outlined"
              startIcon={isGenerating ? <CircularProgress size={20} /> : <AutoFixHighIcon />}
              onClick={handleSuggestPreamble}
              disabled={isGenerating}
              sx={{ mt: 2 }}
            >
              Suggest
            </Button>
          </Box>

          <TextField
            label="Reference Code"
            fullWidth
            multiline
            rows={4}
            margin="normal"
            value={editedTest.reference || ''}
            onChange={(e) =>
              setEditedTest(prev => ({ ...prev, reference: e.target.value }))
            }
            helperText="Add reference code from other plans (not shown to students)"
          />
        </Box>

        <Typography variant="h6" gutterBottom>Questions</Typography>
        
        <Box sx={{ mb: 4 }}>
          {(editedTest.questions || []).map((question, index) => (
            <Paper 
              key={index} 
              sx={{ p: 2, mb: 2, position: 'relative' }}
              variant="outlined"
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                {questionTypeIcons[question.type]}
                <Typography variant="subtitle1" sx={{ ml: 1 }}>
                  Question {index + 1}: {question.type}
                </Typography>
                <IconButton 
                  size="small" 
                  color="error"
                  onClick={() => handleRemoveQuestion(index)}
                  sx={{ position: 'absolute', right: 8, top: 8 }}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {question.stem}
              </Typography>
              {question.type === "Active Code" && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Initial Code Length: {question.initialCode?.split('\n').length || 0} lines
                  </Typography>
                  {question.testCases && (
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                      Test Cases: {question.testCases.split('\n').length}
                    </Typography>
                  )}
                </Box>
              )}
            </Paper>
          ))}
        </Box>

        <Box sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Add New Question
            </Typography>
            {newQuestionType && (
              <Button
                variant="outlined"
                startIcon={isGenerating ? <CircularProgress size={20} /> : <TipsAndUpdatesIcon />}
                onClick={handleSuggestQuestion}
                disabled={isGenerating}
                size="small"
              >
                {isGenerating ? "Generating..." : "Suggest Question"}
              </Button>
            )}
          </Box>
          
          <ToggleButtonGroup
            value={newQuestionType}
            exclusive
            onChange={(e, value) => {
              setNewQuestionType(value);
              setNewQuestion({});
            }}
            sx={{ mb: 2, flexWrap: 'wrap' }}
          >
            {Object.entries(questionTypeIcons).map(([type, icon]) => (
              <ToggleButton value={type} key={type}>
                {icon}
                <Box sx={{ ml: 1 }}>{type}</Box>
              </ToggleButton>
            ))}
          </ToggleButtonGroup>

          {renderQuestionInputs()}

          {newQuestionType && (
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddCircleOutlineIcon />}
                onClick={handleAddQuestion}
              >
                Add Question
              </Button>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" color="primary">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TestPageModal; 