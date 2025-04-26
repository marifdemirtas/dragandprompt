import React, { useState, useEffect, memo, useCallback } from "react";
import {
  Button,
  TextField,
  Typography,
  IconButton,
  Grid,
  Paper,
  Box,
  Chip,
  Divider,
  Card,
  CardContent,
  CardActions,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import DeleteIcon from "@mui/icons-material/Delete";
import QuizIcon from '@mui/icons-material/Quiz';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import ShortTextIcon from '@mui/icons-material/ShortText';
import ReorderIcon from '@mui/icons-material/Reorder';
import TouchAppIcon from '@mui/icons-material/TouchApp';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useDrag, useDrop } from 'react-dnd';

const DraggableBlock = memo(({ block, index, moveBlock, onTextChange, onToggleDistractor, onDelete }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'block',
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: 'block',
    hover(item) {
      if (item.index !== index) {
        moveBlock(item.index, index);
        item.index = index;
      }
    },
  });

  const handleTextChange = useCallback((e) => {
    onTextChange(index, e.target.value);
  }, [index, onTextChange]);

  const handleToggleDistractor = useCallback(() => {
    onToggleDistractor(index);
  }, [index, onToggleDistractor]);

  const handleDelete = useCallback(() => {
    onDelete(index);
  }, [index, onDelete]);

  return (
    <Box
      ref={(node) => drag(drop(node))}
      sx={{
        mb: 1,
        bgcolor: block.isDistractor ? 'error.50' : 'background.paper',
        borderRadius: 1,
        boxShadow: isDragging ? 4 : 1,
        p: 1,
        opacity: isDragging ? 0.5 : 1,
        '&:hover': {
          bgcolor: 'action.hover'
        }
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
            minWidth: '30px'
          }}
        >
          {index}:
        </Typography>
        <DragIndicatorIcon sx={{ color: 'text.secondary', cursor: 'move' }} />
        <TextField
          fullWidth
          size="small"
          value={typeof block === 'object' ? block.text : block}
          onChange={handleTextChange}
        />
        <Tooltip title="Toggle Distractor">
          <IconButton
            size="small"
            color={block.isDistractor ? "error" : "default"}
            onClick={handleToggleDistractor}
          >
            <QuizIcon />
          </IconButton>
        </Tooltip>
        <IconButton
          size="small"
          color="error"
          onClick={handleDelete}
        >
          <DeleteIcon />
        </IconButton>
      </Box>
    </Box>
  );
});

