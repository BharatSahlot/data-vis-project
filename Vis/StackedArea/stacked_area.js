import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

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

function ShowGraph(data, groups, config)
{
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

    const stacked = d3.stack()
        .keys(groups)
        (data);
    console.log(stacked);

    const xScale = d3.scaleLinear()
        .domain(d3.extent(data, d => d.year))
        .range([ 0, config.width ]);

    const yScale = d3.scaleLinear()
        .domain([0, 55000000000])
        .range([config.height, 0]);

    const color = d3.interpolateMagma;

    svg
        .selectAll("layers")
        .data(stacked)
        .join("path")
        .style("fill", (_, i) => {
            return color(1 - (i / groups.length));
        })
        .style("stroke", (_, i) => {
            return color(1 - (i / groups.length));
        })
        .attr("d", d3.area()
            .x(d => xScale(d.data.year))
            .y0(d => yScale(0))
            .y1(d => yScale(0))
        )
        .transition()
        .duration(2000)
        .attr("d", d3.area()
            .x(d => xScale(d.data.year))
            .y0(d => yScale(d[0]))
            .y1(d => yScale(d[1]))
        )
        .delay((_, i) => (200 - i) * 10)
}

function MakeDataIntoRows(data)
{
    let countries = [];
    for(const value of data[0].values)
    {
        if(value.country != " World") 
            countries.push(value.country);
    }

    for(const year of data)
    {
        let seen = [];
        for(const value of year.values)
        {
            seen.push(value.country);
        }

        let nc = [];
        for(const country of countries)
        {
            if(!seen.includes(country)) continue;
            nc.push(country);
        }
        countries = nc;
    }

    let mx = 0;
    let rows = [];
    for(const year of data)
    {
        let row = {
            year: year.year
        };
        for(const value of year.values)
        {
            if(!countries.includes(value.country)) continue;

            row[value.country] = value.export;
            if(value.export > mx) mx = value.export;
            // rows.push({
            //     year: year.year,
            //     country: value.country,
            //     exportValue: value["export"],
            //     importValue: value["import"]
            // });
        }
        rows.push(row);
    }
    console.log(mx);
    return {
        data: rows,
        groups: countries
    };
}

export async function Run(config)
{
    const data = MakeDataIntoRows(await d3.json("./totalonly.json"));

    ShowGraph(data.data, data.groups, config)
}
