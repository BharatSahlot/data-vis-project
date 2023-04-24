import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

function ShowGraph(data, config)
{
    console.log(data);
    const margin = {
        top: -5, //10,
        right: 0, // 30,
        bottom: 0, // 30,
        left: 0, //100
    };

    const svg = d3.select(config.root)
        .append("svg")
        .attr("width", config.width + margin.left + margin.right)
        .attr("height", config.height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    const xScale = d3.scaleLinear()
        .domain([1988, 2020])
        .range([ 0, config.width ]);

    const yScale = d3.scaleLinear()
        .domain([0, 1.5 * d3.max(data, d => d3.max(d.values, c => c.value))])
        .range([config.height, 0]);

    const color = d3.interpolateMagma;

    const labelOffsetY = 75;

    svg.append("text")
        .attr("x", config.width - 157)
        .attr("y", labelOffsetY - 40)
        .style("fill", "lightgray")
        .text("Top 10(2020)");

    svg.append("text")
        .attr("x", config.width - 157)
        .attr("y", labelOffsetY - 20)
        .style("fill", "lightgray")
        .text("Countries");

    for(const cnt of data)
    {
        const col = color(0.1 + 0.9 * (cnt.si / data.length));
        let ele = svg
            .append("path")
            .datum(cnt.values)
            .attr("id", `S1_area_${cnt.si}`)
            .attr("fill", col)
            .attr("opacity", 0.5 + 0.3 * (1 - (cnt.si / data.length)))
            .attr("stroke", color(0.9 * (cnt.si / data.length)))
            .attr("stroke-width", 2.5)
            .attr("d", d3.area()
                .curve(d3.curveBasis)
                .x(d => xScale(d.year))
                .y0(yScale(0))
                .y1(yScale(0))
            );

        for(let i = 0; i < cnt.values.length; i++)
        {
            ele = ele.transition()
            .duration(150)
            .ease(d3.easeLinear)
            .attr("d", d3.area()
                .curve(d3.curveBasis)
                .x(d => xScale(d.year))
                .y0(yScale(0))
                .y1((d, j) => {
                    if(j <= i) return yScale(d.value);
                    return yScale(0);
                })
            )
        }

        $(`#S1_area_${cnt.si}`).qtip({
            style: { classes: 'qtip-dark' },
            content: {
                text: () => {
                    return cnt.country;
                }
            },
            position: {
                target: 'mouse'
            }
        });

        if(cnt.si >= 10) continue;

        svg.append("circle")
            .attr("cx", config.width - 150)
            .attr("cy", labelOffsetY + 25 * cnt.si)
            .attr("r", 7)
            .attr("fill", col)

        svg.append("text")
            .attr("x", config.width - 140)
            .attr("y", labelOffsetY + 5 + 25 * cnt.si)
            .style("fill", "gray")
            .text(cnt.country);
    }

    const mouseText = svg.append("text")
        .attr("x", config.width - 230)
        .attr("y", config.height - 15)
        .style("fill", "white")
        .text("Year: 2020, Value: 12321321");

    svg.on("mousemove", e => {
        const xPerc = e.clientX / config.width;
        const yPerc = 1 - (e.clientY / config.height);
        mouseText.text(`Year: ${1988 + Math.round((2020 - 1988) * xPerc)}, Value: ${0 + yPerc * (1.5 * d3.max(data, d => d3.max(d.values, c => c.value)))}`);
    });
}

function ProcessData(data)
{
    let res = {};
    for(const year of data)
    {
        for(const cnt of year.values)
        {
            if(cnt.country == " World" ||
                cnt.country == "Europe & Central Asia" ||
                cnt.country == "East Asia & Pacific" ||
                cnt.country == "North America" ||
                cnt.country == "Latin America & Caribbean" ||
                cnt.country == "Middle East & North Africa" ||
                cnt.country == "Unspecified" ||
                cnt.country == "South Asia" ||
                cnt.country == "Sub-Saharan Africa" ||
                cnt.country == "Sub-Saharan Africa"
            ) continue;

            if(res[cnt.country] == undefined) res[cnt.country] = [];

            res[cnt.country].push({
                year: year.year,
                value: cnt.export
            });
        }
    }
    let keys = Object.keys(res);
    let fr = [];

    for(const key of keys)
    {
        fr.push({
            country: key,
            values: res[key]
        });
    }
    fr.sort((a, b) => -(a.values[a.values.length - 1].value - b.values[b.values.length - 1].value));

    const toSelect = 15;
    let frr = [];
    for(let i = 0; i < 10; i++) frr.push(fr[i]);

    for(let i = 10; i < fr.length; i++)
    {
        if(Math.round(Math.random() * fr.length) <= toSelect) frr.push(fr[i]);
    }

    fr = frr;

    // shuffle(fr);
    for(let i = 0; i < fr.length; i++)
    {
        fr[i].i = i;
    }

    fr.sort((a, b) => -(a.values[a.values.length - 1].value - b.values[b.values.length - 1].value));
    for(let i = 0; i < fr.length; i++)
    {
        fr[i].si = i;
    }

    return fr;
}

export async function Run(config, folder)
{
    const data = ProcessData(await d3.json(folder + "totalonly.json"));
    console.log(data);

    ShowGraph(data, config)
}
