// edge strength: percentage of import * economy / max economy
// node size: economy / max economy

import iso from 'iso-3166-1';
import xlsx from 'xlsx';
import { Download, FindCountry } from './functions.js';
import PRODUCTS from './products.js';
import fs from 'fs';
import { setInterval } from 'timers/promises';

const countries = iso.all();

let gdpFileData = xlsx.readFile("gdp.csv");
gdpFileData = xlsx.utils.sheet_to_json(gdpFileData.Sheets['Sheet1']);

let gdpData = {};
for(const row of gdpFileData)
{
    gdpData[row.Code] = row;
}

let downloaded = 0;

async function DownloadYear(year)
{
    const data = {
        year: year,
        import_data: [],
        export_data: []
    };

    let country_gdp = [];
    for(const country of countries)
    {
        if(gdpData[country.alpha3] == undefined || gdpData[country.alpha3][year] == undefined) continue;

        country_gdp.push({
            code: country.alpha3,
            gdp: gdpData[country.alpha3][year]
        });
    }
    country_gdp.sort((a, b) => a.gdp - b.gdp);
    country_gdp = country_gdp.slice(0, 25);

    for(const country of countries)
    {
        // if(!country_gdp.some((a) => a.code == country.alpha3)) continue;
        if(gdpData[country.alpha3] == undefined || gdpData[country.alpha3][year] == undefined) continue;

        // const cd = await DownloadForProduct(country.alpha3, year, year, PRODUCTS[PRODUCTS.length - 1], true);
        const import_data = await Download(country.alpha3, year, PRODUCTS[PRODUCTS.length - 1].code, false, true);

        let to_push = [];
        for(const key of Object.keys(import_data))
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
                value: import_data[key],
                perc: import_data[key] / import_data['total']
            };

            /* if(d.perc >= 0.1) */ to_push.push(d);
        }
        to_push.sort((a, b) => b.value - a.value);
        to_push = to_push.slice(0, to_push.length < 5 ? to_push.length : 5);
        for(const x of to_push) data.import_data.push(x);


        to_push = []
        const export_data = await Download(country.alpha3, year, PRODUCTS[PRODUCTS.length - 1].code, true, true);
        for(const key of Object.keys(export_data))
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
                value: export_data[key],
                perc: export_data[key] / export_data['total']
            };

            /* if(d.perc >= 0.1) */ to_push.push(d);
        }
        to_push.sort((a, b) => b.value - a.value);
        to_push = to_push.slice(0, to_push.length < 5 ? to_push.length : 5);
        for(const x of to_push) data.export_data.push(x);

        downloaded++;
    }
    return data;
}

const queue = [];

for(let i = 1998; i <= 2020; i++)
{
    queue.push(DownloadYear(i));
}

let last = 0;
setInterval(() => {
    if(downloaded == last) return;

    last = downloaded;
    console.log(downloaded);
}, 500);

const values = await Promise.all(queue);

fs.writeFileSync("./output/dependence.json", (JSON.stringify(values)));

console.log(values);
