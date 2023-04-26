import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

export async function Run(config, folder){
    const form = document.createElement('form');

    // Create the label element
    const label = document.createElement('label');
    label.setAttribute('for', 'selectYear');
    label.textContent = 'Select year:';

    // Create the select element
    const select = document.createElement('select');
    select.setAttribute('id', 'selectYear');
    select.setAttribute('name', 'selectYear');

    // Create the option elements
    for (let i = 2008; i <= 2019; i++) {
        const option = document.createElement('option');
        option.setAttribute('value', i.toString());
        option.textContent = i.toString();
        select.appendChild(option);
    }

    // Add the label and select elements to the form
    form.appendChild(label);
    form.appendChild(select);

    // Add the form to the document
    //document.body.appendChild(form);
    const main = d3.select(config.root);
    main.node().appendChild(form);
    const svg = main.append("svg")
        .attr("width", config.width )
        .attr("height", config.height );

    const yearOfStudySelect = document.getElementById("selectYear");

    const updateGraph = async () => {
        svg.node().innerHTML = "";

        const selectedValue=yearOfStudySelect.value;

        console.log(selectedValue);

        let margin = 20,
            diameter = +svg.attr("width"),
            g = svg.append("g").attr("transform", "translate(" + diameter / 2 + "," + diameter / 2 + ")");

        console.log(svg);

        var color = d3.scaleLinear()
            .domain([-1, 5])
            .range(["hsl(152,80%,80%)", "hsl(228,30%,40%)"])
            .interpolate(d3.interpolateHcl);

        var pack = d3.pack()
            .size([diameter - margin, diameter - margin])
            .padding(2);

        let root = await d3.json(folder+"continents2.json");

        root = d3.hierarchy(root)
            .sum(function (d) {
                if (d.export_data === undefined) {
                    return 0
                }
                else {
                    if (d.export_data[selectedValue] === undefined) {
                        return 0
                    }
                    else {
                        return d.export_data[selectedValue]
                    }
                }
                //return d.export_data;
            })
            .sort(function (a, b) { return b.value - a.value; });

        var focus = root,
            nodes = pack(root).descendants(),
            view;

        var circle = g.selectAll("circle")
            .data(nodes)
            .enter().append("circle")
            .attr("class", function (d) { return d.parent ? d.children ? "node" : "node node--leaf" : "node node--root"; })
            .style("fill", function (d) { return d.children ? color(d.depth) : null; })
            .on("click", function (event, d) { if (focus !== d) zoom(d, event), event.stopPropagation(); });

        var text = g.selectAll("text")
            .data(nodes)
            .enter().append("text")
            .attr("class", "label")
            .style("fill-opacity", function (d) { return d.parent === root ? 1 : 0; })
            .style("display", function (d) { return d.parent === root ? "inline" : "none"; })
            .text(function (d) { return d.data.name; });

        var node = g.selectAll("circle,text");

        svg
            // .style("background", color(-1))
            .on("click", function (event) { zoom(root, event); });

        zoomTo([root.x, root.y, root.r * 2 + margin]);

        function zoom(d, event) {
            var focus0 = focus; focus = d;

            var transition = svg.transition()
                .duration(event.altKey ? 7500 : 750)
                .tween("zoom", function (d) {
                    var i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2 + margin]);
                    return function (t) { zoomTo(i(t)); };
                });

            transition.selectAll("text")
                .filter(function (d) { return d.parent === focus || this.style.display === "inline"; })
                .style("fill-opacity", function (d) { return d.parent === focus ? 1 : 0; })
                .on("start", function (d) { if (d.parent === focus) this.style.display = "inline"; })
                .on("end", function (d) { if (d.parent !== focus) this.style.display = "none"; });
        }

        function zoomTo(v) {
            var k = diameter / v[2]; view = v;
            node.attr("transform", function (d) { return "translate(" + (d.x - v[0]) * k + "," + (d.y - v[1]) * k + ")"; });
            circle.attr("r", function (d) { return d.r * k; });
        }
    };

    yearOfStudySelect.addEventListener("change", updateGraph);
    updateGraph();
}
