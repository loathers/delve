const {
    myAdventures,
    visitUrl,
    toEffect,
    haveEffect,
    cliExecute,
    toStat,
    toElement,
    myBuffedstat,
    myBasestat,
    expectedDamage,
    monsterHp,
    myMaxhp,
    toMonster,
    toItem,
    retrieveItem,
    restoreHp,
    restoreMp,
    runCombat,
    myMaxmp,
    elementalResistance,
    print,
    jumpChance,
    damageAbsorptionPercent,
    getProperty,
    eat,
    availableAmount,
    itemAmount,
    putCloset,
    myMp,
    canAdventure,
    toLocation,
    userConfirm,
    myLevel
} = require('kolmafia');

const SAFETY_MARGIN = 1.05;

// Stat objects
const MOX = toStat('Moxie');
const MYS = toStat('Mysticality');
const MUS = toStat('Muscle');

// Challenge types
const BUFF = "buff";
const MONSTER = "monster";
const STAT = "stat";
const ELEMENT = "element";
const HP = "hp";
const MP = "mp";
const REWARD = "reward";

const CHALLENGE_MAP = {
    "twopills": BUFF + ",muscle,mysticality",
    "figurecard": BUFF + ",mysticality,moxie",
    "twojackets": BUFF + ",moxie,muscle",
    "hydra": MONSTER + ",X-headed Hydra",
    "stonegolem": MONSTER + ",X Stone Golem",
    "eyebeast": MONSTER + ",Beast with X Eyes",
    "earbeast": MONSTER + ",Beast with X Ears",
    "beergolem": MONSTER + ",X Bottles of Beer Golem",
    "fernghost": MONSTER + ",Ghost of Fernswarthy's Grandfather",
    "dimhorror": MONSTER + ",X-dimensional horror",
    "bigstatue": STAT + ",muscle",
    "typewriters": STAT + ",muscle",
    "bigmallet": STAT + ",muscle",
    "darkshards": STAT + ",mysticality",
    "voodoo": STAT + ",mysticality",
    "mops": STAT + ",mysticality",
    "pooltable": STAT + ",moxie",
    "sorority": STAT + ",moxie",
    "bigbaby": STAT + ",moxie",
    "goblinaxe": STAT + ",moxie",
    "snowballbat": ELEMENT + ",spooky,cold",
    "onnastick": ELEMENT + ",stench,hot",
    "document": ELEMENT + ",hot,spooky",
    "coldmarg": ELEMENT + ",cold,sleaze",
    "fratbong": ELEMENT + ",sleaze,stench",
    "powderbox": MP,
    "haiku11": HP,
    "angel": REWARD + ",100",
    "duskdoor": REWARD + ",200",
    "lepbell": REWARD + ",300",
    "corpse": REWARD + ",400",
    "chest": REWARD + ",500"
};

const ALL_STAT_BUFFS = [
    toEffect('Gr8ness'),
    toEffect('Trivia Master'),
    toEffect('Tomato Power'),
    toEffect('Big'),
    toEffect('Triple-Sized')
];

const STAT_BUFFS = {
    Muscle: [
        toEffect('Phorcefullness'),
        toEffect('Quiet Determination')
    ],
    Mysticality: [
        toEffect('On the Shoulders of Giants'),
        toEffect('Mystically Oiled'),
        toEffect('Quiet Judgement')
    ],
    Moxie: [
        toEffect('Cock of the Walk'),
        toEffect('Superhuman Sarcasm'),
        toEffect('Quiet Desperation')
    ]
};

const STABILIZERS = {
    Muscle: 'Stabilizing Oiliness',
    Mysticality: 'Expert Oiliness',
    Moxie: 'Slippery Oiliness'
};

const RESISTANCE_BUFFS = {};
RESISTANCE_BUFFS[toElement('cold')] = [toEffect('Burning Hands')];
RESISTANCE_BUFFS[toElement('hot')] = [toEffect('Fireproof Lips')];
RESISTANCE_BUFFS[toElement('sleaze')] = [toEffect('Proprie Tea')];
RESISTANCE_BUFFS[toElement('spooky')] = [toEffect('Pleasant Forecast')];
RESISTANCE_BUFFS[toElement('stench')] = [toEffect('Net tea')];

const ALL_RESISTANCE_BUFFS = [
    toEffect('Patent Prevention'),
    toEffect('Oiled-Up'),
    toEffect('Protection from Bad Stuff')
];

const ARGS = {
    ignoreMonsterCheck: false
};

