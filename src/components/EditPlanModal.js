import React, { useState, useEffect } from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Typography,
  Box,
  Popover,
  Grid,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import { Editor, useMonaco } from "@monaco-editor/react";
import DeleteIcon from "@mui/icons-material/Delete";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { SketchPicker } from "react-color";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import PlanMetadata from "./PlanMetadata"; // Import the new component
import PlanQuestions from "./PlanQuestions";
import EditIcon from "@mui/icons-material/Edit";
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import HeightIcon from '@mui/icons-material/Height';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vs2015 } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import python from 'react-syntax-highlighter/dist/esm/languages/hljs/python';
import Prism from 'prismjs';
import 'prismjs/components/prism-python';
import 'prismjs/themes/prism-tomorrow.css';
import CodeIcon from '@mui/icons-material/Code';
import PreviewIcon from '@mui/icons-material/Preview';
import CompareIcon from '@mui/icons-material/Compare';

// Register Python language
SyntaxHighlighter.registerLanguage('python', python);

// Add this CSS to match Monaco's theme colors
const monocoLikeTheme = `
  .token.comment { color: #6A9955; }
  .token.string { color: #CE9178; }
  .token.number { color: #B5CEA8; }
  .token.keyword { color: #569CD6; }
  .token.function { color: #DCDCAA; }
  .token.operator { color: #D4D4D4; }
  .token.class-name { color: #4EC9B0; }
  
  .line-number {
    display: inline-block;
    width: 2.5em;
    user-select: none;
    opacity: 0.4;
    text-align: right;
    margin-right: 1.2em;
    padding-right: 0.8em;
    border-right: 1px solid #404040;
    color: #858585;
  }
`;

