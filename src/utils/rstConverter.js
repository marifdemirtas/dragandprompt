import React from 'react';
import { createRoot } from 'react-dom/client';
import { Backdrop, CircularProgress, Typography, Box } from '@mui/material';

const generateRST = async (plans, llmKey, cachedExamples = null) => {
  const rstFiles = {};

  // Generate index page
  let indexContent = 'Programming Plans Tutorial\n';
  indexContent += '='.repeat(30) + '\n\n';

  // Goal section
  indexContent += 'Goal of this Tutorial\n';
  indexContent += '-'.repeat(30) + '\n\n';
  indexContent += 'This tutorial introduces you to common programming plans - reusable code patterns that help solve specific programming tasks. ';
  indexContent += 'Each plan comes with examples, explanations, and interactive exercises to help you master its usage.\n\n';

  // Add admonition about learning approach
  indexContent += '.. admonition:: Learning Approach\n';
  indexContent += '   :class: note\n\n';
  indexContent += '   Each programming plan is presented with:\n';
  indexContent += '   * A clear explanation of its purpose and when to use it\n';
  indexContent += '   * Code examples showing how to implement it\n';
  indexContent += '   * Interactive exercises to practice applying the plan\n';
  indexContent += '   * Common variations and edge cases to consider\n\n';

  // Integrated examples section
  indexContent += 'Integrated Examples\n';
  indexContent += ':'.repeat(30) + '\n\n';
  
  indexContent += '.. toctree::\n';
  indexContent += '   :maxdepth: 1\n\n';
  
  const groups = [...new Set(plans.filter(p => p.group && !p.isTest).map(p => p.group))];
  groups.forEach(group => {
    const filename = `integrated_${group.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    indexContent += `   ${filename}.rst\n`;
  });
  indexContent += '\n';

  // List of plans section
  indexContent += 'List of Plans\n';
  indexContent += '-'.repeat(20) + '\n\n';
  
  indexContent += '.. toctree::\n';
  indexContent += '   :maxdepth: 1\n\n';
  
  plans.filter(p => !p.isTest).forEach(plan => {
    const planFileName = plan.plan_name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    indexContent += `   ${planFileName}\n`;
  });
  indexContent += '\n';

  // Add Exercises section
  const testPages = plans.filter(p => p.isTest);
  if (testPages.length > 0) {
    indexContent += 'Exercises\n';
    indexContent += '-'.repeat(20) + '\n\n';
    
    indexContent += '.. toctree::\n';
    indexContent += '   :maxdepth: 1\n\n';
    
    testPages.forEach(test => {
      const testFileName = test.plan_name.toLowerCase().replace(/[^a-z0-9]/g, '_');
      indexContent += `   ${testFileName}.rst\n`;
    });
    indexContent += '\n';
  }

  // Store the index page
  rstFiles['index.rst'] = indexContent;

  // Generate Integrated Examples with context
  const groupedPlans = plans.reduce((acc, plan) => {
    if (plan.group && !plan.isTest) {
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

  // Create integrated examples for each group
  for (const [groupName, groupPlans] of Object.entries(groupedPlans)) {
    let rstContent = '';
    
    // Add group title
    rstContent += `Integrated Example - ${groupName}\n${'='.repeat(groupName.length + 30)}\n\n`;
    
    // Use cached example if available, otherwise generate new one
    console.log("cachedExamples in generateRST", cachedExamples);
    const context = cachedExamples?.[groupName]?.context || 
                   (llmKey ? await generateContextualExample(groupPlans, groupName, llmKey) : null);
    
    if (context) {
      // Add the pre-explanation
      rstContent += `${context.pre_explanation}\n\n`;
      
      // Create combined code from all plans with context
      rstContent += `.. activecode:: integrated_${groupName.toLowerCase().replace(/[^a-z0-9]/g, '_')}\n`;
      rstContent += '   :language: sql\n\n';
      
      // Combine code from all plans with contextual replacements
      groupPlans.forEach(plan => {
        if (plan.code_template.lines) {
          rstContent += '   # ' + plan.goal + '\n';
          // rstContent += '   # ' + (context.contextual_goals[plan.plan_name] || plan.goal) + '\n';
          
          // Apply contextual replacements
          const lines = plan.code_template.lines.map(line => {
            let contextualLine = line;
            Object.entries(plan.code_template.changeable_areas || {}).forEach(([key, _]) => {
              if (context.changeable_areas_mapping[key]) {
                contextualLine = contextualLine.replace(
                  new RegExp(`@@${key}@@`, 'g'),
                  context.changeable_areas_mapping[key]
                );

                // Find the plan in the original plans array and update its changeable areas
                const originalPlan = plans.find(p => p.plan_name === plan.plan_name);
                if (originalPlan && 
                    originalPlan.code_template.changeable_areas[key] && 
                    !originalPlan.code_template.changeable_areas[key].includes(context.changeable_areas_mapping[key])) {
                  // Add the new value to the array of possible values
                  originalPlan.code_template.changeable_areas[key].push(context.changeable_areas_mapping[key]);
                }
              }
            });
            return contextualLine;
          });
          
          rstContent += '   ' + lines.join('\n   ') + '\n\n';
        }
      });
    } else {
      // Fallback to non-contextual example if no cached example and no LLM key
      rstContent += `This example demonstrates the integration of multiple programming plans from the "${groupName}" group.\n\n`;
      
      // Create combined code from all plans
      rstContent += `.. activecode:: integrated_${groupName.toLowerCase().replace(/[^a-z0-9]/g, '_')}\n`;
      rstContent += '   :language: python\n\n';
      
      // Combine code from all plans
      groupPlans.forEach(plan => {
        if (plan.code_template.lines) {
          rstContent += '   # ' + plan.plan_name + '\n';
          rstContent += '   ' + plan.code_template.lines.join('\n   ') + '\n\n';
        }
      });
    }
    
    // Add links to individual plans
    rstContent += 'This example uses the following programming plans:\n\n';
    // Add toctree with links to plan pages
    rstContent += '.. toctree::\n';
    rstContent += '   :maxdepth: 1\n';
    // rstContent += '   :hidden:\n\n';
    groupPlans.forEach(plan => {
      const planFileName = plan.plan_name.toLowerCase().replace(/[^a-z0-9]/g, '_');
      rstContent += `   ${planFileName}\n`; 
    });
    rstContent += '\n';

    groupPlans.forEach(plan => {
      const planFileName = plan.plan_name.toLowerCase().replace(/[^a-z0-9]/g, '_');
      rstContent += `.. plandisplay:: plans.json${planFileName}_code\n`;
      rstContent += `   :plan: ${plan.plan_name}\n\n`;
      // rstContent += `* Click to go to the plan page for :doc:\`${planFileName}\`\n\n`;
    });
    rstContent += '\n';

    // Store the integrated example
    const filename = `integrated_${groupName.toLowerCase().replace(/[^a-z0-9]/g, '_')}.rst`;
    rstFiles[filename] = rstContent;
  }

  // Generate Plan Pages and Test Pages
  plans.forEach((plan) => {
    // Create main RST content
    let rstContent = '';

    rstContent += `..  shortname:: ${plan.plan_name.toLowerCase().replace(/[^a-z0-9]/g, '_')}\n\n`;
    rstContent += `..  description:: ${plan.goal || 'Exercise Page'}\n\n`;
    
    rstContent += `
.. setup for automatic question numbering.

.. qnum::
   :start: 1
   :prefix: ${plan.isTest ? 'ex' : 'p2'}-

`;

    // Add the plan name and goal
    rstContent += `Plan: ${plan.plan_name}\n${'='.repeat(plan.plan_name.length + 10)}\n\n`;
    
    if (!plan.isTest) {
      // Only add code template and metadata for regular plans
      if (plan.code_template.lines) {
        rstContent += '.. plandisplay:: plans.json' + 
          `${plan.plan_name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_code\n`;
        rstContent += '   :plan: ' + plan.plan_name + '\n';
        rstContent += '\n';
      }

      // Add plan metadata
      rstContent += `${plan.plan_metadata.description}\n\n`;
      
      rstContent += `Plan I - When to use this plan?\n${'-'.repeat(32)}\n`;
      rstContent += `${plan.plan_metadata.usage}\n\n`;

      rstContent += `Plan I - What parts can be customized to use this plan?\n${'-'.repeat(55)}\n`;
      rstContent += `${plan.plan_metadata.instruction}\n\n`;

      rstContent += `Plan I - Exercises\n${'-'.repeat(20)}\n`;
    }

    // Add questions for both plans and test pages
    if (plan.questions && plan.questions.length > 0) {
      plan.questions.forEach((question, idx) => {
        const questionId = `${plan.plan_name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_q${idx + 1}`;
        
        switch (question.type) {
          case 'MCQ':
            rstContent += generateMCQ(questionId, question, plan);
            break;
          case 'True/False':
            rstContent += generateTrueFalse(questionId, question, plan);
            break;
          case 'Fill in the Blank':
            rstContent += generateFillInTheBlank(questionId, question, plan);
            break;
          case 'Parsons Problem':
            rstContent += generateParsonsProblem(questionId, question, plan);
            break;
          case 'Clickable Areas':
            rstContent += generateClickableAreas(questionId, question, plan);
            break;
          case 'Active Code':
            rstContent += generateActiveCode(questionId, question);
            break;
        }
      });
    }

    rstContent += `.. note:: 
      
      .. raw:: html

       <a href="/index.html" >Click here to go back to the main page</a>
    `;

    // Store the RST content with a filename
    const filename = `${plan.plan_name.toLowerCase().replace(/[^a-z0-9]/g, '_')}.rst`;
    rstFiles[filename] = rstContent;
  });

  // Update the test page generation
  plans.filter(p => p.isTest).forEach(test => {
    let rstContent = '';
    
    // Add test page title
    rstContent += `${test.plan_name}\n${'='.repeat(test.plan_name.length)}\n\n`;
    
    // Add preamble if exists
    if (test.preamble) {
      rstContent += `${test.preamble}\n\n`;
    }

    // Add questions
    if (test.questions && test.questions.length > 0) {
      test.questions.forEach((question, idx) => {
        const questionId = `${test.plan_name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_q${idx + 1}`;
        
        switch (question.type) {
          case 'MCQ':
            rstContent += generateMCQ(questionId, question, test);
            break;
          case 'True/False':
            rstContent += generateTrueFalse(questionId, question, test);
            break;
          case 'Fill in the Blank':
            rstContent += generateFillInTheBlank(questionId, question, test);
            break;
          case 'Parsons Problem':
            rstContent += generateParsonsProblem(questionId, question, test);
            break;
          case 'Clickable Areas':
            rstContent += generateClickableAreas(questionId, question, test);
            break;
          case 'Active Code':
            rstContent += generateActiveCode(questionId, question);
            break;
        }
      });
    }

    // Store the RST content
    const filename = `${test.plan_name.toLowerCase().replace(/[^a-z0-9]/g, '_')}.rst`;
    rstFiles[filename] = rstContent;
  });

  return rstFiles;
};

