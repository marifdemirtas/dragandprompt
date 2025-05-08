import React, { useState, useEffect } from "react";
import UploadFile from "./components/UploadFile";
import PlanCards from "./components/PlanCards";
import EditPlanModal from "./components/EditPlanModal";
import RSTPreviewDialog from "./components/RSTPreviewDialog";
import GenerateExamplesModal from "./components/GenerateExamplesModal";
import AllPlansPage from "./components/AllPlansPage";
import { Button, Tabs, Tab, Box, Grid, Paper, IconButton, Typography, Menu, MenuItem, TextField, Tooltip } from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import UndoIcon from '@mui/icons-material/Undo';
import { Snackbar, Alert } from '@mui/material';
import UploadIcon from '@mui/icons-material/Upload';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import PreviewIcon from '@mui/icons-material/Preview';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import StorageIcon from '@mui/icons-material/Storage';
import EditIcon from '@mui/icons-material/Edit';
import LabelIcon from '@mui/icons-material/Label';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import LLMKeyModal from "./components/LLMKeyModal";
import { exportRST, generateContextualExamples, generateContextualExample, generateGroupRST } from './utils/rstConverter';
import TestPageModal from "./components/TestPageModal";
import ViewListIcon from '@mui/icons-material/ViewList';
import examplePlans from './data/plans-sql.json';

const STORAGE_KEY = 'programming-plans-autosave';
const LLM_KEY_STORAGE = 'llm-api-key';
const CACHED_EXAMPLES_STORAGE = 'cached-examples';
const GROUP_TAGS_STORAGE = 'group-tags';

