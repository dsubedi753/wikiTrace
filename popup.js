class WikiGraphVisualizer {
    constructor(container) {
        console.log('Initializing visualizer with container:', container);
        this.container = container;
        
        const rect = container.getBoundingClientRect();
        this.width = rect.width;
        this.height = rect.height;
        console.log('Container dimensions:', this.width, this.height);

        // Create SVG
        this.svg = d3.select(container).select('svg')
            .attr('width', this.width)
            .attr('height', this.height);

        // Create main group
        this.mainGroup = this.svg.append('g');

        // Initialize zoom
        this.zoom = d3.zoom()
            .scaleExtent([0.2, 2])
            .on('zoom', (event) => {
                this.mainGroup.attr('transform', event.transform);
            });

        this.svg.call(this.zoom);
        
        this.treeLayout = d3.tree()
            .nodeSize([80, 200]);
    }

    processData(wikiTree) {
        console.log('Processing tree data:', wikiTree);
        
        if (!wikiTree || Object.keys(wikiTree).length === 0) {
            console.log('Empty tree data');
            return null;
        }

        // Find root node
        const childTitles = new Set();
        Object.values(wikiTree).forEach(node => {
            console.log('Processing node:', node);
            node.children.forEach(child => childTitles.add(child));
        });

        console.log('Child titles:', childTitles);

        const rootTitle = Object.keys(wikiTree).find(title => !childTitles.has(title));
        console.log('Found root title:', rootTitle);

        if (!rootTitle) return null;

        // Build hierarchy
        const buildHierarchy = (title) => {
            console.log('Building hierarchy for:', title);
            const node = wikiTree[title];
            if (!node) {
                console.log('No node found for title:', title);
                return null;
            }

            const children = Array.from(node.children)
                .map(buildHierarchy)
                .filter(Boolean);
            
            console.log(`Node ${title} has ${children.length} children`);
            
            return {
                name: title,
                children: children
            };
        };

        const hierarchy = buildHierarchy(rootTitle);
        console.log('Final hierarchy:', hierarchy);
        return hierarchy;
    }

    render(wikiTree) {
        console.log('Starting render with tree:', wikiTree);
        
        // Clear previous content
        this.mainGroup.selectAll('*').remove();

        // Process data
        const hierarchicalData = this.processData(wikiTree);
        if (!hierarchicalData) {
            console.log('No hierarchical data to render');
            this.showEmptyMessage();
            return;
        }

        console.log('Creating D3 hierarchy from:', hierarchicalData);
        const root = d3.hierarchy(hierarchicalData);
        console.log('D3 hierarchy created:', root);

        // Apply tree layout
        this.treeLayout(root);
        console.log('Tree layout applied:', root);

        // Create links
        const links = this.mainGroup.append('g')
            .attr('class', 'links')
            .selectAll('path')
            .data(root.links())
            .enter()
            .append('path')
            .attr('class', 'link')
            .attr('d', d3.linkHorizontal()
                .x(d => d.y)
                .y(d => d.x));

        // Create nodes
        const nodes = this.mainGroup.append('g')
            .attr('class', 'nodes')
            .selectAll('g')
            .data(root.descendants())
            .enter()
            .append('g')
            .attr('class', 'node')
            .attr('transform', d => `translate(${d.y},${d.x})`);

        // Add rectangles
        nodes.append('rect')
            .attr('class', 'node-box')
            .attr('x', -75)
            .attr('y', -20)
            .attr('width', 150)
            .attr('height', 40)
            .attr('rx', 5);

        // Add labels
        nodes.append('text')
            .attr('class', 'node-label')
            .attr('dy', '0.32em')
            .attr('text-anchor', 'middle')
            .text(d => {
                const title = d.data.name;
                return title.length > 20 ? title.substring(0, 20) + '...' : title;
            });

        // Initial zoom
        this.zoomToFit();
    }

    zoomToFit() {
        const bounds = this.mainGroup.node().getBBox();
        console.log('Bounds for zoom:', bounds);
        
        const fullWidth = this.width;
        const fullHeight = this.height;
        const scale = 0.8 / Math.max(bounds.width / fullWidth, bounds.height / fullHeight);
        
        const translate = [
            fullWidth/2 - scale * (bounds.x + bounds.width/2),
            fullHeight/2 - scale * (bounds.y + bounds.height/2)
        ];
        
        console.log('Zoom parameters:', { scale, translate });

        this.svg.transition()
            .duration(750)
            .call(this.zoom.transform, 
                d3.zoomIdentity
                    .translate(translate[0], translate[1])
                    .scale(scale));
    }

    showEmptyMessage() {
        this.mainGroup.append('text')
            .attr('x', this.width / 2)
            .attr('y', this.height / 2)
            .attr('text-anchor', 'middle')
            .attr('class', 'empty-message')
            .text('No navigation history yet. Start browsing Wikipedia!');
    }
}

// Initialize when popup opens
document.addEventListener('DOMContentLoaded', function() {
    console.log('Popup opened');
    
    // First, check if we can get the container
    const graphContainer = document.getElementById('graph');
    console.log('Graph container:', graphContainer);
    
    if (!graphContainer) {
        console.error('Could not find graph container!');
        return;
    }
    
    const visualizer = new WikiGraphVisualizer(graphContainer);
    
    function updateGraph() {
        console.log('Updating graph...');
        chrome.storage.local.get(['wikiTree'], function(result) {
            console.log('Retrieved storage data:', result);
            visualizer.render(result.wikiTree || {});
        });
    }

    // Set up event listeners
    document.getElementById('refreshGraph').addEventListener('click', function() {
        console.log('Refresh clicked');
        updateGraph();
    });
    
    document.getElementById('clearHistory').addEventListener('click', function() {
        console.log('Clear clicked');
        chrome.storage.local.set({ wikiTree: {} }, function() {
            console.log('Storage cleared');
            updateGraph();
        });
    });

    // Initial render
    updateGraph();
});