import fs from 'fs';
import https from 'https';
import axios from 'axios';
import crypto from 'crypto';
import xlsx from 'xlsx';
import util from 'util';
import stream from 'stream';
import iso from 'iso-3166-1';

const qSize = 500;
let queue = [];
let downloaded = 0, failed = 0;

async function Download(country_code, year, isExport = true)
{
    const fileName = `output/${country_code}-${year}-${isExport ? 'Export' : 'Import'}.xlsx`;
    if(fs.existsSync(fileName)) return;

    const pipeline = util.promisify(stream.pipeline);

    const agent = new https.Agent({
        secureOptions: crypto.constants.SSL_OP_LEGACY_SERVER_CONNECT,
    });

    const response = await axios({
        method: 'get',
        url: `https://wits.worldbank.org/Download.aspx?Reporter=${country_code}&Year=${year}&Tradeflow=${isExport ? 'Export' : 'Import'}&Type=Partner&Lang=en`,
        httpsAgent: agent,
        responseType: 'stream'
    });
    if(response.status != 200)
    {
        failed++;
        return;
    }

    await pipeline(response.data, fs.createWriteStream(fileName));
}

const codes = iso.all();
const startYear = 1998, endYear = 2020;

for(const country of codes)
{
    for(let i = startYear; i <= endYear; i++)
    {
        queue.push(Download(country.alpha3, i));
        if(queue.length > qSize)
        {
            await Promise.all(queue);
            downloaded += queue.length;
            queue = [];

            console.log(`Downloaded: ${downloaded}, Failed: ${failed}, Current Country: ${country.country}`);
        }
    }
}

await Promise.all(queue);
downloaded += queue.length;
queue = [];
            
console.log(`Downloaded: ${downloaded}`);

let out = 'from,to,year,flow,amount\n';
for(const country of codes)
{
    for(let i = startYear; i <= endYear; i++)
    {
        const fileName = `output/${country.alpha3}-${i}-Export.xlsx`;
        if(!fs.existsSync(fileName)) continue;

        const workBook = xlsx.readFile(fileName);

        const data = xlsx.utils.sheet_to_json(workBook.Sheets[workBook.SheetNames[1]]);
        for(const row of data)
        {
            if(row['Export (US$ Thousand)'] == undefined) continue;

            out += `${row['Reporter Name']},${row['Partner Name']},${row['Year']},${row['Trade Flow']},${row['Export (US$ Thousand)']}\n`;
        }
    }
    console.log(`${country.country} done`);
}
fs.writeFileSync('combined.csv', out);
