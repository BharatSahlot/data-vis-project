import fs from 'fs';
import https from 'https';
import axios from 'axios';
import crypto from 'crypto';
import xlsx from 'xlsx';
import util from 'util';
import stream from 'stream';
import * as cheerio from 'cheerio';
import iso from 'iso-3166-1';
import stringSimilarity from 'string-similarity';

async function Download(country_code, year, product, isExport = true, store_per_country = true)
{
    const fileName = `./temp/${country_code}-${year}-${isExport ? 'Export' : 'Import'}-${product}.xlsx`;

    // if file doesnt already exist then only download
    if(!fs.existsSync(fileName))
    {
        const pipeline = util.promisify(stream.pipeline);

        const agent = new https.Agent({
            secureOptions: crypto.constants.SSL_OP_LEGACY_SERVER_CONNECT,
        });

        const response = await axios({
            method: 'get',
            url: `https://wits.worldbank.org/Download.aspx?Reporter=${country_code}&Year=${year}&Tradeflow=${isExport ? 'Export' : 'Import'}&Partner=BY-COUNTRY&Product=${product}&Type=Product&Lang=en`,
            httpsAgent: agent,
            responseType: 'stream'
        });
        if(response.status != 200)
        {
            return;
        }
        await pipeline(response.data, fs.createWriteStream(fileName));
    }

    const workBook = xlsx.readFile(fileName);

    const data = xlsx.utils.sheet_to_json(workBook.Sheets[workBook.SheetNames[1]]);

    let res = {}, sum = 0;
    for(const row of data)
    {
        const val = row["Export (US$ Thousand)"];
        sum += parseInt(val);

        if(store_per_country) res[row["Partner Name"]] = val;
    }
    res['total'] = sum;
    return store_per_country ? res : sum;
}

export async function DownloadForProduct(country_code, start_year, end_year, product, store_per_country = true) {
    let pdata = {
        name: product.name,
        export_data: {},
        import_data: {}
    };

    let queue = [];
    for(let i = start_year; i <= end_year; i++)
    {
        queue.push(Download(country_code, i, product.code, true, store_per_country));
    }
    let values = await Promise.allSettled(queue);
    for(let i = start_year; i <= end_year; i++)
    {
        const value = values[i - start_year];
        if(value.status == "rejected") continue;

        pdata.export_data[i] = value.value;
    }

    for(let i = start_year; i <= end_year; i++)
    {
        queue.push(Download(country_code, i, product.code, false, store_per_country));
    }
    values = await Promise.allSettled(queue);
    for(let i = start_year; i <= end_year; i++)
    {
        const value = values[i - start_year];
        if(value.status == "rejected") continue;

        pdata.import_data[i] = value.value;
    }
    console.log(`Download complete for: ${country_code}`);
    return pdata;
}

export async function GetRegionOfCountry(country_code)
{
    const agent = new https.Agent({
        secureOptions: crypto.constants.SSL_OP_LEGACY_SERVER_CONNECT,
    });

    const response = await axios({
        method: 'get',
        url: `https://wits.worldbank.org/CountryProfile/en/${country_code}`,
        httpsAgent: agent,
        responseType: 'document'
    });

    if(response.status != 200)
    {
        return null;
    }

    const html = response.data;
    const dom = cheerio.load(html);

    const ele = dom(".elements > h2:nth-child(1)");
    const str = ele.html();
    if(str == undefined)
    {
        return null;
    }
    return str.split("</span>")[5].split(" <span>")[0];
}

export function FindCountry(name)
{
    const countries = iso.all();

    let best = 0, best_c = null;
    for(const country of countries)
    {
        const frac = stringSimilarity.compareTwoStrings(name, country.country);
        if(frac > best)
        {
            best = frac;
            best_c = country;
        }
    }
    return { frac: best, country: best_c };
}
