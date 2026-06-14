import puppeteer from 'puppeteer';
import fs from 'fs';

async function parseChannel(url) {
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    let streamUrl = null;

    try {
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        await page.setRequestInterception(true);
        page.on('request', request => {
            const reqUrl = request.url();
            if (reqUrl.includes('.m3u8')) {
                streamUrl = reqUrl;
            }
            request.continue();
        });

        console.log(`Открываем страницу: ${url}`);
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        await new Promise(resolve => setTimeout(resolve, 5000));

    } catch (error) {
        console.error(`Ошибка при парсинге страницы:`, error);
    } finally {
        await browser.close();
    }

    return streamUrl;
}

async function main() {
    const channels = [
        { slug: 'ctc', name: 'СТС', group: 'Развлекательные', tvgId: 'ctc' },
        { slug: 'tnt', name: 'ТНТ', group: 'Развлекательные', tvgId: 'tnt' },
        { slug: 'pyatnica', name: 'Пятница', group: 'Развлекательные', tvgId: 'friday' }
    ];

    console.log('Запуск парсера плейлиста...');
    let m3uContent = "#EXTM3U\n";

    for (let ch of channels) {
        const channelPageUrl = `https://smotru.tv/channel/${ch.slug}`; 
        console.log(`Ищем поток для: ${ch.name}`);
        const freshStreamUrl = await parseChannel(channelPageUrl);

        if (freshStreamUrl) {
            console.log(`✅ Найдена ссылка для ${ch.name}`);
            m3uContent += `#EXTINF:-1 tvg-id="${ch.tvgId}" group-title="${ch.group}",${ch.name}\n`;
            m3uContent += `${freshStreamUrl}\n`;
        } else {
            console.log(`❌ Не удалось найти поток для ${ch.name}`);
        }
    }

    // Файл создастся в любом случае под твоим именем, чтобы Git не выдавал ошибку 128
    fs.writeFileSync('farid.sadikh.m3u', m3uContent);
    console.log('Файл farid.sadikh.m3u успешно обновлен!');
}

main();