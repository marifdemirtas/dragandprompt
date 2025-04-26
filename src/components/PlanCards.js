import React, { useState } from "react";
import { 
  Grid, Card, CardContent, Typography, Button, TextField,
  Menu, MenuItem, IconButton, Tooltip, Box, Chip
} from "@mui/material";
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import EditIcon from '@mui/icons-material/Edit';

// New internal component representing a single plan card
const PlanCard = ({ 
  plan, 
  onEditPlan, 
  onUpdatePlan, 
  onClonePlan,
  onDeletePlan,
  availableGroups,
  currentGroup,
  groupTags = {}
}) => {
  const [groupValue, setGroupValue] = useState(plan.group || "");
  const [orderValue, setOrderValue] = useState(plan.order || "");
  const [anchorEl, setAnchorEl] = useState(null);

  // Find the association for the current group
  const getGroupAssociation = () => {
    if (plan.groupAssociations) {
      return plan.groupAssociations.find(assoc => assoc.group === currentGroup);
    }
    return null;
  };

  const handleOrderChange = (e) => {
    const value = e.target.value;
    if (!/^\d*$/.test(value)) return;
    setOrderValue(value);
  };

  const handleOrderKeyDown = (e) => {
    if (e.key === "Enter") {
      const order = orderValue === "" ? 0 : parseInt(orderValue, 10);
      
      // Update in the groupAssociations array
      if (plan.groupAssociations) {
        const updatedAssociations = [...plan.groupAssociations];
        const index = updatedAssociations.findIndex(assoc => assoc.group === currentGroup);
        
        if (index >= 0) {
          updatedAssociations[index] = { ...updatedAssociations[index], order };
        } else {
          updatedAssociations.push({ group: currentGroup, order });
        }
        
        onUpdatePlan(plan.id, { groupAssociations: updatedAssociations, order });
      } else {
        // Fallback to legacy behavior
        onUpdatePlan(plan.id, { order });
      }
      
      e.target.blur();
    }
  };

  const handleGroupChange = (e) => {
    setGroupValue(e.target.value);
  };

  const handleGroupKeyDown = (e) => {
    if (e.key === "Enter") {
      const newGroup = groupValue;
      
      // Update the group in the groupAssociations array
      if (plan.groupAssociations) {
        const updatedAssociations = [...plan.groupAssociations];
        const currentIndex = updatedAssociations.findIndex(assoc => assoc.group === currentGroup);
        
        if (currentIndex >= 0) {
          // Replace the current group
          updatedAssociations[currentIndex] = { 
            ...updatedAssociations[currentIndex],
            group: newGroup
          };
        } else {
          // Add a new association if somehow the current group isn't in the array
          updatedAssociations.push({ 
            group: newGroup, 
            order: plan.order || 0 
          });
        }
        
        onUpdatePlan(plan.id, { 
          groupAssociations: updatedAssociations,
          group: newGroup // Keep for backward compatibility
        });
      } else {
        // Fallback to legacy behavior
        onUpdatePlan(plan.id, { group: newGroup });
      }
      
      e.target.blur();
    }
  };

  const handleCloneClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloneToGroup = (targetGroup) => {
    if (targetGroup !== currentGroup) {
      onClonePlan(plan, targetGroup);
    }
    setAnchorEl(null);
  };
  
  // Get the total number of groups this plan is in
  const getGroupCount = () => {
    return plan.groupAssociations ? plan.groupAssociations.length : 1;
  };

  return (
    <Card
      variant="outlined"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", plan.id);
        e.dataTransfer.setData("application/json", JSON.stringify({
          id: plan.id,
          order: plan.order
        }));
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Typography variant="h6">{plan.plan_name}</Typography>
          <Box>
            <Tooltip title="Edit plan">
              <IconButton 
                size="small" 
                onClick={() => onEditPlan(plan.id)}
                sx={{ mr: 1 }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete plan">
              <IconButton 
                size="small" 
                onClick={() => onDeletePlan(Number(plan.id), currentGroup)}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
        >
          {availableGroups.map((group) => (
            <MenuItem
              key={group}
              onClick={() => handleCloneToGroup(group)}
              disabled={group === currentGroup}
            >
              {groupTags[group] ? `Copy to ${groupTags[group]} (Group ${group})` : `Copy to Group ${group}`}
            </MenuItem>
          ))}
        </Menu>

        <Typography variant="body2" color="text.secondary" sx={{ fontSize: 16 }}>
          Goal: {plan.goal}
        </Typography>
        <Grid container spacing={2}>
          {/* <Grid item xs={6}>
            <TextField
              label="Group"
              fullWidth
              margin="normal"
              value={currentGroup}
              onChange={handleGroupChange}
              onKeyDown={handleGroupKeyDown}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Order"
              fullWidth
              margin="normal"
              value={getGroupAssociation()?.order ?? plan.order ?? ""}
              onChange={handleOrderChange}
              onKeyDown={handleOrderKeyDown}
            />
          </Grid> */}
        </Grid>
      </CardContent>
    </Card>
  );
};

const PlanCards = ({ 
  plans, 
  onEditPlan, 
  onUpdatePlan, 
  onClonePlan,
  onDeletePlan,
  availableGroups, 
  groupTags = {},
  currentGroup = "Ungrouped"
}) => {
  // Use the provided currentGroup directly
  
  // If currentGroup is not provided, we can fall back (but this should not be needed)
  const effectiveGroup = currentGroup || (plans.length > 0 ? (plans[0].group || "Ungrouped") : "Ungrouped");
  
  // Group plans by order number to create rows
  const plansByRow = plans.reduce((acc, plan) => {
    const order = plan.order || 0;
    if (!acc[order]) acc[order] = [];
    acc[order].push(plan);
    return acc;
  }, {});

  const handleDragOver = (e, rowOrder, isDropZone = false) => {
    e.preventDefault();
    // Only consider it an existing row if it's not a drop zone and has plans
    const isExistingRow = !isDropZone && plansByRow[rowOrder] && plansByRow[rowOrder].length > 0;
    e.currentTarget.style.backgroundColor = isExistingRow ? 
      'rgba(255, 0, 0, 0.1)' :  // Light red for existing rows
      'rgba(0, 100, 255, 0.1)'; // Light blue for new row positions
  };

  const handleDragLeave = (e) => {
    e.currentTarget.style.backgroundColor = 'transparent';
  };

  const handleDrop = (e, targetOrder, isDropZone = false) => {
    e.preventDefault();
    e.currentTarget.style.backgroundColor = 'transparent';
    
    const idStr = e.dataTransfer.getData("text/plain");
    const planId = parseInt(idStr, 10);
    
    if (!isNaN(planId)) {
      const currentPlan = plans.find(p => p.id === planId);
      if (!currentPlan) return;

      // Only merge into existing row if it's not a drop zone and has plans
      const isExistingRow = !isDropZone && plansByRow[targetOrder] && plansByRow[targetOrder].length > 0;
      
      if (isExistingRow) {
        // Check if the plan is already at this order in the current group
        const currentOrder = currentPlan.order || 0;
        if (currentOrder === targetOrder) {
          // Don't do anything if it's already at this position
          return;
        }
        
        // Update in the groupAssociations array
        if (currentPlan.groupAssociations) {
          const updatedAssociations = [...currentPlan.groupAssociations];
          const index = updatedAssociations.findIndex(assoc => assoc.group === effectiveGroup);
          
          if (index >= 0) {
            updatedAssociations[index] = { ...updatedAssociations[index], order: targetOrder };
          } else {
            updatedAssociations.push({ group: effectiveGroup, order: targetOrder });
          }
          
          onUpdatePlan(planId, { 
            groupAssociations: updatedAssociations,
            order: targetOrder // Keep for backward compatibility
          });
        } else {
          // Fallback to legacy behavior
          onUpdatePlan(planId, { order: targetOrder });
        }
        return;
      }

      // Calculate the new order value
      const currentOrder = currentPlan.order || 0;
      
      // If it's already at this position, don't change anything
      if (!isDropZone && currentOrder === targetOrder) {
        return;
      }

      // Create a temporary mapping of current orders
      let tempOrders = new Map(plans.map(p => [p.id, p.order || 0]));
      
      // Remove the dragged plan from temp orders
      tempOrders.delete(planId);

      // Find all plans that need to be shifted (excluding the dragged plan)
      const plansToShift = plans.filter(p => 
        p.id !== planId && 
        (p.order || 0) >= targetOrder
      );

      // Update temp orders for all affected plans
      plansToShift.forEach(plan => {
        tempOrders.set(plan.id, (tempOrders.get(plan.id) || 0) + 1);
      });

      // Set the target order for the dragged plan
      tempOrders.set(planId, targetOrder);

      // Apply all the updates
      for (const [id, newOrder] of tempOrders.entries()) {
        if (id === planId || plansToShift.some(p => p.id === id)) {
          const planToUpdate = plans.find(p => p.id === id);
          
          if (planToUpdate && planToUpdate.groupAssociations) {
            const updatedAssociations = [...planToUpdate.groupAssociations];
            const index = updatedAssociations.findIndex(assoc => assoc.group === effectiveGroup);
            
            if (index >= 0) {
              updatedAssociations[index] = { ...updatedAssociations[index], order: newOrder };
            } else {
              updatedAssociations.push({ group: effectiveGroup, order: newOrder });
            }
            
            onUpdatePlan(id, { 
              groupAssociations: updatedAssociations,
              order: newOrder // Keep for backward compatibility
            });
          } else {
            // Fallback to legacy behavior
            onUpdatePlan(id, { order: newOrder });
          }
        }
      }
    }
  };

  const sortedRows = Object.keys(plansByRow)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <Grid container spacing={2} direction="column">
      {/* First drop zone */}
      <Grid 
        item
        container
        onDragOver={(e) => handleDragOver(e, 0, true)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, 0, true)}
        sx={{
          height: '20px',
          border: '1px dashed transparent',
          p: 2,
          '&:hover, &.dragover': {
            border: '1px dashed grey',
            height: '60px',
          },
          transition: 'all 0.2s'
        }}
      />

      {sortedRows.map((rowOrder, index) => (
        <React.Fragment key={rowOrder}>
          {/* Row content */}
          <Grid 
            item 
            onDragOver={(e) => handleDragOver(e, rowOrder, false)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, rowOrder, false)}
            sx={{
              p: 2,
              border: '1px dashed transparent',
              '&:hover': {
                border: '1px dashed grey',
              },
              transition: 'all 0.2s'
            }}
          >
            <Grid container spacing={2}>
              {plansByRow[rowOrder].map((plan) => (
                <Grid 
                  item 
                  xs={12}      // 1 card per row on mobile
                  sm={6}       // 2 cards per row on small screens
                  md={4}       // 3 cards per row on medium screens
                  lg={3}       // 4 cards per row on large screens
                  xl={2.4}     // 5 cards per row on extra large screens
                  key={plan.id}
                >
                  <PlanCard
                    plan={plan}
                    onEditPlan={onEditPlan}
                    onUpdatePlan={onUpdatePlan}
                    onClonePlan={onClonePlan}
                    onDeletePlan={onDeletePlan}
                    availableGroups={availableGroups}
                    currentGroup={effectiveGroup}
                    groupTags={groupTags}
                  />
                </Grid>
              ))}
            </Grid>
          </Grid>

          {/* Drop zone between rows */}
          <Grid 
            item
            container
            onDragOver={(e) => handleDragOver(e, rowOrder + 1, true)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, rowOrder + 1, true)}
            sx={{
              height: '20px',
              border: '1px dashed transparent',
              p: 2,
              '&:hover, &.dragover': {
                border: '1px dashed grey',
                height: '60px',
              },
              transition: 'all 0.2s, background-color 0.3s'
            }}
          />
        </React.Fragment>
      ))}

      {/* Last drop zone */}
      <Grid 
        item
        container
        onDragOver={(e) => handleDragOver(e, (sortedRows.length > 0 ? sortedRows[sortedRows.length - 1] + 1 : 1), true)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, (sortedRows.length > 0 ? sortedRows[sortedRows.length - 1] + 1 : 1), true)}
        sx={{
          height: '20px',
          border: '1px dashed transparent',
          p: 2,
          '&:hover, &.dragover': {
            border: '1px dashed grey',
            height: '60px',
          },
          transition: 'all 0.2s, background-color 0.3s',
          mb: 2
        }}
      />
    </Grid>
  );
};

export default PlanCards;