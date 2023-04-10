import PRODUCTS from './products.js';
import fs from 'fs';
import iso from 'iso-3166-1';
import DownloadForProduct from './functions.js';

const country_code = process.argv[2];

let data = {
    country: iso.whereAlpha3(country_code).country,
    country_code: country_code,
    data: []
};

let queue = [];
for(const product of PRODUCTS)
{
    queue.push(DownloadForProduct(country_code, 1998, 2020, product));
}

const values = await Promise.all(queue);
for(const value of values) data.data.push(value);

fs.writeFileSync(`output/${country_code}.json`, JSON.stringify(data));

export default DownloadForProduct;
