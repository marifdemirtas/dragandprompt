import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  TextField,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Paper,
  Chip,
  CircularProgress,
  Collapse,
  Divider
} from '@mui/material';
import PreviewIcon from '@mui/icons-material/Preview';
import RefreshIcon from '@mui/icons-material/Refresh';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const GenerateExamplesModal = ({ 
  open, 
  onClose, 
  plans, 
  onGenerateExample, 
  onPreviewExample,
  cachedExamples 
}) => {
  // Group the plans and sort them by order property
  const groupedPlans = plans.reduce((acc, plan) => {
    if (plan.group && !plan.isTest && plan.group !== "Ungrouped") {
      if (!acc[plan.group]) {
        acc[plan.group] = [];
      }
      acc[plan.group].push(plan);
    }
    return acc;
  }, {});
  
  // Sort plans in each group by order property
  Object.keys(groupedPlans).forEach(groupName => {
    groupedPlans[groupName].sort((a, b) => {
      // Use order property if available, otherwise keep original order
      const orderA = a.order !== undefined ? a.order : Number.MAX_SAFE_INTEGER;
      const orderB = b.order !== undefined ? b.order : Number.MAX_SAFE_INTEGER;
      return orderA - orderB;
    });
  });

  // State for user context inputs and expanded items
  const [userContexts, setUserContexts] = useState({});
  const [expandedItems, setExpandedItems] = useState({});
  const [generating, setGenerating] = useState({});

  const handleContextChange = (groupName, value) => {
    setUserContexts(prev => ({
      ...prev,
      [groupName]: value
    }));
  };

  const handleToggleExpand = (groupName) => {
    setExpandedItems(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  const handleGenerateExample = async (groupName) => {
    setGenerating(prev => ({ ...prev, [groupName]: true }));
    await onGenerateExample(groupName, groupedPlans[groupName], userContexts[groupName]);
    setGenerating(prev => ({ ...prev, [groupName]: false }));
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '60vh' }
      }}
    >
      <DialogTitle>Generate Integrated Examples</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Generate contextual examples for each group of plans. Optionally provide context to guide the example generation.
        </Typography>
        
        <List>
          {Object.entries(groupedPlans).map(([groupName, plans]) => (
            <Paper 
              key={groupName} 
              elevation={1} 
              sx={{ mb: 2, overflow: 'hidden' }}
            >
              <ListItem
                secondaryAction={
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {cachedExamples?.[groupName] && (
                      <Chip
                        icon={<CheckCircleIcon />}
                        label="Cached"
                        color="success"
                        size="small"
                      />
                    )}
                    <IconButton
                      onClick={() => handleToggleExpand(groupName)}
                      size="small"
                    >
                      {expandedItems[groupName] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                  </Box>
                }
              >
                <ListItemText
                  primary={`Group ${groupName}`}
                  secondary={`${plans.length} plans`}
                />
              </ListItem>

              <Collapse in={expandedItems[groupName]}>
                <Box sx={{ p: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Plans in this group:
                  </Typography>
                  <List dense>
                    {plans.map(plan => (
                      <ListItem key={plan.plan_name}>
                        <ListItemText
                          primary={`${plan.plan_name}${plan.order !== undefined ? ` (Order: ${plan.order})` : ''}`}
                          secondary={plan.goal}
                        />
                      </ListItem>
                    ))}
                  </List>

                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Optional Context"
                    placeholder="Provide specific context for this example..."
                    value={userContexts[groupName] || ''}
                    onChange={(e) => handleContextChange(groupName, e.target.value)}
                    sx={{ mt: 2 }}
                  />

                  <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                    <Button
                      variant="contained"
                      onClick={() => handleGenerateExample(groupName)}
                      disabled={generating[groupName]}
                      startIcon={generating[groupName] ? <CircularProgress size={20} /> : <RefreshIcon />}
                    >
                      {generating[groupName] ? 'Generating...' : 'Generate Example'}
                    </Button>
                    {cachedExamples?.[groupName] && (
                      <Button
                        variant="outlined"
                        onClick={() => onPreviewExample(groupName)}
                        startIcon={<PreviewIcon />}
                      >
                        Preview Cached
                      </Button>
                    )}
                  </Box>
                </Box>
              </Collapse>
            </Paper>
          ))}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default GenerateExamplesModal; 