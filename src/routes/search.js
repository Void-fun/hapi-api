const {options, handler} = require("@hapi/hapi/lib/cors");
const request = require("request");
const rp = require("request-promise");
const pdfkitDoc= require("pdfkit")
const fs = require("fs")
const PDFDocument = require("pdfkit");
const Path = require("path")
const iconv = require("iconv-lite")
const {convert} = require("html-to-text")
const delay = require('delay');

function findMostFrequent (strArr, num) {
    const map = {};
    strArr.forEach(word => {
        if(map.hasOwnProperty(word)){
            map[word]++;
        }else{
            map[word] = 1;
        }
    });
    const frequencyArr = Object.keys(map).map(key => [key, map[key]]);
    frequencyArr.sort((a, b) => b[1] - a[1]);
    return frequencyArr.slice(0, num).map(el => el[0]);
}

function containsSpecialChars(str) {
    const specialChars =
        '[`!@#$%^&*()_+-=[]{};\':"\\|,.<>/?~]1234567890/';
    return specialChars
        .split('')
        .some((specialChar) => str.includes(specialChar));
}

async function getTextByBody(url, body){
    let text = convert(body, {wordwrap: 130}).toString();
    let strings = text.toString().split('\n')
    let words = []
    for (let string of strings){
        let wordsSplited = string.split(' ')
        for (let word of wordsSplited){
            words.push(word)
        }
    }
    for (let i = 0; i< words.length; i++){
        if (containsSpecialChars(words[i])){
            delete words[i]
            continue
        }
        if(words[i].length <= 4){
            delete words[i]
        }
    }
    let topThree = findMostFrequent(words, 3)
    console.log(topThree)
    console.log(words)
    return (url.toString() + ` : ${topThree}`)
}

async function writeWords(url, body, doc){
    let text = await getTextByBody(url, body);
    doc
        .font('./fonts/DejaVuSans.ttf')
        .fontSize(25)
        .text(`${text}\n\n`);
    return text;
}

async function openFile(searchParams, urls){
    const doc = new pdfkitDoc();
    doc.pipe(fs.createWriteStream('output.pdf'));
    pdfPath = Path.join(__dirname + '\\..\\..')
    for (const key of searchParams.values()) {
        let opt = {
            url: key.toString(),
            encoding: null
        };
        let result = await rp(opt, async function (err, res, body) {
            if (!err && res.statusCode === 200) {
                console.log(key.toString());
                console.log(res.statusCode);
                let text = await writeWords(key.toString(), body, doc)
                //console.log(text);
                urls.push(key.toString());
            }
        });
    }
    doc.end()
    return doc

}

async function search(req) {
    // content-type будет автоматически генерироваться в зависимости оттого какой тип данных  в ответе
    // тут будет вместо json-а возвращасться pdf
    const searchParams = new URLSearchParams(req.url.search);
    let urls = []

    return await openFile(searchParams, urls);
}

module.exports = {
    method: 'GET', // Метод
    path: '/search', // Путь
    handler: async function (req, h) {
        await search(req);
        let filePath = Path.join(__dirname + '\\..\\..\\' + 'output.pdf');
        console.log(filePath)
        await delay(10);
        return h.file(filePath);
    },
    // handler:{
    //     file: 'output.pdf'
    // }
};

