
console.log('Popup script starting...');

// Test storage access
chrome.storage.local.get(['navigationHistory'], function(result) {
    console.log('Current storage:', result);
});


document.addEventListener('DOMContentLoaded', function() {
  console.log('Popup opened');
  
  const svg = document.querySelector('#graph svg');
  console.log('SVG element:', svg);
  
  const visualizer = new GraphVisualizer(svg);
  
  function updateGraph() {
    console.log('Fetching navigation history...');
    chrome.storage.local.get(['navigationHistory'], function(result) {
      console.log('Retrieved history:', result);
      const history = result.navigationHistory || [];
      if (history.length === 0) {
        console.log('No navigation history found');
      } else {
        console.log('Found history with', history.length, 'entries');
      }
      visualizer.render(history);
    });
  }
  
  document.getElementById('clearHistory').addEventListener('click', function() {
    console.log('Clearing history');
    chrome.storage.local.set({ navigationHistory: [] }, updateGraph);
  });
  
  document.getElementById('zoomIn').addEventListener('click', function() {
    visualizer.zoomIn();
  });
  
  document.getElementById('zoomOut').addEventListener('click', function() {
    visualizer.zoomOut();
  });
  
  document.getElementById('resetView').addEventListener('click', function() {
    visualizer.resetView();
  });
  
  updateGraph();
});

class GraphVisualizer {
  constructor(svgElement) {
    this.svg = svgElement;
    this.scale = 1;
    this.translateX = 0;
    this.translateY = 0;
    this.width = this.svg.clientWidth || 800;
    this.height = this.svg.clientHeight || 500;
    this.setupZoom();
  }

  setupZoom() {
    let isDragging = false;
    let startX, startY;

    this.svg.addEventListener('mousedown', function(e) {
      isDragging = true;
      startX = e.clientX - this.translateX;
      startY = e.clientY - this.translateY;
    }.bind(this));

    this.svg.addEventListener('mousemove', function(e) {
      if (isDragging) {
        this.translateX = e.clientX - startX;
        this.translateY = e.clientY - startY;
        this.updateTransform();
      }
    }.bind(this));

    this.svg.addEventListener('mouseup', function() {
      isDragging = false;
    });

    this.svg.addEventListener('mouseleave', function() {
      isDragging = false;
    });
  }

  updateTransform() {
    const container = this.svg.querySelector('g');
    if (container) {
      container.setAttribute('transform', 
        `translate(${this.translateX},${this.translateY}) scale(${this.scale})`);
    }
  }

  zoomIn() {
    this.scale *= 1.2;
    this.updateTransform();
  }

  zoomOut() {
    this.scale *= 0.8;
    this.updateTransform();
  }

  resetView() {
    this.scale = 1;
    this.translateX = 0;
    this.translateY = 0;
    this.updateTransform();
  }

  layoutNodes(nodes) {
    const verticalPadding = 50;
    const horizontalCenter = this.width / 2;
    const availableHeight = this.height - (2 * verticalPadding);
    const verticalSpacing = availableHeight / (nodes.length + 1);

    nodes.forEach((node, index) => {
      node.x = horizontalCenter;
      node.y = verticalPadding + (index * verticalSpacing);
    });
  }

  render(history) {
    console.log('Rendering history:', history);
    this.svg.innerHTML = '';
    
    if (!history || history.length === 0) {
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', '50%');
      text.setAttribute('y', '50%');
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('fill', 'white');
      text.textContent = 'No navigation history yet. Start browsing Wikipedia!';
      this.svg.appendChild(text);
      return;
    }

    // Create container group
    const container = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.svg.appendChild(container);

    // Process nodes and links
    const nodesMap = new Map();
    const nodes = [];
    const links = [];

    // First, collect all unique nodes in order of appearance
    history.forEach(entry => {
      if (!nodesMap.has(entry.from)) {
        const node = { id: entry.from };
        nodesMap.set(entry.from, node);
        nodes.push(node);
      }
      if (!nodesMap.has(entry.to)) {
        const node = { id: entry.to };
        nodesMap.set(entry.to, node);
        nodes.push(node);
      }
    });

    // Layout nodes vertically
    this.layoutNodes(nodes);

    // Create links
    history.forEach(entry => {
      links.push({
        source: nodesMap.get(entry.from),
        target: nodesMap.get(entry.to)
      });
    });

    // Draw links
    links.forEach(link => {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('class', 'link');
      path.setAttribute('fill', 'none');

      // Calculate path
      const dx = link.target.x - link.source.x;
      const dy = link.target.y - link.source.y;
      if (Math.abs(dy) > 60) {
        // Use curved line for non-adjacent nodes
        const dr = Math.sqrt(dx * dx + dy * dy) * 1.5;
        path.setAttribute('d', `M${link.source.x},${link.source.y} A${dr},${dr} 0 0,1 ${link.target.x},${link.target.y}`);
      } else {
        // Use straight line for adjacent nodes
        path.setAttribute('d', `M${link.source.x},${link.source.y} L${link.target.x},${link.target.y}`);
      }

      container.appendChild(path);
    });

    // Draw nodes
    nodes.forEach(node => {
      const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      group.setAttribute('class', 'node-group');
      
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', node.x - 80);
      rect.setAttribute('y', node.y - 20);
      rect.setAttribute('width', 160);
      rect.setAttribute('height', 40);
      rect.setAttribute('rx', 5);
      rect.setAttribute('class', 'node-box');
      
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', node.x);
      text.setAttribute('y', node.y);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('dominant-baseline', 'middle');
      text.setAttribute('class', 'node-label');
      
      const title = node.id.length > 20 ? node.id.substring(0, 20) + '...' : node.id;
      text.textContent = title;
      
      group.appendChild(rect);
      group.appendChild(text);
      container.appendChild(group);
    });
  }
}

// Initialize visualization when the document is ready
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM Content Loaded');
  
  const svg = document.querySelector('#graph svg');
  console.log('Found SVG element:', svg);
  
  const visualizer = new GraphVisualizer(svg);
  
  function updateGraph() {
    console.log('Updating graph');
    chrome.storage.local.get(['navigationHistory'], function(result) {
      console.log('Retrieved from storage:', result);
      const history = result.navigationHistory || [];
      visualizer.render(history);
    });
  }
  
  // Set up button event listeners
  document.getElementById('clearHistory').addEventListener('click', function() {
    console.log('Clearing history');
    chrome.storage.local.set({ navigationHistory: [] }, updateGraph);
  });
  
  document.getElementById('zoomIn').addEventListener('click', function() {
    visualizer.zoomIn();
  });
  
  document.getElementById('zoomOut').addEventListener('click', function() {
    visualizer.zoomOut();
  });
  
  document.getElementById('resetView').addEventListener('click', function() {
    visualizer.resetView();
  });
  
  // Initial graph update
  updateGraph();
});