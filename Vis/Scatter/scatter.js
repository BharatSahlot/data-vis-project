const tooltip = d3
    .select("#scatter_viz")
    .append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("visibility", "hidden");
const tooltip2 = d3
    .select("#scatter_viz")
    .append("div")
    .attr("class", "tooltip2")
    .style("position", "absolute")
    .style("visibility", "hidden");
// set the dimensions and margins of the graph
var margin = { top: 10, right: 30, bottom: 250, left: 60 },
    width = 700 - margin.left - margin.right,
    height = 450 - margin.top - margin.bottom;

var svg1 = d3.select("#scatter_viz")
    .append("div")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");
var svg = d3.select("#scatter_viz")
    .append("div")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");

//Read the data
d3.csv("./Scatter/indiaTradeGdpRatio.csv",
    // When reading the csv, I must format variables:
    function (d) {
        return { date: d3.timeParse("%Y-%m-%d")(d.date), value: d.trade, diff: d.annualChange }
    },
    // Now I can use this dataset:
    function (data) {
        //console.log(data)
        // Add X axis --> it is a date format
        var x = d3.scaleTime()
            .domain(d3.extent(data, function (d) { return d.date; }))
            .range([0, width])
        var xAxis = svg1.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x))
            .attr("class", "axis");

        xAxis.select(".domain").attr("stroke", "white");
        xAxis.selectAll("text").attr("fill", "white");
        xAxis.selectAll("line").attr("stroke", "white");

        // Add Y axis
        var y1 = d3.scaleLinear()
            .domain(d3.extent(data, function (d) { return d.diff; }))
            .range([height, 0]);
        
        let yAxis = svg1.append("g")
            .call(d3.axisLeft(y1))
            .attr("class", "axis");

        yAxis.select(".domain").attr("stroke", "white");
        yAxis.selectAll("text").attr("fill", "white");
        yAxis.selectAll("line").attr("stroke", "white");

        var clip = svg1.append("defs").append("svg:clipPath")
            .attr("id", "clip")
            .append("svg:rect")
            .attr("width", width)
            .attr("height", height + 300)
            .attr("x", 0)
            .attr("y", -100);

        var clip1 = svg.append("defs").append("svg:clipPath1")
            .attr("id", "clip1")
            .append("svg:rect")
            .attr("width", width)
            .attr("height", height)
            .attr("x", 0)
            .attr("y", 0);

        //Add brushing
        var brush = d3.brushX()                 // Add the brush feature using the d3.brush function
            .extent([[0, 0], [width, height]]) // initialise the brush area: start at 0,0 and finishes at width,height: it means I select the whole graph area
            .on("end", updateChart) // Each time the brush selection changes, trigger the 'updateChart' function
        var brush1 = d3.brushX()                 // Add the brush feature using the d3.brush function
            .extent([[0, 0], [width, height]]) // initialise the brush area: start at 0,0 and finishes at width,height: it means I select the whole graph area
            .on("end", updateChart1)

        // Create the scatter variable: where both the circles and the brush take place
        var scatter = svg1.append('g')
            .attr("clip-path", "url(#clip)")
        var scatter1 = svg.append('g')
            .attr("clip-path", "url(#clip)")
        scatter
            .append("g")
            .attr("class", "brush")
            .call(brush);
        scatter.selectAll("myline")
            .data(data)
            .enter()
            .append("line")
            .attr("x1", function (d) { return x(d.date); })
            .attr("x2", function (d) { return x(d.date); })
            .attr("y1", function (d) { return y1(d.diff); })
            .attr("y2", y1(0))
            .attr("stroke", "grey")

        scatter.selectAll("circle")
            .data(data)
            .enter()
            .append("circle")
            .attr("class", function (d, i) {
                return "point" + i;
            })
            .attr("cx", function (d) { return x(d.date); })
            .attr("cy", function (d) { return y1(d.diff); })
            .attr("r", "4")
            .style("fill", "blue")
            .attr("stroke", "black")
            .on('mouseover', function (d, i) {
                //console.log(d)
                d3.selectAll(".point" + i)
                    .style("fill", "yellow");
                d3.selectAll(".dot" + i)
                    .style("fill", "yellow");
                tooltip.text(`${d.diff}%`);
                tooltip.style("visibility", "visible");
                tooltip
                    .style("left", d3.event.pageX + 5 + "px")
                    .style("top", d3.event.pageY - 14 + "px");
            })
            .on("mouseout", function (d, i) {
                d3.selectAll(".dot" + i)
                    .style("fill", "blue");
                d3.selectAll(".point" + i)
                    .style("fill", "blue");
                tooltip.style("visibility", "hidden");
                tooltip2.style("visibility", "hidden");
            });
        scatter1
            .append("g")
            .attr("class", "brush1")
            .call(brush1);
        var idleTimeout
        function idled() { idleTimeout = null; }

        // A function that update the chart for given boundaries
        var x = d3.scaleTime()
            .domain(d3.extent(data, function (d) { return d.date; }))
            .range([0, width]);
        var xAxis2 = svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x));

        xAxis2.select(".domain").attr("stroke", "white");
        xAxis2.selectAll("text").attr("fill", "white");
        xAxis2.selectAll("line").attr("stroke", "white");

        // Add Y axis
        var y = d3.scaleLinear()
            .domain(d3.extent(data, function (d) { return Number(d.value); }))
            .range([height, 0]);

        let yAxis2 = svg.append("g")
            .call(d3.axisLeft(y));

        yAxis2.select(".domain").attr("stroke", "white");
        yAxis2.selectAll("text").attr("fill", "white");
        yAxis2.selectAll("line").attr("stroke", "white");

        // Add the line
        scatter1.append("path")
            .datum(data)
            .attr("fill", "none")
            .attr("stroke-width", 3)
            .attr("stroke", "white")
            .attr("d", d3.line()
                .x(function (d) { return x(d.date) })
                .y(function (d) { return y(d.value) })
            )
        // Add the points
        scatter1
            .selectAll("circle")
            .data(data)
            .enter()
            .append("circle")
            .attr("class", function (d, i) {
                return "dot" + i;
            })
            .attr("cx", function (d) { return x(d.date) })
            .attr("cy", function (d) {
                //console.log(y(d.value))
                return y(d.value)
            })
            .attr("r", 5)
            .attr("fill", "blue")
            .attr("stroke", "black")
            .on('mouseover', function (d, i) {
                //console.log(i)
                d3.selectAll(".point" + i)
                    .style("fill", "yellow");
                d3.selectAll(".dot" + i)
                    .style("fill", "yellow");
                tooltip2.text(`${d.value}%`);
                tooltip2.style("visibility", "visible");
                tooltip2
                    .style("left", d3.event.pageX + 5 + "px")
                    .style("top", d3.event.pageY - 14 + "px");
            })
            .on("mouseout", function (d, i) {
                d3.selectAll(".dot" + i)
                    .style("fill", "blue");
                d3.selectAll(".point" + i)
                    .style("fill", "blue");
                tooltip2.style("visibility", "hidden");
            });
        // Add x-axis label for first graph
        svg1.append("text")
            .attr("transform",
                "translate(" + (width / 2) + " ," +
                    (height + margin.top + 40) + ")")
            .style("text-anchor", "middle")
            .text("Year");

        // Add y-axis label for first graph
        svg1.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - margin.left)
            .attr("x", 0 - (height / 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text("Annual Change(%)");
        //Trade to GDP Ratio
        // Add x-axis label for second graph
        svg.append("text")
            .attr("transform",
                "translate(" + (width / 2) + " ," +
                    (height + margin.top + 40) + ")")
            .style("text-anchor", "middle")
            .text("Year");

        // Add y-axis label for second graph
        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - margin.left)
            .attr("x", 0 - (height / 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text("Trade to GDP Ratio");

        function updateChart() {

            // Get the selected region on the x-axis
            var extent = d3.event.selection;

            // If no selection, revert to initial coordinate system
            if (!extent) {
                if (!idleTimeout) return idleTimeout = setTimeout(idled, 350);
                x.domain(d3.extent(data, function (d) { return d.date; }))
            } else {
                // Otherwise, update x domain with the selected region
                x.domain([x.invert(extent[0]), x.invert(extent[1])]);
                scatter.select(".brush").call(brush.move, null);
            }

            // Filter the original dataset based on the selected region on the x-axis
            var newData = data.filter(function (d) {
                return d.date >= x.domain()[0] && d.date <= x.domain()[1];
            });

            // Get the extent of the filtered dataset on the y-axis
            var yExtent = d3.extent(newData, function (d) { return d.diff; });
            var yExtent1 = d3.extent(newData, function (d) { return Number(d.value); });

            // Update the y-axis scale domain with the new extent
            y1.domain(yExtent);
            y.domain(yExtent1)

            // Update the y-axis
            xAxis.transition().duration(1000).call(d3.axisBottom(x));
            xAxis2.transition().duration(1000).call(d3.axisBottom(x));
            yAxis.transition().duration(1000).call(d3.axisLeft(y1));
            yAxis2.transition().duration(1000).call(d3.axisLeft(y))

            // Update the scatterplot circles
            scatter.selectAll("circle")
                .transition().duration(1000)
                .attr("cx", function (d) { return x(d.date); })
                .attr("cy", function (d) { return y1(d.diff); });

            // Update the lines
            scatter.selectAll("line")
                .transition().duration(1000)
                .attr("x1", function (d) { return x(d.date); })
                .attr("x2", function (d) { return x(d.date); })
                .attr("y1", function (d) { return y1(d.diff); })
                .attr("y2", y1(0));

            scatter1
                .selectAll("circle")
                .transition().duration(1000)
                .attr("cx", function (d) { return x(d.date); })
                .attr("cy", function (d) { return y(d.value); })
            scatter1.selectAll("path")
                .transition().duration(1000)
                .attr("d", d3.line()
                    .x(function (d) { return x(d.date) })
                    .y(function (d) { return y(d.value) })
                )
        }

        function updateChart1() {

            const extent = d3.event.selection


            // If no selection, back to initial coordinate. Otherwise, update X axis domain
            if (!extent) {
                if (!idleTimeout) return idleTimeout = setTimeout(idled, 350); // This allows to wait a little bit
                x.domain(d3.extent(data, function (d) { return d.date; }))
            } else {
                x.domain([x.invert(extent[0]), x.invert(extent[1])])
                // y.domain([y.invert(extent[0]), y.invert(extent[1])])
                // y1.domain([y1.invert(extent[0]), y1.invert(extent[1])])
                //scatter.select(".brush").call(brush.move, null) // This remove the grey brush area as soon as the selection has been done
                scatter1.select(".brush1").call(brush1.move, null)
            }

            var newData = data.filter(function (d) {
                return d.date >= x.domain()[0] && d.date <= x.domain()[1];
            });

            // Get the extent of the filtered dataset on the y-axis
            var yExtent = d3.extent(newData, function (d) { return d.diff; });
            var yExtent1 = d3.extent(newData, function (d) { return Number(d.value); });
            console.log(yExtent)
            console.log(yExtent1)

            // Update the y-axis scale domain with the new extent
            y1.domain(yExtent);
            y.domain(yExtent1)

            // Update the y-axis
            xAxis.transition().duration(1000).call(d3.axisBottom(x));
            xAxis2.transition().duration(1000).call(d3.axisBottom(x));
            yAxis.transition().duration(1000).call(d3.axisLeft(y1));
            yAxis2.transition().duration(1000).call(d3.axisLeft(y))
            scatter
                .selectAll("circle")
                .transition().duration(1000)
                .attr("cx", function (d) { return x(d.date); })
                .attr("cy", function (d) { return y1(d.diff); })
            scatter1
                .selectAll("circle")
                .transition().duration(1000)
                .attr("cx", function (d) { return x(d.date); })
                .attr("cy", function (d) { return y(d.value); })
            scatter1.selectAll("path")
                .transition().duration(1000)
                .attr("d", d3.line()
                    .x(function (d) { return x(d.date) })
                    .y(function (d) { return y(d.value) })
                )
            scatter.selectAll("line")
                .transition().duration(1000)
                .attr("x1", function (d) { return x(d.date); })
                .attr("x2", function (d) { return x(d.date); })
                .attr("y1", function (d) { return y1(d.diff); })
                .attr("y2", y1(0))
        }
    })
