class GraphVisualizer {
  constructor(svgElement) {
    console.log('Initializing GraphVisualizer');
    this.svg = svgElement;
    this.scale = 1;
    this.translateX = 0;
    this.translateY = 0;
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

  updateTransform() {
    const container = this.svg.querySelector('g');
    if (container) {
      container.setAttribute('transform', 
        `translate(${this.translateX},${this.translateY}) scale(${this.scale})`);
    }
  }

  render(history) {
    console.log('Rendering graph with history:', history);
    
    // Clear the SVG
    this.svg.innerHTML = '';
    
    if (!history || history.length === 0) {
      console.log('No history to render');
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
    
    // Create nodes and links from history
    const nodes = new Map();
    const links = [];
    
    history.forEach(entry => {
      console.log('Processing entry:', entry);
      
      if (!nodes.has(entry.from)) {
        nodes.set(entry.from, {
          id: entry.from,
          x: Math.random() * 600 + 100,
          y: Math.random() * 400 + 100
        });
      }
      if (!nodes.has(entry.to)) {
        nodes.set(entry.to, {
          id: entry.to,
          x: Math.random() * 600 + 100,
          y: Math.random() * 400 + 100
        });
      }
      
      links.push({
        source: nodes.get(entry.from),
        target: nodes.get(entry.to)
      });
    });

    console.log('Created nodes:', nodes);
    console.log('Created links:', links);

    // Draw links
    links.forEach(link => {
      const linkElement = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      linkElement.setAttribute('x1', link.source.x);
      linkElement.setAttribute('y1', link.source.y);
      linkElement.setAttribute('x2', link.target.x);
      linkElement.setAttribute('y2', link.target.y);
      linkElement.setAttribute('class', 'link');
      container.appendChild(linkElement);
    });

    // Draw nodes
    nodes.forEach(node => {
      const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', node.x - 80);
      rect.setAttribute('y', node.y - 20);
      rect.setAttribute('width', 160);
      rect.setAttribute('height', 40);
      rect.setAttribute('rx', 5);
      rect.setAttribute('class', 'node-box');
      group.appendChild(rect);
      
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', node.x);
      text.setAttribute('y', node.y);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('dominant-baseline', 'middle');
      text.setAttribute('class', 'node-label');
      
      const title = node.id.length > 20 ? node.id.substring(0, 20) + '...' : node.id;
      text.textContent = title;
      
      group.appendChild(text);
      container.appendChild(group);
    });

    this.svg.appendChild(container);
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