const generateMCQ = (questionId, question, plan) => {
  let content = `.. mchoice:: ${questionId}\n`;
  content += `   :random: \n`;
  content += `   :answer_a: ${question.correct}\n`;
  content += `   :feedback_a: Correct!\n`;
  question.distractors.forEach((distractor, i) => {
    content += `   :answer_${String.fromCharCode(98 + i)}: ${distractor}\n`;
    content += `   :feedback_${String.fromCharCode(98 + i)}: ${question.feedback?.[i] || 'Try again.'}\n`;
  });
  content += '   :correct: a\n\n';
  content += `   ${question.stem}\n\n`;
  return content;
};

const generateTrueFalse = (questionId, question, plan) => {
  let content = `.. mchoice:: ${questionId}\n`;
  content += '   :answer_a: True\n';
  content += `   :feedback_a: ${question.label === 'True' ? 'Correct!' : question.feedback || 'Try again.'}\n`;
  content += '   :answer_b: False\n';
  content += `   :feedback_b: ${question.label === 'False' ? 'Correct!' : question.feedback || 'Try again.'}\n`;
  content += `   :correct: ${question.label === 'True' ? 'a' : 'b'}\n\n`;
  content += `   ${question.stem}\n\n`;
  return content;
};

const generateFillInTheBlank = (questionId, question, plan) => {
  let content = `.. fillintheblank:: ${questionId}\n`;
  content += `   :code_template: |\n`;

  // Process each line of code with proper indentation
  for (let line of plan.code_template.lines) {
    let processedLine = line;
    let blankCounter = 1;
    
    // Replace target area with @@blankN@@ format
    if (line.includes(`@@${question.area}@@`)) {
      processedLine = line.replace(`@@${question.area}@@`, `@@blank${blankCounter}@@`);
      blankCounter++;
    }
    
    // Replace other placeholders with their first value
    for (const [areaKey, values] of Object.entries(plan.code_template.changeable_areas)) {
      if (areaKey !== question.area && processedLine.includes(`@@${areaKey}@@`)) {
        processedLine = processedLine.replace(`@@${areaKey}@@`, values[0]);
      }
    }
    
    content += `      ${processedLine}${line === plan.code_template.lines[plan.code_template.lines.length - 1] ? '' : '\n'}`;
  }

  // Add correct answers, feedback, and placeholders
  let correctAnswers = plan.code_template.changeable_areas[question.area];
  content += `   :correct: ["${correctAnswers[0]}"]\n`;
  content += `   :feedback: ["Try using one of these values: ${correctAnswers.join(', ')}"]\n`;
  content += `   :placeholder: ["Enter the appropriate value"]\n\n`;
  
  // Add the question stem
  content += `   ${question.stem}\n\n`;
  
  return content;
};

