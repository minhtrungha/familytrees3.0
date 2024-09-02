import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use(express.static(__dirname));

// Read and parse the family tree data from a JSON file
const rawFamilyTreeData = fs.readFileSync(join(__dirname, 'familyTreeData.json'), 'utf8');
const familyTreeData = parseDigraphsToD3Trees(JSON.parse(rawFamilyTreeData));

// Root route to serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(join(__dirname, 'index.html'));
});

app.get('/Tree:treeNumber', (req, res) => {
    const treeID = req.params.treeNumber;
    res.sendFile(join(__dirname, 'TreeDetails.html'));
});

app.get('/family-tree-data', (req, res) => {
    res.json(familyTreeData);
});

app.get('/count', (req, res) => {
    const countNodes = (node) => {
        if (!node.children || node.children.length === 0) {
            return 1;
        }
        return 1 + node.children.reduce((sum, child) => sum + countNodes(child), 0);
    };

    let totalCount = 0;
    const treeCounts = familyTreeData.map((tree, index) => {
        const count = countNodes(tree);
        totalCount += count;
        return `Tree ${index}: ${count}\n`;
    });
    treeCounts.push(`Total: ${totalCount}`);
    res.type('text/plain');
    res.send(treeCounts.join('\n'));
});

const port = process.env.PORT || 4445;
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

// Function to parse the data into a D3-friendly format
function parseDigraphsToD3Trees(trees) {
    trees.forEach((tree, index) => {
        tree.id = `${index}`;
        const namesSet = new Set();
        const extractNames = (node) => {
            let fullName = node.name.split(',')[0].trim();
            namesSet.add(fullName);
            if (node.children) {
                node.children.forEach(child => extractNames(child));
            }
        };
        extractNames(tree);
        tree.uniqueNames = Array.from(namesSet);
    });
    return trees;
}
