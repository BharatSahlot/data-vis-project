// edge strength: percentage of import * economy / max economy
// node size: economy / max economy

import iso from 'iso-3166-1';
import xlsx from 'xlsx';
import { DownloadForProduct, FindCountry } from './functions.js';
import PRODUCTS from './products.js';
import fs from 'fs';

const countries = iso.all();

let gdpFileData = xlsx.readFile("gdp.csv");
gdpFileData = xlsx.utils.sheet_to_json(gdpFileData.Sheets['Sheet1']);

let gdpData = {};
for(const row of gdpFileData)
{
    gdpData[row.Code] = row;
}

async function DownloadYear(year)
{
    const data = {
        year: year,
        import_data: [],
        export_data: []
    };
    for(const country of countries)
    {
        if(gdpData[country.alpha3] == undefined || gdpData[country.alpha3][year] == undefined) continue;

        const cd = await DownloadForProduct(country.alpha3, year, year, PRODUCTS[PRODUCTS.length - 1], true);
        for(const key of Object.keys(cd.import_data[year]))
        {
            if(key == 'total' || key == 'Unspecified') continue;

            let b = iso.whereCountry(key);
            if(b == undefined)
            {
                const r = FindCountry(key);
                b = r.country;
            }
            b = b.alpha3;

            const d = {
                a: country.alpha3,
                b: b,
                gdp: gdpData[country.alpha3][year],
                value: cd.import_data[year][key],
                perc: cd.import_data[year][key] / cd.import_data[year]['total']
            };

            if(d.perc >= 0.1) data.import_data.push(d);
        }

        for(const key of Object.keys(cd.export_data[year]))
        {
            if(key == 'total' || key == 'Unspecified') continue;

            let b = iso.whereCountry(key);
            if(b == undefined)
            {
                const r = FindCountry(key);
                b = r.country;
            }
            b = b.alpha3;

            const d = {
                a: country.alpha3,
                b: b,
                gdp: gdpData[country.alpha3][year],
                value: cd.export_data[year][key],
                perc: cd.export_data[year][key] / cd.export_data[year]['total']
            };

            if(d.perc >= 0.1) data.export_data.push(d);
        }
    }
    return data;
}

const queue = [];

for(let i = 1998; i <= 2020; i++)
{
    queue.push(DownloadYear(i));
}

const values = await Promise.all(queue);

fs.writeFileSync("./output/dependence.json", (JSON.stringify(values)));

console.log(values);