const generateParsonsProblem = (questionId, question, plan) => {
  let content = `.. parsonsprob:: ${questionId}\n\n`;
  content += `   ${question.stem}\n\n`;
  content += `   ${'-'.repeat(5)}\n\n`;

  let order = question.correctOrder;
  let blocks = question.blocks;

  let correctBlocks = []
  let incorrectBlocks = []
  console.log(blocks);
  console.log(order);
  for (let item of blocks) {
    incorrectBlocks.push([item, false]);
  }

  for (let i of order) {
    correctBlocks.push(blocks[i]);
    incorrectBlocks[i][1] = true;
  }
  incorrectBlocks = incorrectBlocks.filter(item => item[1] === false);
  console.log(correctBlocks);
  console.log(incorrectBlocks);

  content += `   ${correctBlocks[0].text}\n`;
  for (let block of correctBlocks.slice(1)) {
    content += `   ${'='.repeat(5)}\n`;
    content += `   ${block.text}\n`;
  }
  for (let block of incorrectBlocks) {
    content += `   ${'='.repeat(5)}\n`;
    content += `   ${block[0].text} #distractor\n`;
  }

  content += '\n';
  return content;
};

const generateClickableAreas = (questionId, question, plan) => {
  let content = `.. clickablearea:: ${questionId}\n`;
  content += `   :question: ${question.stem}\n`;
  content += `   :iscode:\n\n`;

  for (let line of plan.code_template.lines) {
    line = `:click-incorrect:${line}:endclick:`;
    for (let area of question.areas) {
      console.log(line);
      if (line.includes(`@@${area}@@`)) {
        line = line.replace(`@@${area}@@`, `:endclick::click-correct:${plan.code_template.changeable_areas[area][0]}:endclick::click-incorrect:`);
      }
    }
    // Replace remaining placeholders with their first value
    for (const [areaKey, values] of Object.entries(plan.code_template.changeable_areas)) {
      if (line.includes(`@@${areaKey}@@`)) {
        line = line.replace(`@@${areaKey}@@`, values[0]);
      }
    }
    content += `   ${line}\n`;    
  }

  return content;
};

