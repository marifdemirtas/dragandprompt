import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Tabs,
  Tab,
  Paper
} from '@mui/material';

const RSTPreviewDialog = ({ open, onClose, examples = {} }) => {
  const [selectedGroup, setSelectedGroup] = React.useState(0);
  const groups = Object.keys(examples).filter(group => examples[group]?.rstContent);
  console.log("examples", examples);
  const handleTabChange = (event, newValue) => {
    setSelectedGroup(newValue);
  };

  if (groups.length === 0) {
    return (
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>RST Preview</DialogTitle>
        <DialogContent>
          <Typography>No examples available to preview.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { height: '80vh' }
      }}
    >
      <DialogTitle>RST Preview</DialogTitle>
      <DialogContent>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs
            value={selectedGroup}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
          >
            {groups.map((group, index) => (
              <Tab key={group} label={`Group ${group}`} />
            ))}
          </Tabs>
        </Box>
        {groups.map((group, index) => (
          <Box
            key={group}
            role="tabpanel"
            hidden={selectedGroup !== index}
            sx={{
              height: 'calc(100% - 48px)',
              overflow: 'auto'
            }}
          >
            {selectedGroup === index && examples[group]?.rstContent && (
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 2,
                  fontFamily: 'monospace',
                  whiteSpace: 'pre-wrap',
                  bgcolor: '#f5f5f5'
                }}
              >
                {examples[group].rstContent}
              </Paper>
            )}
          </Box>
        ))}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default RSTPreviewDialog; 