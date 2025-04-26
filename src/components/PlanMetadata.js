import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  IconButton,
  Button,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";

const PlanMetadata = ({ metadata, onUpdateMetadata }) => {
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");

  const handleAddMetadata = () => {
    if (newKey && newValue) {
      onUpdateMetadata({ ...metadata, [newKey]: newValue });
      setNewKey("");
      setNewValue("");
    }
  };

  const handleUpdateMetadata = (key, value) => {
    onUpdateMetadata({ ...metadata, [key]: value });
  };

  const handleDeleteMetadata = (key) => {
    const updatedMetadata = { ...metadata };
    delete updatedMetadata[key];
    onUpdateMetadata(updatedMetadata);
  };

  return (
    <div>
      <h4>Plan Metadata</h4>
      <TableContainer component={Paper} sx={{ mb: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Key</TableCell>
              <TableCell>Value</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Object.entries(metadata || {}).map(([key, value]) => (
              <TableRow key={key}>
                <TableCell>
                  <TextField value={key} disabled fullWidth />
                </TableCell>
                <TableCell>
                  <TextField
                    value={value}
                    fullWidth
                    onChange={(e) => handleUpdateMetadata(key, e.target.value)}
                  />
                </TableCell>
                <TableCell>
                  <IconButton
                    color="error"
                    onClick={() => handleDeleteMetadata(key)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};

export default PlanMetadata;