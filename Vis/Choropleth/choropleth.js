import * as d3 from "https://cdn.jsdelivr.net/npm/d3@4/+esm";
import { geoPath, geoNaturalEarth1 } from "https://cdn.jsdelivr.net/npm/d3-geo@2/+esm";
import { schemeGnBu } from "https://cdn.skypack.dev/d3-scale-chromatic@1";

export async function Run(config) {

    const selectedValue = document.getElementById('importExport')
    const selectedValue2 = document.getElementById('selectYear')

    for(let i = 1997; i <= 2020; i++)
    {
        d3.select(selectedValue2).append("option").attr("value", i).text(`${i}`);
    }

    const width = config.width;
    const height = config.height;

    var svg = d3.select(config.root).append("svg")
        .attr("width", width)
        .attr("height", height)

    // Map and projection
    var path = d3.geoPath();
    var projection = geoNaturalEarth1()
        .scale(width / 2 / Math.PI)
        .translate([width / 2, height / 2])
    var path = geoPath()
        .projection(projection);

    // Data and color scale
    var data = d3.map();
    var colorScheme = schemeGnBu[6];
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

    const UpdateGraph = () => {
        console.log(selectedValue2.value)
        let i = selectedValue2.value;
        let string = "Export";
        const tooltip = d3.select("#tooltip");
        console.log(importExport.value)
        if (importExport.value === '1') {
            string = "Import"
        }
        legendTitle.text(string);
        d3.queue()
            .defer(d3.json, "http://enjalot.github.io/wwsd/data/world/world-110m.geojson")
            .defer(d3.csv, "india.csv", function (d) {
                if (d.FinancialYearStart === i.toString()) {
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

    selectedValue.addEventListener("change", UpdateGraph);
    selectedValue2.addEventListener("change", UpdateGraph);

    UpdateGraph();
}
