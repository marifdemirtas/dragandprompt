import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField
} from "@mui/material";

const LLMKeyModal = ({ open, onClose, onSave, initialKey = "" }) => {
  const [apiKey, setApiKey] = useState(initialKey);

  // Update apiKey when initialKey changes
  useEffect(() => {
    setApiKey(initialKey);
  }, [initialKey]);

  const handleSave = () => {
    onSave(apiKey);
  };

  const handleCancel = () => {
    setApiKey(initialKey); // Reset to initial value
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleCancel}>
      <DialogTitle>Enter LLM API Key</DialogTitle>
      <DialogContent sx={{ pb: 0 }}>
        Enter your Azure OpenAI API key and endpoint, separated by a pipe (|).
        Example: sk-1234567890|https://your-endpoint.openai.azure.com
      </DialogContent>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="LLM API Key"
          type="password"
          fullWidth
          variant="outlined"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel}>Cancel</Button>
        <Button 
          onClick={handleSave} 
          variant="contained" 
          color="primary"
          disabled={!apiKey}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LLMKeyModal; 