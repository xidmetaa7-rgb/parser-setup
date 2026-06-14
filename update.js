import puppeteer from 'puppeteer';
import fs from 'fs';

async function parseChannel(url) {
    // Запуск скрытого браузера Chromium
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    let streamUrl = null;

    try {
        // Устанавливаем User-Agent как у обычного компьютера
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        // Перехватываем все сетевые запросы страницы, чтобы поймать .m3u8
        await page.setRequestInterception(true);
        page.on('request', request => {
            const reqUrl = request.url();
            if (reqUrl.includes('.m3u8')) {
                streamUrl = reqUrl; // Сохраняем найденную ссылку на поток
            }
            request.continue();
        });

        // Переходим на страницу канала на smotru.tv
        console.log(`Открываем страницу: ${url}`);
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

        // Даем плееру 5 секунд на подгрузку потока
        await new Promise(resolve => setTimeout(resolve, 5000));

    } catch (error) {
        console.error(`Ошибка при парсинге страницы:`, error);
    } finally {
        await browser.close();
    }

    return streamUrl;
}

async function main() {
    // Пример: парсим страницу канала СТС (замени на точный URL канала на этом сайте)
    const channelPageUrl = 'https://smotru.tv/channel/ctc'; 
    
    console.log('Запуск парсера...');
    const freshStreamUrl = await parseChannel(channelPageUrl);

    if (freshStreamUrl) {
        console.log(`Успешно нашли поток: ${freshStreamUrl}`);

        // Собираем новый файл плейлиста playlist.m3u
        const m3uContent = `#EXTM3U\n#EXTINF:-1 tvg-id="ctc" group-title="Общие",СТС\n${freshStreamUrl}\n`;
        
        fs.writeFileSync('playlist.m3u', m3uContent);
        console.log('Файл playlist.m3u успешно обновлен!');
    } else {
        console.log('Не удалось вытащить ссылку .m3u8 с этой страницы.');
    }
}

main();