const EditPlanModal = ({ plan, onSave, onClose }) => {
  const [editedPlan, setEditedPlan] = useState({ ...plan });
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [anchorEl, setAnchorEl] = useState(null);
  const [currentKey, setCurrentKey] = useState("");
  const [selectedText, setSelectedText] = useState("");
  const [editorInstance, setEditorInstance] = useState(null);
  const [editingKey, setEditingKey] = useState(null);
  const [newKeyName, setNewKeyName] = useState("");
  const [isScrollable, setIsScrollable] = useState(true);
  const [expandedBox, setExpandedBox] = useState(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [viewMode, setViewMode] = useState('compare'); // 'edit', 'preview', or 'compare'

  const handleSave = () => {
    onSave(editedPlan);
    onClose();
  };

  const handleChange = (field) => (event) => {
    setEditedPlan({ ...editedPlan, [field]: event.target.value });
  };

  const handleCodeChange = (newCode) => {
    setEditedPlan((prev) => ({
      ...prev,
      code_template: {
        ...prev.code_template,
        lines: newCode.split("\n"),
      },
    }));
  };
  const handleUpdateMetadata = (updatedMetadata) => {
    setEditedPlan((prev) => ({
      ...prev,
      plan_metadata: updatedMetadata,
    }));
  };

  const handleEditorDidMount = (editor, monaco) => {
    setEditorInstance(editor);
    
    // Define custom tokenizer rules for Python
    monaco.languages.setMonarchTokensProvider('python', {
      defaultToken: '',
      tokenPostfix: '.python',

      // Custom tokens
      keywords: [
        'and', 'as', 'assert', 'break', 'class', 'continue', 'def',
          'del', 'elif', 'else', 'except', 'exec', 'finally', 'for',
          'from', 'global', 'if', 'import', 'in', 'is', 'lambda', 'not',
          'or', 'pass', 'print', 'raise', 'return', 'try', 'while',
          'with', 'yield', 'None', 'True', 'False'
      ],

      brackets: [
        { open: '{', close: '}', token: 'delimiter.curly' },
          { open: '[', close: ']', token: 'delimiter.square' },
          { open: '(', close: ')', token: 'delimiter.parenthesis' },
      ],

      tokenizer: {
        root: [
          // Changeable areas
          [/@@[a-zA-Z_]\w*@@/, 'changeable-area'],
          
          // Whitespace
          { include: '@whitespace' },

          // Decorators
          [/@[a-zA-Z_]\w*/, 'tag'],

          // Keywords
          [/[a-zA-Z_]\w*/, {
            cases: {
              '@keywords': 'keyword',
              '@default': 'identifier'
            }
          }],

          // Numbers
          [/[0-9]+/, 'number'],

          // Strings
          [/'([^'\\]|\\.)*$/, 'string.invalid'],
          [/"([^"\\]|\\.)*$/, 'string.invalid'],
          [/'/, 'string', '@string_single'],
          [/"/, 'string', '@string_double'],
        ],

        whitespace: [
          [/[ \t\r\n]+/, 'white'],
          [/#.*$/, 'comment'],
        ],

        string_single: [
          [/[^\\']+/, 'string'],
          [/\\./, 'string.escape'],
          [/'/, 'string', '@pop']
        ],

        string_double: [
          [/[^\\"]+/, 'string'],
          [/\\./, 'string.escape'],
          [/"/, 'string', '@pop']
        ],
      }
    });

    // Define custom theme rules
    monaco.editor.defineTheme('custom-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'changeable-area', foreground: 'cccccc' }, // Light gray color
        { token: 'keyword', foreground: '569CD6' },         // Keep Python keywords blue
        { token: 'string', foreground: 'CE9178' },         // Keep strings brown/orange
        { token: 'comment', foreground: '6A9955' },        // Keep comments green
        { token: 'number', foreground: 'B5CEA8' },         // Keep numbers light green
        { token: 'tag', foreground: '569CD6' },            // Keep decorators blue
      ],
      colors: {}
    });

    // Apply the custom theme
    monaco.editor.setTheme('custom-dark');
    
    editor.onDidChangeCursorSelection((e) => {
      const selection = editor.getModel().getValueInRange(e.selection);
      setSelectedText(selection);
      if (selection) {
        let key = selection.trim()
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '_')
          .substring(0, 20);
        
        let uniqueKey = key;
        let counter = 1;
        while (editedPlan.code_template.changeable_areas[uniqueKey]) {
          uniqueKey = `${key}_${counter}`;
          counter++;
        }
        setNewKey(uniqueKey);
      }
    });
  };

  const handleAddChangeableArea = () => {
    if (newKey && !editedPlan.code_template.changeable_areas[newKey]) {
      if (selectedText && editorInstance) {
        const selection = editorInstance.getSelection();
        
        const operation = {
          range: selection,
          text: `@@${newKey}@@`,
        };
        
        editorInstance.executeEdits('makeChangeable', [operation]);
      }

      setEditedPlan((prev) => ({
        ...prev,
        code_template: {
          ...prev.code_template,
          changeable_areas: { 
            ...prev.code_template.changeable_areas, 
            [newKey]: selectedText ? [selectedText] : [] 
          },
          changeable_areas_annotations: {
            ...prev.code_template.changeable_areas_annotations,
            [newKey]: "",
          },
          changeable_areas_colors: {
            ...prev.code_template.changeable_areas_colors,
            [newKey]: "#4CAF50",
          },
        },
      }));

      if (selectedText && editorInstance) {
        const newCode = editorInstance.getValue();
        handleCodeChange(newCode);
      }
      
      setNewKey("");
      setSelectedText("");
    }
  };

  const handleRemoveChangeableArea = (key) => {
    setEditedPlan((prev) => {
      const firstValue = prev.code_template.changeable_areas[key]?.[0] || '';
      const { [key]: _, ...remainingAreas } = prev.code_template.changeable_areas;
      const { [key]: __, ...remainingAnnotations } = prev.code_template.changeable_areas_annotations;
      const { [key]: ___, ...remainingColors } = prev.code_template.changeable_areas_colors;

      const newLines = prev.code_template.lines.map(line =>
        line.replace(new RegExp(`@@${key}@@`, 'g'), firstValue)
      );

      return {
        ...prev,
        code_template: {
          ...prev.code_template,
          lines: newLines,
          changeable_areas: remainingAreas,
          changeable_areas_annotations: remainingAnnotations,
          changeable_areas_colors: remainingColors,
        },
      };
    });
  };

  const handleAddValue = (key) => {
    if (newValue) {
      setEditedPlan((prev) => ({
        ...prev,
        code_template: {
          ...prev.code_template,
          changeable_areas: {
            ...prev.code_template.changeable_areas,
            [key]: [...prev.code_template.changeable_areas[key], newValue],
          },
        },
      }));
      setNewValue("");
    }
  };

  const handleRemoveValue = (key, value) => {
    setEditedPlan((prev) => ({
      ...prev,
      code_template: {
        ...prev.code_template,
        changeable_areas: {
          ...prev.code_template.changeable_areas,
          [key]: prev.code_template.changeable_areas[key].filter((v) => v !== value),
        },
      },
    }));
  };

  const handleAnnotationChange = (key, value) => {
    setEditedPlan((prev) => ({
      ...prev,
      code_template: {
        ...prev.code_template,
        changeable_areas_annotations: {
          ...prev.code_template.changeable_areas_annotations,
          [key]: value,
        },
      },
    }));
  };

  const handleColorClick = (event, key) => {
    setAnchorEl(event.currentTarget);
    setCurrentKey(key);
  };

  const handleColorChange = (color) => {
    setEditedPlan((prev) => ({
      ...prev,
      code_template: {
        ...prev.code_template,
        changeable_areas_colors: {
          ...prev.code_template.changeable_areas_colors,
          [currentKey]: color.hex,
        },
      },
    }));
  };

  const handleClosePopover = () => {
    setAnchorEl(null);
    setCurrentKey("");
  };

  // Add the style tag to the component
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = monocoLikeTheme;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // Update getHighlightedCode to include line numbers
  const getHighlightedCode = () => {
    const { lines, changeable_areas_colors } = editedPlan.code_template;
    const code = lines.join("\n");
    
    const highlightedCode = Prism.highlight(code, Prism.languages.python, 'python');
    
    const processedCode = highlightedCode
      .split('\n')
      .map((line, i) => {
        const lineNumber = i + 1;
        const processedLine = line.replace(/\t/g, '    ')
          .replace(/@@(.*?)@@/g, (match, key) => {
            const color = changeable_areas_colors[key] || "#1e1e1e";
            return `<span style="background-color: ${color}; padding: 2px 4px; border-radius: 4px; color: white;">${key}</span>`;
          });
        return `<span class="line"><span class="line-number">${lineNumber}</span>${processedLine}</span>`;
      })
      .join('\n');

    return processedCode;
  };

  const handleRenameKey = (oldKey) => {
    if (!newKeyName || newKeyName === oldKey) {
      setEditingKey(null);
      return;
    }

    if (editedPlan.code_template.changeable_areas[newKeyName]) {
      alert("This key already exists!");
      return;
    }

    setEditedPlan((prev) => {
      const { [oldKey]: areaValues, ...remainingAreas } = prev.code_template.changeable_areas;
      const { [oldKey]: annotation, ...remainingAnnotations } = prev.code_template.changeable_areas_annotations;
      const { [oldKey]: color, ...remainingColors } = prev.code_template.changeable_areas_colors;

      const newLines = prev.code_template.lines.map(line =>
        line.replace(
          new RegExp(`@@${oldKey}@@`, 'g'),
          `@@${newKeyName}@@`
        )
      );

      return {
        ...prev,
        code_template: {
          ...prev.code_template,
          lines: newLines,
          changeable_areas: {
            ...remainingAreas,
            [newKeyName]: areaValues,
          },
          changeable_areas_annotations: {
            ...remainingAnnotations,
            [newKeyName]: annotation,
          },
          changeable_areas_colors: {
            ...remainingColors,
            [newKeyName]: color,
          },
        },
      };
    });

    setEditingKey(null);
    setNewKeyName("");
  };

  const handleViewModeChange = (event, newMode) => {
    if (newMode !== null) {
      setViewMode(newMode);
    }
  };

  return (
    <Dialog open onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {isEditingName ? (
            <TextField
              autoFocus
              fullWidth
              value={editedPlan.plan_name}
              onChange={(e) =>
                setEditedPlan({ ...editedPlan, plan_name: e.target.value })
              }
              onBlur={() => setIsEditingName(false)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  setIsEditingName(false);
                }
              }}
            />
          ) : (
            <>
              <Typography variant="h6" sx={{ flex: 1 }}>
                {editedPlan.plan_name}
              </Typography>
              <IconButton 
                size="small" 
                onClick={() => setIsEditingName(true)}
                sx={{ ml: 1 }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </>
          )}
        </Box>
      </DialogTitle>
      <DialogContent>
        <TextField
          label="Goal"
          fullWidth
          margin="normal"
          value={editedPlan.goal}
          onChange={(e) =>
            setEditedPlan({ ...editedPlan, goal: e.target.value })
          }
          disabled={editedPlan.isTest}
        />

        {!editedPlan.isTest && (
          <div style={{ marginTop: "20px", display: "flex", gap: "20px", flexDirection: "column" }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={handleViewModeChange}
                aria-label="view mode"
                size="small"
              >
                <ToggleButton value="edit" aria-label="edit mode">
                  <CodeIcon sx={{ mr: 1 }} />
                  Edit
                </ToggleButton>
                <ToggleButton value="preview" aria-label="preview mode">
                  <PreviewIcon sx={{ mr: 1 }} />
                  Preview
                </ToggleButton>
                <ToggleButton value="compare" aria-label="compare mode">
                  <CompareIcon sx={{ mr: 1 }} />
                  Compare
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>

            <div style={{ 
              display: "flex", 
              gap: "20px",
              height: "300px"
            }}>
              <div style={{ 
                flex: viewMode === 'preview' ? 0 : 1,
                display: viewMode === 'preview' ? 'none' : 'block'
              }}>
                <Editor
                  height="300px"
                  defaultLanguage="python"
                  value={editedPlan.code_template.lines.join("\n")}
                  onChange={handleCodeChange}
                  onMount={handleEditorDidMount}
                  theme="custom-dark"
                  options={{
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    fontSize: 14,
                    contextmenu: true,
                  }}
                />
              </div>

              <div style={{ 
                flex: viewMode === 'edit' ? 0 : 1,
                display: viewMode === 'edit' ? 'none' : 'block'
              }}>
                <div
                  style={{
                    height: "300px",
                    overflow: "auto",
                    padding: "0 0 0 10px",
                    backgroundColor: "#1e1e1e",
                    borderRadius: "5px",
                    color: "#D4D4D4",
                    fontFamily: "'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'source-code-pro', monospace",
                    fontSize: "14px",
                    whiteSpace: "pre",
                    lineHeight: "1.4",
                  }}
                  dangerouslySetInnerHTML={{ __html: getHighlightedCode() }}
                  className="language-python"
                ></div>
              </div>
            </div>
          </div>
        )}

        {!editedPlan.isTest && (
          <>
            <Accordion defaultExpanded={false}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                Changeable Areas
              </AccordionSummary>
              <AccordionDetails 
                style={{ 
                  maxHeight: isScrollable ? '500px' : 'none',
                  overflow: isScrollable ? 'auto' : 'visible'
                }}
              >
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Box display="flex" gap={2} alignItems="center" flex={1}>
                    <TextField
                      label="New Changeable Key"
                      value={newKey}
                      onChange={(e) => setNewKey(e.target.value)}
                      fullWidth
                      size="small"
                      helperText={selectedText ? "Selected text will be made changeable" : "Select text in editor to make changeable"}
                    />
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleAddChangeableArea}
                      startIcon={<AddCircleOutlineIcon />}
                      disabled={!newKey || (!selectedText && !editedPlan.code_template.changeable_areas[newKey])}
                    >
                      Add
                    </Button>
                  </Box>
                  <Button
                    startIcon={<HeightIcon />}
                    onClick={() => setIsScrollable(!isScrollable)}
                    size="small"
                    sx={{ ml: 2 }}
                  >
                    {isScrollable ? 'Disable Scroll' : 'Enable Scroll'}
                  </Button>
                </Box>

                <Grid container spacing={2}>
                  {Object.keys(editedPlan.code_template.changeable_areas).map((key) => (
                    <Grid 
                      item 
                      xs={12} 
                      sm={expandedBox === key ? 12 : 6} 
                      md={expandedBox === key ? 12 : 4} 
                      key={key}
                    >
                      <Box
                        border="1px solid #ccc"
                        borderRadius="8px"
                        padding="16px"
                        height="100%"
                        sx={{
                          transition: 'all 0.3s ease',
                          position: 'relative',
                        }}
                      >
                        <div style={{ 
                          display: "flex", 
                          alignItems: "center", 
                          gap: "10px", 
                          marginBottom: "10px", 
                          justifyContent: "space-between" 
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            {editingKey === key ? (
                              <>
                                <TextField
                                  size="small"
                                  value={newKeyName}
                                  onChange={(e) => setNewKeyName(e.target.value)}
                                  autoFocus
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                      handleRenameKey(key);
                                    }
                                  }}
                                />
                                <Button
                                  size="small"
                                  variant="contained"
                                  onClick={() => handleRenameKey(key)}
                                >
                                  Save
                                </Button>
                                <Button
                                  size="small"
                                  onClick={() => {
                                    setEditingKey(null);
                                    setNewKeyName("");
                                  }}
                                >
                                  Cancel
                                </Button>
                              </>
                            ) : (
                              <>
                                <Typography variant="subtitle1">Key: {key}</Typography>
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    setEditingKey(key);
                                    setNewKeyName(key);
                                  }}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <IconButton
                              size="small"
                              onClick={() => setExpandedBox(expandedBox === key ? null : key)}
                            >
                              {expandedBox === key ? (
                                <FullscreenExitIcon fontSize="small" />
                              ) : (
                                <FullscreenIcon fontSize="small" />
                              )}
                            </IconButton>
                            <IconButton
                              color="error"
                              onClick={() => handleRemoveChangeableArea(key)}
                            >
                              <DeleteForeverIcon />
                            </IconButton>
                          </div>
                        </div>

                        <div style={{
                          display: 'flex',
                          flexDirection: expandedBox === key ? 'row' : 'column',
                          gap: '16px',
                          alignItems: expandedBox === key ? 'flex-start' : 'stretch',
                        }}>
                          <div style={{ flex: expandedBox === key ? 1 : 'auto' }}>
                            <TextField
                              label="Edit Annotation"
                              fullWidth
                              margin="normal"
                              size="small"
                              value={editedPlan.code_template.changeable_areas_annotations[key]}
                              onChange={(e) => handleAnnotationChange(key, e.target.value)}
                            />
                            <Button
                              variant="contained"
                              size="small"
                              style={{
                                backgroundColor:
                                  editedPlan.code_template.changeable_areas_colors[key],
                                color: "#fff",
                              }}
                              onClick={(e) => handleColorClick(e, key)}
                            >
                              Pick Color
                            </Button>
                          </div>
                          <List 
                            dense 
                            style={{ 
                              flex: expandedBox === key ? 2 : 'auto',
                              maxHeight: expandedBox === key ? '300px' : 'none',
                              overflow: expandedBox === key ? 'auto' : 'visible',
                            }}
                          >
                            {editedPlan.code_template.changeable_areas[key].map((value, idx) => (
                              <ListItem key={idx}>
                                <ListItemText 
                                  primary={value}
                                  primaryTypographyProps={{ 
                                    style: { 
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis'
                                    }
                                  }}
                                />
                                <ListItemSecondaryAction>
                                  <IconButton
                                    edge="end"
                                    size="small"
                                    onClick={() => handleRemoveValue(key, value)}
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                </ListItemSecondaryAction>
                              </ListItem>
                            ))}
                            <ListItem>
                              <TextField
                                label="Add Value"
                                size="small"
                                fullWidth
                                value={newValue}
                                onChange={(e) => setNewValue(e.target.value)}
                              />
                              <Button
                                variant="contained"
                                size="small"
                                onClick={() => handleAddValue(key)}
                                color="primary"
                                style={{ marginLeft: '8px' }}
                              >
                                Add
                              </Button>
                            </ListItem>
                          </List>
                        </div>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </AccordionDetails>
            </Accordion>

            <Accordion defaultExpanded={false}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>Plan Metadata</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <PlanMetadata
                  metadata={editedPlan.plan_metadata || {}}
                  onUpdateMetadata={handleUpdateMetadata}
                />
              </AccordionDetails>
            </Accordion>
          </>
        )}

        <Accordion defaultExpanded={editedPlan.isTest}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>{editedPlan.isTest ? "Test Questions" : "Plan Questions"}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <PlanQuestions
              llmKey="..."
              planJson={editedPlan}
              questions={editedPlan.questions || []}
              onUpdateQuestions={(updatedQuestions) =>
                setEditedPlan((prev) => ({ ...prev, questions: updatedQuestions }))
              }
              changeableAreas={editedPlan.code_template.changeable_areas || {}}
            />
          </AccordionDetails>
        </Accordion>
        
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSave}
          color="primary"
        >
          Save
        </Button>
      </DialogActions>
      
      {/* Color Picker Popover */}
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClosePopover}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        <SketchPicker
          color={currentKey ? editedPlan.code_template.changeable_areas_colors[currentKey] : '#fff'}
          onChange={handleColorChange}
        />
      </Popover>
    </Dialog>
  );
};

export default EditPlanModal;