function customRestoreMp(amount) {
    if (amount >= 1000 && myMaxmp() - myMp() >= amount) {
        const sausagesToEat = Math.floor(amount / 1000);
        const sausagesRemainingToday = parseInt(getProperty('_sausagesEaten'));
        if (sausagesToEat < (23 - sausagesRemainingToday) && availableAmount(toItem('magical sausage casing')) >= sausagesToEat) {
            eat(toItem('magical sausage'), sausagesToEat);
            amount -= sausagesToEat * 1000;
        }
    }

    restoreMp(amount);
}

/**
 * Load the page for the given basement level
 * @param {Number} [action=1]  option to select
 */
function dive(action) {
    action = action || 1;
    visitUrl("basement.php?action=" + action + "&pwd");
}

function tryMaximize(maximizerString) {
    try {
        cliExecute("maximize " + maximizerString);
    } finally {
        cliExecute("refresh equipment");
        cliExecute("maximize " + maximizerString);
    }
}

/**
 * Get basement level from page html
 * @param {string} page  page html
 * @return {number} level
 */
function getLevel(page) {
    const regExp = new RegExp(/Fernswarthy's Basement, Level (\d+)/);

    return regExp.test(page) ? parseInt(regExp.exec(page)[1]) : 0;
}

/**
 * Determine the current basement challenge using the image
 * @param {string} page  page html
 * @return {string} value from CHALLENGE_MAP
 */
function getChallenge(page) {
    const images = Object.keys(CHALLENGE_MAP);
    for (let i = 0; i < images.length; i++) {
        if (page.includes(images[i] + '.gif')) {
            return CHALLENGE_MAP[images[i]];
        }
    }

    throw new Error("Unrecognised challenge");
}

/**
 * Execute default source for the given buffs if needed
 * @param {Effect[]} buffs  buffs to execute
 */
function maintainBuffs(buffs) {
    buffs.forEach((buff) => {
        if (!haveEffect(buff) && buff.default !== '') {
            cliExecute("try; " + buff.default);
        }
    });
}

/**
 * Get highest stat using the provided function to get current stat values
 * @param {function} statFunc  function to get value for stat
 * @return {Stat} highest stat
 */
function highestStat(statFunc) {
    let highest = toStat('none');

    for (let i = 0; i < 3; i++) {
        let stat = [MOX, MYS, MUS][i];
        if (statFunc(stat) > statFunc(highest)) {
            highest = stat;
        }
    }

    return highest;
}

/**
 * Get highest base stat
 * @return {Stat} highest base stat
 */
function myHighestStat() {
    return highestStat(myBasestat);
}

/**
 * Get highest boosted stat
 * @return {Stat} highest boosted stat
 */
function myHighestBuffedStat() {
    return highestStat(myBuffedstat);
}

/**
 * Stabilize the given stat to the highest other stat if possible
 * @param {Stat} goal  stat to maximize
 */
function stabilize(goal) {
    const highest = myHighestStat();

    if (myBasestat(highest) > myBasestat(goal)) {
        const effect = toEffect(STABILIZERS[highest]);
        if (haveEffect(effect) < 1) {
            cliExecute(effect.default);
        }
    }
}

/**
 * Get the indefinite article for the given noun
 * @param {string} noun
 * @return {string} indefinite article and given noun
 */
function indefiniteArticle(noun) {
    if (['a', 'e', 'i', 'o', 'u'].includes(noun.charAt(0).toLowerCase())) {
        return "an " + noun;
    }

    return "a " + noun;
}

/**
 * Calculate required buff stat for a given level
 * @param {number} level  basement level
 * @return {number} needed buffed stat
 */
function requiredStat(level) {
    return (Math.pow(level, 1.4) + 2) * SAFETY_MARGIN;
}

/**
 * See if given stat is buffed enough for the basement level
 * @param {number} level  basement level
 * @param {Stat} stat  stat to check
 * @return {boolean}
 */
function checkStat(level, stat) {
    return myBuffedstat(stat) >= requiredStat(level);
}

/**
 * Improve the given stat
 * @param {number} required  necessary stat
 * @param {number} step  current attempt number
 * @param {Stat} stat  stat to increase
 * @return {boolean} true if something was done
 */
function improveStat(required, step, stat) {
    switch (step) {
        case 0:
            cliExecute("maximize " + required + " " + stat + " min, switch Left-Hand Man, switch Disembodied Hand");
            return true;
        case 1:
            stabilize(stat);
            return true;
        case 2:
            maintainBuffs(ALL_STAT_BUFFS);
            return true;
        case 3:
            maintainBuffs(STAT_BUFFS[stat]);
            return true;
    }

    return false;
}

/**
 * See if the given monster can be killed
 * @param {number} level  basement level
 * @param {Monster} m  monster
 * @return {boolean} true if monster can be killed
 */
function checkMonster(level, m) {
    const attack = Math.max(0, expectedDamage(m));
    const hp = monsterHp(m);

    const divineDamage = myBuffedstat(myHighestBuffedStat());
    const actualDamage = Math.max(1, divineDamage - Math.floor(divineDamage * m.physicalResistance / 100));

    let survivableRounds = Math.floor(myMaxhp() / attack);
    const roundsToKill = Math.floor(hp / actualDamage);

    if (jumpChance(m) <= 100) {
        survivableRounds -= -1;
    } else {
        survivableRounds += 3;
    }

    return survivableRounds > roundsToKill || m.physicalResistance === 100;
    // return jumpChance(m) === 100 || attack < myMaxhp();
}

/**
 * Get required MP or HP for the given level
 * @param {number} level  basement level
 * @return {number} required MP
 */
function requiredMp(level) {
    return 1.67 * Math.pow(level, 1.4) * SAFETY_MARGIN;
}

/**
 * See if have enough MP for the given level
 * @param {number} level  basement level
 * @return {boolean} true if have enough MP
 */
function checkMp(level) {
    return myMaxmp() > requiredMp(level);
}

function improveMp(required, step) {
    switch (step) {
        case 0:
            cliExecute("maximize " + required + 1 + " mp, switch Left-Hand Man, switch Disembodied Hand");
            return true;
        case 1:
        case 2:
        case 3:
            improveStat(required, step, MYS);
            return true;
        case 4:
            cliExecute("gain " + required + " mp");
            return true;
    }
}

function requiredHp(level) {
    return Math.pow(level, 1.4) * 10 * (100 - damageAbsorptionPercent()) / 100;
}

function checkHp(level) {
    return myMaxhp() > requiredHp(level);
}

function improveHp(required, step) {
    switch (step) {
        case 0:
            cliExecute("maximize " + required + 1 + " hp, DA, switch Left-Hand Man, switch Disembodied Hand");
            return true;
        case 1:
        case 2:
        case 3:
            improveStat(required, step, MUS);
            return true;
        case 4:
            cliExecute("gain " + required + " hp");
            return true;
    }

    return false;
}

function requiredElement(level, e1, e2) {
    const damage = (4.48 * Math.pow(level, 1.4)) + 8;
    const e1_damage = damage * ((100 - elementalResistance(e1)) / 100);
    const e2_damage = damage * ((100 - elementalResistance(e2)) / 100);
    return (e1_damage + e2_damage) * SAFETY_MARGIN;
}

/**
 * check the given elements
 * @param {number} level  basement level
 * @param {Element} e1  first element
 * @param {Element} e2  second element
 * @param {number} [factor=1]  factor to multiply by
 * @return {boolean} true if resitant enough to survive
 */
function checkElement(level, e1, e2, factor) {
    factor = factor || 1;
    return myMaxhp() > requiredElement(level, e1, e2) * factor;
}

function improveElement(requirement, step, e1, e2) {
    switch (step) {
        case 0:
            tryMaximize(e1 + " res, " + e2 + " res, switch Left-Hand Man, switch Disembodied Hand, switch Mu, switch Exotic Parrot");
            return true;
        case 1:
            maintainBuffs(ALL_RESISTANCE_BUFFS);
            return true;
        case 2:
            maintainBuffs(RESISTANCE_BUFFS[e1]);
            return true;
        case 3:
            maintainBuffs(RESISTANCE_BUFFS[e2]);
            return true;
        case 4:
        case 5:
        case 6:
            improveHp(requirement, step - 3);
            return true;
        case 7:
            cliExecute("gain " + requirement + " hp");
            return true;
    }

    return false;
}

const TESTS = {
    /**
     * Handle stat test for the given level
     * @param {number} level  basement level
     * @param {string} challenge  value from CHALLENGE_MAP
     */
    STAT: function(level, challenge) {
        const stat = toStat(challenge[1]);
        const required = requiredStat(level);
        print("Level " + level + " tests your " + stat, "green");

        for (let i = 0; !checkStat(level, stat); i++) {
            if (!improveStat(required, i, stat)) {
                throw new Error("You need " + required - myBuffedstat(stat) + " more " + stat);
            }
        }

        dive();
    },
    /**
     * Handle monster test for the given level
     * @param {number} level  basement level
     * @param {string} challenge  value from CHALLENGE_MAP
     */
    MONSTER: function(level, challenge) {
        const m = toMonster(challenge[1]);

        print("Level " + level + " has you fighting " + indefiniteArticle(m.name), "green");

        let combatItem;
        const attackStat = myHighestBuffedStat();

        putCloset(toItem('divine can of silly string'), itemAmount(toItem('divine can of silly string')));
        putCloset(toItem('divine blowout'), itemAmount(toItem('divine blowout')));
        putCloset(toItem('divine noisemaker'), itemAmount(toItem('divine noisemaker')));

        switch (attackStat) {
            case MUS:
                combatItem = toItem('divine noisemaker');
                break;
            case MYS:
                combatItem = toItem('divine can of silly string');
                break;
            case MOX:
                combatItem = toItem('divine blowout');
                break;
        }

        retrieveItem(10, combatItem);
        retrieveItem(1, toItem('gas balloon'));
        retrieveItem(4, toItem('gas can'));
        cliExecute("maximize effective, hp, dr, da, " + attackStat);
        // cliExecute("maximize effective, hp, dr, da");

        if (ARGS.ignoreMonsterCheck || checkMonster(level, m)) {
            restoreHp(myMaxhp());
            customRestoreMp(1000);

            dive();
            runCombat();
        } else {
            throw new Error("Won't survive fighting " + m.name + " at level " + level);
        }
    },
    /**
     * Handle MP test for the given level
     * @param {number} level  basement level
     * @param {string} challenge  value from CHALLENGE_MAP
     */
    MP: function(level) {
        print("Level " + level + " tests your MP", "green");

        const required = requiredMp(level);
        for (let i = 0; !checkMp(level); i++) {
            if (!improveMp(required, i)) {
                throw new Error("You need " + required - myMaxmp() + " more MP");
            }
        }

        customRestoreMp(required);
        dive();
    },
    /**
     * Handle HP test for the given level
     * @param {number} level  basement level
     */
    HP: function(level) {
        print("Level " + level + " tests your HP", "green");

        const required = requiredHp(level);
        for (let i = 0; !checkHp(level); i++) {
            if (!improveHp(required, i)) {
                throw new Error("You need " + parseInt(required - myMaxhp()) + " more HP");
            }
        }

        restoreHp(required);
        dive();
    },
    /**
     * Handle element test for the given level
     * @param {number} level  basement level
     * @param {string} challenge  value from CHALLENGE_MAP
     */
    ELEMENT: function(level, challenge) {
        const e1 = toElement(challenge[1]);
        const e2 = toElement(challenge[2]);

        print("Level " + level + " tests your " + e1 + " and " + e2 + " resistance", "green");

        for (let i = 0; !checkElement(level, e1, e2, i === 0 ? 2 : 1); i++) {
            const required = requiredElement(level, e1, e2);
            if (!improveElement(required, i, e1, e2)) {
                throw new Error("You need " + required - myMaxhp() + " more HP (or more " + e1 + " or " + e2 + " resistance)");
            }
        }

        restoreHp(requiredElement(level, e1, e2) + 1);
        dive();
    },
    REWARD: function(level, challenge) {
        print("Level " + level + " gives you a reward", "green");

        if (challenge[1] === '500') {
            throw new Error("Got your telescope! Take it manually and if you run this again we'll just adventure indefinitely");
        }

        dive();
    },
    BUFF: function(level, challenge) {
        const stat1 = toStat(challenge[1]);
        const stat2 = toStat(challenge[2]);

        print("Level " + level + " gives you a buff of " + stat1 + " or " + stat2, "green");

        dive(myBasestat(stat1) < myBasestat(stat2) ? 1 : 2);
    }
};

/**
 * General handler
 * @returns {number} basement level completed
 */
function handleChallenge() {
    const page = visitUrl('basement.php');
    const level = getLevel(page);
    const challenge = getChallenge(page);
    const parts = challenge.split(',');

    const testName = parts[0].toUpperCase();
    const testFunc = TESTS[testName];
    testFunc(level, parts);

    if (haveEffect(toEffect('Beaten Up'))) {
        throw Error('Oops. We got beaten up somehow.');
    }

    return level;
}

function main(args) {

    if (!canAdventure(toLocation(`Fernswarthy's Basement`))) {
        throw Error('You do not have access to the basement');
    }

    if (myLevel() < 30) {
        if (!userConfirm("It's suggested to be level 30 before basement diving. Are you sure you want to proceed?")) {
            return;
        }
    }

    ARGS.ignoreMonsterCheck = args && args.includes('noCheck');
    try {
        while (handleChallenge() < 500 && myAdventures() > 0) {
            continue;
        }
    } catch (e) {
        print(e.message, "red");
    }
}

module.exports.main = main;
