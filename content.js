class WikiNode {
    constructor(title) {
        this.title = title;
        this.children = new Set();  // Using Set to avoid duplicate children
        this.timestamp = new Date().toISOString();
    }

    addChild(childNode) {
        this.children.add(childNode);
    }

    toJSON() {
        return {
            title: this.title,
            children: Array.from(this.children).map(child => child.title),
            timestamp: this.timestamp
        };
    }
}

class WikiTree {
    constructor() {
        this.nodes = new Map();  // title -> WikiNode
    }

    getOrCreateNode(title) {
        if (!this.nodes.has(title)) {
            this.nodes.set(title, new WikiNode(title));
        }
        return this.nodes.get(title);
    }

    addConnection(fromTitle, toTitle) {
        const parentNode = this.getOrCreateNode(fromTitle);
        const childNode = this.getOrCreateNode(toTitle);
        parentNode.addChild(childNode);
        
        console.log('Added connection:', fromTitle, '->', toTitle);
        this.saveToStorage();
    }

    toJSON() {
        const nodes = {};
        this.nodes.forEach((node, title) => {
            nodes[title] = node.toJSON();
        });
        return nodes;
    }

    saveToStorage() {
        const data = this.toJSON();
        console.log('Saving tree:', data);
        chrome.storage.local.set({ wikiTree: data });
    }

    static async fromStorage() {
        return new Promise((resolve) => {
            chrome.storage.local.get(['wikiTree'], (result) => {
                const tree = new WikiTree();
                if (result.wikiTree) {
                    Object.entries(result.wikiTree).forEach(([title, data]) => {
                        const node = tree.getOrCreateNode(title);
                        data.children.forEach(childTitle => {
                            const childNode = tree.getOrCreateNode(childTitle);
                            node.addChild(childNode);
                        });
                    });
                }
                resolve(tree);
            });
        });
    }
}

// Global tree instance
let wikiTree;

// Initialize tree from storage
WikiTree.fromStorage().then(tree => {
    wikiTree = tree;
    console.log('Wiki tree initialized:', tree);
});

// Track current page
let currentTitle = null;

function getWikipediaTitle() {
    const titleElement = document.getElementById('firstHeading');
    return titleElement ? titleElement.textContent.trim() : null;
}

// Track clicks on Wikipedia links
document.addEventListener('click', function(e) {
    const link = e.target.closest('a[href*="/wiki/"]');
    if (!link) return;

    const fromTitle = getWikipediaTitle();
    if (fromTitle) {
        console.log('Storing source page:', fromTitle);
        chrome.storage.local.set({ lastSourcePage: fromTitle });
    }
});

// When page loads, check if we came from another Wikipedia page
window.addEventListener('load', function() {
    currentTitle = getWikipediaTitle();
    if (!currentTitle) return;

    console.log('Page loaded:', currentTitle);
    chrome.storage.local.get(['lastSourcePage'], function(result) {
        if (result.lastSourcePage) {
            console.log('Found source page:', result.lastSourcePage);
            wikiTree.addConnection(result.lastSourcePage, currentTitle);
            chrome.storage.local.remove('lastSourcePage');
        }
    });
});