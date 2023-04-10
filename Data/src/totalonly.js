import fs from 'fs';
import https from 'https';
import axios from 'axios';
import crypto from 'crypto';
import xlsx from 'xlsx';
import util from 'util';
import stream from 'stream';

async function Download(year)
{
    const fileName = `./temp/total-${year}.xlsx`;

    // if file doesnt already exist then only download
    if(!fs.existsSync(fileName))
    {
        const pipeline = util.promisify(stream.pipeline);

        const agent = new https.Agent({
            secureOptions: crypto.constants.SSL_OP_LEGACY_SERVER_CONNECT,
        });

        const response = await axios({
            method: 'get',
            url: `https://wits.worldbank.org/Download.aspx?Reporter=WLD&Year=${year}&Tradeflow=EXPIMP&Type=Partner&Lang=en`,
            httpsAgent: agent,
            responseType: 'stream'
        });
        if(response.status != 200)
        {
            return null;
        }
        await pipeline(response.data, fs.createWriteStream(fileName));
    }

    const workBook = xlsx.readFile(fileName);

    const data = xlsx.utils.sheet_to_json(workBook.Sheets[workBook.SheetNames[1]]);

    let res = [];
    for(const row of data)
    {
        const d = {
            country: row["Partner Name"],
            export: row["Export (US$ Thousand)"],
            import: row["Import (US$ Thousand)"],
        };
        res.push(d);
    }
    return res;
}

let queue = [];
for(let i = 1988; i <= 2020; i++)
{
    queue.push(Download(i));
}

let data = [];
for(let i = 1988; i <= 2020; i++)
{
    const res = await Download(i);
    if(res == null) continue;

    data.push({
        year: i,
        values: res
    });
}

fs.writeFileSync(`output/totalonly.json`, JSON.stringify(data));