const PlanQuestions = ({ planJson, questions = [], onUpdateQuestions, changeableAreas, llmKey }) => {
  // console.log("Plan JSON:", planJson); // Debug log
  const [newQuestionType, setNewQuestionType] = useState(null);
  const [newQuestion, setNewQuestion] = useState({});
  const [selectedAreas, setSelectedAreas] = useState([]);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const questionTypeIcons = {
    "MCQ": <QuizIcon />,
    "True/False": <CheckBoxIcon />,
    "Fill in the Blank": <ShortTextIcon />,
    "Parsons Problem": <ReorderIcon />,
    "Clickable Areas": <TouchAppIcon />,
  };

  const getQuestionNumber = (type, index, questionsList = questions) => {
    const typeQuestions = questionsList
      .slice(0, index + 1)
      .filter(q => q.type === type);
    const number = typeQuestions.length;
    return `${type}_${number}`;
  };

  const handleEditQuestion = (question, index) => {
    setEditingQuestion({ ...question, index });
    setNewQuestionType(question.type);
    setNewQuestion(question);
    if (question.type === "Clickable Areas") {
      setSelectedAreas(question.areas || []);
    }
  };

  const handleAddQuestion = () => {
    if (newQuestionType && Object.keys(newQuestion).length > 0) {
      if (editingQuestion) {
        const updatedQuestions = [...questions];
        updatedQuestions[editingQuestion.index] = {
          ...newQuestion,
          type: newQuestionType,
          question_id: editingQuestion.question_id
        };
        onUpdateQuestions(updatedQuestions);
      } else {
        const newQuestionNumber = getQuestionNumber(
          newQuestionType, 
          questions.length, 
          [...questions, { type: newQuestionType }]
        );

        onUpdateQuestions([
          ...questions, 
          { 
            type: newQuestionType,
            question_id: newQuestionNumber,
            ...newQuestion 
          }
        ]);
      }
      
      setNewQuestionType(null);
      setNewQuestion({});
      setSelectedAreas([]);
      setEditingQuestion(null);
    }
  };

  const handleRemoveQuestion = (index) => {
    const updatedQuestions = questions.filter((_, i) => i !== index);
    onUpdateQuestions(updatedQuestions);
  };

  useEffect(() => {
    const needsUpdate = questions.some(q => !q.question_id);
    if (needsUpdate) {
      const updatedQuestions = questions.map((question, index) => ({
        ...question,
        question_id: question.question_id || getQuestionNumber(question.type, index)
      }));
      onUpdateQuestions(updatedQuestions);
    }
  }, []);

  // Add ResizeObserver error handler
  useEffect(() => {
    const resizeHandler = (entries) => {
      window.requestAnimationFrame(() => {
        if (!Array.isArray(entries)) return;
        for (let entry of entries) {
          if (!entry.target || !entry.contentRect) continue;
        }
      });
    };

    // Create ResizeObserver instance
    const resizeObserver = new ResizeObserver(resizeHandler);

    // Handle ResizeObserver errors
    window.addEventListener('error', (e) => {
      if (e.message === 'ResizeObserver loop completed with undelivered notifications.') {
        e.stopPropagation();
        e.preventDefault();
      }
    });

    return () => {
      resizeObserver.disconnect();
      // Clean up error listener
      window.removeEventListener('error', resizeHandler);
    };
  }, []);

  const getQuestionFields = (type) => {
    switch (type) {
      case "MCQ":
        return "Fields to generate:\n- stem: The question text\n- correct: The correct answer\n- distractors: Array of incorrect options\n- feedback: Array of feedback messages for each distractor";
      case "True/False":
        return "Fields to generate:\n- stem: The statement to evaluate\n- label: Either 'True' or 'False'\n- feedback: Optional feedback for wrong answer";
      case "Fill in the Blank":
        return "Fields to generate:\n- stem: Instructions for what to fill in\n- area: The specific area to be filled (must be one of the changeable areas)\n- correct: The correct answer";
      case "Parsons Problem":
        return "Fields to generate:\n- stem: Instructions for arranging the blocks\n- blocks: Array of code blocks (each with 'text' and optional 'isDistractor' boolean)\n- correctOrder: Array of indices showing correct arrangement";
      case "Clickable Areas":
        return "Fields to generate:\n- stem: Instructions for what to click\n- areas: Array of area names to be clicked (must be from changeable areas)";
      default:
        return "";
    }
  };

  const extractJsonFromResponse = (responseText) => {
    const warnings = [];
    let jsonText = responseText.trim();

    // Check for ```json ... ``` format
    const jsonBlockMatch = responseText.match(/```json\n?([\s\S]*?)\n?```/);
    if (jsonBlockMatch) {
      jsonText = jsonBlockMatch[1].trim();
    } else {
      warnings.push("Response was not properly formatted with ```json``` code block");
    }

    return { jsonText, warnings };
  };

  const parseQuestionResponse = (type, responseText) => {
    const warnings = [];
    try {
      // First extract JSON from the response format
      const { jsonText, warnings: extractWarnings } = extractJsonFromResponse(responseText);
      warnings.push(...extractWarnings);

      // Then try to parse the JSON
      const parsed = JSON.parse(jsonText);
      
      // Validate and normalize based on question type
      let result;
      switch (type) {
        case "MCQ":
          if (!parsed.stem) warnings.push("Missing stem field");
          if (!parsed.correct) warnings.push("Missing correct answer");
          if (!Array.isArray(parsed.distractors)) warnings.push("Distractors should be an array");
          
          result = {
            stem: parsed.stem || '',
            correct: parsed.correct || '',
            distractors: Array.isArray(parsed.distractors) ? parsed.distractors : [],
            feedback: Array.isArray(parsed.feedback) ? 
              parsed.feedback.slice(0, parsed.distractors?.length || 0) : 
              Array(parsed.distractors?.length || 0).fill('')
          };
          break;

        case "True/False":
          if (!parsed.stem) warnings.push("Missing stem field");
          if (!['True', 'False'].includes(parsed.label)) warnings.push("Invalid label value");
          
          result = {
            stem: parsed.stem || '',
            label: ['True', 'False'].includes(parsed.label) ? parsed.label : 'True',
            feedback: parsed.feedback || ''
          };
          break;

        case "Fill in the Blank":
          if (!parsed.stem) warnings.push("Missing stem field");
          if (!parsed.area) warnings.push("Missing area field");
          if (!changeableAreas[parsed.area]) warnings.push(`Invalid area: ${parsed.area}`);
          
          result = {
            stem: parsed.stem || '',
            area: changeableAreas[parsed.area] ? parsed.area : Object.keys(changeableAreas)[0],
            correct: parsed.correct || ''
          };
          break;

        case "Parsons Problem":
          if (!parsed.stem) warnings.push("Missing stem field");
          if (!Array.isArray(parsed.blocks)) warnings.push("Blocks should be an array");
          
          const blocks = Array.isArray(parsed.blocks) ? 
            parsed.blocks.map(block => {
              if (typeof block === 'string') {
                return { text: block, isDistractor: false };
              }
              return {
                text: block.text || '',
                isDistractor: !!block.isDistractor
              };
            }) : [];

          result = {
            stem: parsed.stem || '',
            blocks,
            correctOrder: Array.isArray(parsed.correctOrder) ? 
              parsed.correctOrder.filter(i => i >= 0 && i < blocks.length) :
              blocks.map((_, i) => i)
          };
          break;

        case "Clickable Areas":
          if (!parsed.stem) warnings.push("Missing stem field");
          if (!Array.isArray(parsed.areas)) warnings.push("Areas should be an array");
          
          const validAreas = Array.isArray(parsed.areas) ?
            parsed.areas.filter(area => {
              const isValid = changeableAreas[area];
              if (!isValid) warnings.push(`Invalid area: ${area}`);
              return isValid;
            }) : [];
          
          result = {
            stem: parsed.stem || '',
            areas: validAreas.length > 0 ? validAreas : [Object.keys(changeableAreas)[0]]
          };
          break;

        default:
          result = parsed;
      }

      return { result, warnings };
    } catch (error) {
      warnings.push(`Failed to parse LLM response as JSON: ${error.message}`);
      return { 
        result: { stem: responseText },
        warnings 
      };
    }
  };

  const handleLLMSuggestion = async () => {
    if (!llmKey) {
      alert("Please set your Azure OpenAI API key first.");
      return;
    }
    if (!planJson || Object.keys(planJson).length === 0) {
      alert("Plan context is not available.");
      return;
    }

    // Split the API key into actual key and endpoint
    const [apiKey, targetUri] = llmKey.split('|');
    
    if (!apiKey || !targetUri) {
      alert("Please provide both Azure OpenAI API Key and Target URI in format: 'API_KEY|TARGET_URI'");
      return;
    }

    const interactionLog = {
      questionType: newQuestionType,
      endpoint: targetUri
    };

    setIsLoading(true);

    try {
      // Extract changeable areas explanation
      const changeableAreasExplanation = Object.entries(changeableAreas || {})
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n');

      const prompt = `Generate a JSON output (and nothing else) to act as a possible programming exercise. Your context will be a programming plan, which is a common template in the target domain with certain fields

Question type: ${newQuestionType}
${getQuestionFields(newQuestionType)}

Plan name: ${planJson.plan_name || 'Unnamed Plan'}
Plan goal: ${planJson.goal || 'No goal specified'}
Code template for the plan:
${planJson.code_template?.lines?.join('\n') || 'No code template'}
Parts in the template that can change are annotated with @ signs. These parts are:
${changeableAreasExplanation}

In your question, situate this plan in a particular context.`;

      interactionLog.prompt = prompt;
      
      const requestBody = {
        model: "gpt-4",
        messages: [{
          role: "user",
          content: prompt
        }],
        temperature: 0.7
      };

      interactionLog.requestBody = requestBody;

      const response = await fetch(targetUri, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": apiKey
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const suggestionText = data.choices?.[0]?.message?.content?.trim();
      
      interactionLog.rawResponse = {
        ...data,
        parsedContent: suggestionText  // Add the raw content for logging
      };

      const { result: suggestion, warnings } = parseQuestionResponse(newQuestionType, suggestionText);
      
      interactionLog.parsedResponse = suggestion;
      interactionLog.parsingWarnings = warnings;
      
      // Add the extracted JSON to the log
      const { jsonText } = extractJsonFromResponse(suggestionText);
      interactionLog.extractedJson = jsonText;
      
      logLLMInteraction(interactionLog);
      
      setNewQuestion(prev => ({ ...prev, ...suggestion }));
    } catch (error) {
      interactionLog.error = error;
      logLLMInteraction(interactionLog);
      
      console.error("Error fetching LLM suggestion:", error);
      alert("An error occurred while fetching suggestion from Azure OpenAI.");
    } finally {
      setIsLoading(false);
    }
  };

  const extractCodeLines = () => {
    // Check both planJson.code and planJson.content for the code
    const codeContent = planJson.code_template.lines || '';
    console.log("Code content:", codeContent); // Debug log
    
    if (!codeContent) {
      alert("No code found in the plan");
      return [];
    }

    const lines = codeContent
      .map(line => line.trimRight())
      .filter(line => line.length > 0)
      .map(line => ({
        text: line,
        isDistractor: false
      }));

    console.log("Extracted lines:", lines); // Debug log
    return lines;
  };

  const reorder = (list, startIndex, endIndex) => {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    return result;
  };

  const moveBlock = useCallback((fromIndex, toIndex) => {
    setNewQuestion(prev => {
      const blocks = [...(prev.blocks || [])];
      const [movedBlock] = blocks.splice(fromIndex, 1);
      blocks.splice(toIndex, 0, movedBlock);
      
      const correctOrder = prev.correctOrder?.map(index => {
        if (index === fromIndex) return toIndex;
        if (fromIndex < toIndex && index > fromIndex && index <= toIndex) 
          return index - 1;
        if (fromIndex > toIndex && index >= toIndex && index < fromIndex) 
          return index + 1;
        return index;
      });

      return {
        ...prev,
        blocks,
        correctOrder
      };
    });
  }, []);

  const handleTextChange = useCallback((index, value) => {
    setNewQuestion(prev => {
      const newBlocks = [...(prev.blocks || [])];
      newBlocks[index] = {
        ...(typeof newBlocks[index] === 'object' ? newBlocks[index] : { isDistractor: false }),
        text: value
      };
      return { ...prev, blocks: newBlocks };
    });
  }, []);

  const handleToggleDistractor = useCallback((index) => {
    setNewQuestion(prev => {
      const newBlocks = [...(prev.blocks || [])];
      newBlocks[index] = {
        ...(typeof newBlocks[index] === 'object' ? newBlocks[index] : { text: newBlocks[index] }),
        isDistractor: !newBlocks[index].isDistractor
      };
      return { ...prev, blocks: newBlocks };
    });
  }, []);

  const handleDeleteBlock = useCallback((index) => {
    setNewQuestion(prev => ({
      ...prev,
      blocks: prev.blocks.filter((_, i) => i !== index)
    }));
  }, []);

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
            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
              Select Changeable Area:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {Object.keys(changeableAreas).map((area) => (
                <Chip
                  key={area}
                  label={area}
                  clickable
                  color={newQuestion.area === area ? "primary" : "default"}
                  onClick={() =>
                    setNewQuestion((prev) => ({ ...prev, area: area }))
                  }
                />
              ))}
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

      case "Parsons Problem":
        return (
          <DndProvider backend={HTML5Backend}>
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
                Code Blocks:
              </Typography>

              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  const codeLines = extractCodeLines();
                  if (codeLines.length > 0) {
                    setNewQuestion(prev => ({
                      ...prev,
                      blocks: codeLines,
                      correctOrder: codeLines.map((_, i) => i)
                    }));
                  }
                }}
                sx={{ mb: 2 }}
              >
                Populate from Code
              </Button>
              
              <Box sx={{ mb: 2 }}>
                {(newQuestion.blocks || []).map((block, index) => (
                  <DraggableBlock
                    key={index}
                    block={block}
                    index={index}
                    moveBlock={moveBlock}
                    onTextChange={handleTextChange}
                    onToggleDistractor={handleToggleDistractor}
                    onDelete={handleDeleteBlock}
                  />
                ))}
              </Box>

              <Button
                startIcon={<AddCircleOutlineIcon />}
                onClick={() => {
                  setNewQuestion(prev => ({
                    ...prev,
                    blocks: [...(prev.blocks || []), { text: '', isDistractor: false }]
                  }));
                }}
                sx={{ mt: 1 }}
              >
                Add Code Block
              </Button>

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
            </Box>
          </DndProvider>
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
            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
              Select Changeable Areas:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {Object.keys(changeableAreas).map((area) => (
                <Chip
                  key={area}
                  label={area}
                  clickable
                  color={selectedAreas.includes(area) ? "primary" : "default"}
                  onClick={() => {
                    const newAreas = selectedAreas.includes(area)
                      ? selectedAreas.filter((a) => a !== area)
                      : [...selectedAreas, area];
                    setSelectedAreas(newAreas);
                    setNewQuestion((prev) => ({ ...prev, areas: newAreas }));
                  }}
                />
              ))}
            </Box>
          </Box>
        );

      default:
        return null;
    }
  };

  const logLLMInteraction = (interaction) => {
    console.group('LLM Interaction Log');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Question Type:', interaction.questionType);
    
    console.group('Prompt');
    console.log(interaction.prompt);
    console.groupEnd();

    console.group('API Request');
    console.log('Endpoint:', interaction.endpoint);
    console.log('Request Body:', interaction.requestBody);
    console.groupEnd();

    if (interaction.error) {
      console.group('Error');
      console.error('Error Details:', interaction.error);
      console.groupEnd();
    } else {
      console.group('Response');
      console.log('Raw Response:', interaction.rawResponse);
      console.log('Extracted JSON:', interaction.extractedJson);
      console.log('Parsed Response:', interaction.parsedResponse);
      console.groupEnd();
    }

    if (interaction.parsingWarnings?.length) {
      console.group('Parsing Warnings');
      interaction.parsingWarnings.forEach(warning => console.warn(warning));
      console.groupEnd();
    }

    console.groupEnd();
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={2}>
          {questions.map((question, index) => (
            <Grid item xs={12} md={6} key={index}>
              <Card variant="outlined">
                <CardContent sx={{ pb: 1 }}>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    mb: 1 
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {questionTypeIcons[question.type]}
                      <Typography variant="subtitle1" component="div">
                        {question.question_id || getQuestionNumber(question.type, index)}
                      </Typography>
                    </Box>
                    <Box>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleEditQuestion(question, index)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleRemoveQuestion(index)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ 
                      mb: 1,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {question.stem}
                  </Typography>
                  {question.type === "MCQ" && (
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: 'column',
                      gap: 1,
                      fontSize: '0.75rem'
                    }}>
                      <Typography 
                        variant="caption" 
                        color="success.main"
                        sx={{ display: 'flex', alignItems: 'center' }}
                      >
                        ✓ {question.correct}
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        {question.distractors?.map((distractor, idx) => (
                          <Typography 
                            key={idx}
                            variant="caption" 
                            color="error.main"
                            sx={{ display: 'flex', alignItems: 'center' }}
                          >
                            ✗ {distractor}
                            {question.feedback?.[idx] && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ ml: 1 }}
                              >
                                (Feedback: {question.feedback[idx]})
                              </Typography>
                            )}
                          </Typography>
                        ))}
                      </Box>
                    </Box>
                  )}
                  {question.type === "Fill in the Blank" && (
                    <Typography variant="caption" color="primary">
                      Area: {question.area}
                    </Typography>
                  )}
                  {question.type === "Clickable Areas" && (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {question.areas?.map((area, i) => (
                        <Chip 
                          key={i} 
                          label={area} 
                          size="small" 
                          variant="outlined"
                          sx={{ height: 20, fontSize: '0.75rem' }}
                        />
                      ))}
                    </Box>
                  )}
                  {question.type === "True/False" && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Typography 
                        variant="caption" 
                        color={question.label === "True" ? "success.main" : "error.main"}
                      >
                        Answer: {question.label}
                      </Typography>
                      {question.feedback && (
                        <Typography variant="caption" color="text.secondary">
                          Wrong answer feedback: {question.feedback}
                        </Typography>
                      )}
                    </Box>
                  )}
                  {question.type === "Parsons Problem" && (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        Blocks: {question.blocks?.length || 0} 
                        {question.blocks?.some(b => b.isDistractor) && 
                          ` (${question.blocks.filter(b => b.isDistractor).length} distractors)`}
                      </Typography>
                      <Box sx={{ 
                        display: 'flex', 
                        flexWrap: 'wrap', 
                        gap: 0.5,
                        mt: 0.5 
                      }}>
                        {question.blocks?.slice(0, 2).map((block, i) => (
                          <Chip
                            key={i}
                            label={`${i}: ${typeof block === 'object' ? block.text : block}`.substring(0, 20) + 
                              (`${typeof block === 'object' ? block.text : block}`.length > 20 ? '...' : '')}
                            size="small"
                            variant="outlined"
                            color={block.isDistractor ? "error" : "default"}
                            sx={{ height: 20, fontSize: '0.75rem' }}
                          />
                        ))}
                        {(question.blocks?.length || 0) > 2 && (
                          <Chip
                            label={`+${(question.blocks?.length || 0) - 2} more`}
                            size="small"
                            variant="outlined"
                            sx={{ height: 20, fontSize: '0.75rem' }}
                          />
                        )}
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          {editingQuestion ? 'Edit Question' : 'Add New Question'}
        </Typography>
        <Box sx={{ mb: 2 }}>
          <ToggleButtonGroup
            value={newQuestionType}
            exclusive
            onChange={(e, value) => setNewQuestionType(value)}
            sx={{ flexWrap: 'wrap' }}
          >
            {Object.entries(questionTypeIcons).map(([type, icon]) => (
              <ToggleButton value={type} key={type}>
                {icon}
                <Box sx={{ ml: 1 }}>{type}</Box>
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>

        {renderQuestionInputs()}

        {newQuestionType && (
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            {!editingQuestion && (
              <Button
                variant="outlined"
                onClick={handleLLMSuggestion}
                disabled={isLoading}
                startIcon={isLoading ? <CircularProgress size={20} /> : null}
              >
                {isLoading ? "Generating..." : "Ask for Suggestion"}
              </Button>
            )}
            <Button
              variant="contained"
              color="primary"
              startIcon={editingQuestion ? <SaveIcon /> : <AddCircleOutlineIcon />}
              onClick={handleAddQuestion}
            >
              {editingQuestion ? 'Save Changes' : 'Add Question'}
            </Button>
            {editingQuestion && (
              <Button
                variant="outlined"
                color="secondary"
                onClick={() => {
                  setEditingQuestion(null);
                  setNewQuestionType(null);
                  setNewQuestion({});
                  setSelectedAreas([]);
                }}
              >
                Cancel
              </Button>
            )}
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default PlanQuestions;
