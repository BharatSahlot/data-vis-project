// import * as d3 from "https://cdn.jsdelivr.net/npm/d3@4/+esm";
// import { geoPath, geoNaturalEarth1 } from "https://cdn.jsdelivr.net/npm/d3-geo@2/+esm";
// import { schemeGnBu } from "https://cdn.skypack.dev/d3-scale-chromatic@1";

async function Run(config, folder) {

    const width = config.width;
    const height = config.height;

    const uiRoot = d3.select(config.root).append("div").style("margin-bottom", "25px");
    const importExport = uiRoot.append("select").attr("name", "choroImportExport").attr("id", "choroImportExport");
    const selectYear = uiRoot.append("select").attr("name", "choroSelectYear").attr("id", "choroSelectYear");

    importExport.append("option")
        .attr("value", "export")
        .text("Export");

    importExport.append("option")
        .attr("value", "import")
        .text("Import");

    for(let i = 1997; i <= 2020; i++)
    {
        selectYear.append("option").attr("value", i).text(`${i}`);
    }

    const tooltip = d3.select(config.root).append("div").attr("id", "#tooltip").attr("class", "choro_tooltip");

    var svg = d3.select(config.root).append("div").append("svg")
        .attr("width", width)
        .attr("height", height)

    // Map and projection
    var path = d3.geoPath();
    var projection = d3.geoNaturalEarth1()
        .scale(width / 2 / Math.PI)
        .translate([width / 2, height / 2])
    var path = d3.geoPath()
        .projection(projection);

    // Data and color scale
    var data = d3.map();
    var colorScheme = d3.schemeBuPu[6];
    var colorScheme2=d3.schemeBuPu[9]
    console.log(colorScheme2)
    colorScheme.unshift("#eee")
    var colorScale = d3.scaleThreshold()
        .domain([1, 6, 11, 26, 101, 1001])
        .range(colorScheme);

    // Legend
    var g = svg.append("g")
        .attr("class", "legendThreshold")
        .attr("transform", "translate(20,20)");

    const legendTitle = g.append("text")
        .attr("class", "caption")
        .attr("x", 0)
        .attr("y", -6)
        .text("export")
        .style("fill", '#fff');

    var labels = ['0', '1-5', '6-10', '11-25', '26-100', '101-1000', '> 1000'];
    var labelValue = [ 1, 6, 11, 26, 101, 1001 ];
    for(const i in labels)
    {
        const label = labels[i];
        g.append("text")
            .attr("x", 7 + 15)
            .attr("y", 3.5 + 15 + 15 * i)
            .style("fill", "#fff")
            .text(label);

        g.append("circle")
            .attr("cx", 7)
            .attr("cy", 15 + 15 * i)
            .attr("r", 7)
            .attr("fill", colorScale(labelValue[i]))
    }

    var zoom = d3.zoom()
        .scaleExtent([1, 8])
        .on("zoom", zoomed);

    svg.call(zoom);

    function zoomed() {
        svg.selectAll(".choro_countries")
            .attr("transform", d3.event.transform);
    }

    const UpdateGraph = () => {
        const year = selectYear.node().selectedIndex + 1997;
        console.log(selectYear.node());

        let string = "Export";

        console.log(importExport.node().value)
        if (importExport.node().selectedIndex === 1) {
            string = "Import"
        }
        legendTitle.text(string);

        d3.queue()
            .defer(d3.json, "http://enjalot.github.io/wwsd/data/world/world-110m.geojson")
            .defer(d3.csv, folder + "india.csv", function (d) {
                if (d.FinancialYearStart === year.toString()) {
                    data.set(d.Country, +d[string].replace(/,/g, ''));
                }
            })
            .await(ready);
        function ready(error, topo) {
            svg.select(".choro_countries").remove();
            if (error) throw error;

            // Draw the map
            svg.append("g")
                .attr("class", "choro_countries")
                .selectAll("path")
                .data(topo.features)
                .enter().append("path")
                .attr("fill", function (d) {
                    var id = '$' + d.properties.name.toUpperCase()
                    d[string] = data[id] || 0;
                    return colorScale(d[string]);
                })
                .attr("d", path)
                .on("mouseover", function (d) {
                    tooltip.style("display", "inline-block");

                    let value = data['$' + d.properties.name.toUpperCase()];
                    if(value == undefined) value = "unknown";

                    tooltip.html(d.properties.name + '<br>' + value);
                })
                .on("mousemove", function () {
                    tooltip.style("left", (d3.event.pageX + 10) + "px");
                    tooltip.style("top", (d3.event.pageY - 30) + "px");
                })
                .on("mouseout", function () {
                    tooltip.style("display", "none");
                });
        }
    };

    importExport.on("change", UpdateGraph);
    selectYear.on("change", UpdateGraph);

    UpdateGraph();
}

Run({
    width: 1200,
    height: 900,
    root: document.querySelector("#choro")
}, "./Choropleth/");
