<img src="https://user-images.githubusercontent.com/17497392/215860797-a12abb8b-5504-40da-a48b-2c572337fc09.png" alt="delve logo" style="width: 35%;">

This script will get your character to level 500 in Fernswarthy's Basement in the [Kingdom of Loathing](https://www.kingdomofloathing.com/).

In a recent version of [KoLMafia](https://github.com/kolmafia/kolmafia), install delve using `git checkout loathers/delve release` 

Once installed, just run `delve` to descend into Fernswarthy's depths.

## Requirements:
- Fernswarthy's Basement must be unlocked. You need to complete [The Wizard of Ego](https://kol.coldfront.net/thekolwiki/index.php/The_Wizard_of_Ego) manually.
- Your character needs to have access to the [Saucegeyser](https://kol.coldfront.net/thekolwiki/index.php/Saucegeyser) skill
- Set below CCS as the Custom Combat script in KoLMafia.

```
[ default ]
item gas balloon
while !pastround 5
    if hascombatitem divine noise
        item divine noisemaker,divine noisemaker
    endif
    if hascombatitem divine can
        item divine can of silly string,divine can of silly string
    endif
    if hascombatitem divine blow
        item divine blowout,divine blowout
    endif
endwhile

[ ghost of fernswarthy's ]
skill saucegeyser
```

## Cautions:
- It is suggested to be level 30 before basement diving. It will greatly reduce the cost of the exercise.
- Maintaining required stat buffs can be very expensive. It can cost millions of meat. If you don't want to use a ton of meat for this script, closet or convert it to dense meat stacks.
