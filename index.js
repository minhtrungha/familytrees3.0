import express from 'express';
import axios from 'axios';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use(express.static(join(__dirname, 'public')));

let familyTreeData = {};

app.get('/Tree:treeNumber', (req, res) => {
    const treeID = req.params.treeNumber;
    res.sendFile(join(__dirname, 'public', `TreeDetails.html`));
});

app.post('/update-family-tree-data', (req, res) => {
    console.log('Manual update triggered');
    fetchAndUpdateFamilyTreeData()
        .then(() => res.status(200).send('Family tree data updated successfully'))
        .catch(error => res.status(500).send(`Error updating family tree data: ${error.message}`));
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


const port = process.env.PORT || 1542;
const server = app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
    checkJavaConnection();
});

function fetchAndUpdateFamilyTreeData() {
    const javaApiUrl = `https://familytreewebsite-411906.appspot.com/family-tree-data`;
    return axios.get(javaApiUrl, { responseType: 'text' })
        .then(response => {
            console.log('Received data from Java API:', response.data);
            familyTreeData = parseDigraphsToD3Trees(response.data);
        })
        .catch(error => {
            console.error('Error connecting to Java API:', error);
            throw error;
        });
}

function checkJavaConnection() {
    fetchAndUpdateFamilyTreeData()
        .catch(error => {
            if (error.response) {
                console.error('Error details:', error.response.status, error.response.data);
            }
        })
        .finally(() => {
            setTimeout(checkJavaConnection, 60000);
        });
}

function parseDigraphsToD3Trees(digraphString) {
    const trees = JSON.parse(digraphString);
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
export default app;