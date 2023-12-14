const puppeteer = require('puppeteer-extra');
const stealthPlugin = require('puppeteer-extra-plugin-stealth');
const pathTo = require('path');
const PF = require('pathfinding');


(async (sleep) => {

    const getRandomTime = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

    const credentials = {
        login: 'type login',
        password: 'type pass',
        char_id: 'type char id'
    }

    const talkToNpc = async (page) => {
        try {
            const startTalking = await page.evaluate(() => localStorage.getItem('pTalkToNpc'));
            if (startTalking == 'true') {
                console.log('Zaczynam rozmawiac');
                await page.keyboard.down("q");
                await sleep(getRandomTime(300, 350));
                await page.keyboard.up("q");
                await sleep(getRandomTime(300, 350));
                await page.keyboard.down("1");
                await sleep(getRandomTime(300, 350));
                await page.keyboard.up("1");
                await page.evaluate(() => window.localStorage.setItem('pTalkToNpc', 'false'));
            }
        } catch (error) {
            console.log(error);
            await talkToNpc(page);
        }
    }

    const movePlayer = async (page) => {
        try {
            await page.waitForFunction(() => window.localStorage);
            let gMap = await page.evaluate(() => JSON.parse(localStorage.getItem('pgMap')));
            let cords = await page.evaluate(() => JSON.parse(localStorage.getItem('pmoveCords')));

            if (!gMap || !cords) return;

            if (!gMap.some(row => row.includes(0)) || !cords.start.x || !cords.start.y || !cords.end.x || !cords.end.y) return;

            for (let i = 0; i < gMap.length; i++) {
                for (let j = 0; j < gMap[i].length; j++) {
                    if (gMap[i][j] == 2 || gMap[i][j] == -2) {
                        gMap[i][j] = 0;
                    }
                }
            }

            const grid = new PF.Grid(gMap);
            const finder = new PF.AStarFinder({
                allowDiagonal: false,
                dontCrossCorner: true
            });
            const path = finder.findPath(parseInt(cords.start.x), parseInt(cords.start.y), parseInt(cords.end.x), parseInt(cords.end.y), grid);
            console.log('[LOG] Path: ' + path);

            let numberOfIgnoreMoves = 2;
            const moves = [];

            for (let i = 0; i < path.length - numberOfIgnoreMoves; i++) {
                const dx = path[i + 1][0] - path[i][0];
                const dy = path[i + 1][1] - path[i][1];
                moves.push([dx, dy]);
            }

            for (let i = 0; i < moves.length; i++) {
                const move = moves[i];

                if (i % 2 === 0) {
                    const npcs = await page.evaluate(() => JSON.parse(window.localStorage.getItem('pgameData')).npcs);
                    for (const npc of npcs) {
                        if (cords.end.x === npc.x && cords.end.y === npc.y) {
                            break;
                        }
                    }
                }


                const xBefore = await page.evaluate(() => hero.x);
                const yBefore = await page.evaluate(() => hero.y);

                let key = null;

                if (move[0] === 1) {
                    key = 'd';
                } else if (move[0] === -1) {
                    key = 'a';
                } else if (move[1] === -1) {
                    key = 'w';
                } else if (move[1] === 1) {
                    key = 's';
                }

                if (key) {
                    await page.keyboard.down(key);
                    await sleep(getRandomTime(250, 300));
                    await page.keyboard.up(key);
                }

                await page.waitForFunction(() => window.hero);
                const xAfter = await page.evaluate(() => { if (g.init == 5) return hero.x; else return null; });
                const yAfter = await page.evaluate(() => { if (g.init == 5) return hero.y; else return null; });

                if (xBefore !== null && yBefore !== null) {
                    if (xBefore + move[0] !== xAfter || yBefore + move[1] !== yAfter) {
                        break;
                    }
                }
            }

            await page.waitForFunction(() => window.localStorage);
            await page.evaluate(() => { window.localStorage.setItem('pgMap', JSON.stringify([])); });

        } catch (error) {
            console.log('ERROR: ', error);
            await movePlayer(page);
            await talkToNpc(page);
        }
    }

    try {
        puppeteer.use(stealthPlugin());
        const browser = await puppeteer.launch({
            executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
            args: [
                `--disable-features=CalculateNativeWinOcclusion,silent-debugger-extension-api`,
                `--disable-extensions-except=${pathTo.join(process.cwd(), 'extension')}`,
                `--load-extension=${pathTo.join(process.cwd(), 'extension')}`
            ],
            headless: false,
            defaultViewport: null
        });
        const page = await browser.newPage();

        await page.goto('https://www.margonem.pl');
        await page.waitForSelector('p:nth-child(7) > a');
        await page.click('p:nth-child(7) > a');

        await page.waitForSelector('#login-input');
        await page.type('#login-input', credentials.login);
        await page.type('#login-password', credentials.password);
        await page.click('#js-login-btn');

        await page.waitForSelector('.c-btn.enter-game');
        await page.click('.select-char');
        await page.waitForSelector(`.charc[data-id="${credentials.char_id}"]`);
        await page.click(`.charc[data-id="${credentials.char_id}"]`);


        await page.waitForSelector('.c-btn.enter-game');
        await page.click('.c-btn.enter-game');

        await page.setCookie({
            name: "interface",
            value: "si",
            domain: await page.evaluate(() => window.location.host)
        });
        await page.setCookie({
            name: "__mExts",
            value: "v120%2Cv282%2Cv4351%2Cv10015%2Cv36400%2Cv64196%2Cv98459%2Cv114320%2Cv114899",
            domain: await page.evaluate(() => window.location.host)
        });
        await page.reload({ waitUntil: ["networkidle0", "domcontentloaded"] });
        await page.focus("#centerbox");
        await page.evaluate(() => window.mAlert = () => { });

        while (true) {
            await movePlayer(page);
            await talkToNpc(page);
        }

    } catch (error) {
        console.log('ERROR: ', error);
    }

})((ms) => new Promise((resolve) => setTimeout(resolve, ms)))