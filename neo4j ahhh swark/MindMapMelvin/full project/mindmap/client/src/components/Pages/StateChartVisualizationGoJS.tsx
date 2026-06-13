import React, { useRef, useEffect, useState } from 'react';
import * as go from 'gojs';
import { 
  Box, 
  Paper, 
  Typography, 
  Button, 
  Alert,
  Stack,
  Chip,
  TextareaAutosize
} from '@mui/material';
import {
  Save as SaveIcon,
  FolderOpen as LoadIcon,
  PlayArrow as PlayIcon
} from '@mui/icons-material';
import { graphData } from '../../data/graphData';

interface StateChartVisualizationProps {
  projectName?: string;
  username?: string;
}

const StateChartVisualizationGoJS: React.FC<StateChartVisualizationProps> = ({
  projectName = 'phonex',
  username = 'saahithi-ncompass'
}) => {
  const diagramRef = useRef<HTMLDivElement>(null);
  const [diagram, setDiagram] = useState<go.Diagram | null>(null);
  const [diagramError, setDiagramError] = useState<string | null>(null);
  const [savedModel, setSavedModel] = useState<string>('');
  const initializationRef = useRef<boolean>(false);

  // Transform graphData to GoJS state chart format (like the reference)
  const createStateChartData = () => {
    console.log('Creating state chart data from graphData:', graphData.nodes.length, 'nodes');
    
    // Create nodes with proper state chart styling
    const nodeDataArray = graphData.nodes.slice(0, 20).map((node: any, index: number) => {
      let type = '';
      let text = node.name.length > 15 ? node.name.substring(0, 15) + '...' : node.name;
      
      // Set start and end nodes
      if (index === 0) {
        type = 'Start';
        text = 'Start';
      } else if (index === 19) {
        type = 'End'; 
        text = 'End';
      }
      
      return {
        id: index,
        loc: `${150 + (index % 5) * 200} ${50 + Math.floor(index / 5) * 150}`,
        type: type,
        text: text
      };
    });

    // Create links between nodes
    const linkDataArray = graphData.links.slice(0, 15).map((link: any, index: number) => {
      // Find source and target indices
      const sourceIndex = graphData.nodes.findIndex((n: any) => n.id === link.source);
      const targetIndex = graphData.nodes.findIndex((n: any) => n.id === link.target);
      
      if (sourceIndex >= 0 && targetIndex >= 0 && sourceIndex < 20 && targetIndex < 20) {
        return {
          from: sourceIndex,
          to: targetIndex,
          progress: Math.random() > 0.3, // Random true/false for demonstration
          text: `Action ${index + 1}`,
          curviness: (Math.random() - 0.5) * 100
        };
      }
      return null;
    }).filter(link => link !== null);

    return {
      class: "go.GraphLinksModel",
      nodeKeyProperty: "id",
      pointsDigits: 0,
      nodeDataArray,
      linkDataArray
    };
  };

  // Initialize GoJS Diagram (exact copy of reference implementation)
  const initializeDiagram = () => {
    if (!diagramRef.current || initializationRef.current) return;

    try {
      initializationRef.current = true;
      
      // Check if there's already a diagram associated with this div
      const existingDiagram = go.Diagram.fromDiv(diagramRef.current);
      if (existingDiagram) {
        existingDiagram.div = null;
      }
      
      // Dispose of existing diagram in state
      if (diagram) {
        diagram.div = null;
        setDiagram(null);
      }
      
      // Clear the div completely
      diagramRef.current.innerHTML = '';
      
      // Remove any existing id to ensure clean slate
      diagramRef.current.removeAttribute('id');
      
      const myDiagram = new go.Diagram(diagramRef.current, {
        'animationManager.initialAnimationStyle': go.AnimationManager.None,
        'InitialAnimationStarting': (e: any) => {
          var animation = e.subject.defaultAnimation;
          animation.easing = go.Animation.EaseOutExpo;
          animation.duration = 800;
          animation.add(e.diagram, 'scale', 0.3, 1);
          animation.add(e.diagram, 'opacity', 0, 1);
        },
        // have mouse wheel events zoom in and out instead of scroll up and down
        'toolManager.mouseWheelBehavior': go.ToolManager.WheelZoom,
        // support double-click in background creating a new node
        'clickCreatingTool.archetypeNodeData': { text: 'new node' },
        // enable undo & redo
        'undoManager.isEnabled': true
      });

      // Colors from reference
      const colors = {
        pink: '#facbcb',
        blue: '#b7d8f7', 
        green: '#b9e1c8',
        yellow: '#faeb98',
        background: '#e8e8e8'
      };

      // Set background color
      myDiagram.div!.style.backgroundColor = colors.background;

      // Node template (exact copy from reference)
      myDiagram.nodeTemplate = new go.Node('Auto', {
        isShadowed: true,
        shadowBlur: 0,
        shadowOffset: new go.Point(5, 5),
        shadowColor: 'black'
      })
        .bindTwoWay('location', 'loc', go.Point.parse, go.Point.stringify)
        .add(
          new go.Shape('RoundedRectangle', {
            strokeWidth: 1.5,  
            fill: colors.blue,
            portId: '',
            fromLinkable: true, 
            fromLinkableSelfNode: false, 
            fromLinkableDuplicates: true,
            toLinkable: true, 
            toLinkableSelfNode: false, 
            toLinkableDuplicates: true,
            cursor: 'pointer'
          })
            .bind('fill', 'type', (type: string) => {
              if (type === 'Start') return colors.green;
              if (type === 'End') return colors.pink;
              return colors.blue;
            })
            .bind('figure', 'type', (type: string) => {
              if (type === 'Start' || type === 'End') return 'Circle';
              return 'RoundedRectangle';
            }),
          new go.TextBlock({
            font: 'bold small-caps 11pt helvetica, bold arial, sans-serif',
            shadowVisible: false,
            margin: 8,
            stroke: '#333',
            editable: true
          }).bindTwoWay('text')
        );

      // Add selection adornment with button (from reference)
      myDiagram.nodeTemplate.selectionAdornmentTemplate = new go.Adornment('Spot')
        .add(
          new go.Panel('Auto')
            .add(
              new go.Shape('RoundedRectangle', { 
                fill: null, 
                stroke: colors.pink, 
                strokeWidth: 3 
              }),
              new go.Placeholder()
            ),
          // Button to create new node
          (go.GraphObject as any).build('Button', {
            alignment: go.Spot.TopRight,
            click: (e: any, obj: any) => addNodeAndLink(e, obj, myDiagram)
          })
            .add(
              new go.Shape('PlusLine', { width: 6, height: 6 })
            )
        );

      // Link template (exact copy from reference)
      myDiagram.linkTemplate = new go.Link({
        isShadowed: true,
        shadowBlur: 0,
        shadowColor: 'black',
        shadowOffset: new go.Point(2.5, 2.5),
        curve: go.Link.Bezier,
        curviness: 40,
        adjusting: go.Link.Stretch,
        reshapable: true,
        relinkableFrom: true,
        relinkableTo: true,
        fromShortLength: 8,
        toShortLength: 10
      })
        .bindTwoWay('points')
        .bind('curviness')
        .add(
          // Main shape geometry
          new go.Shape({ 
            strokeWidth: 2, 
            shadowVisible: false, 
            stroke: 'black' 
          })
            .bind('strokeDashArray', 'progress', (progress: boolean) => (progress ? [] : [5, 6]))
            .bind('opacity', 'progress', (progress: boolean) => (progress ? 1 : 0.5)),
          // Arrowheads
          new go.Shape({ 
            fromArrow: 'circle', 
            strokeWidth: 1.5, 
            fill: 'white' 
          }).bind('opacity', 'progress', (progress: boolean) => (progress ? 1 : 0.5)),
          new go.Shape({ 
            toArrow: 'standard', 
            stroke: null, 
            scale: 1.5, 
            fill: 'black' 
          }).bind('opacity', 'progress', (progress: boolean) => (progress ? 1 : 0.5)),
          // Link label
          new go.Panel('Auto')
            .add(
              new go.Shape('RoundedRectangle', {
                shadowVisible: true,
                fill: colors.yellow,
                strokeWidth: 0.5
              }),
              new go.TextBlock({
                font: '9pt helvetica, arial, sans-serif',
                margin: 1,
                editable: true,
                text: 'Action'
              }).bind('text')
            )
        );

      // Load the transformed data
      const stateChartData = createStateChartData();
      myDiagram.model = go.Model.fromJson(JSON.stringify(stateChartData));
      
      // Save initial model
      setSavedModel(myDiagram.model.toJson());
      
      setDiagram(myDiagram);
      setDiagramError(null);
      
      console.log('GoJS State Chart initialized successfully');
      
    } catch (error: any) {
      console.error('Error initializing GoJS state chart:', error);
      setDiagramError(`Failed to initialize state chart: ${error.message}`);
    }
  };

  // Add node and link function (from reference)
  const addNodeAndLink = (_e: any, obj: any, diagram: go.Diagram) => {
    var adornment = obj.part;
    diagram.startTransaction('Add State');

    // get the node data for which the user clicked the button
    var fromNode = adornment.adornedPart;
    var fromData = fromNode.data;
    // create a new "State" data object, positioned off to the right of the adorned Node
    var toData: any = { text: 'new' };
    var p = fromNode.location.copy();
    p.x += 200;
    toData.loc = go.Point.stringify(p);
    // add the new node data to the model
    var model = diagram.model as go.GraphLinksModel;
    model.addNodeData(toData);

    // create a link data from the old node data to the new node data
    var linkdata = {
      from: model.getKeyForNodeData(fromData),
      to: model.getKeyForNodeData(toData),
      text: 'transition'
    };
    // and add the link data to the model
    model.addLinkData(linkdata);

    // select the new Node
    var newnode = diagram.findNodeForData(toData);
    if (newnode) {
      diagram.select(newnode);
      diagram.commitTransaction('Add State');
      // if the new node is off-screen, scroll the diagram to show the new node
      diagram.scrollToRect(newnode.actualBounds);
    }
  };

  // Save and Load functions
  const save = () => {
    if (diagram) {
      setSavedModel(diagram.model.toJson());
      (diagram as any).isModified = false;
    }
  };

  const load = () => {
    if (diagram && savedModel) {
      diagram.model = go.Model.fromJson(savedModel);
    }
  };

  useEffect(() => {
    initializeDiagram();
    
    return () => {
      initializationRef.current = false;
      if (diagram) {
        diagram.div = null;
      }
    };
  }, []);

  if (diagramError) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert 
          severity="error" 
          action={
            <Button color="inherit" size="small" onClick={initializeDiagram}>
              Retry
            </Button>
          }
        >
          {diagramError}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#f5f5f5' }}>
      {/* Header */}
      <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2D3748' }}>
            State Chart Visualization (GoJS)
          </Typography>
          <Stack direction="row" spacing={1}>
            <Chip 
              label={`Project: ${projectName}`} 
              variant="outlined" 
              sx={{ bgcolor: '#E2E8F0' }} 
            />
            <Chip 
              label={`User: ${username}`} 
              variant="outlined" 
              sx={{ bgcolor: '#E2E8F0' }} 
            />
          </Stack>
        </Box>
        
        {/* Controls */}
        <Stack direction="row" spacing={2} alignItems="center">
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={save}
            sx={{ 
              bgcolor: '#4299E1', 
              '&:hover': { bgcolor: '#3182CE' },
              textTransform: 'none'
            }}
          >
            Save
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<LoadIcon />}
            onClick={load}
            sx={{ 
              borderColor: '#4A5568', 
              color: '#4A5568',
              textTransform: 'none'
            }}
          >
            Load
          </Button>

          <Typography variant="body2" color="text.secondary">
            Double-click to create node • Drag from node edge to create link • Links and text are editable
          </Typography>
        </Stack>
      </Paper>

      {/* GoJS Diagram */}
      <Box sx={{ 
        flex: 1, 
        border: '2px solid #E2E8F0', 
        borderRadius: 2, 
        overflow: 'hidden',
        position: 'relative'
      }}>
        <div 
          ref={diagramRef} 
          style={{ 
            width: '100%', 
            height: '100%',
            backgroundColor: '#e8e8e8'
          }} 
        />
      </Box>

      {/* Model JSON Display */}
      <Paper sx={{ p: 2, mt: 2, maxHeight: '200px', overflow: 'auto' }}>
        <Typography variant="h6" gutterBottom>
          Diagram Model (JSON Format)
        </Typography>
        <TextareaAutosize
          value={savedModel}
          onChange={(e) => setSavedModel(e.target.value)}
          style={{
            width: '100%',
            minHeight: '100px',
            fontFamily: 'monospace',
            fontSize: '12px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            padding: '8px'
          }}
          placeholder="Diagram model will appear here..."
        />
      </Paper>
    </Box>
  );
};

export default StateChartVisualizationGoJS;