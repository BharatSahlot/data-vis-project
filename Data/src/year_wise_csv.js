import iso from 'iso-3166-1';
import { DownloadForProduct } from './functions.js';
import PRODUCTS from './products.js';
import fs from 'fs';

const countries = iso.all();
let downloaded = 0;

async function DownloadForCountry(country)
{
    if(fs.existsSync(`./temp/year_wise_${country.alpha3}.json`))
    {
        return JSON.parse(fs.readFileSync(`./temp/year_wise_${country.alpha3}.json`));
    }

    let rows = [];
    for(let year = 1988; year <= 2020; year++)
    {
        rows.push({
            year: year,
            country: country.country,
            country_code: country.alpha3,
        });
    }

    let queue = [];
    for(let i = 0; i < PRODUCTS.length; i++)
    {
        queue.push(DownloadForProduct(country.alpha3, 1988, 2020, PRODUCTS[i], false));
    }

    const values = await Promise.all(queue);
    for(let i = 0; i < PRODUCTS.length; i++)
    {
        const data = values[i];
        for(let year = 1988; year <= 2020; year++)
        {
            let ex = data.export_data[year];
            let im = data.import_data[year];

            if(ex == undefined) ex = 0;
            if(im == undefined) im = 0;

            rows[year - 1988][PRODUCTS[i].code] = ex + im;
        }
    }
    fs.writeFileSync(`./temp/year_wise_${country.alpha3}.json`, JSON.stringify(rows));
    downloaded++;
    console.log(`Done for ${country.country}: ${downloaded} / ${countries.length}`);
    return rows;
}

let queue = [];
for(const country of countries)
{
    queue.push(DownloadForCountry(country));
}



const values = await Promise.all(queue);

let res = [];
for(const value of values)
{
    res = [ ...res, ...value ]
}
console.log(res);

// TODO: csv
fs.writeFileSync("./output/year_wise.json", (JSON.stringify(res)));
