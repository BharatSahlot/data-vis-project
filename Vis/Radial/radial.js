import * as d3 from "https://cdn.jsdelivr.net/npm/d3@4/+esm";

function square(x) {
    return x * x;
}

function radial() {
    var linear = d3.scaleLinear();

    function scale(x) {
        return Math.sqrt(linear(x));
    }

    scale.domain = function(_) {
        return arguments.length ? (linear.domain(_), scale) : linear.domain();
    };

    scale.nice = function(count) {
        return (linear.nice(count), scale);
    };

    scale.range = function(_) {
        return arguments.length ? (linear.range(_.map(square)), scale) : linear.range().map(Math.sqrt);
    };

    scale.ticks = linear.ticks;
    scale.tickFormat = linear.tickFormat;

    return scale;
}

function ShowGraph(g, config, type, folder)
{
    var x = d3.scaleBand()
        .range([0, 2 * Math.PI])
        .align(0);

    var y = radial()
        .range([config.innerRadius, config.outerRadius]);

    var z = d3.scaleOrdinal()
        .range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]);

    d3.csv(folder + `${type}.csv`, function (d, i, columns) {
        let t = 0;
        for (i = 2; i < columns.length; ++i) t += d[columns[i]] = +d[columns[i]];
        d.total = t;
        d.migrantRemittanceInflows = d.migrantRemittanceInflows;
        return d;
    }, function (error, data) {
        if (error) throw error;

        d3.select(config.root).selectAll(".radial_tooltip").remove();
        g.selectAll("g").remove();

        x.domain(data.map(function (d) { return d.migrantRemittanceInflows; }));
        y.domain([0, d3.max(data, function (d) { return d.total; })]);
        z.domain(data.columns.slice(1));

        var tooltip = d3.select(config.root).append("div")
            .attr("class", "radial_tooltip")
            .style('opacity', 0.9)
            .style('display', 'none');

        g.append("g")
            .selectAll("g")
            .data(d3.stack().keys(data.columns.slice(1))(data))
            .enter().append("g")
            .attr("fill", function (d) { return z(d.key); })
            .selectAll("path")
            .data(function (d) { return d; })
            .enter().append("path")
            .attr("d", d3.arc()
                .innerRadius(function (d) { return y(d[0]); })
                .outerRadius(function (d) { return y(d[1]); })
                .startAngle(function (d) { return x(d.data.migrantRemittanceInflows); })
                .endAngle(function (d) { return x(d.data.migrantRemittanceInflows) + x.bandwidth(); })
                .padAngle(0.01)
                .padRadius(config.innerRadius))
            .on("mouseover", function (d) {
                tooltip.style("left", d3.event.pageX + "px")
                    .style("top", d3.event.pageY + "px")
                    .style("opacity", 0.9)
                    .style('display', 'block')
                    .html("2013-" + d.data[2013] + "</br>" + "2014-" + d.data[2014] + "</br>" + "2015-" + d.data[2015] + "</br>" + "2016-" + d.data[2016]);
            })
            .on("mouseout", function (d, i) {
                tooltip.style('opacity', 0).style('display', 'none');
            });


        var label = g.append("g")
            .selectAll("g")
            .data(data)
            .enter().append("g")
            .attr("text-anchor", "middle")
            .attr("transform", function (d) { return "rotate(" + ((x(d.migrantRemittanceInflows) + x.bandwidth() / 2) * 180 / Math.PI - 90) + ")translate(" + config.innerRadius + ",0)"; });

        label.append("line")
            .attr("x2", -5)
            .attr("stroke", "#000");

        label.append("text")
            .attr("transform", function (d) { return (x(d.migrantRemittanceInflows) + x.bandwidth() / 2 + Math.PI / 2) % (2 * Math.PI) < Math.PI ? "rotate(360)translate(0,16)" : "rotate(180)translate(0,-9)"; })
            .text(function (d) { return d.migrantRemittanceInflows; });

        var yAxis = g.append("g")
            .attr("text-anchor", "middle");

        var yTick = yAxis
            .selectAll("g")
            .data(y.ticks(5).slice(1))
            .enter().append("g");

        yTick.append("circle")
            .attr("fill", "none")
            .attr("stroke", "#000")
            .attr("r", y);

        yTick.append("text")
            .attr("y", function (d) { return -y(d); })
            .attr("dy", "0.35em")
            .attr("fill", "none")
            .attr("stroke", "#fff")
            .attr("stroke-width", 5)
            .text(y.tickFormat(5, "s"));

        yTick.append("text")
            .attr("y", function (d) { return -y(d); })
            .attr("dy", "0.35em")
            .text(y.tickFormat(5, "s"));

        yAxis.append("text")
            .attr("y", function (d) { return -y(y.ticks(5).pop()); })
            .attr("dy", "-1em")
            .text(`${type}-remittance`);

        var legend = g.append("g")
            .selectAll("g")
            .data(data.columns.slice(2).reverse())
            .enter().append("g")
            .attr("transform", function (d, i) { return "translate(-40," + (i - (data.columns.length - 1) / 2) * 20 + ")"; });

        legend.append("rect")
            .attr("width", 18)
            .attr("height", 18)
            .attr("fill", z);

        legend.append("text")
            .attr("x", 24)
            .attr("y", 9)
            .attr("dy", "0.35em")
            .text(function (d) { return d; });
    });  
}

export async function Run(config, folder) {
    const root = d3.select(config.root);

    const select = root.append("select")
    .attr("name", "flowSelect")
    .attr("id", "flowSelect");

    select.append("option").attr("value", "inflow").text("inflow");
    select.append("option").attr("value", "outflow").text("outflow");

    const svg = root.append("div").append("svg")
                .attr("width", config.width)
                .attr("height", config.height)
                .attr("font-family", "sans-serif")
                .attr("font-size", "10");
    
    const width = config.width;

    const height = config.height;
    
    const innerRadius = 180;

    const outerRadius = Math.min(width, height) / 2;

    const g = svg.append("g").attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

    config.width = width;
    config.height = height;
    config.innerRadius = innerRadius;
    config.outerRadius = outerRadius;

    const showGraph = () => ShowGraph(g, config, select.node().value, folder);
    select.on("change", showGraph);

    showGraph();
}
