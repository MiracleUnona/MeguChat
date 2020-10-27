const version = '0.0.7';

const fs = require('fs');
const net = require('net');
const red = text => `\u001b[31m${text}\u001b[0m`;
const green = text => `\u001b[32m${text}\u001b[0m`;
const yellow = text => `\u001b[33m${text}\u001b[0m`;
const blue = text => `\u001b[34m${text}\u001b[0m`;
const ping = text => `\u001b[47m\u001B[30m${text}\u001b[0m`;
const redPing = text => `\u001b[47m\u001b[31m${text}\u001b[0m\u001b[47m\u001b[30m`;
let me = '';
let cooldown = false;
let readline;
function input(question) {
    return new Promise(resolve => {
        readline = require('readline').createInterface({
            input: process.stdin,
            output: process.stdout
        });
    
        readline.question(question, answer => {
            process.stdout.clearLine();
            process.stdout.cursorTo(0, process.stdout.rows - 2);
            process.stdout.clearLine();
            readline.close();
            resolve(answer);
        });
    });
}

function write(data) {
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write(data);
}

const client = net.createConnection({
    port: 228,
    host: 'chat.megu.one'
}, async () => {
    const username = await input('Введите ваш юзернейм английскими буквами: ');
    client.write(JSON.stringify({username, version}));

    while (!0) {
        //слоумод ХАХАХАха на стороне клиента заебись
        const message = await input('> ');
        console.log(`${green(username)}: ${message}`);
        if(cooldown) return;
        client.write(message.trim());
    }
});

client.on('data', d => {
    let data;
    try { 
        data = JSON.parse(d.toString());
    } catch {
        return;
    }

    if (data.type === 'message') {
        if(data.content.includes('@'+me)) write(`${green(data.author)}: ${ping(data.content.replace(/!@\w{1,18}/g, match => redPing(match.slice(1))))}\n> ${readline.line || ''}`);
        else write(`${data.bot ? blue(data.author) : green(data.author)}: ${data.content.replace(/!@\w{1,18}/g, match => yellow(match.slice(1)))}\n> ${readline.line || ''}`);
    } else if (data.type === 'ratelimit') {
        process.stdout.clearLine();
        process.stdout.cursorTo(0, process.stdout.rows - 2);
        process.stdout.clearLine();
        if(!cooldown){
        cooldown = true;
        setTimeout(() => {tf = false;}, 1000);
        }
        console.log(`Не так быстро блять! Жди ${+(data.remain / 1000).toFixed(1)}с`);
    } else if (data.type === 'welcome') {
        write(`${data.bot ? blue(data.member) : red(data.member)} присоединяется к вечеринке!\nСейчас онлайн: ${data.members.map(m => yellow(m)).join(', ')}\n> ${readline.line || ''}`);
        if (!me) me = data.member;
    } else if (data.type === 'goodbye') {
        write(`${data.bot ? blue(data.member) : red(data.member)} покидает канал.\nСейчас онлайн: ${data.members.map(m => yellow(m)).join(', ')}\n> ${readline.line || ''}`);
    } else if (data.type === 'update') {
        console.log('Обновление клиента...');

        const buffers = [];
        client.on('data', d => buffers.push(d));
        client.on('end', () => {
            fs.writeFileSync(`./${process.argv[1].match(/\w+.js$/)[0]}`, Buffer.concat(buffers));
            console.log('Запустите клиент заново');
            process.exit(0);
        });
    }
});

client.on('error', () => {
    console.log('Сервер временно недоступен');
});

client.on('close', () => {
    console.log('смэрт');
    setTimeout(() => process.exit(0), 3000);
});
