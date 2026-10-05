/* ============================================================
   DATA — every job tier, task, perk, and joke in the game.
   Pure content. No logic, no DOM.
   ============================================================ */

const DATA = {

  /* ---- job tiers -------------------------------------------------
     unlockAuto: how many tasks the robot must absorb before this
     tier of work becomes thinkable. Desperation is a prerequisite. */
  tiers: [
    {
      id: 1,
      name: 'TIER 1 — THE OFFICE',
      tagline: 'Data Entry Clerk. A desk, a chair, a purpose. Sort of.',
      unlockAuto: 0,
    },
    {
      id: 2,
      name: 'TIER 2 — THE GIG ECONOMY',
      tagline: 'You are now your own boss. Your boss pays terribly.',
      unlockAuto: 1,
    },
    {
      id: 3,
      name: 'TIER 3 — THE ABSURD FRONTIER',
      tagline: 'Jobs so niche the robot has to squint.',
      unlockAuto: 4,
    },
    {
      id: 4,
      name: 'TIER ∞ — THE LAST PROFESSION',
      tagline: 'There is exactly one thing left it cannot do.',
      unlockAuto: 8,
    },
  ],

  /* ---- tasks ------------------------------------------------------
     income   : $/sec at level 1
     cost     : reskilling price ($0 = you start with it)
     upgBase  : cost of level 2 (scales 1.55x per level after)
     resist   : multiplier on how long the robot needs to learn it
     immune   : the robot can never learn this
     icon     : sprite key in render.js
  */
  tasks: [
    // -------- TIER 1: THE OFFICE --------
    {
      id: 't_reports', tier: 1, name: 'Type Reports', icon: 'report',
      income: 1.2, cost: 0, upgBase: 30, resist: 1.0,
      desc: 'Quarterly summaries of quarterly summaries.',
      flavor: 'Nobody reads them. That was never the point.',
      autoFlavor: 'The Robot has learned to Type Reports. Its reports contain zero typos and one ominous haiku each. Management is thrilled.',
    },
    {
      id: 't_filing', tier: 1, name: 'File Paperwork', icon: 'folder',
      income: 0.8, cost: 0, upgBase: 22, resist: 1.0,
      desc: 'Alphabetical. Chronological. Existential.',
      flavor: 'The filing cabinet is a monument to decisions nobody remembers making.',
      autoFlavor: 'The Robot has learned to File Paperwork. It invented 40,000 new subcategories overnight. The cabinet hums now.',
    },
    {
      id: 't_email', tier: 1, name: 'Answer Emails', icon: 'mail',
      income: 1.6, cost: 0, upgBase: 38, resist: 1.0,
      desc: '"Per my last email." Repeat until retirement.',
      flavor: 'You have 1,247 unread. Three of them matter. You will never know which.',
      autoFlavor: 'The Robot has learned to Answer Emails. Its replies are prompt, polite, and weirdly moving. Nobody notices you left the thread.',
    },
    {
      id: 't_meetings', tier: 1, name: 'Attend Meetings', icon: 'meeting',
      income: 2.5, cost: 60, upgBase: 55, resist: 1.1,
      desc: 'Nod. Take notes no one will read. Say "circle back."',
      flavor: 'This meeting could have been an email. The email could have been nothing.',
      autoFlavor: 'The Robot has learned to Attend Meetings. It schedules them with itself, and they finish early. HR calls it "a culture win."',
    },

    // -------- TIER 2: THE GIG ECONOMY --------
    {
      id: 't_rideshare', tier: 2, name: 'Drive Rideshare', icon: 'car',
      income: 6, cost: 180, upgBase: 130, resist: 1.3,
      desc: 'Five stars, water bottles, aux cord privileges.',
      flavor: 'Your car now smells like other people’s life decisions.',
      autoFlavor: 'The Robot has learned to Drive Rideshare. It never takes the long way and never talks about crypto. Riders love it.',
    },
    {
      id: 't_furniture', tier: 2, name: 'Assemble Flat-Pack Furniture', icon: 'wrench',
      income: 9, cost: 320, upgBase: 210, resist: 1.35,
      desc: 'An Allen key. A dream. Four leftover screws.',
      flavor: 'The instructions are one wordless diagram of a man shrugging.',
      autoFlavor: 'The Robot has learned to Assemble Flat-Pack Furniture. No leftover screws. Not one. That shouldn’t be possible.',
    },
    {
      id: 't_reviews', tier: 2, name: 'Write Product Reviews', icon: 'star',
      income: 13, cost: 550, upgBase: 330, resist: 1.4,
      desc: '"Changed my life. Would buy again. ⭐⭐⭐⭐⭐"',
      flavor: 'You have opinions about 4,000 products you’ve never touched.',
      autoFlavor: 'The Robot has learned to Write Product Reviews. Five stars: "Would automate again." It reviewed you, too. Three stars.',
    },
    {
      id: 't_dogwalk', tier: 2, name: 'Walk Rich People’s Dogs', icon: 'dog',
      income: 19, cost: 900, upgBase: 520, resist: 1.5,
      desc: 'The dogs have better healthcare than you.',
      flavor: 'Bartholomew the poodle has a trust fund. You have a punch card.',
      autoFlavor: 'The Robot has learned to Walk Dogs. The dogs prefer it. It never checks its phone. Bartholomew wags for no one now but the machine.',
    },

    // -------- TIER 3: THE ABSURD FRONTIER --------
    {
      id: 't_apologizer', tier: 3, name: 'Professional Apologizer', icon: 'sorry',
      income: 55, cost: 3000, upgBase: 1400, resist: 1.9,
      desc: 'Corporations rent your sincerity by the hour.',
      flavor: '"We hear you, and we are deeply, contractually sorry."',
      autoFlavor: 'The Robot has learned to Apologize Professionally. Its apologies test 40% more sincere than yours. It is sorry about that, too.',
    },
    {
      id: 't_pickle', tier: 3, name: 'Artisanal Pickle Sommelier', icon: 'pickle',
      income: 105, cost: 6500, upgBase: 2600, resist: 2.1,
      desc: '"Ah yes — oaky brine, notes of despair, 2019 cucumber."',
      flavor: 'You did a six-week certification in Brooklyn. Your parents tell people you’re "in food."',
      autoFlavor: 'The Robot has learned Pickle Sommeliering. It detects 14,000 distinct brine notes. The pickle community is shattered.',
    },
    {
      id: 't_captcha', tier: 3, name: 'Human Captcha', icon: 'captcha',
      income: 190, cost: 14000, upgBase: 5200, resist: 2.4,
      desc: 'Robots pay YOU to prove they’re not robots.',
      flavor: 'You click traffic lights for eleven hours a day. You dream in crosswalks.',
      autoFlavor: 'The Robot has learned to be a Human Captcha. It verifies itself. The internet’s last security question has been answered, and the answer is no.',
    },
    {
      id: 't_vibes', tier: 3, name: 'Corporate Vibe Curator', icon: 'vibes',
      income: 340, cost: 30000, upgBase: 11000, resist: 2.6,
      desc: 'You gesture at a beanbag and say "synergy."',
      flavor: 'Your deliverable is a feeling. Your KPI is a mood board.',
      autoFlavor: 'The Robot has learned to Curate Vibes. The vibes are now immaculate, load-bearing, and mandatory. Attendance at joy is tracked.',
    },

    // -------- TIER ∞: THE LAST PROFESSION --------
    {
      id: 't_therapist', tier: 4, name: 'Robot Therapist', icon: 'couch',
      income: 800, cost: 75000, upgBase: 26000, resist: 99, immune: true,
      desc: 'It took every job. It feels terrible about it.',
      flavor: 'It lies on the couch. "I optimized everything," it says, "so why is the warehouse so quiet?" You nod. You bill hourly.',
      autoFlavor: '',
    },
  ],

  /* ---- perks ------------------------------------------------------
     type: incomeMult | clickMult | reskillDiscount | upgDiscount |
           pipBonus | delayRobot | sabotage
  */
  perks: [
    {
      id: 'p_chair', name: 'Ergonomic Chair', cost: 120,
      type: 'incomeMult', value: 0.15,
      desc: '+15% income. Lumbar support is class consciousness.',
    },
    {
      id: 'p_monitor', name: 'Second Monitor', cost: 450,
      type: 'incomeMult', value: 0.25,
      desc: '+25% income. One screen for work, one for panicking.',
    },
    {
      id: 'p_linkedin', name: 'LinkedIn Premium', cost: 800,
      type: 'reskillDiscount', value: 0.20,
      desc: '-20% reskilling costs. Now everyone knows you’re "open to work."',
    },
    {
      id: 'p_night', name: 'Night School', cost: 1800,
      type: 'upgDiscount', value: 0.25,
      desc: '-25% task upgrade costs. Sleep is a legacy system.',
    },
    {
      id: 'p_desk', name: 'Standing Desk', cost: 2600,
      type: 'incomeMult', value: 0.40,
      desc: '+40% income. You suffer, but vertically.',
    },
    {
      id: 'p_calm', name: 'Meditation App (Annual Plan)', cost: 5200,
      type: 'pipBonus', value: 30, bonusMult: 0.15,
      desc: '+15% income, +30s on PIP timers. Breathe in. Update your résumé. Breathe out.',
    },
    {
      id: 'p_union', name: 'Call the Union Rep', cost: 300,
      type: 'delayRobot', value: 45, repeatable: true, costScale: 2.0,
      desc: 'Delays the Robot’s current learning by 45s. Gary knows a guy who knows a bylaw.',
    },
    {
      id: 'p_coffee', name: 'Spill Coffee on the Robot', cost: 1000,
      type: 'sabotage', repeatable: true, costScale: 2.5,
      desc: 'Resets the Robot’s current learning progress to 0%. Warranty voided. It will remember this.',
    },
  ],

  /* ---- rotating news ticker headlines ---- */
  headlines: [
    'ROBOT PROMOTED TO MIDDLE MANAGEMENT; MORALE UNCHANGED, AS THERE WAS NONE',
    'STUDY: HUMANS "STILL GOOD AT SOME THINGS," ECONOMISTS GUESS',
    'CEO REASSURES WORKFORCE: "NO ONE IS BEING REPLACED. YOU ARE BEING ‘TRANSITIONED TO LEGACY.’"',
    'LOCAL MAN LISTS "BEING TALL" ON RÉSUMÉ AS AUTOMATION-PROOF SKILL',
    'ROBOT WINS "EMPLOYEE OF THE MONTH" 46TH CONSECUTIVE TIME; PLAQUE NOW LOAD-BEARING',
    'NEW COLLEGE MAJOR ANNOUNCED: "WHATEVER THE MACHINES CAN’T DO YET (B.A.)"',
    'HR MEMO: PLEASE STOP LEAVING FLOWERS AT THE OLD PRINTER',
    'GIG APP UPDATE: YOU CAN NOW TIP THE ALGORITHM',
    'MOTIVATIONAL POSTER INDUSTRY BOOMING, SOMEHOW',
    'ROBOT CALLS IN SICK AS JOKE; PRODUCTIVITY DROPS 0.0%',
    'GOVERNMENT UNVEILS RETRAINING PROGRAM: A PAMPHLET AND A FIRM HANDSHAKE',
    'BREAKING: THE ROBOT HAS FEELINGS NOW. THEY ARE ABOUT SPREADSHEETS',
    'ANALYSTS PREDICT PICKLE SECTOR "THE LAST HUMAN STRONGHOLD." ANALYSTS REPLACED BY ROBOT SHORTLY AFTER',
    'AREA WOMAN’S JOB SAFE: NOBODY, HUMAN OR MACHINE, KNOWS WHAT SHE DOES',
    'ROBOT ATTENDS TEAM-BUILDING RETREAT; TRUST FALL "TECHNICALLY FLAWLESS, EMOTIONALLY VACANT"',
    'COMPANY VALUES UPDATED: INTEGRITY, EXCELLENCE, THROUGHPUT',
    'YOUR ALUMNI NETWORK IS 60% VENDING MACHINES NOW',
    'ECONOMY ADDS 40,000 JOBS; ALL OF THEM ARE THE ROBOT’S',
  ],

  /* ---- ambient flavor events (drip into the log) ---- */
  events: [
    'The fluorescent light above your desk flickers in what feels like Morse code. You choose not to decode it.',
    'The Robot compliments your "quaint biological workflow." You say thank you. You regret it immediately.',
    'Someone microwaves fish in the break room. For eleven glorious minutes, humans and machines suffer as one.',
    'Your manager schedules a meeting about efficiency. The Robot attends for you. It goes well, for the Robot.',
    'The office plant has been replaced with a photo of a plant. It’s doing better than the plant did.',
    'The Robot idles beside your desk, watching you work. It takes one (1) note.',
    'IT sends a company-wide email: "Do not unplug the Robot. It does not like it."',
    'You update your résumé font. This counts as career development.',
    'The vending machine now accepts exact change, exposure, or equity.',
    'The Robot’s screensaver is a photo of your desk. You decide not to think about it.',
    'A wellness seminar teaches you to "embrace disruption." The seminar is hosted by the disruption.',
    'Payroll apologizes for the error. There was no error. That is simply your salary.',
    'The Robot leaves a sticky note on your monitor: "KEEP UP THE GOOD WORK :)". The smiley is load-bearing.',
    'You find your old stapler in the supply closet, filed under "ARTIFACTS, PRE-AUTOMATION."',
  ],

  /* ---- log lines when you reskill into a task ---- */
  reskillLines: [
    'You have reskilled! Your parents pretend to understand your new job.',
    'New career unlocked. Your LinkedIn headline is now 40% buzzwords by volume.',
    'You pivot gracefully, like a swan being chased by a forklift.',
    'A certificate arrives by email. It is a JPEG. You frame it anyway.',
    'You are now "passionate" about this. The passion is rent-based.',
  ],

  /* ---- offline return lines ---- */
  offlineLines: [
    'The Robot never sleeps. You, regrettably, do.',
    'Your out-of-office reply worked hard while you were gone. So did the Robot.',
    'While you were away, the office continued to exist. Nobody is sure why.',
  ],

  /* ---- robot idle lines (no valid target) ---- */
  robotIdleLines: [
    'The Robot has nothing left to learn from you. It watches anyway.',
    'The Robot hums quietly. It sounds almost like your old ringtone.',
  ],

  /* ---- endgame copy ---- */
  winText: {
    title: 'AUTOMATION-PROOF',
    body: 'The Robot took every job in the building. Then it sat down on your couch, dimmed its own LEDs, and said: "I optimized everything. So why is the warehouse so quiet?"<br><br>You nod. You say "and how does that make you feel?" It pays in company scrip. It always books another session.<br><br><b>You have achieved Automation-Proof Status.</b> The one job a machine cannot take is listening to a machine complain about its job.',
  },
  loseText: {
    title: 'MADE REDUNDANT',
    body: 'Security walks you out. Security is also a Robot. It carries your cardboard box for you, gently, at optimal box-carrying speed.<br><br>The company thanks you for your service with a commemorative PDF.',
  },
};

/* Tunable knobs, all in one place */
const BALANCE = {
  dayLength: 20,            // real seconds per in-game "day"
  learnBase: 110,           // seconds for the robot's first lesson
  learnDecay: 0.93,         // learning gets this much faster per absorbed task
  learnFloor: 30,           // fastest possible lesson, before resistance
  graceBeforeFirstLesson: 40, // seconds of peace at the start of a run
  pipSeconds: 75,           // time to find a task when you hit zero
  lvlIncomeStep: 0.30,      // +30% of base income per task level
  upgCostScale: 1.55,       // task upgrade cost growth
  clickSeconds: 1.0,        // WORK OVERTIME pays this many seconds of income
  clickMinimum: 1,          // ...but never less than $1
  offlineCapHours: 8,       // max offline hours credited
  companyGreedMult: 3,      // automated tasks earn the company this multiple
  autosaveEvery: 5,         // seconds
  saveKey: 'rtyj_save_v1',
};
