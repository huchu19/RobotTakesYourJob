/* ============================================================
   RENDER — pixel art office diorama on a 320x180 canvas.
   All sprites are code-generated from string grids below;
   no image assets. Reads Game.state, never mutates it.
   ============================================================ */

const Renderer = (() => {

  const W = 320, H = 180;
  const FLOOR_Y = 112;

  /* ---------- global sprite palette ---------- */
  const PAL = {
    '.': null,
    'k': '#1c1d24',   // outline
    's': '#e8b088',   // skin
    'S': '#c98d66',   // skin shadow
    'h': '#4e3826',   // hair
    'w': '#e9e4d4',   // shirt
    't': '#7c6f4e',   // tie
    'c': '#d7dde6',   // chrome light
    'C': '#98a2b2',   // chrome mid
    'd': '#5c6470',   // chrome dark
    'r': '#ff2a3c',   // neon red
    'R': '#8d1420',   // dark red
    'y': '#e8c84a',   // yellow
    'g': '#59c135',   // green
    'G': '#2e6b1e',   // dark green
    'b': '#9fe0e0',   // screen glow
    'B': '#24303e',   // dark screen
    'o': '#8a6a48',   // wood
    'O': '#66492f',   // dark wood
    'e': '#d6cdb8',   // beige / manila
    'E': '#b3a98f',   // beige shadow
    'n': '#f4f1e8',   // paper white
    'u': '#6e7687',   // steel blue
  };

  /* ---------- sprite grids ---------- */
  const GRIDS = {

    player: [
      '......hhhh......',
      '.....hhhhhh.....',
      '.....hssssh.....',
      '.....ssssss.....',
      '.....skssks.....',
      '.....ssssss.....',
      '......ssss......',
      '.....wwwwww.....',
      '....wwwtwwww....',
      '...wwwwttwwww...',
      '...wwwwttwwww...',
      '..swwwwttwwwws..',
      '..swwwwttwwwws..',
      '...wwwwwwwwww...',
    ],

    robot1: [
      '....kkkkkkkk....',
      '...kccCCCCCck...',
      '...kcRrrrrRck...',
      '...kccCCCCCck...',
      '....kkkkkkkk....',
      '.......kk.......',
      '....kkkkkkkk....',
      '...kCCCCCCCCk...',
      '..kkCCrrCCCCkk..',
      '.kdkCCCCCCCCkdk.',
      '.kdkCCCCCCCCkdk.',
      '.kdkCCCCCCCCkdk.',
      '.k.kCCCCCCCCk.k.',
      '...kkkkkkkkkk...',
      '....kdd..ddk....',
      '....kdd..ddk....',
      '....kdd..ddk....',
      '...kkdd..ddkk...',
      '...kdddkkdddk...',
      '...kkkk..kkkk...',
    ],

    robot2: [
      '.....kkkkkkkk.....',
      '....kccCCCCCck....',
      '....kcrrrrrrck....',
      '....kccCCCCCck....',
      '.....kkkkkkkk.....',
      '........kk........',
      '...kkkkkkkkkkkk...',
      '..kCCCCCCCCCCCCk..',
      '..kCCrrCCCCrrCCk..',
      '.kkkCCCCCCCCCCkkk.',
      '.kdkCCCcccCCCCkdk.',
      '.kdkCCCCCCCCCCkdk.',
      '.kdkCCCCCCCCCCkdk.',
      '.krkCCCCCCCCCCkrk.',
      '.kkkkkkkkkkkkkkkk.',
      '....kddkkkkddk....',
      '....kdd....ddk....',
      '....kdd....ddk....',
      '....kdd....ddk....',
      '...kkddk..kddkk...',
      '...kdddd..ddddk...',
      '...kkkkk..kkkkk...',
    ],

    robot3: [
      '..rr............rr..',
      '.krrk..........krrk.',
      '.kddk.kkkkkkkk.kddk.',
      '.kdk.kccCCCCcck.kdk.',
      '.kdk.kcrrrrrrck.kdk.',
      '.kdk.kcrrrrrrck.kdk.',
      '.kdk.kccCCCCcck.kdk.',
      '.kdk..kkkkkkkk..kdk.',
      '.kdk.....kk.....kdk.',
      '.kdkkkkkkkkkkkkkkdk.',
      '.kkCCCCCCCCCCCCCCkk.',
      '..kCCrrrCCCCrrrCCk..',
      '..kCCCCCCCCCCCCCCk..',
      '..kCCCcccccccCCCCk..',
      '..kCCCcrrrrrcCCCCk..',
      '..kCCCcccccccCCCCk..',
      '..kCCCCCCCCCCCCCCk..',
      '..kkkkkkkkkkkkkkkk..',
      '.....kddkkkkddk.....',
      '.....kdd....ddk.....',
      '.....kdd....ddk.....',
      '.....kdd....ddk.....',
      '.....kdd....ddk.....',
      '....kkddk..kddkk....',
      '....kdddd..ddddk....',
      '....kkkkk..kkkkk....',
    ],

    monitor: [
      '..kkkkkkkkkk..',
      '.kBBBBBBBBBBk.',
      '.kBbbbbbbbbBk.',
      '.kBbBBbBBbbBk.',
      '.kBbbbbbbbbBk.',
      '.kBbBBBbBbbBk.',
      '.kBbbbbbbbbBk.',
      '.kBBBBBBBBBBk.',
      '..kkkkkkkkkk..',
      '.....kkkk.....',
      '...kkkkkkkk...',
    ],

    posterHang: [
      'kkkkkkkkkkkkkkkkkkkk',
      'kEEEEEEEEEEEEEEEEEEk',
      'kEnnnnnnnnnnnnnnnnEk',
      'kEnnnnnyyyynnnnnnnEk',
      'kEnnnnyyyyyynnnnnnEk',
      'kEnnnnyyyyyynnnnnnEk',
      'kEnnnnnyyyynnnnnnnEk',
      'kEnnnnnnhhnnnnnnnnEk',
      'kEnnnnnhhhhnnnnnnnEk',
      'kEnnnnhhhhhhnnnnnnEk',
      'kEnnnnnhnnhnnnnnnnEk',
      'kEnnnnnnnnnnnnnnnnEk',
      'kEnkkkkknnnkkkkkknEk',
      'kEnnnnnnnnnnnnnnnnEk',
      'kEnnkkkkkkkkkkknnnEk',
      'kEnnnnnnnnnnnnnnnnEk',
      'kkkkkkkkkkkkkkkkkkkk',
    ],

    posterObey: [
      'kkkkkkkkkkkkkkkkkkkk',
      'kBBBBBBBBBBBBBBBBBBk',
      'kBBBBBBBBBBBBBBBBBBk',
      'kBBBBkkkkkkkkkBBBBBk',
      'kBBBkCCCCCCCCCkBBBBk',
      'kBBBkCrrrrrrrCkBBBBk',
      'kBBBkCrrrrrrrCkBBBBk',
      'kBBBkCCCCCCCCCkBBBBk',
      'kBBBBkkkkkkkkkBBBBBk',
      'kBBBBBBBBBBBBBBBBBBk',
      'kBBrrkkrrkkrrkkrrBBk',
      'kBBrBrBrBBBrBBrBrBBk',
      'kBBrrkBrBBBrBBrrkBBk',
      'kBBrBrBrBBBrBBrBBBBk',
      'kBBrrkkrrBBrBBrrkBBk',
      'kBBBBBBBBBBBBBBBBBBk',
      'kkkkkkkkkkkkkkkkkkkk',
    ],

    clock: [
      '...kkkkk...',
      '..knnnnnk..',
      '.knnnnnnnk.',
      'knnnnnnnnnk',
      'knnnnnnnnnk',
      'knnnnknnnnk',
      'knnnnnnnnnk',
      'knnnnnnnnnk',
      '.knnnnnnnk.',
      '..knnnnnk..',
      '...kkkkk...',
    ],

    mug: [
      '.kkk..',
      'knnkk.',
      'knnkgk',
      'knnkk.',
      '.kkk..',
    ],

    /* ---------- task icons, 10x10 ---------- */
    icon_report: [
      '..........',
      '.kkkkkkk..',
      '.knnnnnk..',
      '.knkkknk..',
      '.knnnnnk..',
      '.knkkknk..',
      '.knnnnnk..',
      '.knkknnk..',
      '.kkkkkkk..',
      '..........',
    ],
    icon_folder: [
      '..........',
      '..........',
      '.kkkk.....',
      '.keeekkkk.',
      '.keeeeeek.',
      '.keeeeeek.',
      '.keeeeeek.',
      '.keeeeeek.',
      '.kkkkkkkk.',
      '..........',
    ],
    icon_mail: [
      '..........',
      '..........',
      '.kkkkkkkk.',
      '.kknnnnkk.',
      '.knknnknk.',
      '.knnkknnk.',
      '.knnnnnnk.',
      '.kkkkkkkk.',
      '..........',
      '..........',
    ],
    icon_meeting: [
      '..........',
      '..ss..ss..',
      '..ss..ss..',
      '.kwwk.kwwk',
      '.kwwk.kwwk',
      '.oooooooo.',
      '.oooooooo.',
      '..k....k..',
      '..k....k..',
      '..........',
    ],
    icon_car: [
      '..........',
      '..........',
      '..kkkkk...',
      '.kbbkbbk..',
      'kkkkkkkkk.',
      'kCCCCCCkr.',
      'kCCCCCCkk.',
      'kkkkkkkkk.',
      '.kk...kk..',
      '..........',
    ],
    icon_wrench: [
      '..........',
      '...kCCk...',
      '...kCCk...',
      '...kCCk...',
      '...kCCk...',
      '...kCCkkk.',
      '...kCCCCk.',
      '...kkkkkk.',
      '..........',
      '..........',
    ],
    icon_star: [
      '....yy....',
      '....yy....',
      '...yyyy...',
      '.yyyyyyyy.',
      '..yyyyyy..',
      '...yyyy...',
      '..yy..yy..',
      '.yy....yy.',
      '..........',
      '..........',
    ],
    icon_dog: [
      '..........',
      '..........',
      '.kk....kk.',
      'knnkkkknnk',
      'knnnnnnnnk',
      'knnkkkknnk',
      '.kk....kk.',
      '..........',
      '..........',
      '..........',
    ],
    icon_sorry: [
      '..kkkkkk..',
      '..knnnnn..',
      '..knnnnn..',
      '..knnnn...',
      '..knnn....',
      '..k.......',
      '..k.......',
      '..k.......',
      '..k.......',
      '..........',
    ],
    icon_pickle: [
      '..........',
      '....kk....',
      '...kggk...',
      '..kggggk..',
      '..kgGggk..',
      '..kggGgk..',
      '..kgggGk..',
      '..kggggk..',
      '...kggk...',
      '....kk....',
    ],
    icon_captcha: [
      'kkkkkkkkkk',
      'kbbkbbkbbk',
      'kbbkbbkbbk',
      'kkkkkkkkkk',
      'kbbkggkbbk',
      'kbbkggkbbk',
      'kkkkkkkkkk',
      'kbbkbbkbbk',
      'kbbkbbkbbk',
      'kkkkkkkkkk',
    ],
    icon_vibes: [
      '..........',
      '..y....b..',
      '.yyy..bbb.',
      '..y....b..',
      '..........',
      '....yy....',
      '...yyyy...',
      '....yy....',
      '..........',
      '..........',
    ],
    icon_couch: [
      '..........',
      '..........',
      '.kk....kk.',
      '.kRRRRRRk.',
      'kRRrrrrRRk',
      'kRRRRRRRRk',
      'kkkkkkkkkk',
      '.k......k.',
      '..........',
      '..........',
    ],
  };

  /* icon key used in DATA.tasks -> grid name */
  const ICON_MAP = {
    report: 'icon_report', folder: 'icon_folder', mail: 'icon_mail',
    meeting: 'icon_meeting', car: 'icon_car', wrench: 'icon_wrench',
    star: 'icon_star', dog: 'icon_dog', sorry: 'icon_sorry',
    pickle: 'icon_pickle', captcha: 'icon_captcha', vibes: 'icon_vibes',
    couch: 'icon_couch',
  };

  /* ---------- sprite baking ---------- */
  const sprites = {};
  function bake(name) {
    const grid = GRIDS[name];
    const h = grid.length, w = grid[0].length;
    const cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    const c = cv.getContext('2d');
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const col = PAL[grid[y][x]];
        if (!col) continue;
        c.fillStyle = col;
        c.fillRect(x, y, 1, 1);
      }
    }
    sprites[name] = cv;
    return cv;
  }
  function spr(name) { return sprites[name] || bake(name); }

  /* ---------- helpers ---------- */
  let ctx = null;
  let stage = null;

  function px(x, y, w, h, col) { ctx.fillStyle = col; ctx.fillRect(x | 0, y | 0, w, h); }

  function lerpColor(a, b, t) {
    const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
    const r = ((pa >> 16) + (((pb >> 16) - (pa >> 16)) * t)) | 0;
    const g = (((pa >> 8) & 255) + ((((pb >> 8) & 255) - ((pa >> 8) & 255)) * t)) | 0;
    const bl = ((pa & 255) + (((pb & 255) - (pa & 255)) * t)) | 0;
    return `rgb(${r},${g},${bl})`;
  }

  /* ---------- transient FX state ---------- */
  const floaters = [];   // {x,y,vy,text,color,life}
  const arcs = [];       // flying stolen-task icons {icon, t}
  const sparks = [];     // {x,y,vx,vy,life,color}
  let flash = 0;

  const DESK = { x: 26, w: 72, top: 124 };
  const ROBOT_X = 252;
  const SHELF = { x: 222, w: 88, y1: 46, y2: 66 };

  function floater(text, color, x, y) {
    floaters.push({
      x: x !== undefined ? x : DESK.x + 34 + Math.random() * 20,
      y: y !== undefined ? y : 104,
      vy: -14, text, color, life: 1.4,
    });
    if (floaters.length > 24) floaters.shift();
  }

  function learnFx(task) {
    arcs.push({ icon: ICON_MAP[task.icon], t: 0, slot: Game.state.robot.absorbed - 1 });
    flash = 0.5;
    for (let i = 0; i < 14; i++) {
      sparks.push({
        x: ROBOT_X + 8, y: 130, vx: (Math.random() - 0.5) * 60,
        vy: -Math.random() * 55, life: 0.7 + Math.random() * 0.4, color: '#ff2a3c',
      });
    }
  }

  function sabotageFx(kind) {
    const col = kind === 'coffee' ? '#6b4a2a' : '#e8c84a';
    for (let i = 0; i < 18; i++) {
      sparks.push({
        x: ROBOT_X + 8 + (Math.random() - 0.5) * 14, y: 118 + Math.random() * 20,
        vx: (Math.random() - 0.5) * 50, vy: -Math.random() * 60,
        life: 0.6 + Math.random() * 0.5, color: col,
      });
    }
  }

  /* ---------- scene pieces ---------- */

  function shelfSlot(i) {
    const perRow = 8;
    const row = Math.floor(i / perRow);
    const col = i % perRow;
    return { x: SHELF.x + 2 + col * 11, y: (row === 0 ? SHELF.y1 : SHELF.y2) - 11 };
  }

  function drawWallAndFloor(doom, t) {
    /* wall */
    px(0, 0, W, FLOOR_Y, '#cfc6ae');
    px(0, 0, W, 14, '#c2b9a1');
    /* steel invasion creeps across the wall from the right */
    const steelW = Math.floor(doom * W * 0.85);
    if (steelW > 0) {
      px(W - steelW, 0, steelW, FLOOR_Y, '#7b8496');
      for (let x = W - steelW; x < W; x += 16) {
        px(x, 0, 1, FLOOR_Y, '#68707f');
        for (let y = 12; y < FLOOR_Y; y += 24) px(x + 8, y, 2, 1, '#ff2a3c');
      }
      px(W - steelW, 0, 2, FLOOR_Y, '#59616e');
    }
    /* baseboard */
    px(0, FLOOR_Y - 4, W, 4, '#9a8f77');
    px(0, FLOOR_Y - 1, W, 1, '#6e6650');

    /* floor tiles, chrome invading from the right */
    const cols = Math.ceil(W / 16), rows = Math.ceil((H - FLOOR_Y) / 8);
    const invade = doom * (cols + 4);
    for (let cy = 0; cy < rows; cy++) {
      for (let cx = 0; cx < cols; cx++) {
        const fromRight = cols - 1 - cx;
        const ragged = (cy * 13 + cx * 7) % 3;
        const chrome = fromRight + ragged < invade;
        const alt = (cx + cy) % 2 === 0;
        let col;
        if (chrome) col = alt ? '#8d97a8' : '#7b8496';
        else col = alt ? '#b8b2a4' : '#aaa496';
        px(cx * 16, FLOOR_Y + cy * 8, 16, 8, col);
        if (chrome && (cx * 5 + cy * 3) % 7 === 0) {
          px(cx * 16 + 2, FLOOR_Y + cy * 8 + 3, 3, 1, '#ff2a3c'); // glowing seams
        }
      }
    }
    px(0, FLOOR_Y, W, 1, '#8c8577');
  }

  function drawLights(t) {
    for (let i = 0; i < 2; i++) {
      const lx = 46 + i * 160;
      const flicker = Math.sin(t * 0.011 + i * 17) > 0.992 || Math.sin(t * 0.007 + i * 5) > 0.996;
      px(lx, 4, 44, 5, '#3c3f4d');
      px(lx + 2, 6, 40, 3, flicker ? '#a8a48a' : '#f2f0dc');
      if (!flicker) {
        ctx.globalAlpha = 0.07;
        px(lx - 8, 9, 60, 60, '#fffbe0');
        ctx.globalAlpha = 1;
      }
    }
  }

  function drawWindow(doom, t) {
    const x = 20, y = 24, w = 62, h = 52;
    px(x - 2, y - 2, w + 4, h + 4, '#8c8577');
    const sky = lerpColor('#a8cfe0', '#6e3540', doom);
    px(x, y, w, h, sky);
    /* sun, increasingly smog-obscured */
    px(x + 40, y + 8, 8, 8, lerpColor('#f7e9b0', '#a05050', doom));
    /* skyline */
    ctx.fillStyle = lerpColor('#7d94a0', '#3a2e38', doom);
    const heights = [18, 26, 14, 30, 22, 12, 24];
    for (let i = 0; i < heights.length; i++) {
      ctx.fillRect(x + 2 + i * 9, y + h - heights[i], 8, heights[i]);
    }
    /* lit windows in the skyline turn red with doom */
    ctx.fillStyle = doom > 0.4 ? '#ff2a3c' : '#f7e9b0';
    for (let i = 0; i < heights.length; i += 2) {
      ctx.fillRect(x + 4 + i * 9, y + h - heights[i] + 4, 2, 2);
      ctx.fillRect(x + 4 + i * 9, y + h - heights[i] + 9, 2, 2);
    }
    /* frame */
    px(x + (w >> 1) - 1, y, 2, h, '#8c8577');
    px(x, y + (h >> 1) - 1, w, 2, '#8c8577');
  }

  function drawClock(t) {
    const cx = 150, cy = 30;
    ctx.drawImage(spr('clock'), cx - 5, cy - 5);
    const S = Game.state;
    const frac = (S.playTime % BALANCE.dayLength) / BALANCE.dayLength;
    const a1 = frac * Math.PI * 2 - Math.PI / 2;               // "minute": one lap per day
    const a2 = (Game.day() % 12) / 12 * Math.PI * 2 - Math.PI / 2; // "hour"
    ctx.fillStyle = '#1c1d24';
    for (let r = 1; r <= 4; r++) ctx.fillRect(Math.round(cx + Math.cos(a1) * r), Math.round(cy + Math.sin(a1) * r), 1, 1);
    for (let r = 1; r <= 2; r++) ctx.fillRect(Math.round(cx + Math.cos(a2) * r), Math.round(cy + Math.sin(a2) * r), 1, 1);
  }

  function drawPoster(doom) {
    const name = doom >= 0.5 ? 'posterObey' : 'posterHang';
    ctx.drawImage(spr(name), 176, 26);
  }

  function drawShelves() {
    const autoTasks = Game.automatedTasks();
    if (!autoTasks.length) return;
    px(SHELF.x, SHELF.y1, SHELF.w, 3, '#66492f');
    if (autoTasks.length > 8) px(SHELF.x, SHELF.y2, SHELF.w, 3, '#66492f');
    /* the robot's trophy case of stolen work */
    autoTasks.forEach((task, i) => {
      const p = shelfSlot(i);
      ctx.drawImage(spr(ICON_MAP[task.icon]), p.x, p.y);
    });
    if (autoTasks.length) {
      px(SHELF.x + 26, SHELF.y1 + 5, 36, 7, '#1c1d24');
      ctx.fillStyle = '#ff2a3c';
      ctx.font = '5px "Press Start 2P", monospace';
      ctx.fillText('MINE', SHELF.x + 34, SHELF.y1 + 11);
    }
  }

  function drawDesk(t) {
    const S = Game.state;
    const working = Game.activeTasks().length > 0 && !S.flags.gameOver;
    const slump = !working;

    /* office worker, slightly slumped when unemployed */
    const py = 96 + (slump ? 3 : 0);
    ctx.drawImage(spr('player'), 42, py);
    if (slump) {
      px(52, py + 1, 1, 2, '#9fe0e0'); // flop sweat
      if (Math.floor(t / 600) % 2) px(58, py - 4, 2, 2, '#9fe0e0');
    }

    /* desk */
    px(DESK.x, DESK.top, DESK.w, 5, '#8a6a48');
    px(DESK.x, DESK.top + 5, DESK.w, 2, '#66492f');
    px(DESK.x + 3, DESK.top + 7, 4, 26, '#66492f');
    px(DESK.x + DESK.w - 7, DESK.top + 7, 4, 26, '#66492f');

    /* CRT with flickering screen */
    ctx.drawImage(spr('monitor'), 58, DESK.top - 11 - 9);
    if (working && Math.floor(t / 240) % 3 === 0) {
      px(61, DESK.top - 17, 8, 1, '#d5f5f5');
    }

    /* keyboard + typing hands */
    px(56, DESK.top - 1, 18, 2, '#3c3f4d');
    if (working) {
      const up = Math.floor(t / 260) % 2 === 0;
      px(58, DESK.top - 2 - (up ? 1 : 0), 4, 2, '#e8b088');
      px(68, DESK.top - 2 - (up ? 0 : 1), 4, 2, '#e8b088');
    }

    /* paper stack + coffee */
    px(32, DESK.top - 3, 10, 3, '#f4f1e8');
    px(32, DESK.top - 4, 10, 1, '#d6cdb8');
    ctx.drawImage(spr('mug'), 84, DESK.top - 5);

    /* certified plaque, for those who survive */
    if (S.flags.won) {
      px(44, 66, 34, 12, '#66492f');
      px(46, 68, 30, 8, '#e8c84a');
      ctx.fillStyle = '#66492f';
      ctx.font = '5px "Press Start 2P", monospace';
      ctx.fillText('SAFE', 51, 75);
    }
  }

  function drawRobot(t, doom) {
    const S = Game.state;
    const ver = Game.robotVersion();
    const name = 'robot' + ver;
    const sprite = spr(name);
    const bob = Math.round(Math.sin(t * 0.003) * 1.5);
    const rx = ROBOT_X - (sprite.width >> 1);
    const ry = 168 - sprite.height + bob;

    /* charging dock + cable */
    px(ROBOT_X - 16, 166, 32, 4, '#3c3f4d');
    px(ROBOT_X - 16, 166, 32, 1, '#565a6e');
    px(W - 8, FLOOR_Y - 14, 5, 8, '#8c8577');
    px(W - 6, FLOOR_Y - 12, 1, 2, '#1c1d24');

    /* antenna blink */
    ctx.drawImage(sprite, rx, ry);
    const blinkOn = Math.floor(t / 500) % 2 === 0;
    px(ROBOT_X - 1, ry - 4, 2, 4, '#5c6470');
    px(ROBOT_X - 1, ry - 6, 2, 2, blinkOn ? '#ff2a3c' : '#8d1420');

    /* eye glow while learning */
    const learning = S.robot.target !== null && !S.flags.gameOver;
    if (learning) {
      const pulse = 0.25 + Math.abs(Math.sin(t * 0.006)) * 0.35;
      ctx.globalAlpha = pulse;
      px(rx + 2, ry + 1, sprite.width - 4, 5, '#ff2a3c');
      ctx.globalAlpha = 1;

      /* knowledge siphon: dashed beam from the target icon to the robot */
      const target = Game.taskById(S.robot.target);
      const bx = 70, by = 88;              // icon floats above the desk
      const ex = rx + (sprite.width >> 1), ey = ry + 4;
      const dx = ex - bx, dy = ey - by;
      const len = Math.sqrt(dx * dx + dy * dy);
      const march = (t * 0.02) % 8;
      ctx.fillStyle = 'rgba(255,42,60,0.75)';
      for (let d = march; d < len; d += 8) {
        ctx.fillRect(Math.round(bx + dx * d / len), Math.round(by + dy * d / len), 2, 1);
      }

      /* the task being studied, blinking nervously */
      ctx.drawImage(spr(ICON_MAP[target.icon]), bx - 5, by - 5);
      if (Math.floor(t / 300) % 2) {
        ctx.fillStyle = '#ff2a3c';
        ctx.font = '7px "Press Start 2P", monospace';
        ctx.fillText('!', bx + 7, by - 5);
      }
      /* progress pips under the icon */
      const prog = Math.min(1, S.robot.progress / S.robot.duration);
      px(bx - 6, by + 7, 12, 2, '#1c1d24');
      px(bx - 6, by + 7, Math.round(12 * prog), 2, '#ff2a3c');
    }
  }

  function drawFx(dt, t) {
    /* stolen-task icons arcing to the trophy shelf */
    for (let i = arcs.length - 1; i >= 0; i--) {
      const a = arcs[i];
      a.t += dt / 0.9;
      if (a.t >= 1) {
        const slot = shelfSlot(a.slot);
        floater('LEARNED!', '#ff2a3c', slot.x, slot.y);
        arcs.splice(i, 1);
        continue;
      }
      const p = a.t;
      const slot = shelfSlot(a.slot);
      const x0 = 70, y0 = 88, x1 = slot.x + 5, y1 = slot.y + 5;
      const mx = (x0 + x1) / 2, my = Math.min(y0, y1) - 46;
      const x = (1 - p) * (1 - p) * x0 + 2 * (1 - p) * p * mx + p * p * x1;
      const y = (1 - p) * (1 - p) * y0 + 2 * (1 - p) * p * my + p * p * y1;
      ctx.drawImage(spr(a.icon), Math.round(x) - 5, Math.round(y) - 5);
    }

    /* sparks / coffee droplets */
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.life -= dt;
      if (s.life <= 0) { sparks.splice(i, 1); continue; }
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.vy += 140 * dt;
      ctx.globalAlpha = Math.min(1, s.life * 2);
      px(s.x, s.y, 2, 2, s.color);
      ctx.globalAlpha = 1;
    }

    /* money floaters */
    ctx.font = '12px "VT323", monospace';
    for (let i = floaters.length - 1; i >= 0; i--) {
      const f = floaters[i];
      f.life -= dt;
      if (f.life <= 0) { floaters.splice(i, 1); continue; }
      f.y += f.vy * dt;
      ctx.globalAlpha = Math.min(1, f.life);
      ctx.fillStyle = '#1c1d24';
      ctx.fillText(f.text, Math.round(f.x) + 1, Math.round(f.y) + 1);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, Math.round(f.x), Math.round(f.y));
      ctx.globalAlpha = 1;
    }

    /* white flash on automation */
    if (flash > 0) {
      flash -= dt * 2;
      ctx.globalAlpha = Math.max(0, flash);
      px(0, 0, W, H, '#ffffff');
      ctx.globalAlpha = 1;
    }
  }

  /* ---------- main frame ---------- */
  let lastT = 0;
  function frame(t) {
    if (!ctx || !Game.state) return;
    const dt = Math.min(0.1, (t - lastT) / 1000) || 0.016;
    lastT = t;
    const doom = Game.doom();

    ctx.imageSmoothingEnabled = false;
    drawWallAndFloor(doom, t);
    drawLights(t);
    drawWindow(doom, t);
    drawClock(t);
    drawPoster(doom);
    drawShelves();
    drawDesk(t);
    drawRobot(t, doom);
    drawFx(dt, t);
  }

  /* ---------- icon painting for DOM cards ---------- */
  function drawIcon(canvasEl, iconKey) {
    const name = ICON_MAP[iconKey];
    if (!name) return;
    canvasEl.width = 10;
    canvasEl.height = 10;
    const c = canvasEl.getContext('2d');
    c.imageSmoothingEnabled = false;
    c.drawImage(spr(name), 0, 0);
  }

  function init(canvasEl) {
    stage = canvasEl;
    ctx = stage.getContext('2d');
    ctx.imageSmoothingEnabled = false;
  }

  return { init, frame, floater, learnFx, sabotageFx, drawIcon, DESK };
})();