function App() {
  const [plans, setPlans] = useState(() => {
    const savedPlans = localStorage.getItem(STORAGE_KEY);
    if (savedPlans) {
      return JSON.parse(savedPlans);
    } else {
      // If no saved plans exist, load the example plans
      const exampleData = examplePlans;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(exampleData));
      return exampleData;
    }
  });
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedTest, setSelectedTest] = useState(null);
  const [groups, setGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState(0);
  const [draggedOver, setDraggedOver] = useState(null);
  const [history, setHistory] = useState([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [llmKey, setLlmKey] = useState(() => {
    const savedKey = localStorage.getItem(LLM_KEY_STORAGE);
    if (savedKey) {
      return savedKey;
    } else {
      // Set a default key if none exists
      const defaultKey = "9b7XCgAKKWBNvk0mo4hjGAVyjsRAgvZgNeZyS7AwHZzjb2LIiD3oJQQJ99AJACHrzpqXJ3w3AAABACOGgOO6|https://north-by-northwest.openai.azure.com/openai/deployments/gpt-4o/chat/completions?api-version=2024-08-01-preview"; // Replace with your actual default key
      localStorage.setItem(LLM_KEY_STORAGE, defaultKey);
      return defaultKey;
    }
  });
  const [llmModalOpen, setLlmModalOpen] = useState(false);
  const [cachedExamples, setCachedExamples] = useState(() => {
    const savedExamples = localStorage.getItem(CACHED_EXAMPLES_STORAGE);
    return savedExamples ? JSON.parse(savedExamples) : {};
  });
  const [groupTags, setGroupTags] = useState(() => {
    const savedTags = localStorage.getItem(GROUP_TAGS_STORAGE);
    return savedTags ? JSON.parse(savedTags) : {};
  });
  const [editingTag, setEditingTag] = useState(null);
  const [tagValue, setTagValue] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [previewGroup, setPreviewGroup] = useState(null);
  const [showAllPlansPage, setShowAllPlansPage] = useState(false);
  const [dataMenuAnchor, setDataMenuAnchor] = useState(null);
  const [editMenuAnchor, setEditMenuAnchor] = useState(null);

  useEffect(() => {
    if (plans.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
      setSnackbarMessage('Changes saved');
      setSnackbarOpen(true);
    }
  }, [plans]);

  useEffect(() => {
    if (llmKey) {
      localStorage.setItem(LLM_KEY_STORAGE, llmKey);
      setSnackbarMessage('API Key saved');
      setSnackbarOpen(true);
    }
  }, [llmKey]);

  useEffect(() => {
    if (Object.keys(cachedExamples).length > 0) {
      localStorage.setItem(CACHED_EXAMPLES_STORAGE, JSON.stringify(cachedExamples));
    }
  }, [cachedExamples]);
  
  useEffect(() => {
    if (Object.keys(groupTags).length > 0) {
      localStorage.setItem(GROUP_TAGS_STORAGE, JSON.stringify(groupTags));
    }
  }, [groupTags]);

  const groupedPlans = plans.reduce((acc, plan) => {
    if (plan.groupAssociations && plan.groupAssociations.length > 0) {
      // For plans with group associations, use those to place in correct groups
      plan.groupAssociations.forEach(assoc => {
        const group = assoc.group || "Ungrouped";
        if (!acc[group]) acc[group] = [];
        // Create a deep copy of the plan and ensure id is preserved as a number
        const planForGroup = { 
          ...plan, 
          id: Number(plan.id), 
          order: assoc.order 
        };
        acc[group].push(planForGroup);
      });
    } else if (!plan.groupAssociations || plan.groupAssociations.length === 0) {
      // For plans with no group associations, use the legacy group property
      // Only if the group is not "Ungrouped" - this prevents deleted plans from showing up
      const group = plan.group || "Ungrouped";
      if (group !== "Ungrouped") {
        if (!acc[group]) acc[group] = [];
        acc[group].push({...plan, id: Number(plan.id)});
      }
    }
    return acc;
  }, {});

  const derivedGroups = Object.keys(groupedPlans);
  const allGroups = [...new Set([...groups, ...derivedGroups])];
  
  const handleFileUpload = (data) => {
    const dataWithId = data.map((plan, i) => {
      const newPlan = { ...plan, id: i };
      if (newPlan.group && !newPlan.groupAssociations) {
        newPlan.groupAssociations = [
          { group: newPlan.group, order: newPlan.order || 0 }
        ];
      }
      return newPlan;
    });
    setHistory([]);
    setPlans(dataWithId);
    const fileGroups = Array.from(
      new Set(dataWithId.flatMap(plan => 
        plan.groupAssociations 
          ? plan.groupAssociations.map(assoc => assoc.group) 
          : (plan.group ? [plan.group] : ["Ungrouped"])
      ))
    );
    setGroups(fileGroups);
  };

  const saveToHistory = (prevPlans) => {
    setHistory(prev => [...prev.slice(-9), prevPlans]);
  };

  const handleUpdatePlan = (id, updates) => {
    setPlans((prevPlans) => {
      saveToHistory(prevPlans);
      const newPlans = prevPlans.map((plan) => {
        if (plan.id === id) {
          const updatedPlan = { ...plan, ...updates };
          
          if (updates.group !== undefined && !updates.groupAssociations) {
            const existingAssociations = updatedPlan.groupAssociations || [];
            const groupExists = existingAssociations.some(assoc => assoc.group === updates.group);
            
            if (!groupExists) {
              updatedPlan.groupAssociations = [
                ...existingAssociations,
                { group: updates.group, order: updates.order || 0 }
              ];
            }
          }
          
          return updatedPlan;
        }
        return plan;
      });
      return newPlans;
    });

    if (updates.group !== undefined) {
      setGroups((prev) => {
        if (!prev.includes(updates.group)) return [...prev, updates.group];
        return prev;
      });
    }

    if (updates.groupAssociations) {
      const newGroups = updates.groupAssociations.map(assoc => assoc.group);
      setGroups(prev => {
        const uniqueNewGroups = newGroups.filter(group => !prev.includes(group));
        if (uniqueNewGroups.length > 0) {
          return [...prev, ...uniqueNewGroups];
        }
        return prev;
      });
    }
  };

  const handleExport = () => {
    const jsonBlob = new Blob([JSON.stringify(plans, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(jsonBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "plans.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportRST = () => {
    exportRST(plans, llmKey, cachedExamples);
  };

  const handleEditPlan = (id) => {
    const planToEdit = plans.find((plan) => plan.id === id);
    if (planToEdit) {
      if (planToEdit.isTest) {
        setSelectedTest(planToEdit);
      } else {
        setSelectedPlan(planToEdit);
      }
    }
  };

  const handleSaveChanges = (updatedPlan) => {
    setPlans((prevPlans) =>
      prevPlans.map((plan) =>
        plan.id === updatedPlan.id ? updatedPlan : plan
      )
    );
  };

  const handleSaveTest = (updatedTest) => {
    setPlans((prevPlans) =>
      prevPlans.map((plan) =>
        plan.id === updatedTest.id ? updatedTest : plan
      )
    );
  };

  const handleTabChange = (event, newValue) => {
    setActiveGroup(newValue);
  };

  const handleCreateGroup = () => {
    const newGroup = prompt("Enter new group name:");
    if (newGroup) {
      setGroups((prev) => {
        if (!prev.includes(newGroup)) return [...prev, newGroup];
        return prev;
      });
    }
  };

  const handleCreateTestPage = () => {
    const testName = prompt("Enter test page name:");
    if (testName) {
      const newTest = {
        id: plans.length,
        plan_name: testName,
        isTest: true,
        group: "Tests",
        goal: "Exercise Page",
        questions: [],
        code_template: {
          lines: [],
          changeable_areas: {},
          changeable_areas_annotations: {},
          changeable_areas_colors: {}
        }
      };
      setPlans(prev => [...prev, newTest]);
      if (!groups.includes("Tests")) {
        setGroups(prev => [...prev, "Tests"]);
      }
    }
  };

  const handleDragOver = (event, group) => {
    event.preventDefault();
    setDraggedOver(group);
  };

  const handleDragLeave = () => {
    setDraggedOver(null);
  };

  const handleDropPlan = (event, group) => {
    event.preventDefault();
    setDraggedOver(null);
    const idStr = event.dataTransfer.getData("text/plain");
    const planId = parseInt(idStr, 10);
    if (!isNaN(planId)) {
      const planToUpdate = plans.find(p => p.id === planId);
      
      if (planToUpdate) {
        // Check if plan is already in this group
        const existingAssociation = planToUpdate.groupAssociations?.find(a => a.group === group);
        
        // If plan is already in this group, don't update it (avoid incrementing order)
        if (existingAssociation) {
          // Don't do anything, the plan is already in this group
          return;
        }
        
        // Find the highest order in the target group
        const maxOrder = plans.reduce((max, plan) => {
          const association = plan.groupAssociations?.find(a => a.group === group);
          return association && association.order > max ? association.order : max;
        }, -1);
        
        let updatedAssociations = [...(planToUpdate.groupAssociations || [])];
        
        // Add to this group with next order
        updatedAssociations.push({ group, order: maxOrder + 1 });
        
        handleUpdatePlan(planId, { 
          group, // Keep for backward compatibility
          groupAssociations: updatedAssociations 
        });
      }
    }
  };

  const handleDeleteGroup = (groupToDelete) => {
    if (!groupedPlans[groupToDelete] || groupedPlans[groupToDelete].length === 0) {
      setGroups(prev => prev.filter(group => group !== groupToDelete));
      if (activeGroup === allGroups.indexOf(groupToDelete)) {
        setActiveGroup(0);
      }
    }
  };

  const handleClonePlan = (originalPlan, targetGroup) => {
    const newPlan = {
      ...originalPlan,
      id: plans.length,
      group: targetGroup,
    };
    
    let groupAssociations = [...(originalPlan.groupAssociations || [])];
    const maxOrder = plans.reduce((max, plan) => {
      const association = plan.groupAssociations?.find(a => a.group === targetGroup);
      return association && association.order > max ? association.order : max;
    }, -1);
    
    const existingIndex = groupAssociations.findIndex(a => a.group === targetGroup);
    if (existingIndex >= 0) {
      groupAssociations[existingIndex].order = maxOrder + 1;
    } else {
      groupAssociations.push({ group: targetGroup, order: maxOrder + 1 });
    }
    
    newPlan.groupAssociations = groupAssociations;
    
    setPlans(prev => [...prev, newPlan]);
  };

  const handleDeletePlan = (id, fromGroup = null) => {
    console.log('Deleting plan', id, 'from group:', fromGroup);
    
    // Ensure id is a number
    const planId = Number(id);
    
    setPlans(prevPlans => {
      saveToHistory(prevPlans);
      
      // If fromGroup is provided, just remove the association from that group
      if (fromGroup) {
        console.log('Removing plan from group', fromGroup);
        const planToModify = prevPlans.find(plan => Number(plan.id) === planId);
        console.log('Original plan:', planToModify);
        
        const newPlans = prevPlans.map(plan => {
          if (Number(plan.id) === planId) {
            // Check if the plan has groupAssociations
            if (plan.groupAssociations) {
              // Filter out the specified group from groupAssociations
              const updatedAssociations = plan.groupAssociations.filter(
                assoc => assoc.group !== fromGroup
              );
              
              console.log('Updated associations:', updatedAssociations);
              
              // Also update the legacy group property
              // If this was the only group or the same as the legacy group, set to "Ungrouped"
              // Otherwise keep the legacy group as is
              let updatedGroup = plan.group;
              if (plan.group === fromGroup || updatedAssociations.length === 0) {
                updatedGroup = "Ungrouped";
              }
              
              return {
                ...plan,
                group: updatedGroup,
                groupAssociations: updatedAssociations
              };
            } 
            // Handle legacy plans with only 'group' property
            else if (plan.group === fromGroup) {
              console.log('Handling legacy plan with only group property');
              // Create a new empty groupAssociations array for this plan
              // This effectively removes it from the group without deleting it
              return {
                ...plan,
                group: "Ungrouped", // Set to ungrouped for backward compatibility
                groupAssociations: [] // Empty array means not associated with any group
              };
            }
          }
          return plan;
        });
        
        const modifiedPlan = newPlans.find(plan => Number(plan.id) === planId);
        console.log('Modified plan:', modifiedPlan);
        
        setSnackbarMessage('Plan removed from group');
        setSnackbarOpen(true);
        return newPlans;
      } else {
        // Otherwise, delete the plan completely (from all plans)
        console.log('Deleting plan completely');
        const newPlans = prevPlans.filter(plan => Number(plan.id) !== planId);
        setSnackbarMessage('Plan deleted');
        setSnackbarOpen(true);
        return newPlans;
      }
    });
  };

  const handleUndo = () => {
    if (history.length > 0) {
      const previousState = history[history.length - 1];
      setPlans(previousState);
      setHistory(prev => prev.slice(0, -1));
      setSnackbarMessage('Action undone');
      setSnackbarOpen(true);
    }
  };

  const handleClearSavedData = () => {
    if (window.confirm('Are you sure you want to clear all saved data? This will also remove your saved API key and cached examples.')) {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(LLM_KEY_STORAGE);
      localStorage.removeItem(CACHED_EXAMPLES_STORAGE);
      localStorage.removeItem(GROUP_TAGS_STORAGE);
      setPlans([]);
      setHistory([]);
      setGroups([]);
      setActiveGroup(0);
      setLlmKey("");
      setCachedExamples({});
      setGroupTags({});
      setSnackbarMessage('All saved data cleared');
      setSnackbarOpen(true);
    }
  };

  const availableGroups = allGroups;

  const openDataMenu = (event) => {
    setDataMenuAnchor(event.currentTarget);
  };
  
  const closeDataMenu = () => {
    setDataMenuAnchor(null);
  };
  
  const openEditMenu = (event) => {
    setEditMenuAnchor(event.currentTarget);
  };
  
  const closeEditMenu = () => {
    setEditMenuAnchor(null);
  };

  const handleStartEditTag = (groupName) => {
    setEditingTag(groupName);
    setTagValue(groupTags[groupName] || "");
  };

  const handleTagChange = (e) => {
    setTagValue(e.target.value);
  };

  const handleTagKeyDown = (e, groupName) => {
    if (e.key === "Enter") {
      const updatedTags = { ...groupTags, [groupName]: tagValue };
      setGroupTags(updatedTags);
      setEditingTag(null);
      setSnackbarMessage(`Tag for Group ${groupName} updated`);
      setSnackbarOpen(true);
    } else if (e.key === "Escape") {
      setEditingTag(null);
    }
  };

  const handleTagBlur = (groupName) => {
    const updatedTags = { ...groupTags, [groupName]: tagValue };
    setGroupTags(updatedTags);
    setEditingTag(null);
  };

  const handleLoadExamplePlans = () => {
    if (window.confirm('Loading example plans will replace your current plans. Continue?')) {
      handleFileUpload(examplePlans);
      setSnackbarMessage('Example plans loaded');
      setSnackbarOpen(true);
    }
  };

  return (
    <Box 
      sx={{ 
        maxWidth: '1800px',  // Increased max width
        margin: '0 auto',    
        padding: '20px',
        minHeight: '100vh',
        bgcolor: '#f5f5f5'   
      }}
    >
      <Paper 
        elevation={2}
        sx={{ 
          p: 3,
          mb: 3,
          borderRadius: 2
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2
        }}>
          <Typography variant="h5" component="h1" sx={{ fontWeight: 500 }}>
            Purpose-First Tutorial Generator
          </Typography>
          <Box sx={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(5, auto)',
            gap: 2
          }}>
            {/* Data dropdown */}
            <Button
              variant="contained"
              color="primary"
              onClick={openDataMenu}
              endIcon={<ArrowDropDownIcon />}
              startIcon={<StorageIcon />}
            >
              Data
            </Button>
            {/* File upload component should be outside the menu for proper DOM positioning */}
            <UploadFile onFileUpload={handleFileUpload} />
            <Menu
              anchorEl={dataMenuAnchor}
              open={Boolean(dataMenuAnchor)}
              onClose={closeDataMenu}
            >
              <MenuItem onClick={() => {
                document.getElementById('file-upload').click();
                closeDataMenu();
              }}>
                <UploadIcon sx={{ mr: 1 }} />
                Upload JSON
              </MenuItem>
              <MenuItem onClick={() => {
                handleLoadExamplePlans();
                closeDataMenu();
              }}>
                <UploadIcon sx={{ mr: 1 }} />
                Load Example Plans
              </MenuItem>
              <MenuItem onClick={() => {
                handleExport();
                closeDataMenu();
              }} disabled={!plans.length}>
                <DownloadIcon sx={{ mr: 1 }} />
                Export JSON
              </MenuItem>
              <MenuItem onClick={() => {
                handleExportRST(plans, llmKey, cachedExamples);
                closeDataMenu();
              }} disabled={!plans.length}>
                <DownloadIcon sx={{ mr: 1 }} />
                Export RST
              </MenuItem>
            </Menu>
            
            {/* Edit dropdown */}
            <Button
              variant="contained"
              color="secondary"
              onClick={openEditMenu}
              endIcon={<ArrowDropDownIcon />}
              startIcon={<EditIcon />}
            >
              Edit
            </Button>
            <Menu
              anchorEl={editMenuAnchor}
              open={Boolean(editMenuAnchor)}
              onClose={closeEditMenu}
            >
              <MenuItem onClick={() => {
                handleUndo();
                closeEditMenu();
              }} disabled={!history.length}>
                <UndoIcon sx={{ mr: 1 }} />
                Undo
              </MenuItem>
              <MenuItem onClick={() => {
                handleClearSavedData();
                closeEditMenu();
              }} disabled={!plans.length}>
                <DeleteIcon sx={{ mr: 1 }} />
                Clear Data
              </MenuItem>
              <MenuItem onClick={() => {
                setLlmModalOpen(true);
                closeEditMenu();
              }}>
                <VpnKeyIcon sx={{ mr: 1 }} />
                Set LLM Key
              </MenuItem>
            </Menu>

            <Button
              variant="contained"
              color="success"
              startIcon={<AddIcon />}
              onClick={handleCreateTestPage}
            >
              Add Test
            </Button>
            <Button
              variant="contained"
              color="info"
              startIcon={<PreviewIcon />}
              onClick={() => {
                if (!llmKey) {
                  setSnackbarMessage('Please set LLM API key first');
                  setSnackbarOpen(true);
                  return;
                }
                setGenerateModalOpen(true);
              }}
              disabled={!plans.length}
            >
              Full Examples
            </Button>
            {/* <Button
              variant="contained"
              color="warning"
              startIcon={<ViewListIcon />}
              onClick={() => setShowAllPlansPage(true)}
              disabled={!plans.length}
            >
              All Plans
            </Button> */}
          </Box>
        </Box>
      </Paper>

      {showAllPlansPage && (
        <AllPlansPage
          plans={plans}
          onUpdatePlan={handleUpdatePlan}
          availableGroups={allGroups}
          onEditPlan={handleEditPlan}
          onClose={() => setShowAllPlansPage(false)}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDropPlan={handleDropPlan}
          activeGroup={activeGroup}
          onTabChange={handleTabChange}
          draggedOver={draggedOver}
          onDeletePlan={handleDeletePlan}
          groupTags={groupTags}
          onEditTag={handleStartEditTag}
          onCreateGroup={handleCreateGroup}
        />
      )}

      {allGroups.length === 0 && !showAllPlansPage && (
        <Paper 
          elevation={2} 
          sx={{ 
            p: 5,
            borderRadius: 2,
            textAlign: 'center'
          }}
        >
          <Typography variant="h6" sx={{ mb: 3 }}>
            No groups available
          </Typography>
          <Typography variant="body1" sx={{ mb: 4 }}>
            Create a group to organize your plans
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleCreateGroup}
            size="large"
          >
            Add Group
          </Button>
        </Paper>
      )}

      {allGroups.length > 0 && !showAllPlansPage && (
        <Paper 
          elevation={2} 
          sx={{ 
            p: 3,
            borderRadius: 2
          }}
        >
          <Box sx={{ 
            borderBottom: 1, 
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center'
          }}>
            <Tabs
              value={activeGroup}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ mb: 2, flex: 1 }}
            >
              {allGroups.map((group, index) => (
                <Tab
                  key={group}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {editingTag === group ? (
                        <TextField
                          size="small"
                          value={tagValue}
                          onChange={handleTagChange}
                          onKeyDown={(e) => handleTagKeyDown(e, group)}
                          onBlur={() => handleTagBlur(group)}
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                          sx={{ width: 120 }}
                        />
                      ) : (
                        <>
                          <Box 
                            sx={{ 
                              px: 1.5,  // Add horizontal padding to create a click area
                              py: 0.5,  // Add vertical padding for better clickability
                              borderRadius: 1,
                              mr: 1,
                              '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' }
                            }}
                            // This box serves as a clickable area that won't trigger edit
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
                          
                          {!groupTags[group] && (
                            <Tooltip title="Add tag">
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStartEditTag(group);
                                }}
                                sx={{ width: 20, height: 20 }}
                              >
                                <LabelIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          {groupTags[group] && (
                            <Tooltip title="Edit tag">
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStartEditTag(group);
                                }}
                                sx={{ width: 20, height: 20 }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </>
                      )}
                      {(!groupedPlans[group] || groupedPlans[group].length === 0) && (
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteGroup(group);
                          }}
                          sx={{ 
                            ml: 1,
                            width: 20,
                            height: 20,
                            '& svg': { fontSize: 16 }
                          }}
                        >
                          <CloseIcon />
                        </IconButton>
                      )}
                    </Box>
                  }
                  onDragOver={(e) => handleDragOver(e, group)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDropPlan(e, group)}
                  sx={{
                    backgroundColor: draggedOver === group ? 'rgba(0, 0, 0, 0.04)' : 'transparent',
                    transition: 'background-color 0.2s',
                  }}
                />
              ))}
            </Tabs>
            <IconButton
              color="primary"
              onClick={handleCreateGroup}
              sx={{ ml: 1, mb: 2 }}
            >
              <AddIcon />
            </IconButton>
            <IconButton
              color="secondary"
              onClick={() => setShowAllPlansPage(true)}
              sx={{ ml: 1, mb: 2 }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <ViewListIcon />
                <Typography sx={{ ml: 1 }}>All Plans</Typography>
              </Box>
            </IconButton>
          </Box>
          
          {allGroups.map((group, index) => (
            <Paper
              key={group}
              onDragOver={(e) => handleDragOver(e, group)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDropPlan(e, group)}
              sx={{
                display: activeGroup === index ? "block" : "none",
                minHeight: "200px",
                padding: "10px",
                border: '2px dashed',
                borderColor: draggedOver === group ? 'primary.main' : 'grey.300',
                backgroundColor: draggedOver === group ? 'rgba(0, 0, 0, 0.04)' : 'transparent',
                transition: 'all 0.2s',
              }}
            >
              <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                  {groupTags[group] ? `${groupTags[group]} (Group ${group})` : `Group ${group}`}
                </Typography>
                {!groupTags[group] && (
                  <Button 
                    startIcon={<LabelIcon />} 
                    size="small" 
                    onClick={() => handleStartEditTag(group)}
                  >
                    Add Tag
                  </Button>
                )}
                {groupTags[group] && (
                  <Button 
                    startIcon={<EditIcon />} 
                    size="small" 
                    onClick={() => handleStartEditTag(group)}
                  >
                    Edit Tag
                  </Button>
                )}
              </Box>
              <PlanCards
                plans={groupedPlans[group] ? groupedPlans[group] : []}
                onEditPlan={handleEditPlan}
                onUpdatePlan={handleUpdatePlan}
                onClonePlan={handleClonePlan}
                onDeletePlan={handleDeletePlan}
                availableGroups={availableGroups}
                groupTags={groupTags}
                currentGroup={group}
              />
            </Paper>
          ))}
        </Paper>
      )}

      {selectedPlan && (
        <EditPlanModal
          plan={selectedPlan}
          onSave={handleSaveChanges}
          onClose={() => setSelectedPlan(null)}
        />
      )}

      {selectedTest && (
        <TestPageModal
          test={selectedTest}
          onSave={handleSaveTest}
          onClose={() => setSelectedTest(null)}
        />
      )}

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={2000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert 
          onClose={() => setSnackbarOpen(false)} 
          severity="info" 
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>

      {llmModalOpen && (
        <LLMKeyModal
          open={llmModalOpen}
          onClose={() => setLlmModalOpen(false)}
          initialKey={llmKey}
          onSave={(key) => {
            setLlmKey(key);
            setLlmModalOpen(false);
          }}
        />
      )}

      <GenerateExamplesModal
        open={generateModalOpen}
        onClose={() => setGenerateModalOpen(false)}
        plans={plans}
        cachedExamples={cachedExamples}
        onGenerateExample={async (groupName, groupPlans, userContext) => {
          try {
            const context = await generateContextualExample(groupPlans, groupName, llmKey, userContext);
            if (context) {
              const rstContent = await generateGroupRST(groupName, groupPlans, context);
              setCachedExamples(prev => ({
                ...prev,
                [groupName]: { context, rstContent }
              }));
              setSnackbarMessage(`Example for Group ${groupName} generated successfully`);
              setSnackbarOpen(true);
            }
          } catch (error) {
            console.error("Error generating example:", error);
            setSnackbarMessage(`Error generating example for Group ${groupName}`);
            setSnackbarOpen(true);
          }
        }}
        onPreviewExample={(groupName) => {
          setPreviewGroup(groupName);
          setPreviewOpen(true);
        }}
      />

      <RSTPreviewDialog
        open={previewOpen}
        onClose={() => {
          setPreviewOpen(false);
          setPreviewGroup(null);
        }}
        examples={previewGroup ? { [previewGroup]: cachedExamples[previewGroup] } : cachedExamples}
      />
      
      {/* Colophon - App information footer */}
      <Paper 
        elevation={1}
        sx={{ 
          mt: 4,
          p: 2,
          borderRadius: 2,
          bgcolor: 'rgba(0, 0, 0, 0.02)',
          textAlign: 'center'
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Purpose-First Tutorial Generator v0.9 - 2025-04-07
          <Box sx={{ width: '50%', margin: '0 auto' }}>
            This demo shows a prototype of our ongoing work on generating <a href="https://dl.acm.org/doi/abs/10.1145/3411764.3445571">purpose-first programming tutorials</a>. Instructors can use this tool to build source files for <a href="https://github.com/RunestoneInteractive/rs">Runestone e-books</a> using <a href="https://arxiv.org/abs/2502.10618">programming plans as building blocks</a>. Follow our work on <a href="https://trailslab.web.illinois.edu">TRAILS Lab</a>.
          </Box>
           
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
          2025 • Built by <a href="https://marifdemirtas.github.io">Arif</a> from TRAILS Lab at UIUC
        </Typography>
      </Paper>
    </Box>
  );
}

export default App;