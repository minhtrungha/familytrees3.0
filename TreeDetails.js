document.addEventListener('DOMContentLoaded', () => {
    const pathSegments = window.location.pathname.split('/');
    const treeNumberSegment = pathSegments.find(segment => segment.startsWith('Tree'));
    const treeNumber = treeNumberSegment ? parseInt(treeNumberSegment.replace('Tree', ''), 10) : null;

    if (treeNumber === null || isNaN(treeNumber)) { 
        displayError('No tree number found in URL');
        return;
    }

    fetchTreeData(treeNumber);
});

function adjustHeaderHeight() {
    var header = document.querySelector('header'); 
    var isMobile = window.innerWidth < 768;

    if (isMobile) {
        if (window.innerWidth > window.innerHeight) {
            header.style.height = '23vh'; 
        } else {
            header.style.height = '13vh'; 
        }
    }
}

adjustHeaderHeight();

window.addEventListener('resize', adjustHeaderHeight);

async function fetchTreeData(treeNumber) {
    try {
        const response = await fetch('/family-tree-data');
        if (!response.ok) throw new Error('Network response was not ok.');
        const trees = await response.json();
        const treeData = trees[treeNumber];

        if (treeData) {
            generateTree(treeData);
        } else {
            displayError(`Tree data not found for tree number: ${treeNumber}`);
        }
    } catch (error) {
        displayError(`Error fetching tree data: ${error.message}`);
    }
}

function displayError(message) {
    console.error(message);
    document.getElementById('treeContent').innerHTML = `<p class="error">${message}</p>`;
}

function generateTree(treeData) {
    const container = document.querySelector('.svgContainer');
    if (!container) {
        console.error('SVG container not found.');
        return;
    }

    const svg = d3.select(container).append('svg')
    .attr('width', '100%') 
    .attr('height', '90%');

    const root = d3.hierarchy(treeData);

    const max_depth = findMaxDepth(treeData);
    const nokids = countLeaves(treeData);
    let newW = (2 > max_depth) ? 1 : max_depth;
    const rootNameLength = root.data.name.length;

    const screenWidth = window.innerWidth;
    const isMobile = screenWidth < 768;
    const initialScale = isMobile ? 0.5 : 1;
    const additionalMargin = isMobile? Math.max(140, rootNameLength * 2):Math.max(140, rootNameLength * 7);
    const width = isMobile ? max_depth*100:max_depth*250;
    const height = isMobile ? nokids*50:nokids*80;
    const margin = { top: 30, right: 120, bottom: 30, left: additionalMargin };

    const treeLayout = d3.tree().size([height, width]);
    const treeRoot = treeLayout(root);

    const zoom = d3.zoom()
    .scaleExtent([0.1, 10])
    .on("zoom", (event) => {
        zoomG.attr("transform", event.transform);
    });

svg.call(zoom);

const zoomG = svg.append('g');

const g = zoomG.append('g')
    .attr('transform', `translate(${additionalMargin},${margin.top})`);

    g.selectAll('.link')
     .data(treeRoot.links())
     .enter().append('path')
       .attr('class', 'link')
       .attr('d', d3.linkHorizontal().x(d => d.y).y(d => d.x))
       .style('fill', 'none')
       .style('stroke', '#614829')
       .style('opacity','40%')
       .style('stroke-width', '3px');

    const node = g.selectAll('.node')
                  .data(treeRoot.descendants())
                  .enter().append('g')
                    .attr('class', d => `node${d.children ? ' node--internal' : ' node--leaf'}`)
                    .attr('transform', d => `translate(${d.y},${d.x})`);

    const newRadius= isMobile ? 3 : 4.5;
    node.append('circle')
        .attr('r', newRadius)
        .style('fill', '#7bc868')
        .style('stroke', '#276228')
        .style('stroke-width', '3px');
    node.each(function(d) {
        const nodeText = d3.select(this).append("text")
        .attr("dy", "-.25em")
        .attr("x", d => d.children ? -12 : 12)
        .style("text-anchor", d => d.children ? "end" : "start")
        .style("font-size", "12px");

        const nameDetails = d.data.name.split(', ');
        const fullName = nameDetails[0];
        const additionalInfo = nameDetails.slice(1).join(', ');
        const nameFontSize = isMobile ? "10px" : "20px";
        const additionalInfoFontSize = isMobile ? "6px" : "12px";
        const newY = isMobile ? "9": "18";

        nodeText.append("tspan")
            .style("font-size", nameFontSize)
            .text(fullName);

        if(additionalInfo) {
            nodeText.append("tspan")
                .attr("x", d => d.children ? -14 : 14)
                .attr("dy", newY)
                .style("font-size", additionalInfoFontSize)
                .text(additionalInfo);
        }
    });

    const fullscreenIcon = svg.append('g')
        .attr('transform', `translate(${svg}, ${0})`)
        .style('cursor', 'pointer')
        .on('click', () => {
            window.location.href = `/`;
        });


    positionFullscreenIcon(svg, fullscreenIcon);

window.addEventListener('resize', () => positionFullscreenIcon(svg, fullscreenIcon));

document.querySelector('header').addEventListener('click', () => {
    window.location.href = '/';
});

fullscreenIcon.append('circle')
    .attr('r', 20)
    .attr('fill', 'rgb(211,211,211)')
        .attr('id', 'fullscreenCircle')
        .attr('stroke-width', '1');

    fullscreenIcon.append('text')
    .attr('id', 'icon') 
    .attr('class', 'material-icons') 
    .attr('text-anchor', 'middle') 
    .attr('dominant-baseline', 'central')
    .attr('font-family', 'Material Icons')
    .attr('font-size', 40)
    .attr('x', 0)
    .attr('y', 0) 
    .attr('transform', 'translate(168, 0)')
    .attr('fill', '#717272') 
    .text('fullscreen_exit');

    svg.on('mouseover', function() {
        svg.style("border-color", '#787a7a');
    })
    .on('mouseout', function() {
        svg.style("border-color", 'rgb(211,211,211)');
    });
    fullscreenIcon
    .on('mouseover', function() {
        d3.select('#fullscreenCircle')
            .attr('stroke', '#787a7a')
            .attr('stroke-width', '2');
        d3.select('#icon')
            .attr('fill','#4d4e4e');
    })
    .on('mouseout', function() {
        d3.select('#fullscreenCircle')
            .attr('stroke', null)
            .attr('stroke-width', null);
        d3.select('#icon')
            .attr('fill','#717272');
    });
}

function positionFullscreenIcon(svg, fullscreenIcon) {
    const svgRect = svg.node().getBoundingClientRect();
    const iconX = 40;
    const iconY = 40;

    fullscreenIcon.attr('transform', `translate(${iconX}, ${iconY})`);
}



function countLeaves(node) {
    if (!node.children || node.children.length === 0) {
      return 1;
    }
    return node.children.reduce((sum, child) => sum + countLeaves(child), 0);
  }
  function findMaxDepth(node) {
    if (!node.children || node.children.length === 0) {
      return 1;
    } else {
      return 1 + Math.max(...node.children.map(findMaxDepth));
    }
  }