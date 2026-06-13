import React, { useRef, useEffect, useState } from 'react';
import * as go from 'gojs';
import { useNavigate } from 'react-router-dom';
import { 
  Box, Paper, Typography, Button, Alert, Stack, Card, CardContent
} from '@mui/material';
import {
  ZoomOutMap as ZoomToFitIcon,
  Refresh as RefreshIcon,
  AccountTree as DiagramIcon
} from '@mui/icons-material';
import { graphData } from '../../data/graphData';

// ===========================
// TYPESCRIPT INTERFACES
// ===========================
interface OverviewResizingProps {
  projectName?: string;
  username?: string;
}

// ===========================
// CUSTOM GOJS TOOL CLASS
// ===========================
class OverviewResizingTool extends go.ResizingTool {
  public resizeObject: go.GraphObject | null = null;

  public resize(newr: go.Rect): void {
    const diagram = this.diagram;
    this.resizeObject!.desiredSize = new go.Size(newr.width, newr.height);
    diagram.layoutDiagram(true);
  }
}

// ===========================
// MAIN COMPONENT
// ===========================
const OverviewResizing: React.FC<OverviewResizingProps> = ({    
  projectName = 'phonex',
  username = 'Melvin-ncompass'
}) => {
  // ===========================
  // STATE AND REFS
  // ===========================
  const navigate = useNavigate();
  const diagramRef = useRef<HTMLDivElement>(null);
  const overviewRef = useRef<HTMLDivElement>(null);
  const initializationRef = useRef<boolean>(false);
  
  const [diagram, setDiagram] = useState<go.Diagram | null>(null);
  const [overview, setOverview] = useState<go.Overview | null>(null);
  const [diagramError, setDiagramError] = useState<string | null>(null);
  const [selectedNodeData, setSelectedNodeData] = useState<any>(null);

  // ===========================
  // DATA PROCESSING FUNCTIONS
  // ===========================
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

  const createTreeData = () => {
    const nodesWithIncomingLinks = new Set<string>();
    
    // Find nodes with incoming dependencies
    graphData.links.forEach(link => {
      nodesWithIncomingLinks.add(link.target);
    });
    
    // Find parent nodes (no incoming dependencies)
    const parentNodes = graphData.nodes.filter(node => 
      !nodesWithIncomingLinks.has(node.id)
    );
    
    // Fallback logic if no parent nodes found
    let nodesToDisplay = parentNodes;
    if (parentNodes.length === 0) {
      const sourceNodes = new Set<string>();
      graphData.links.forEach(link => sourceNodes.add(link.source));
      
      nodesToDisplay = graphData.nodes.filter(node => 
        sourceNodes.has(node.id) && !nodesWithIncomingLinks.has(node.id)
      );
      
      if (nodesToDisplay.length === 0) {
        nodesToDisplay = [graphData.nodes[0]];
      }
    }

    const nodeDataArray: any[] = [];
    const linkDataArray: any[] = [];
    
    // Create parent node data
    nodesToDisplay.forEach((node, index) => {
      const childConnections = graphData.links
        .filter(link => link.source === node.id)
        .map(link => link.target);

      const nodeData = {
        key: `root-${node.id}`,
        id: node.id,
        text: node.name || node.id?.split('#')[1]?.split(/[\/\.]/).pop() || `Parent ${index + 1}`,
        everExpanded: false,
        originalId: node.id,
        group: node.group || 'parent',
        complexity: (node as any).complexity || 1,
        availableConnections: childConnections,
        isParentNode: true,
        isRootNode: true,
        category: 'root',
        hasChildren: childConnections.length > 0,
        level: 0
      };
      
      nodeDataArray.push(nodeData);
    });
    
    return { nodeDataArray, linkDataArray };
  };

  // ===========================
  // NODE EXPANSION LOGIC
  // ===========================
  const createSubTree = (parentdata: any, diagramRef?: go.Diagram): number => {
    const currentDiagram = diagramRef || diagram;
    if (!currentDiagram) return 0;
    
    const model = currentDiagram.model as go.GraphLinksModel;
    let childCount = 0;
    
    const dependentLinks = graphData.links.filter((link: any) => 
      link.source === parentdata.id
    );
    
    const dependentNodeIds = dependentLinks.map((link: any) => link.target);
    const dependencies = graphData.nodes.filter((node: any) => 
      dependentNodeIds.includes(node.id)
    );
    
    dependencies.forEach((childItem: any) => {
      const globalChildKey = `shared_${childItem.id}`;
      let childNodeData = model.findNodeDataForKey(globalChildKey);
      
      if (!childNodeData) {
        childNodeData = {
          key: globalChildKey,
          id: childItem.id,
          text: childItem.name,
          description: childItem.filePath || '',
          level: (parentdata.level || 0) + 1,
          isParentNode: false,
          category: childItem.language || 'file',
          everExpanded: false,
          isExpanded: false,
          hasChildren: graphData.links.some((link: any) => 
            link.source === childItem.id
          ),
          parentNodes: [parentdata.key]
        };
        
        model.addNodeData(childNodeData);
        childCount++;
      } else {
        if (!childNodeData.parentNodes) {
          childNodeData.parentNodes = [];
        }
        if (!childNodeData.parentNodes.includes(parentdata.key)) {
          childNodeData.parentNodes.push(parentdata.key);
          model.setDataProperty(childNodeData, 'parentNodes', childNodeData.parentNodes);
        }
      }
      
      const linkKey = `link_${parentdata.key}_to_${globalChildKey}`;
      const existingLink = model.findLinkDataForKey(linkKey);
      
      if (!existingLink) {
        const linkData = {
          key: linkKey,
          from: parentdata.key,
          to: globalChildKey,
          category: 'dependency'
        };
        
        model.addLinkData(linkData);
      }
    });
    
    if (childCount > 0) {
      currentDiagram.rebuildParts();
      currentDiagram.layoutDiagram(true);
    }
    
    return dependencies.length;
  };

  const collapseNode = (nodeKey: string, currentDiagram: go.Diagram) => {
    const model = currentDiagram.model as go.GraphLinksModel;
    const linksToRemove: string[] = [];
    const nodesToCheck: string[] = [];
    
    model.linkDataArray.forEach((link: any) => {
      if (link.from === nodeKey) {
        linksToRemove.push(link.key);
        nodesToCheck.push(link.to);
      }
    });
    
    linksToRemove.forEach(linkKey => {
      const linkData = model.linkDataArray.find((l: any) => l.key === linkKey);
      if (linkData) {
        model.removeLinkData(linkData);
      }
    });
    
    nodesToCheck.forEach(childKey => {
      const childNode = model.findNodeDataForKey(childKey);
      if (!childNode) return;
      
      const hasOtherParents = model.linkDataArray.some((link: any) => 
        link.to === childKey && link.from !== nodeKey
      );
      
      if (!hasOtherParents) {
        collapseNode(childKey, currentDiagram);
        model.removeNodeData(childNode);
      } else {
        if (childNode.parentNodes && Array.isArray(childNode.parentNodes)) {
          const updatedParents = childNode.parentNodes.filter((pk: string) => pk !== nodeKey);
          model.setDataProperty(childNode, 'parentNodes', updatedParents);
        }
      }
    });
  };

  const expandNode = (node: go.Node) => {
    try {
      const currentDiagram = node.diagram || diagram;
      if (!currentDiagram) return;
      
      currentDiagram.startTransaction('ExpandNode');
      const data = node.data;
      
      if (!data.everExpanded) {
        currentDiagram.model.setDataProperty(data, 'everExpanded', true);
        const numchildren = createSubTree(data, currentDiagram);
        
        if (numchildren === 0) {
          const button = node.findObject('TREEBUTTON');
          if (button) button.visible = false;
          currentDiagram.commitTransaction('ExpandNode');
          return;
        }
        
        currentDiagram.model.setDataProperty(data, 'isExpanded', true);
      } else {
        if (data.isExpanded) {
          collapseNode(data.key, currentDiagram);
          currentDiagram.model.setDataProperty(data, 'isExpanded', false);
          currentDiagram.model.setDataProperty(data, 'everExpanded', false);
        } else {
          const numchildren = createSubTree(data, currentDiagram);
          if (numchildren > 0) {
            currentDiagram.model.setDataProperty(data, 'isExpanded', true);
          }
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
          
          const parentShape = node.findObject('SHAPE') as go.Shape;
          if (parentShape) {
            if (data.isExpanded) {
              parentShape.fill = '#4CAF50';
            } else {
              parentShape.fill = data.isParentNode ? '#1565C0' : '#99183fff';
            }
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

  // ===========================
  // DIAGRAM INITIALIZATION
  // ===========================
  const initializeDiagram = () => {
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
      
      // Create main diagram
      const myDiagram = new go.Diagram(diagramRef.current, {
        layout: new go.ForceDirectedLayout(),
        'undoManager.isEnabled': true
      });

      // Selection event handler
      myDiagram.addDiagramListener('ChangedSelection', (e: go.DiagramEvent) => {
        // Reset all nodes to default color
        e.diagram.nodes.each((node: go.Node) => {
          const shape = node.findObject('SHAPE') as go.Shape;
          if (shape) {
            shape.fill = '#99183fff';
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
          setSelectedNodeData(selection.data);
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
          setSelectedNodeData(null);
        }
      });

      // Node template
      myDiagram.nodeTemplate = new go.Node('Spot', {
        selectionObjectName: 'PANEL',
        selectionAdornmentTemplate: new go.Adornment()
      })
        .add(
          new go.Panel('Auto', { name: 'PANEL' })
            .add(
              new go.Shape('Circle', { 
                name: 'SHAPE',
                stroke: '#ddd',
                strokeWidth: 2,
                width: 160,
                height: 160
              })
              .bind('fill', 'isParentNode', (isParent: boolean) => isParent ? '#1565C0' : '#99183fff'),
              new go.TextBlock({ 
                font: 'bold 10pt sans-serif', 
                margin: 8,
                stroke: 'white',
                maxSize: new go.Size(140, 140),
                wrap: go.Wrap.DesiredSize,
                textAlign: 'center',
                overflow: go.TextOverflow.Ellipsis,
                verticalAlignment: go.Spot.Center
              }).bind('text', 'text', (text: string) => splitCamelCase(text))
            ),
          new go.Panel('Auto', {
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
          })
            .add(
              new go.Shape('Circle', {
                name: 'BUTTONSHAPE',
                fill: '#333',
                stroke: '#666',
                strokeWidth: 2,
                width: 24,
                height: 24
              }),
              new go.TextBlock({
                font: 'bold 14pt sans-serif',
                stroke: '#fff',
                textAlign: 'center',
                margin: 0,
                name: 'BUTTONTEXT',
                text: '+'
              }).bind('visible', '', (data: any) => {
                return data.hasChildren || data.isParentNode || data.isExpanded;
              })
            )
        );

      // Link template
      myDiagram.linkTemplate = 
        new go.Link()
          .add(
            new go.Shape({ 
              name: 'LINKSHAPE',
              stroke: '#888', 
              strokeWidth: 2 
            }),
            new go.Shape({ 
              toArrow: 'Standard', 
              fill: '#888', 
              stroke: null,
              name: 'ARROWHEAD'
            })
          );

      // Set model
      const { nodeDataArray, linkDataArray } = createTreeData();
      const model = new go.GraphLinksModel();
      model.nodeDataArray = nodeDataArray;
      model.linkDataArray = linkDataArray;
      model.nodeKeyProperty = 'key';
      model.linkKeyProperty = 'key';
      myDiagram.model = model;

      // Create Overview
      const myOverview = new go.Overview(overviewRef.current, {
        observed: myDiagram,
        contentAlignment: go.Spot.Center,
        'box.resizable': true,
        resizingTool: new OverviewResizingTool()
      });

      setDiagram(myDiagram);
      setOverview(myOverview);
      setDiagramError(null);
      
    } catch (error: any) {
      console.error('Error initializing GoJS overview resizing:', error);
      setDiagramError(`Failed to initialize overview resizing: ${error.message}`);
    }
  };

  // ===========================
  // UTILITY FUNCTIONS
  // ===========================
  const zoomToFit = () => {
    if (diagram) {
      diagram.zoomToFit();
    }
  };

  const resetDiagram = () => {
    if (diagram) {
      const { nodeDataArray, linkDataArray } = createTreeData();
      const model = new go.GraphLinksModel();
      model.nodeDataArray = nodeDataArray;
      model.linkDataArray = linkDataArray;
      model.nodeKeyProperty = 'key';
      model.linkKeyProperty = 'key';
      diagram.model = model;
      diagram.zoomToFit();
    }
  };

  // ===========================
  // EFFECTS
  // ===========================
  useEffect(() => {
    initializeDiagram();
    
    return () => {
      initializationRef.current = false;
      if (diagram) {
        diagram.div = null;
      }
      if (overview) {
        overview.div = null;
      }
    };
  }, []);

  // ===========================
  // ERROR HANDLING
  // ===========================
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
            initializeDiagram();
          }}
        >
          Retry
        </Button>
      </Box>
    );
  }

  // ===========================
  // RENDER
  // ===========================
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
          Overview Resizing Visualization
        </Typography>
        
        <Typography variant="body2" sx={{ mb: 1, color: '#b0b0b0' }}>
          Project: {projectName} | User: {username}
        </Typography>

        {/* Control Buttons */}
        <Stack direction="row" spacing={2}>
          <Button
            variant="contained"
            startIcon={<ZoomToFitIcon />}
            onClick={zoomToFit}
            size="small"
          >
            Zoom to Fit
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={resetDiagram}
            size="small"
          >
            Reset
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
        {/* Main Diagram */}
        <Box sx={{ flex: '1 1 80%' }}>
          <Paper 
            elevation={0}
            sx={{ 
              height: '100%',
              position: 'relative',
              overflow: 'hidden',
              borderRadius: 0
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

        {/* Side Panel */}
        <Box sx={{ flex: '1 1 20%', minWidth: '250px' }}>
          <Stack spacing={1} sx={{ height: '100%' }}>
            {/* Overview */}
            <Card elevation={2} sx={{ flex: '0 0 auto', backgroundColor: '#2a2a2a', color: '#fff' }}>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>
                  Overview
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
                  {selectedNodeData ? 'Node Details' : 'Select a Node'}
                </Typography>
                {selectedNodeData ? (
                  <Box>
                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold', color: '#fff' }}>
                      {selectedNodeData.text}
                    </Typography>
                    
                    <Typography variant="body2" sx={{ mb: 0.5, color: '#b0b0b0' }}>
                      <strong>Key:</strong> {selectedNodeData.key}
                    </Typography>
                    
                    <Typography variant="body2" sx={{ mb: 0.5, color: '#b0b0b0' }}>
                      <strong>Group:</strong> {selectedNodeData.group || 'N/A'}
                    </Typography>
                    
                    <Typography variant="body2" sx={{ mb: 0.5, color: '#b0b0b0' }}>
                      <strong>Complexity:</strong> {selectedNodeData.complexity || 1}
                    </Typography>
                    
                    <Typography variant="body2" sx={{ mb: 0.5, color: '#b0b0b0' }}>
                      <strong>Ever Expanded:</strong> {selectedNodeData.everExpanded ? 'Yes' : 'No'}
                    </Typography>
                    
                    <Typography variant="body2" sx={{ mb: 0.5, color: '#b0b0b0' }}>
                      <strong>Available Connections:</strong> {selectedNodeData.availableConnections?.length || 0}
                    </Typography>
                    
                    {selectedNodeData.originalId && (
                      <Typography variant="body2" sx={{ mb: 0.5, wordBreak: 'break-all', color: '#b0b0b0' }}>
                        <strong>Original ID:</strong> {selectedNodeData.originalId}
                      </Typography>
                    )}
                    
                    {/* Diagram button for parent nodes */}
                    {selectedNodeData.isParentNode && (
                      <Box sx={{ mt: 2, mb: 1 }}>
                        <Button
                          variant="contained"
                          color="primary"
                          size="small"
                          startIcon={<DiagramIcon />}
                          onClick={() => {
                            // Collect node data including children
                            const nodeDataToSend = {
                              ...selectedNodeData,
                              // Get child dependencies
                              children: selectedNodeData.availableConnections ? 
                                graphData.nodes.filter((node: any) => 
                                  selectedNodeData.availableConnections.includes(node.id)
                                ).map((node: any) => ({
                                  id: node.id,
                                  name: node.name,
                                  filePath: node.filePath,
                                  group: node.group,
                                  complexity: node.complexity,
                                  language: node.language
                                })) : []
                            };
                            
                            navigate('/dynamic-workflow', { 
                              state: { nodeData: nodeDataToSend } 
                            });
                          }}
                          sx={{
                            backgroundColor: '#1976d2',
                            '&:hover': {
                              backgroundColor: '#1565c0',
                            },
                            textTransform: 'none',
                            fontWeight: 'bold'
                          }}
                        >
                          View Workflow Diagram
                        </Button>
                        <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: '#888' }}>
                          See how this function connects to your codebase
                        </Typography>
                      </Box>
                    )}
                    
                    <Typography variant="caption" sx={{ mt: 1, display: 'block', color: '#888' }}>
                      Click the + button to expand nodes and explore dependencies
                    </Typography>
                  </Box>
                ) : (
                  <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
                    Click on any node to see its details here. The nodes (160px) display function names split by camelCase for better readability.
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Stack>
        </Box>
      </Box>
    </Box>
  );
};

export default OverviewResizing;