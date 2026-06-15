import fs from 'fs';

async function main() {
    const mainUrl = 'https://smotru.tv/';
    console.log('Запуск парсера исходного кода главной страницы...');

    try {
        const response = await fetch(mainUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7'
            }
        });

        if (!response.ok) {
            console.log(`❌ Сайт ответил статусом: ${response.status}`);
            return;
        }

        const html = await response.text();
        console.log('Исходный код страницы успешно получен. Ищем потоки .m3u8...');

        // Ищем все ссылки на потоки .m3u8 в коде страницы
        const m3u8Regex = /(https?:\/\/[^\s"'`<>]+?\.m3u8[^\s"'`<>]*)/gi;
        const foundUrls = html.match(m3u8Regex) || [];

        let m3uContent = "#EXTM3U\n";
        
        // Карта каналов, которые мы ищем в ссылках
        const channelConfig = [
            { keyword: 'ctc', name: 'СТС', group: 'Развлекательные', tvgId: 'ctc' },
            { keyword: 'tnt', name: 'ТНТ', group: 'Развлекательные', tvgId: 'tnt' },
            { keyword: 'friday', name: 'Пятница', group: 'Развлекательные', tvgId: 'friday' },
            { keyword: 'pyatnica', name: 'Пятница', group: 'Развлекательные', tvgId: 'friday' }
        ];

        let foundAny = false;

        // Фильтруем найденные m3u8 ссылки по ключевым словам каналов
        for (let url of foundUrls) {
            let cleanUrl = url.replace(/\\/g, ''); // Очищаем от экранирования
            
            for (let ch of channelConfig) {
                if (cleanUrl.toLowerCase().includes(ch.keyword)) {
                    console.log(`✅ Найдена ссылка для ${ch.name}: ${cleanUrl}`);
                    m3uContent += `#EXTINF:-1 tvg-id="${ch.tvgId}" group-title="${ch.group}",${ch.name}\n`;
                    m3uContent += `${cleanUrl}\n`;
                    foundAny = true;
                }
            }
        }

        // Если конкретные каналы не отфильтровались, запишем вообще ВСЕ найденные .m3u8 потоки, чтобы плейлист не был пустым
        if (!foundAny && foundUrls.length > 0) {
            console.log(`Конкретные СТС/ТНТ не найдены, сохраняем все найденные потоки (${foundUrls.length} шт.)...`);
            foundUrls.forEach((url, index) => {
                let cleanUrl = url.replace(/\\/g, '');
                m3uContent += `#EXTINF:-1 group-title="Сканированные",Канал ${index + 1}\n`;
                m3uContent += `${cleanUrl}\n`;
            });
        }

        fs.writeFileSync('IPTV by Farid Sadikh.m3u', m3uContent);
        console.log('Файл IPTV by Farid Sadikh.m3u успешно сохранен!');

    } catch (error) {
        console.error('Ошибка при парсинге кода сайта:', error.message);
        // Создаем базовый файл в любом случае, чтобы Git не падал
        fs.writeFileSync('farid.sadikh.m3u', '#EXTM3U\n');
    }
}

main();
