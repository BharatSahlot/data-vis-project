var margin = {
    top: 60,
    right: 230,
    bottom: 50,
    left: 350,
};

var width = 1700 - margin.left - margin.right;
var height = 800 - margin.top - margin.bottom;

d3.csv("./StackedBar/yearwise.csv", function (data) {

    const root = d3.select("#stackedchart");

    root.select("svg").remove();
    var countryData = {};

    // loop through each row of the csv data
    data.forEach(function (d) {
        var countryname = d.country;
        //console.log("hi");
        // if the country doesn't exist in the countryData object, create a new empty array for them
        if (!countryData[countryname]) {
            countryData[countryname] = [];
            //  console.log(countryname);
        }

        // add the row data to the country's array
        countryData[countryname].push({
            year: d.year,
            Animals: d.Animals,
            vegetables: d.Vegetables,
            Minerals: d.Minerals,
            Fuels: d.Fuels,
            Chemicals: d.Chemicals,
            Plastic_Rubber: d.Plastic_Rubber,
            Hides: d.Hides,
            wood: d.wood,
            Footwear: d.Footwear,
            Metals: d.Metals,
            Mach_electric: d.Mach_electric,
            transport: d.transport,
            Miscellaneous: d.Miscellaneous,
        });
    });

    // create dropdown menu with options for each country
    var countrySelect = d3.select("#countrySelect");
    countrySelect
        .selectAll("option")
        .data(Object.keys(countryData))
        .enter()
        .append("option")
        .text(function (d) {
            return d;
        });

    countrySelect.on("change", function () {
        var selectedcountry = d3.select(this).property("value");
        var selectedData = countryData[selectedcountry];
        root.select("svg").remove();
        updateAreaChart(selectedData);
    });

    function updateAreaChart(data) {
        root.select("svg").remove();
        var svg = root
            .append("svg")
            .attr("id", "chart-svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr(
                "transform",
                "translate(" + margin.left + "," + margin.top + ")"
            );

        console.log(data);

        var keys = [
            "year",
            "Animals",
            "Vegetables",
            "Food",
            "Minerals",
            "Fuels",
            "Chemicals",
            "Plastic_Rubber",
            "Hides",
            "wood",
            "Textile",
            "Footwear",
            "Stone_glass",
            "Metals",
            "Mach_electric",
            "transport",
            "Miscellaneous",
        ];
        console.log(keys);
        var stackedData = d3.stack().keys(keys)(data);

        var color = d3.scaleOrdinal().domain(keys).range(d3.schemePaired);

        var x = d3
            .scaleLinear()
            .domain(
                d3.extent(data, function (d) {
                    return d.year;
                })
            )
            .range([0, width]);

        var xAxis = svg
            .append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x).ticks(10));

        xAxis.select(".domain").attr("stroke", "white");
        xAxis.selectAll("text").attr("fill", "white");
        xAxis.selectAll("line").attr("stroke", "white");

        var y = d3
            .scaleLinear()
            .domain([
                0,
                d3.max(stackedData, function (d) {
                    return d3.max(d, function (d) {
                        return d[1];
                    });
                }),
            ])
            .range([height, 0]);
        console.log(y.domain());

        const yAxis = svg.append("g").call(d3.axisLeft(y).ticks(10));
        yAxis.select(".domain").attr("stroke", "white");
        yAxis.selectAll("text").attr("fill", "white");
        yAxis.selectAll("line").attr("stroke", "white");


        svg
            .append("text")
            .attr("text-anchor", "end")
            .attr("x", width / 2)
            .attr("y", height + 50)
            .attr("font-size", 25)
            .text("Year");

        svg
            .append("text")
            .attr("text-anchor", "end")
            .attr("x", -420)
            .attr("y", -35)
            .attr("transform", "rotate(-90,20, 50)")
            .text("Trade(in UNIT)")
            .attr("font-size", 25)
            .attr("text-anchor", "start");

        var y = d3
            .scaleLinear()
            .domain([
                0,
                d3.max(stackedData, function (d) {
                    return d3.max(d, function (d) {
                        return d[1];
                    });
                }),
            ])
            .range([height, 0]);

        // svg.append("g").call(d3.axisLeft(y).ticks(10));

        var clip = svg
            .append("defs")
            .append("svg:clipPath")
            .attr("id", "sclip")
            .append("svg:rect")
            .attr("width", width)
            .attr("height", height)
            .attr("x", 0)
            .attr("y", 0);

        var brush = d3
            .brushX()
            .extent([
                [0, 0],
                [width, height],
            ])
            .on("end", updateChart);

        var areaChart = svg.append("g").attr("clip-path", "url(#sclip)");

        var area = d3
            .area()
            .x(function (d) {
                return x(d.data.year);
            })
            .y0(function (d) {
                return y(d[0]);
            })
            .y1(function (d) {
                return y(d[1]);
            });

        areaChart
            .selectAll("mylayers")
            .data(stackedData)
            .attr("id", "chart-layers")
            .enter()
            .append("path")
            .attr("class", function (d) {
                return "myArea " + d.key;
            })
            .style("fill", function (d) {
                return color(d.key);
            })
            .attr("d", area);

        // Add the brushing
        areaChart.append("g").attr("class", "brush2").call(brush);

        var idleTimeout;

        function idled() {
            idleTimeout = null;
        }

        function updateChart() {
            const extent = d3.event.selection;

            if (!extent) {
                if (!idleTimeout) return (idleTimeout = setTimeout(idled, 350)); // This allows to wait a little bit
                x.domain(
                    d3.extent(data, function (d) {
                        return d.year;
                    })
                );
            } else {
                x.domain([x.invert(extent[0]), x.invert(extent[1])]);
                areaChart.select(".brush2").call(brush.move, null); // This remove the grey brush area as soon as the selection has been done
            }

            xAxis.transition().duration(1000).call(d3.axisBottom(x).ticks(5));
            areaChart
                .selectAll("path")
                .transition()
                .duration(1000)
                .attr("d", area);
        }

        var highlight = function (d) {
            root.selectAll(".myArea").style("opacity", 0.1);
            root.select("." + d.replaceAll(" ", "_")).style("opacity", 1);
        };

        var removeHighlight = function (d) {
            root.selectAll(".myArea").style("opacity", 1);
        };

        var size = 25;
        svg
            .selectAll("myrect")
            .data(keys)
            .enter()
            .append("rect")
            .attr("x", 400)
            .attr("y", function (d, i) {
                return 10 + i * (size + 5);
            }) // 100 is where the first dot appears. 25 is the distance between dots
            .attr("width", size)
            .attr("height", size)
            .style("fill", function (d) {
                return color(d);
            })
            .on("mouseover", highlight)
            .on("mouseleave", removeHighlight);

        // Add one dot in the legend for each name.
            svg
            .selectAll("mylabels")
            .data(keys)
            .enter()
            .append("text")
            .attr("x", 400 + size * 1.2)
            .attr("y", function (d, i) {
                return 10 + i * (size + 5) + size / 2;
            }) // 100 is where the first dot appears. 25 is the distance between dots
            .style("fill", function (d) {
                return color(d);
            })
            .text(function (d) {
                return d;
            })
            .attr("text-anchor", "left")
            .attr("font-size", 25)
            .style("alignment-baseline", "middle")
            .on("mouseover", highlight)
            .on("mouseleave", removeHighlight);
    }

    var selectedcountry = countrySelect.property("value");
    var selectedData = countryData[selectedcountry];
    updateAreaChart(selectedData);
});
