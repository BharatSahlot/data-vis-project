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

function ProcessData(data, gdpMap)
{
    let gdpMap2 = {};

    let nodes = {};
    for(const edge of data.export_data)
    {
        if(nodes[edge.a] == undefined) nodes[edge.a] = 0;
        if(nodes[edge.b] == undefined) nodes[edge.b] = 0;

        nodes[edge.a] += edge.value;
        gdpMap2[edge.a] = edge.gdp;
    }

    for(const edge of data.import_data)
    {
        if(nodes[edge.a] == undefined) nodes[edge.a] = 0;
        if(nodes[edge.b] == undefined) nodes[edge.b] = 0;

        nodes[edge.a] -= edge.value;
        gdpMap2[edge.a] = edge.gdp;
    }

    let maxGDP = 0;
    for(const cnt of Object.keys(nodes))
    {
        let g = gdpMap2[cnt];
        if(g == undefined || isNaN(g)) g = gdpMap[cnt];
        if(g == undefined || isNaN(g)) continue;

        maxGDP = max(maxGDP, g);
    }

    let finalNodes = [];
    for(const cnt of Object.keys(nodes))
    {
        let g = gdpMap2[cnt];
        if(g == undefined || isNaN(g)) g = gdpMap[cnt];
        if(g == undefined || isNaN(g)) continue;

        finalNodes.push({
            id: cnt,
            trade_balance: nodes[cnt],
            gdp: g,
            r: Math.pow(g / maxGDP, 0.3)
        });
    }
    return finalNodes;
}

// data of a year
function ShowGraph(data, root, gdpMap, config)
{
    data = ProcessData(data, gdpMap);
    console.log(data);

    for(const i in data)
    {
        if(nodeColor[data[i].id] == undefined)
        {
            nodeColor[data[i].id] = d3.color(d3.interpolateRainbow(i / data.length));
        }
    }

    const simulation = d3.forceSimulation(data)
    .force("charge", d3.forceManyBody().strength(d => Math.sign(d.trade_balance) * (d.r) * 750))
    .force("x", d3.forceX())
    .force("y", d3.forceY())
    .on("tick", ticked);

    const svg = root.append("svg")
        .attr("width", config.width)
        .attr("height", config.height)
        .attr("viewBox", [-config.width / 2, -config.height / 2, config.width, config.height]);

    const node = svg.append("g")
    .attr("fill", "#999")
    .selectAll("circle")
    .data(data)
    .join("circle")
    .attr("id", n => "F2_Node_" + n.id)
    .attr("r", (n) => n.r * 55)
    .call(drag(simulation));

    for(const nd of data)
    {
        $("#F2_Node_" + nd.id).qtip({
            style: { classes: 'qtip-blue' },
            content: {
                text: () => {
                    return nd.id + "<br>" + 
                        "GDP: " + nd.gdp;
                }
            }
        });
    }

    function ticked() {
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

export async function Run(config, folder)
{
    const root = d3.select(config.root);

    const data = await d3.json(folder + "dependence.json");

    const gdpData = await d3.csv(folder + "gdp.csv");

    const selYear = root.append("select")
    .attr("name", "dep_years")
    .attr("id", "dep_years");

    for(let i = 1998; i <= 2020; i++)
    {
        selYear.append("option")
        .attr("value", i - 1998)
        .text(i);
    }

    const showGraph = () => {
        if(root.select("div"))
            root.select("div").remove();

        let gdpMap = {};

        for(const row of gdpData)
        {
            gdpMap[row.Code] = parseFloat(row[selYear.node().selectedIndex + 1998]);
        }

        ShowGraph(data[selYear.node().selectedIndex], root.append("div"), gdpMap, config);
    }

    selYear.on("change", showGraph);

    showGraph();
}
