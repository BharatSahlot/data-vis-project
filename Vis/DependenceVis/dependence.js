import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

const max = (a, b) => a > b ? a : b;
let nodeColor = {};

function shuffle(a) {
    var j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
}

function ProcessEdges(edges)
{
    edges = edges.filter(e => e.perc >= 0.1);

    let graph = {};
    for(const edge of edges)
    {
        if(graph[edge.a] == undefined) graph[edge.a] = [];
        if(graph[edge.b] == undefined) graph[edge.b] = [];

        graph[edge.a].push(edge.b);
    }

    const nodes = Object.keys(graph);
    shuffle(nodes);

    return {
        edges: edges,
        nodes: nodes 
    };
}

// data of a year
function ShowGraph(edges, root, gdpMap, config, direction)
{
    const processed = ProcessEdges(edges);

    edges = processed.edges;
    const nodes = processed.nodes;

    let maxGDP = 0, maxTrade = 0;

    // let nodes = {};
    for(const edge of edges)
    {
        maxGDP = max(maxGDP, edge.gdp);
        maxTrade = max(maxTrade, edge.value);
    }

    for(const i in nodes)
    {
        const r = gdpMap[nodes[i]] == undefined ? 0.01 : Math.pow(gdpMap[nodes[i]] / maxGDP, 0.3);

        if(nodeColor[nodes[i]] == undefined) nodeColor[nodes[i]] = d3.color(d3.interpolateRainbow(i / nodes.length));

        let nes = [];
        for(const edge of edges)
        {
            if(edge.a == nodes[i]) nes.push(edge);
        }

        nodes[i] = {
            id: nodes[i],
            r: r,
            gdp: gdpMap[nodes[i]],
            edges: nes
        };
    }

    const links = [];
    for(const i in edges)
    {
        let e = {
            source: edges[i].a,
            target: edges[i].b,
            distance: 30 + (1 - edges[i].perc) * 100,
            width: 1 + (edges[i].value / maxTrade) * 5
        };
        /* if(edges[i].perc >= 0.1)  */links.push(e);
    }

    const simulation = d3.forceSimulation(nodes)
    .force("link", d3.forceLink(links).id(d => d.id).distance(l => l.distance))
    .force("charge", d3.forceManyBody().strength(-100))
    .force("x", d3.forceX())
    .force("y", d3.forceY())
    .on("tick", ticked);

    const svg = root.append("svg")
        .attr("width", config.width)
        .attr("height", config.height)
        .attr("viewBox", [-config.width / 2, -config.height / 2, config.width, config.height]);

    const link = svg.append("g")
        .attr("stroke-opacity", 1)
        .selectAll("line")
        .data(links)
        .join("line")
        .attr("stroke-width", d => d.width)

    let hovered = null;

    const node = svg.append("g")
    .attr("fill", "#999")
    .selectAll("circle")
    .data(nodes)
    .join("circle")
    .attr("id", n => "F1_Node_" + n.id)
    .attr("r", (n) => n.r * 15)
    .on("mouseover", (_, n) => hovered = n)
    .on("mouseout", _ => hovered = null)
    .call(drag(simulation));

    for(const nd of nodes)
    {
        $("#F1_Node_" + nd.id).qtip({
            style: { classes: 'qtip-blue' },
            content: {
                text: () => {
                    return nd.id + "<br>" + 
                        "GDP: " + nd.gdp;
                }
            }
        });
    }

    let offset = 0;
    setInterval(() => {
        if(direction) offset++;
        else offset--;

        link.attr("stroke-dashoffset", d => {
                return offset * d.width / 5;
            })
    }, 50);

    function ticked() {
        link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y)
            .attr("stroke", d => nodeColor[d.target.id].formatHex())
            .attr("style", d => {
                if(hovered == null || hovered != d.source) return "";

                return "stroke-dasharray: 10, 4"
            })
            .attr("stroke-opacity", d => {
                if(hovered == null) return max(0.3, d.width / 5);
                if(hovered == d.source) return 1;
                return max(0.1, d.width / 7);
            });


        node
            .attr("cx", d => d.x)
            .attr("cy", d => d.y)
            .attr("fill", d => nodeColor[d.id].formatHex());
    }

    function drag(simulation) {    
        function dragstarted(event) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            event.subject.fx = event.subject.x;
            event.subject.fy = event.subject.y;
        }

        function dragged(event) {
            event.subject.fx = event.x;
            event.subject.fy = event.y;
        }

        function dragended(event) {
            if (!event.active) simulation.alphaTarget(0);
            event.subject.fx = null;
            event.subject.fy = null;
        }

        return d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended);
    }
}

export async function Run(config)
{
    const root = d3.select(config.root);

    const data = await d3.json("./dependence.json");

    const gdpData = await d3.csv("./gdp.csv");

    const selYear = root.append("select")
    .attr("name", "dep_years")
    .attr("id", "dep_years");

    const selType = root.append("select")
    .attr("name", "dep_type")
    .attr("id", "dep_type");

    for(let i = 1998; i <= 2020; i++)
    {
        selYear.append("option")
        .attr("value", i - 1998)
        .text(i);
    }

    selType.append("option")
        .attr("value", "export")
        .text("Export");

    selType.append("option")
        .attr("value", "import")
        .text("Import");

    const showGraph = () => {
        if(root.select("div"))
            root.select("div").remove();

        let gdpMap = {};

        for(const row of gdpData)
        {
            gdpMap[row.Code] = parseFloat(row[selYear.node().selectedIndex + 1998]);
        }

        ShowGraph(data[selYear.node().selectedIndex][selType.node().selectedIndex == 0 ? 'export_data' : 'import_data'], root.append("div"), gdpMap, config, selType.node().selectedIndex);
    }

    selYear.on("change", showGraph);
    selType.on("change", showGraph);

    showGraph();
}
