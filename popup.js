class GraphVisualizer {
  constructor(svgElement) {
    this.svg = svgElement;
    this.scale = 1;
    this.translateX = 0;
    this.translateY = 0;
    this.setupZoom();
  }

  setupZoom() {
    let isDragging = false;
    let startX, startY;

    this.svg.addEventListener('mousedown', (e) => {
      isDragging = true;
      startX = e.clientX - this.translateX;
      startY = e.clientY - this.translateY;
    });

    this.svg.addEventListener('mousemove', (e) => {
      if (isDragging) {
        this.translateX = e.clientX - startX;
        this.translateY = e.clientY - startY;
        this.updateTransform();
      }
    });

    this.svg.addEventListener('mouseup', () => isDragging = false);
    this.svg.addEventListener('mouseleave', () => isDragging = false);
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
        `translate(${this.translateX},${this.translateY}) scale(${this.scale})`
      );
    }
  }

  render(history) {
    this.svg.innerHTML = '';
    
    // Create container group
    const container = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    
    // Create nodes and links from history
    const nodes = new Map();
    const links = [];
    
    history.forEach(entry => {
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
      
      // Create rectangle
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', node.x - 80);
      rect.setAttribute('y', node.y - 20);
      rect.setAttribute('width', 160);
      rect.setAttribute('height', 40);
      rect.setAttribute('rx', 5);
      rect.setAttribute('class', 'node-box');
      group.appendChild(rect);
      
      // Create text
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', node.x);
      text.setAttribute('y', node.y);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('dominant-baseline', 'middle');
      text.setAttribute('class', 'node-label');
      
      // Truncate text if needed
      const title = node.id.length > 20 ? node.id.substring(0, 20) + '...' : node.id;
      text.textContent = title;
      
      group.appendChild(text);
      container.appendChild(group);
    });

    this.svg.appendChild(container);
  }
}

// Initialize visualization
document.addEventListener('DOMContentLoaded', function() {
  const svg = document.querySelector('#graph svg');
  const visualizer = new GraphVisualizer(svg);
  
  function updateGraph() {
    chrome.storage.local.get(['navigationHistory'], function(result) {
      const history = result.navigationHistory || [];
      visualizer.render(history);
    });
  }
  
  document.getElementById('clearHistory').addEventListener('click', function() {
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