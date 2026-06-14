import fs from 'fs';

async function parseChannel(url) {
    try {
        // Делаем вид, что мы обычный браузер Chrome, а не робот
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7'
            }
        });

        if (!response.ok) {
            console.log(`❌ Сайт ответил статусом: ${response.status}`);
            return null;
        }

        const html = await response.text();
        
        // Регулярное выражение: ищет всё, что начинается на http(s) и заканчивается на .m3u8
        const m3u8Regex = /(https?:\/\/[^\s"'`<>]+?\.m3u8[^\s"'`<>]*)/gi;
        const matches = html.match(m3u8Regex);

        if (matches && matches.length > 0) {
            // Очищаем ссылку от возможных мусорных символов в конце
            let streamUrl = matches[0].replace(/\\/g, '');
            return streamUrl;
        }
    } catch (error) {
        console.error(`Ошибка запроса к ${url}:`, error.message);
    }
    return null;
}

async function main() {
    const channels = [
        { slug: 'ctc', name: 'СТС', group: 'Развлекательные', tvgId: 'ctc' },
        { slug: 'tnt', name: 'ТНТ', group: 'Развлекательные', tvgId: 'tnt' },
        { slug: 'pyatnica', name: 'Пятница', group: 'Развлекательные', tvgId: 'friday' }
    ];

    console.log('Запуск нового текстового парсера...');
    let m3uContent = "#EXTM3U\n";

    for (let ch of channels) {
        const channelPageUrl = `https://smotru.tv/channel/${ch.slug}`; 
        console.log(`Ищем поток для: ${ch.name}`);
        const freshStreamUrl = await parseChannel(channelPageUrl);

        if (freshStreamUrl) {
            console.log(`✅ Успех! Ссылка для ${ch.name}: ${freshStreamUrl}`);
            m3uContent += `#EXTINF:-1 tvg-id="${ch.tvgId}" group-title="${ch.group}",${ch.name}\n`;
            m3uContent += `${freshStreamUrl}\n`;
        } else {
            console.log(`❌ Поток для ${ch.name} не найден в коде страницы`);
        }
    }

    // Принудительно записываем файл, чтобы у робота всегда был результат
    fs.writeFileSync('farid.sadikh.m3u', m3uContent);
    console.log('Готово! Файл farid.sadikh.m3u успешно сохранен на диск.');
}

main();
