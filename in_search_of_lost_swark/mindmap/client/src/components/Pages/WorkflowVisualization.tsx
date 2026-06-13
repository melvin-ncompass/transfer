import React, { useEffect, useRef, useState } from 'react';
import * as go from 'gojs';
import { Box, Paper, Typography, Chip, Alert, Button, Stack, Card, CardContent } from '@mui/material';
import { ZoomOutMap as ZoomToFitIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { graphData } from '../../data/graphData';

const WorkflowVisualization: React.FC = () => {
  const diagramRef = useRef<HTMLDivElement>(null);
  const overviewRef = useRef<HTMLDivElement>(null);
  const initializationRef = useRef<boolean>(false);
  
  const [diagram, setDiagram] = useState<go.Diagram | null>(null);
  const [overview, setOverview] = useState<go.Overview | null>(null);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [diagramError, setDiagramError] = useState<string | null>(null);

  // Helper function to split camelCase text
  const splitCamelCase = (text: string): string => {
    if (!text) return text;
    
    // Split camelCase words and join with newlines
    const words = text
      .replace(/([a-z])([A-Z])/g, '$1\n$2') // Split between lowercase and uppercase
      .replace(/([A-Z])([A-Z][a-z])/g, '$1\n$2') // Split consecutive uppercase letters
      .split('\n')
      .filter(word => word.length > 0);
    
    // If we have more than 4 words, group them into pairs to avoid too many lines
    if (words.length > 4) {
      const grouped: string[] = [];
      for (let i = 0; i < words.length; i += 2) {
        if (i + 1 < words.length) {
          grouped.push(words[i] + words[i + 1]);
        } else {
          grouped.push(words[i]);
        }
      }
      return grouped.join('\n');
    }
    
    return words.join('\n');
  };

  // Transform real GraphData into flowchart workflow structure
  const createFlowchartData = () => {
    // Analyze the real data structure
    const nodes = graphData.nodes;
    const links = graphData.links;
    
    // Group nodes by module/file for better organization
    const nodesByModule = nodes.reduce((acc: any, node: any) => {
      const module = node.module || 'core';
      if (!acc[module]) acc[module] = [];
      acc[module].push(node);
      return acc;
    }, {});
    
    // Group nodes by language
    const nodesByLanguage = nodes.reduce((acc: any, node: any) => {
      const lang = node.language || 'unknown';
      if (!acc[lang]) acc[lang] = [];
      acc[lang].push(node);
      return acc;
    }, {});
    
    // Find entry points and high-complexity nodes
    const entryPoints = nodes.filter((node: any) => 
      node.isEntryPoint || node.dependsOnCount === 0 || node.name?.includes('main') || node.name?.includes('index')
    );
    
    const highComplexityNodes = nodes
      .filter((node: any) => node.complexity > 20)
      .sort((a: any, b: any) => b.complexity - a.complexity)
      .slice(0, 5);
    
    const moduleKeys = Object.keys(nodesByModule);
    const languageKeys = Object.keys(nodesByLanguage);
    
    const nodeDataArray = [
      // Start node
      {
        key: "start",
        text: "Start Code Analysis",
        category: "start",
        figure: "Circle",
        fill: "#90EE90",
        hasChildren: false,
        level: 0,
        description: "Begin exploring the codebase structure and dependencies"
      },
      
      // Choose analysis type
      {
        key: "choose-analysis",
        text: "Choose Analysis Type",
        category: "decision",
        figure: "Diamond",
        fill: "#FFE4B5",
        hasChildren: false,
        level: 1,
        description: "Select how you want to explore the code structure"
      },

      // Module-based analysis
      {
        key: "module-analysis",
        text: "Module Analysis",
        category: "process",
        figure: "RoundedRectangle",
        fill: "#87CEEB",
        hasChildren: true,
        level: 2,
        description: `Explore code by modules (${moduleKeys.length} modules found)`,
        expandedChildren: moduleKeys.slice(0, 8).map((module) => ({
          key: `module-${module}`,
          text: `${module} Module`,
          category: "subprocess",
          figure: "RoundedRectangle",
          fill: "#E6E6FA",
          level: 3,
          description: `Analyze ${nodesByModule[module].length} functions in ${module} module`,
          nodeCount: nodesByModule[module].length,
          avgComplexity: Math.round(nodesByModule[module].reduce((sum: number, n: any) => sum + (n.complexity || 1), 0) / nodesByModule[module].length)
        }))
      },

      // Language-based analysis  
      {
        key: "language-analysis",
        text: "Language Analysis",
        category: "process",
        figure: "RoundedRectangle",
        fill: "#DDA0DD",
        hasChildren: true,
        level: 2,
        description: `Explore code by languages (${languageKeys.length} languages found)`,
        expandedChildren: languageKeys.map((lang) => ({
          key: `lang-${lang}`,
          text: `${lang.toUpperCase()} Files`,
          category: "subprocess", 
          figure: "RoundedRectangle",
          fill: "#E6E6FA",
          level: 3,
          description: `Analyze ${nodesByLanguage[lang].length} ${lang} functions`,
          nodeCount: nodesByLanguage[lang].length,
          language: lang
        }))
      },

      // Complexity analysis
      {
        key: "complexity-analysis", 
        text: "Complexity Analysis",
        category: "process",
        figure: "RoundedRectangle", 
        fill: "#F0E68C",
        hasChildren: true,
        level: 2,
        description: "Examine high-complexity functions and potential refactoring opportunities",
        expandedChildren: highComplexityNodes.map((node: any, index: number) => ({
          key: `complex-${node.id}`,
          text: node.name || `Function ${index + 1}`,
          category: "subprocess",
          figure: "RoundedRectangle",
          fill: "#FFB6C1",
          level: 3,
          description: `Complexity: ${node.complexity} | File: ${node.filePath}`,
          complexity: node.complexity,
          filePath: node.filePath,
          originalNode: node
        }))
      },

      // Dependencies analysis
      {
        key: "dependency-analysis",
        text: "Dependency Analysis", 
        category: "process",
        figure: "RoundedRectangle",
        fill: "#98FB98",
        hasChildren: true,
        level: 2,
        description: "Explore function dependencies and relationships",
        expandedChildren: [
          {
            key: "entry-points",
            text: "Entry Points",
            category: "subprocess",
            figure: "RoundedRectangle",
            fill: "#E6E6FA",
            level: 3,
            description: `Found ${entryPoints.length} entry points - functions with no dependencies`,
            nodeCount: entryPoints.length
          },
          {
            key: "most-used",
            text: "Most Referenced",
            category: "subprocess",
            figure: "RoundedRectangle", 
            fill: "#E6E6FA",
            level: 3,
            description: "Functions that are used by many other functions",
            nodeCount: nodes.filter((n: any) => n.usedByCount > 3).length
          },
          {
            key: "most-dependencies",
            text: "Most Dependencies",
            category: "subprocess",
            figure: "RoundedRectangle",
            fill: "#E6E6FA", 
            level: 3,
            description: "Functions that depend on many other functions",
            nodeCount: nodes.filter((n: any) => n.dependsOnCount > 3).length
          }
        ]
      },

      // Analysis complete
      {
        key: "analysis-complete",
        text: "Analysis Complete",
        category: "process", 
        figure: "RoundedRectangle",
        fill: "#FFB6C1",
        hasChildren: false,
        level: 1,
        description: "Code analysis completed. Review findings and insights."
      },

      // Decision: Take action
      {
        key: "take-action",
        text: "Take Action?",
        category: "decision",
        figure: "Diamond",
        fill: "#FFE4B5", 
        hasChildren: false,
        level: 1,
        description: "Based on analysis, decide on next steps for code improvement"
      },

      // Action paths
      {
        key: "refactor-code",
        text: "Refactor Code",
        category: "process",
        figure: "RoundedRectangle",
        fill: "#DEB887",
        hasChildren: true,
        level: 2,
        description: "Improve code structure based on analysis findings",
        expandedChildren: [
          {
            key: "simplify-complex",
            text: "Simplify Complex Functions",
            category: "subprocess", 
            figure: "RoundedRectangle",
            fill: "#E6E6FA",
            level: 3,
            description: "Break down high-complexity functions into smaller parts"
          },
          {
            key: "reduce-dependencies",
            text: "Reduce Dependencies",
            category: "subprocess",
            figure: "RoundedRectangle",
            fill: "#E6E6FA", 
            level: 3,
            description: "Minimize tight coupling between functions"
          }
        ]
      },

      {
        key: "document-findings",
        text: "Document Findings", 
        category: "process",
        figure: "RoundedRectangle",
        fill: "#B0E0E6",
        hasChildren: false,
        level: 2,
        description: "Create documentation based on code analysis results"
      },

      // End node
      {
        key: "end",
        text: "Code Analysis Expert",
        category: "end",
        figure: "Circle",
        fill: "#FFB6C1",
        hasChildren: false,
        level: 0,
        description: `Analysis of ${nodes.length} functions and ${links.length} connections complete!`
      }
    ];

    const linkDataArray = [
      // Main sequential flow
      { key: "l1", from: "start", to: "choose-analysis", category: "main" },
      
      // Decision branches
      { key: "l2", from: "choose-analysis", to: "module-analysis", category: "branch", label: "By Module" },
      { key: "l3", from: "choose-analysis", to: "language-analysis", category: "branch", label: "By Language" },
      { key: "l4", from: "choose-analysis", to: "complexity-analysis", category: "branch", label: "By Complexity" },
      { key: "l5", from: "choose-analysis", to: "dependency-analysis", category: "branch", label: "Dependencies" },
      
      // Convergence to analysis complete
      { key: "l6", from: "module-analysis", to: "analysis-complete", category: "main" },
      { key: "l7", from: "language-analysis", to: "analysis-complete", category: "main" },
      { key: "l8", from: "complexity-analysis", to: "analysis-complete", category: "main" },
      { key: "l9", from: "dependency-analysis", to: "analysis-complete", category: "main" },
      
      // Continue flow
      { key: "l10", from: "analysis-complete", to: "take-action", category: "main" },
      { key: "l11", from: "take-action", to: "refactor-code", category: "branch", label: "Yes - Refactor" },
      { key: "l12", from: "take-action", to: "document-findings", category: "branch", label: "Yes - Document" },
      { key: "l13", from: "refactor-code", to: "end", category: "main" },
      { key: "l14", from: "document-findings", to: "end", category: "main" },
      
      // Feedback loops
      { key: "l15", from: "take-action", to: "choose-analysis", category: "feedback", label: "Re-analyze" },
      { key: "l16", from: "end", to: "choose-analysis", category: "feedback", label: "New Analysis" }
    ];

    return { nodeDataArray, linkDataArray };
  };

  // Node expansion logic for flowchart
  const expandNode = (node: go.Node) => {
    try {
      const currentDiagram = node.diagram || diagram;
      if (!currentDiagram) return;
      
      currentDiagram.startTransaction('ExpandNode');
      const data = node.data;
      
      if (!data.hasChildren || !data.expandedChildren) {
        currentDiagram.commitTransaction('ExpandNode');
        return;
      }
      
      const model = currentDiagram.model as go.GraphLinksModel;
      
      if (!data.everExpanded) {
        // First time expansion - add child nodes
        data.expandedChildren.forEach((child: any) => {
          const childNodeData = {
            ...child,
            everExpanded: false,
            isExpanded: false,
            parentKey: data.key
          };
          
          model.addNodeData(childNodeData);
          
          // Add link from parent to child
          const linkData = {
            key: `expand_${data.key}_${child.key}`,
            from: data.key,
            to: child.key,
            category: 'expansion'
          };
          model.addLinkData(linkData);
        });
        
        model.setDataProperty(data, 'everExpanded', true);
        model.setDataProperty(data, 'isExpanded', true);
      } else {
        // Toggle expansion state
        if (data.isExpanded) {
          // Collapse - remove child nodes
          data.expandedChildren.forEach((child: any) => {
            const childNode = model.findNodeDataForKey(child.key);
            if (childNode) {
              model.removeNodeData(childNode);
            }
            
            const link = model.findLinkDataForKey(`expand_${data.key}_${child.key}`);
            if (link) {
              model.removeLinkData(link);
            }
          });
          
          model.setDataProperty(data, 'isExpanded', false);
        } else {
          // Re-expand - add child nodes back
          data.expandedChildren.forEach((child: any) => {
            const childNodeData = {
              ...child,
              everExpanded: false,
              isExpanded: false,
              parentKey: data.key
            };
            
            model.addNodeData(childNodeData);
            
            const linkData = {
              key: `expand_${data.key}_${child.key}`,
              from: data.key,
              to: child.key,
              category: 'expansion'
            };
            model.addLinkData(linkData);
          });
          
          model.setDataProperty(data, 'isExpanded', true);
        }
      }
      
      currentDiagram.commitTransaction('ExpandNode');
      
      setTimeout(() => {
        if (currentDiagram) {
          currentDiagram.layoutDiagram(true);
          
          const buttonText = node.findObject('BUTTONTEXT') as go.TextBlock;
          if (buttonText) {
            buttonText.text = data.isExpanded ? '−' : '+';
          }
        }
      }, 100);
    } catch (error) {
      console.error('Error in expandNode:', error);
      if (node.diagram) {
        node.diagram.rollbackTransaction();
      }
    }
  };

  useEffect(() => {
    if (!diagramRef.current || !overviewRef.current || initializationRef.current) return;

    try {
      initializationRef.current = true;
      
      // Clear existing diagrams
      const existingDiagram = go.Diagram.fromDiv(diagramRef.current);
      if (existingDiagram) {
        existingDiagram.div = null;
      }
      
      const existingOverview = go.Overview.fromDiv(overviewRef.current);
      if (existingOverview) {
        existingOverview.div = null;
      }
      
      if (diagram) {
        diagram.div = null;
        setDiagram(null);
      }
      
      if (overview) {
        overview.div = null;
        setOverview(null);
      }
      
      // Clear divs
      diagramRef.current.innerHTML = '';
      overviewRef.current.innerHTML = '';

      // Create diagram
      const $ = go.GraphObject.make;
      const myDiagram = $(go.Diagram, diagramRef.current, {
        'undoManager.isEnabled': true,
        layout: $(go.LayeredDigraphLayout, {
          direction: 0, // Left to right
          layerSpacing: 120,
          columnSpacing: 80,
          setsPortSpots: false
        }),
        initialAutoScale: go.AutoScale.Uniform,
        contentAlignment: go.Spot.Center,
        padding: new go.Margin(20)
      });

      // Selection event handler
      myDiagram.addDiagramListener('ChangedSelection', (e: go.DiagramEvent) => {
        // Reset all nodes to default color
        e.diagram.nodes.each((node: go.Node) => {
          const shape = node.findObject('SHAPE') as go.Shape;
          if (shape && node.data.fill) {
            shape.fill = node.data.fill;
          }
        });
        
        // Reset all links to default color
        e.diagram.links.each((link: go.Link) => {
          const linkShape = link.findObject('LINKSHAPE') as go.Shape;
          const arrowHead = link.findObject('ARROWHEAD') as go.Shape;
          if (linkShape) {
            linkShape.stroke = '#888';
            linkShape.strokeWidth = 2;
          }
          if (arrowHead) {
            arrowHead.fill = '#888';
          }
        });
        
        const selection = e.diagram.selection.first();
        if (selection && selection instanceof go.Node) {
          setSelectedNode(selection.data);
          const shape = selection.findObject('SHAPE') as go.Shape;
          if (shape) {
            shape.fill = '#4CAF50';
          }
          
          selection.linksConnected.each((link: go.Link) => {
            const linkShape = link.findObject('LINKSHAPE') as go.Shape;
            const arrowHead = link.findObject('ARROWHEAD') as go.Shape;
            if (linkShape) {
              linkShape.stroke = '#4CAF50';
              linkShape.strokeWidth = 3;
            }
            if (arrowHead) {
              arrowHead.fill = '#4CAF50';
            }
          });
        } else {
          setSelectedNode(null);
        }
      });

      // Define node template
      myDiagram.nodeTemplate = $(go.Node, 'Spot',
        {
          selectionObjectName: 'PANEL',
          selectionAdornmentTemplate: $(go.Adornment)
        },
        $(go.Panel, 'Auto', { name: 'PANEL' },
          $(go.Shape, { 
            name: 'SHAPE',
            stroke: '#333',
            strokeWidth: 2,
            minSize: new go.Size(120, 60)
          }, 
          new go.Binding('figure', 'figure'),
          new go.Binding('fill', 'fill')),
          $(go.TextBlock, { 
            font: 'bold 11pt sans-serif', 
            margin: 8,
            stroke: '#000',
            maxSize: new go.Size(140, NaN),
            wrap: go.Wrap.Fit,
            textAlign: 'center'
          }, new go.Binding('text', 'text', splitCamelCase))
        ),
        // Expand/Collapse button
        $(go.Panel, 'Auto', {
          alignment: go.Spot.TopRight,
          alignmentFocus: go.Spot.Center,
          name: 'TREEBUTTON',
          width: 26,
          height: 26,
          cursor: 'pointer',
          mouseEnter: (_e: any, obj: any) => {
            const shape = obj.findObject('BUTTONSHAPE');
            if (shape) shape.fill = '#555';
          },
          mouseLeave: (_e: any, obj: any) => {
            const shape = obj.findObject('BUTTONSHAPE');
            if (shape) shape.fill = '#333';
          },
          click: (e: any, obj: any) => {
            const node = obj.part;
            if (node === null) return;
            e.handled = true;
            expandNode(node);
          }
        },
          $(go.Shape, 'Circle', {
            name: 'BUTTONSHAPE',
            fill: '#333',
            stroke: '#666',
            strokeWidth: 2,
            width: 24,
            height: 24
          }),
          $(go.TextBlock, {
            font: 'bold 14pt sans-serif',
            stroke: '#fff',
            textAlign: 'center',
            margin: 0,
            name: 'BUTTONTEXT',
            text: '+'
          }, new go.Binding('visible', '', (data: any) => {
            return data.hasChildren;
          }))
        )
      );

      // Define link template
      myDiagram.linkTemplate = $(go.Link, {
        routing: go.Routing.AvoidsNodes,
        corner: 10
      },
        $(go.Shape, { 
          name: 'LINKSHAPE',
          strokeWidth: 2 
        }, new go.Binding('stroke', 'category', (category: string) => {
          switch (category) {
            case 'main': return '#2196F3';
            case 'branch': return '#FF9800';
            case 'feedback': return '#4CAF50';
            case 'expansion': return '#9E9E9E';
            default: return '#888';
          }
        }),
        new go.Binding('strokeDashArray', 'category', (category: string) => {
          return category === 'feedback' ? [5, 5] : null;
        })),
        $(go.Shape, { 
          toArrow: 'Standard',
          strokeWidth: 0,
          name: 'ARROWHEAD'
        }, new go.Binding('fill', 'category', (category: string) => {
          switch (category) {
            case 'main': return '#2196F3';
            case 'branch': return '#FF9800';
            case 'feedback': return '#4CAF50';
            case 'expansion': return '#9E9E9E';
            default: return '#888';
          }
        })),
        $(go.TextBlock, {
          font: '10px sans-serif',
          textAlign: 'center',
          segmentOffset: new go.Point(0, -10),
          segmentOrientation: go.Orientation.Upright
        }, new go.Binding('text', 'label'))
      );

      // Set model data
      const { nodeDataArray, linkDataArray } = createFlowchartData();
      const model = new go.GraphLinksModel();
      model.nodeDataArray = nodeDataArray;
      model.linkDataArray = linkDataArray;
      model.nodeKeyProperty = 'key';
      model.linkKeyProperty = 'key';
      myDiagram.model = model;

      // Create Overview
      const myOverview = $(go.Overview, overviewRef.current, {
        observed: myDiagram,
        contentAlignment: go.Spot.Center,
        'box.resizable': true
      });

      setDiagram(myDiagram);
      setOverview(myOverview);
      setDiagramError(null);
      
    } catch (error: any) {
      console.error('Error initializing workflow diagram:', error);
      setDiagramError(`Failed to initialize workflow diagram: ${error.message}`);
    }
  }, []);

  const zoomToFit = () => {
    if (diagram) {
      diagram.zoomToFit();
    }
  };

  const resetDiagram = () => {
    if (diagram) {
      const { nodeDataArray, linkDataArray } = createFlowchartData();
      const model = new go.GraphLinksModel();
      model.nodeDataArray = nodeDataArray;
      model.linkDataArray = linkDataArray;
      model.nodeKeyProperty = 'key';
      model.linkKeyProperty = 'key';
      diagram.model = model;
      diagram.zoomToFit();
      setSelectedNode(null);
    }
  };

  // Error handling
  if (diagramError) {
    return (
      <Box sx={{ 
        p: 3, 
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#121212',
        flexDirection: 'column'
      }}>
        <Alert severity="error" sx={{ mb: 2, maxWidth: 600 }}>
          {diagramError}
        </Alert>
        <Button 
          variant="contained" 
          onClick={() => {
            setDiagramError(null);
            initializationRef.current = false;
          }}
        >
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      height: '100vh', 
      width: '100vw',
      display: 'flex', 
      flexDirection: 'column',
      overflow: 'hidden',
      position: 'fixed',
      top: 0,
      left: 0,
      backgroundColor: '#121212'
    }}>
      {/* Header */}
      <Box sx={{ 
        p: 1, 
        backgroundColor: '#1e1e1e',
        borderBottom: '1px solid #333',
        zIndex: 1000,
        boxShadow: '0 2px 4px rgba(0,0,0,0.5)'
      }}>
        <Typography variant="h5" component="h1" sx={{ mb: 0.5, color: '#fff' }}>
          🚀 Repository Development Workflow
        </Typography>
        
        <Typography variant="body2" sx={{ mb: 1, color: '#b0b0b0' }}>
          Interactive flowchart showing the complete developer onboarding process
        </Typography>

        {/* Control Buttons */}
        <Stack direction="row" spacing={2}>
          <Button
            variant="contained"
            startIcon={<ZoomToFitIcon />}
            onClick={zoomToFit}
            size="small"
            disabled={!diagram}
          >
            Zoom to Fit
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={resetDiagram}
            size="small"
            disabled={!diagram}
          >
            Reset View
          </Button>
        </Stack>
      </Box>

      {/* Main Content */}
      <Box sx={{ 
        display: 'flex', 
        gap: 1, 
        flexGrow: 1, 
        height: 'calc(100vh - 120px)',
        overflow: 'hidden'
      }}>
        {/* Main Diagram - Takes up 80% of screen */}
        <Box sx={{ flex: '1 1 80%' }}>
          <Paper 
            elevation={0}
            sx={{ 
              height: '100%',
              position: 'relative',
              overflow: 'hidden',
              borderRadius: 0,
              backgroundColor: '#1a1a1a'
            }}
          >
            <div
              ref={diagramRef}
              style={{
                width: '100%',
                height: '100%',
                backgroundColor: '#1a1a1a'
              }}
            />
          </Paper>
        </Box>

        {/* Side Panel - Takes up 20% of screen */}
        <Box sx={{ flex: '1 1 20%', minWidth: '300px' }}>
          <Stack spacing={1} sx={{ height: '100%' }}>
            {/* Overview */}
            <Card elevation={2} sx={{ flex: '0 0 auto', backgroundColor: '#2a2a2a', color: '#fff' }}>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>
                  📍 Overview
                </Typography>
                <div
                  ref={overviewRef}
                  style={{
                    width: '100%',
                    height: '200px',
                    backgroundColor: '#333',
                    border: '1px solid #555'
                  }}
                />
              </CardContent>
            </Card>

            {/* Node Details */}
            <Card elevation={2} sx={{ flex: '1 1 auto', backgroundColor: '#2a2a2a', color: '#fff' }}>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>
                  {selectedNode ? '🔍 Node Details' : '👆 Select a Node'}
                </Typography>
                {selectedNode ? (
                  <Box>
                    <Typography variant="h6" sx={{ mb: 1, color: '#4CAF50' }}>
                      {splitCamelCase(selectedNode.text)}
                    </Typography>
                    
                    <Chip 
                      label={selectedNode.category.toUpperCase()} 
                      size="small" 
                      sx={{ 
                        mb: 2, 
                        bgcolor: selectedNode.fill || '#757575',
                        color: 'white'
                      }} 
                    />
                    
                    <Typography variant="body2" sx={{ mb: 0.5, color: '#b0b0b0' }}>
                      <strong>Key:</strong> {selectedNode.key}
                    </Typography>
                    
                    <Typography variant="body2" sx={{ mb: 0.5, color: '#b0b0b0' }}>
                      <strong>Type:</strong> {selectedNode.figure}
                    </Typography>
                    
                    <Typography variant="body2" sx={{ mb: 0.5, color: '#b0b0b0' }}>
                      <strong>Level:</strong> {selectedNode.level}
                    </Typography>
                    
                    <Typography variant="body2" sx={{ mb: 0.5, color: '#b0b0b0' }}>
                      <strong>Has Sub-steps:</strong> {selectedNode.hasChildren ? 'Yes' : 'No'}
                    </Typography>
                    
                    {selectedNode.hasChildren && (
                      <Typography variant="body2" sx={{ mb: 0.5, color: '#b0b0b0' }}>
                        <strong>Sub-steps:</strong> {selectedNode.expandedChildren?.length || 0}
                      </Typography>
                    )}
                    
                    {selectedNode.isExpanded && (
                      <Typography variant="body2" sx={{ mb: 0.5, color: '#b0b0b0' }}>
                        <strong>Expanded:</strong> Yes
                      </Typography>
                    )}
                    
                    <Alert severity="info" sx={{ mt: 2, backgroundColor: '#1a1a2e', color: '#fff' }}>
                      {selectedNode.category === 'start' && '🎉 Starting point of the development workflow'}
                      {selectedNode.category === 'decision' && '🤔 Decision point - choose your path based on your role or interest'}
                      {selectedNode.category === 'process' && '⚙️ Process step - click + to see detailed sub-tasks if available'}
                      {selectedNode.category === 'subprocess' && '🔧 Detailed sub-task within a larger process'}
                      {selectedNode.category === 'end' && '🎊 Congratulations! You\'ve completed the workflow'}
                    </Alert>
                    
                    {selectedNode.hasChildren && (
                      <Alert severity="success" sx={{ mt: 1, backgroundColor: '#1a2e1a', color: '#fff' }}>
                        💡 Click the <strong>+</strong> button on the node to explore sub-tasks and detailed steps.
                      </Alert>
                    )}
                  </Box>
                ) : (
                  <Box>
                    <Typography variant="body2" sx={{ mb: 2, color: '#b0b0b0' }}>
                      Welcome to the <strong>Repository Development Workflow</strong>! This flowchart shows:
                    </Typography>
                    <Box component="ul" sx={{ pl: 2, mb: 2, color: '#b0b0b0' }}>
                      <li>� <strong>Sequential Process:</strong> Step-by-step developer onboarding</li>
                      <li>� <strong>Decision Points:</strong> Choose your learning path</li>
                      <li>🌳 <strong>Expandable Steps:</strong> Click + to see detailed sub-tasks</li>
                      <li>� <strong>Professional Flow:</strong> Similar to business process charts</li>
                    </Box>
                    <Alert severity="warning" sx={{ mt: 2, backgroundColor: '#2e1a1a', color: '#fff' }}>
                      <strong>🎯 How to Navigate:</strong><br/>
                      • Click nodes to see descriptions<br/>
                      • Follow arrows from Start to End<br/>
                      • Use <strong>+</strong> buttons to expand detailed steps<br/>
                      • Different shapes indicate different step types<br/>
                      • Colors help identify process categories
                    </Alert>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Stack>
        </Box>
      </Box>
    </Box>
  );
};

export default WorkflowVisualization;