import PRODUCTS from './products.js';
import fs from 'fs';
import iso from 'iso-3166-1';
import { DownloadForProduct, GetRegionOfCountry } from './functions.js';


let regions = {};

if(!fs.existsSync("./temp/regions.json"))
{
    let queue = [];

    const countries = iso.all();
    for(const country of countries)
    {
        queue.push(GetRegionOfCountry(country.alpha3));
    }

    const values = await Promise.all(queue);
    for(const i in values)
    {
        let region = values[i];
        const country = countries[i];

        if(region == null)
        {
            continue;
        }

        if(region == '') region = 'No Region';

        region = region.replaceAll("&amp;", "&");

        if(regions[region] == undefined) regions[region] = [];

        regions[region].push(country.alpha3);
    }

    fs.writeFileSync("./temp/regions.json", (JSON.stringify(regions)));
} else 
{
    regions = JSON.parse(fs.readFileSync("./temp/regions.json"));
}


let data = [];
for(const regionName of Object.keys(regions))
{
    const region = regions[regionName];

    let d = {
        name: regionName,
        children: []
    };

    if(fs.existsSync(`./temp/continents-${regionName}.json`))
    {
        d.children = JSON.parse(fs.readFileSync(`./temp/continents-${regionName}.json`));
    } else {
        let q = [];
        for(const country of region)
        {
            const func = async () => {
                let cd = [];
                let queue = [];
                for(const product of PRODUCTS)
                {
                    queue.push(DownloadForProduct(country, 1998, 2020, product, false));
                }
                const values = await Promise.all(queue);
                for(const i in values)
                {
                    cd.push(values[i]);
                }
                return cd;
            }

            q.push(func());
        }

        const values = await Promise.all(q);
        for(const i in values)
        {
            d.children.push({
                name: region[i],
                children: values[i]
            });
        }
        fs.writeFileSync(`./temp/continents-${regionName}.json`, JSON.stringify(d.children));
    }

    data.push(d);
    console.log(`${regionName} done......`);
}
fs.writeFileSync(`output/continents.json`, JSON.stringify(data));

// let queue = [];
// for(const product of PRODUCTS)
// {
//     queue.push(DownloadForProduct(country_code, 1998, 2020, product));
// }
//
// const values = await Promise.all(queue);
// for(const value of values) data.data.push(value);
//
// fs.writeFileSync(`output/${country_code}.json`, JSON.stringify(data));
