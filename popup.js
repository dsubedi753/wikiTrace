class WikiGraphVisualizer {
    constructor(svgElement) {
        this.svg = d3.select(svgElement);
        this.width = svgElement.clientWidth;
        this.height = svgElement.clientHeight;
        
        this.treeLayout = d3.tree()
            .size([this.height - 100, this.width - 200]);
            
        this.container = this.svg.append('g')
            .attr('transform', 'translate(100,50)');
            
        this.setupZoom();
    }

    setupZoom() {
        const zoom = d3.zoom()
            .scaleExtent([0.1, 3])
            .on('zoom', (event) => {
                this.container.attr('transform', event.transform);
            });

        this.svg.call(zoom);
    }

    processData(wikiTree) {
        if (!wikiTree || Object.keys(wikiTree).length === 0) return null;

        // Find root (node with no parents)
        const childTitles = new Set();
        Object.values(wikiTree).forEach(node => {
            node.children.forEach(child => childTitles.add(child));
        });
        
        const rootTitle = Object.keys(wikiTree).find(title => !childTitles.has(title));
        if (!rootTitle) return null;
        
        function buildHierarchy(title) {
            const node = wikiTree[title];
            if (!node) return null;
            
            return {
                name: title,
                children: node.children
                    .map(buildHierarchy)
                    .filter(child => child !== null)
            };
        }

        return buildHierarchy(rootTitle);
    }

    render(wikiTree) {
        console.log('Rendering tree:', wikiTree);
        this.container.selectAll('*').remove();

        const hierarchyData = this.processData(wikiTree);
        if (!hierarchyData) {
            this.showEmptyMessage();
            return;
        }

        const root = d3.hierarchy(hierarchyData);
        this.treeLayout(root);

        // Draw links
        this.container.append('g')
            .attr('class', 'links')
            .selectAll('path')
            .data(root.links())
            .join('path')
            .attr('class', 'link')
            .attr('d', d3.linkHorizontal()
                .x(d => d.y)
                .y(d => d.x));

        // Draw nodes
        const nodes = this.container.append('g')
            .attr('class', 'nodes')
            .selectAll('g')
            .data(root.descendants())
            .join('g')
            .attr('transform', d => `translate(${d.y},${d.x})`);

        nodes.append('rect')
            .attr('class', 'node-box')
            .attr('x', -75)
            .attr('y', -20)
            .attr('width', 150)
            .attr('height', 40)
            .attr('rx', 5);

        nodes.append('text')
            .attr('class', 'node-label')
            .attr('dy', '0.32em')
            .attr('text-anchor', 'middle')
            .text(d => d.data.name.length > 20 ? 
                d.data.name.substring(0, 20) + '...' : 
                d.data.name);
    }

    showEmptyMessage() {
        this.container.append('text')
            .attr('x', this.width / 2)
            .attr('y', this.height / 2)
            .attr('text-anchor', 'middle')
            .attr('fill', 'white')
            .text('No navigation history yet. Start browsing Wikipedia!');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('Popup opened');
    const svg = document.querySelector('#graph svg');
    const visualizer = new WikiGraphVisualizer(svg);
    
    function updateGraph() {
        chrome.storage.local.get(['wikiTree'], function(result) {
            console.log('Retrieved tree data:', result.wikiTree);
            visualizer.render(result.wikiTree || {});
        });
    }
    
    document.getElementById('refreshGraph').addEventListener('click', updateGraph);
    
    document.getElementById('clearHistory').addEventListener('click', function() {
        chrome.storage.local.set({ wikiTree: {} }, function() {
            console.log('History cleared');
            updateGraph();
        });
    });
    
    updateGraph();
});