const extractJsonFromResponse = (responseText) => {
  const warnings = [];
  let jsonText = responseText.trim();

  // Check for ```json ... ``` format
  const jsonBlockMatch = responseText.match(/```json\n?([\s\S]*?)\n?```/);
  if (jsonBlockMatch) {
    jsonText = jsonBlockMatch[1].trim();
  } else {
    // If no ```json block found, try to find any ``` block
    const codeBlockMatch = responseText.match(/```\n?([\s\S]*?)\n?```/);
    if (codeBlockMatch) {
      jsonText = codeBlockMatch[1].trim();
    } else {
      // If no code blocks found, try to parse the entire response
      warnings.push("Response was not properly formatted with code blocks");
    }
  }

  // Validate that the text is actually JSON
  try {
    JSON.parse(jsonText);
  } catch (e) {
    warnings.push(`Invalid JSON format: ${e.message}`);
  }

  return { jsonText, warnings };
};

export const generateContextualExample = async (plans, groupName, llmKey, userContext = '') => {
  // Split the API key into actual key and endpoint
  const [apiKey, targetUri] = llmKey.split('|');
  
  if (!apiKey || !targetUri) {
    console.error("Invalid LLM key format");
    return null;
  }

  try {
    // Build the prompt with all plans in the group
    const plansContext = plans.map(plan => {
      const changeableAreasExplanation = Object.entries(plan.code_template.changeable_areas || {})
        .map(([key, value]) => `${key}: ${value.join(' or ')}`)
        .join('\n');

      return `Plan name: ${plan.plan_name}
Goal: ${plan.goal}
Code template:
${plan.code_template.lines.join('\n')}
Changeable areas:
${changeableAreasExplanation}
`;
    }).join('\n\n');

    const contextPrompt = userContext ? 
      `\nUser-provided context for this example:\n${userContext}\n\nCreate the example in the context described above.` : 
      '';

    const prompt = `Generate a JSON output (and nothing else) to create a contextual integrated example that combines multiple programming plans.

The example should situate these plans in a specific, real-world context that demonstrates how they work together.

Group name: ${groupName}
Plans to integrate:
${plansContext}${contextPrompt}

Your output should be a JSON object with these fields:
- changeable_areas_mapping: An object where keys are the changeable area names and values are the contextually appropriate replacements
- contextual_goals: An object mapping each plan name to a more specific, contextualized goal
- pre_explanation: A detailed explanation of the problem context that will appear above the code. This can include:
  * The specific problem or scenario being solved
  * Any example data or setup needed
  * Placeholders for figures using format: image[alt text]
  * Tables should be in RST format, for example:
    +------------+------------+-----------+
    | Header 1   | Header 2   | Header 3  |
    +============+============+===========+
    | cell 1     | cell 2     | cell 3    |
    +------------+------------+-----------+
    | cell 4     | cell 5     | cell 6    |
    +------------+------------+-----------+
  * Multiple paragraphs if needed

Make sure all the replacements and context are cohesive and make sense together.`;

    const requestBody = {
      model: "gpt-4",
      messages: [{
        role: "user",
        content: prompt
      }],
      temperature: 0.7
    };

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
    const contextJson = data.choices?.[0]?.message?.content?.trim();
    
    // Extract JSON from the response
    const { jsonText, warnings } = extractJsonFromResponse(contextJson);
    if (warnings.length > 0) {
      console.warn("Warnings while parsing LLM response:", warnings);
    }
    
    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Error generating contextual example:", error);
    return null;
  }
};

