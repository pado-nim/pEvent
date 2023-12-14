(async (sleep) => {

    localStorage.getItem('pgMap') || localStorage.setItem('pgMap', JSON.stringify([]));
    localStorage.getItem('pmoveCords') || localStorage.setItem('pmoveCords', JSON.stringify([]));

    const getGameData = () => {
        const data = {
            npcs: [],
            mobs: []
        }
        g.npc.forEach((val, key) => g.npc[key] != null ? data.npcs.push(g.npc[key]) : null);
        data.npcs.forEach(npc => (npc.type == 2 || npc.type == 3) ? data.mobs.push(npc) : null);
        return data;
    }
    localStorage.getItem('pgameData') || localStorage.setItem('pgameData', JSON.stringify([]));

    const getRandomTime = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

    const initMapCols = () => {
        gMap = [];

        for (i = 0; i < map.y; i++) {
            gMap.push([]);
            for (j = 0; j < map.x; j++) {
                gMap[i].push(0);
            }
        }

        x = 0;
        y = 0;

        for (i = 1; i <= map.x * map.y; i++) {
            if (x > map.x - 1) {
                x = 0;
                y++;
            }
            if (map.col.charAt(x + y * map.x) == "1") gMap[y][x] = 1;
            else gMap[y][x] = 0;
            x++;
        }

        let gameData = getGameData();

        gameData.npcs.forEach(npc => {
            if (npc.nick.toLowerCase() == 'mokra zaspa'){
                gMap[npc.y][npc.x] = 2;
            }
            else if (npc.type !== 4) gMap[npc.y][npc.x] = 1;
        });
        gameData.mobs.forEach(mob => {
            gMap[mob.y][mob.x] = 1;
        });

        return gMap;
    }

    const resetMap = (arr) => {
        arr.forEach((row, i) => {
            row.forEach((item, j) => {
                if (item == -1) {
                    arr[i][j] = 0;
                }
            });
        });
    }

    const move = (cords, gMap) => {
        localStorage.setItem('pmoveCords', JSON.stringify({ start: { x: hero.x, y: hero.y }, end: cords }));
        localStorage.setItem('pgMap', JSON.stringify(gMap));
        localStorage.setItem('pisMoving', 'true');
    }


    while (true) {
        if (g.init < 5) {
            await sleep(2000);
            continue;
        }
        localStorage.setItem('pgameData', JSON.stringify(getGameData()));
        let targetNpc = Object.values(g.npc).filter(target => target.nick.toLowerCase() == 'mokra zaspa');
        let availableNPCs = [];
        for(let i in targetNpc){
            availableNPCs.push({
                id: targetNpc[i].id,
                x: targetNpc[i].x,
                y: targetNpc[i].y,
                distance: Math.abs(hero.x - targetNpc[i].x) + Math.abs(hero.y - targetNpc[i].y)
            });
        }
        if(availableNPCs != ''){
            availableNPCs = availableNPCs.sort((a, b) => (a.distance > b.distance) ? 1 : -1);
            if(availableNPCs[0].distance > 2) {
                move({ x: availableNPCs[0].x, y: availableNPCs[0].y }, initMapCols());
            } else localStorage.setItem('pTalkToNpc', 'true');
        }else resetMap(initMapCols());
        await sleep(getRandomTime(150, 200));
    }
})((ms) => new Promise((resolve) => setTimeout(resolve, ms)))