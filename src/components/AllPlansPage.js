import React, { useState, useEffect } from "react";
import { 
  Paper, Typography, Box, Grid, Card, CardContent, 
  Button, TextField, Chip, IconButton, Dialog,
  DialogTitle, DialogContent, DialogActions,
  Select, MenuItem, FormControl, InputLabel,
  List, ListItem, ListItemText, ListItemSecondaryAction,
  Tabs, Tab, Tooltip
} from "@mui/material";
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import LabelIcon from '@mui/icons-material/Label';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';

const AllPlansPage = ({ 
  plans, 
  onUpdatePlan, 
  availableGroups, 
  onEditPlan, 
  onClose, 
  onDragOver, 
  onDragLeave, 
  onDropPlan, 
  activeGroup, 
  onTabChange, 
  draggedOver,
  onDeletePlan,
  groupTags = {},
  onEditTag,
  onCreateGroup
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [editGroupModalOpen, setEditGroupModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [newGroupAssociation, setNewGroupAssociation] = useState({ group: "", order: 0 });

  // Filter plans based on search term
  const filteredPlans = plans.filter(plan => 
    plan.plan_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plan.goal.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle editing a plan's group associations
  const handleOpenEditGroupModal = (plan) => {
    setSelectedPlan(plan);
    setEditGroupModalOpen(true);
  };

  // Add a new group association to a plan
  const handleAddGroupAssociation = () => {
    if (!selectedPlan || !newGroupAssociation.group) return;
    
    // Create a new group associations array if it doesn't exist
    const groupAssociations = selectedPlan.groupAssociations || [];
    
    // Add the new association
    const updatedAssociations = [
      ...groupAssociations,
      { ...newGroupAssociation }
    ];
    
    // Update the plan with the new associations
    onUpdatePlan(selectedPlan.id, { 
      groupAssociations: updatedAssociations
    });
    
    // Reset the new association form
    setNewGroupAssociation({ group: "", order: 0 });
  };

  // Remove a group association from a plan
  const handleRemoveGroupAssociation = (index) => {
    if (!selectedPlan || !selectedPlan.groupAssociations) return;
    
    const updatedAssociations = [...selectedPlan.groupAssociations];
    updatedAssociations.splice(index, 1);
    
    onUpdatePlan(selectedPlan.id, { 
      groupAssociations: updatedAssociations 
    });
  };

  // Update an existing group association (order)
  const handleUpdateGroupAssociation = (index, updatedOrder) => {
    if (!selectedPlan || !selectedPlan.groupAssociations) return;
    
    const updatedAssociations = [...selectedPlan.groupAssociations];
    updatedAssociations[index] = {
      ...updatedAssociations[index],
      order: parseInt(updatedOrder, 10) || 0
    };
    
    onUpdatePlan(selectedPlan.id, { 
      groupAssociations: updatedAssociations 
    });
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden'
    }}>
      <Paper 
        elevation={2} 
        sx={{ 
          p: 3, 
          borderRadius: 2,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflow: 'hidden'
        }}
      >
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Button 
              variant="outlined" 
              startIcon={<ArrowBackIcon />} 
              sx={{ mr: 2 }}
              onClick={onClose}
            >
              Back to Groups
            </Button>
            <Typography variant="h5" component="h2">
              All Plans
            </Typography>
          </Box>
          <TextField
            label="Search plans"
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ width: 300 }}
          />
        </Box>

        {/* Group Tabs Section */}
        <Paper 
          elevation={1}
          sx={{ 
            mb: 3, 
            p: 2, 
            borderRadius: 2,
            backgroundColor: '#f9f9f9'
          }}
        >
          {availableGroups.length > 0 ? (
            <>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                Drag plans to these groups:
              </Typography>
              <Box sx={{ 
                borderBottom: 1, 
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center',
                overflowX: 'auto'
              }}>
                <Tabs
                  value={activeGroup}
                  onChange={onTabChange}
                  variant="scrollable"
                  scrollButtons="auto"
                  sx={{ mb: 1, flex: 1 }}
                >
                  {availableGroups.map((group, index) => (
                    <Tab
                      key={group}
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box 
                            sx={{ 
                              px: 1.5,
                              py: 0.5,
                              borderRadius: 1,
                              mr: 1,
                              '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' }
                            }}
                            onClick={(e) => {
                              // Don't stop propagation - let click go through to the Tab
                              // But mark event as handled to prevent tag editing
                              e.preventDefault();
                            }}
                          >
                            {groupTags[group] ? (
                              groupTags[group]
                            ) : (
                              `Group ${group}`
                            )}
                          </Box>
                          
                          {!groupTags[group] && onEditTag && (
                            <Tooltip title="Add tag">
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEditTag(group);
                                }}
                                sx={{ width: 20, height: 20 }}
                              >
                                <LabelIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          {groupTags[group] && onEditTag && (
                            <Tooltip title="Edit tag">
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEditTag(group);
                                }}
                                sx={{ width: 20, height: 20 }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      }
                      onDragOver={(e) => onDragOver(e, group)}
                      onDragLeave={onDragLeave}
                      onDrop={(e) => onDropPlan(e, group)}
                      sx={{
                        backgroundColor: draggedOver === group ? 'rgba(0, 0, 0, 0.04)' : 'transparent',
                        transition: 'background-color 0.2s',
                        '&:hover': {
                          backgroundColor: 'rgba(0, 0, 0, 0.08)',
                        }
                      }}
                    />
                  ))}
                </Tabs>
              </Box>
              <Typography variant="caption" color="text.secondary">
                Drag a plan card to a group tab above to add it to that group
              </Typography>
            </>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 3 }}>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                No groups available. Create a group to organize your plans.
              </Typography>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={onCreateGroup}
              >
                Add Group
              </Button>
            </Box>
          )}
        </Paper>

        {/* Scrollable Plans Container */}
        <Box 
          sx={{ 
            flexGrow: 1, 
            overflow: 'auto',
            pb: 2,
            px: 1,
            borderRadius: 1,
            bgcolor: 'background.default'
          }}
        >
          <Grid container spacing={3}>
            {filteredPlans.map(plan => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={plan.id}>
                <Card 
                  variant="outlined"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/plain", plan.id);
                    // Also store the plan's group associations for reference
                    e.dataTransfer.setData("application/json", JSON.stringify({
                      id: plan.id,
                      groupAssociations: plan.groupAssociations || []
                    }));
                  }}
                  sx={{
                    cursor: 'grab',
                    '&:hover': {
                      boxShadow: 3,
                      transition: 'box-shadow 0.3s ease-in-out'
                    }
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Typography variant="h6" component="h3" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                        <DragIndicatorIcon sx={{ mr: 1, color: 'text.secondary' }} />
                        {plan.plan_name}
                      </Typography>
                      <Box>
                        <Tooltip title="Delete plan">
                          <IconButton 
                            size="small" 
                            onClick={() => onDeletePlan(plan.id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: 16 }}>
                      {plan.goal}
                    </Typography>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                        Groups: {plan.groupAssociations && plan.groupAssociations.length > 0 ? (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, ml: 1 }}>
                          {plan.groupAssociations.map((assoc, idx) => (
                            <Chip 
                              key={idx}
                              label={`${assoc.group} `}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          ))}
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                          (None)
                        </Typography>
                      )}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Button 
                        size="small" 
                        variant="outlined" 
                        startIcon={<EditIcon />}
                        onClick={() => onEditPlan(plan.id)}
                      >
                        Edit Plan
                      </Button>
                      <Button 
                        size="small" 
                        variant="outlined" 
                        color="secondary"
                        startIcon={<EditIcon />}
                        onClick={() => handleOpenEditGroupModal(plan)}
                      >
                        Edit Groups
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Paper>

      {/* Edit Group Associations Modal */}
      {selectedPlan && (
        <Dialog 
          open={editGroupModalOpen} 
          onClose={() => setEditGroupModalOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            Edit Group Associations for {selectedPlan.plan_name}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mb: 3, mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Current Associations
              </Typography>
              {selectedPlan.groupAssociations && selectedPlan.groupAssociations.length > 0 ? (
                <List>
                  {selectedPlan.groupAssociations.map((assoc, idx) => (
                    <ListItem key={idx}>
                      <ListItemText 
                        primary={`Group: ${assoc.group}`} 
                        secondary={
                          <TextField
                            label="Order"
                            type="number"
                            size="small"
                            value={assoc.order}
                            onChange={(e) => handleUpdateGroupAssociation(idx, e.target.value)}
                            sx={{ width: 100, mt: 1 }}
                          />
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton 
                          edge="end" 
                          onClick={() => handleRemoveGroupAssociation(idx)}
                          color="error"
                        >
                          <CloseIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No group associations yet
                </Typography>
              )}
            </Box>

            <Box sx={{ mt: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
              <Typography variant="subtitle1" gutterBottom>
                Add New Association
              </Typography>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Group</InputLabel>
                    <Select
                      value={newGroupAssociation.group}
                      label="Group"
                      onChange={(e) => setNewGroupAssociation({
                        ...newGroupAssociation,
                        group: e.target.value
                      })}
                    >
                      {availableGroups.map(group => (
                        <MenuItem key={group} value={group}>
                          {group}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    label="Order"
                    type="number"
                    size="small"
                    fullWidth
                    value={newGroupAssociation.order}
                    onChange={(e) => setNewGroupAssociation({
                      ...newGroupAssociation,
                      order: parseInt(e.target.value, 10) || 0
                    })}
                  />
                </Grid>
                <Grid item xs={2}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleAddGroupAssociation}
                    disabled={!newGroupAssociation.group}
                    sx={{ height: '100%' }}
                  >
                    <AddIcon />
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditGroupModalOpen(false)}>
              Close
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

export default AllPlansPage; 