// Add LoadingBackdrop component
const LoadingBackdrop = ({ message }) => {
  return (
    <Backdrop
      sx={{
        color: '#fff',
        zIndex: (theme) => theme.zIndex.drawer + 1,
        flexDirection: 'column',
        gap: 2
      }}
      open={true}
    >
      <CircularProgress color="inherit" />
      <Typography variant="h6" component="div">
        {message}
      </Typography>
    </Backdrop>
  );
};

// Add root reference
let loadingRoot = null;

// Update loading management functions
const showLoading = (message) => {
  const loadingDiv = document.createElement('div');
  loadingDiv.id = 'rst-export-loading';
  document.body.appendChild(loadingDiv);
  loadingRoot = createRoot(loadingDiv);
  loadingRoot.render(<LoadingBackdrop message={message} />);
};

const hideLoading = () => {
  if (loadingRoot) {
    loadingRoot.unmount();
    loadingRoot = null;
    const loadingDiv = document.getElementById('rst-export-loading');
    if (loadingDiv) {
      loadingDiv.remove();
    }
  }
};

// Add function to generate contextual examples for all groups
export const generateContextualExamples = async (plans, llmKey) => {
  const examples = {};
  
  try {
    showLoading("Generating contextual examples...");
    
    // Group the plans
    const groupedPlans = plans.reduce((acc, plan) => {
      if (plan.group && !plan.isTest) {
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

    // Generate examples for each group
    for (const [groupName, groupPlans] of Object.entries(groupedPlans)) {
      const context = await generateContextualExample(groupPlans, groupName, llmKey);
      if (context) {
        examples[groupName] = {
          context,
          rstContent: await generateGroupRST(groupName, groupPlans, context)
        };
      }
    }

    return examples;
  } catch (error) {
    console.error("Error generating contextual examples:", error);
    return null;
  } finally {
    hideLoading();
  }
};

// Add function to generate RST content for a single group
export const generateGroupRST = async (groupName, groupPlans, context) => {
  // Sort plans in the group by order property
  const sortedPlans = [...groupPlans].sort((a, b) => {
    // Use order property if available, otherwise keep original order
    const orderA = a.order !== undefined ? a.order : Number.MAX_SAFE_INTEGER;
    const orderB = b.order !== undefined ? b.order : Number.MAX_SAFE_INTEGER;
    return orderA - orderB;
  });
  
  let rstContent = '';
  
  // Add group title
  rstContent += `Integrated Example - ${groupName}\n${'='.repeat(groupName.length + 30)}\n\n`;
  
  // Add the pre-explanation
  rstContent += `${context.pre_explanation}\n\n`;
  
  // Create combined code from all plans with context
  rstContent += `.. activecode:: integrated_${groupName.toLowerCase().replace(/[^a-z0-9]/g, '_')}\n`;
  rstContent += '   :language: python\n\n';
  
  // Combine code from all plans with contextual replacements
  sortedPlans.forEach(plan => {
    if (plan.code_template.lines) {
      rstContent += '   # ' + plan.goal + '\n';
      
      // Apply contextual replacements
      const lines = plan.code_template.lines.map(line => {
        let contextualLine = line;
        Object.entries(plan.code_template.changeable_areas || {}).forEach(([key, _]) => {
          if (context.changeable_areas_mapping[key]) {
            contextualLine = contextualLine.replace(
              new RegExp(`@@${key}@@`, 'g'),
              context.changeable_areas_mapping[key]
            );
          }
        });
        return contextualLine;
      });
      
      rstContent += '   ' + lines.join('\n   ') + '\n\n';
    }
  });
  
  // Add links to individual plans
  rstContent += 'This example uses the following programming plans:\n\n';
  // Add toctree with links to plan pages
  rstContent += '.. toctree::\n';
  rstContent += '   :maxdepth: 1\n';
  // rstContent += '   :hidden:\n\n';
  sortedPlans.forEach(plan => {
    const planFileName = plan.plan_name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    rstContent += `   ${planFileName}\n`; 
  });
  rstContent += '\n';
  
  sortedPlans.forEach(plan => {
    const planFileName = plan.plan_name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    rstContent += `.. plandisplay:: plans.json${planFileName}_code\n`;
    rstContent += `   :plan: ${plan.plan_name}\n\n`;
    // rstContent += `* Click to go to the plan page for :doc:\`${planFileName}\`\n\n`;
  });
  rstContent += '\n';

  return rstContent;
};

// Add new function to generate activecode question
const generateActiveCode = (questionId, question) => {
  let content = `.. activecode:: ${questionId}\n`;
  content += `   :language: python\n`;
  
  if (question.testCases) {
    content += `   :autograde: unittest\n\n`;
    content += `   ${question.stem}\n\n`;
    content += `   ~~~~\n`;
    content += `   ${question.initialCode || ''}\n\n`;
    content += `   ====\n`;
    content += `   from unittest.gui import TestCaseGui\n\n`;
    content += `   class myTests(TestCaseGui):\n`;
    content += `       def testOne(self):\n`;
    
    // Process test cases
    const tests = question.testCases.split('\n').filter(test => test.trim());
    tests.forEach((test, i) => {
      const [input, expected] = test.split('->').map(s => s.trim());
      content += `           self.assertEqual(${input}, ${expected}, 'Test ${i + 1}')\n`;
    });
    
    content += `   myTests().main()\n\n`;
  } else {
    content += `\n   ${question.stem}\n\n`;
    content += `   ~~~~\n`;
    content += `   ${question.initialCode || ''}\n\n`;
  }

  if (question.solutionCode) {
    content += `   .. solution:: \n\n`;
    content += `      ${question.solutionCode.split('\n').join('\n      ')}\n\n`;
  }

  return content;
};

// Modify the exportRST function to use cached examples
export const exportRST = async (plans, llmKey, cachedExamples = null) => {
  console.log("cachedExamples in exportRST", cachedExamples);
  try {
    showLoading("Generating RST files...");

    // Generate RST files
    const rstFiles = await generateRST(plans, llmKey, cachedExamples);
    
    showLoading("Creating zip file...");

    // Create a zip file containing all RST files
    const zip = require('jszip')();
    
    // Add each RST file to the zip
    Object.entries(rstFiles).forEach(([filename, content]) => {
      zip.file(filename, content);
    });
    
    // Add the JSON file to the zip
    zip.file('plans.json', JSON.stringify(plans, null, 2));

    // Generate and download the zip file
    const content = await zip.generateAsync({ type: "blob" });
    const url = window.URL.createObjectURL(content);
    const link = document.createElement('a');
    link.href = url;
    link.download = "runestone_files.zip";
    link.click();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error exporting RST files:", error);
  } finally {
    hideLoading();
  }
}; 
 