# LoathersBasement
Script to get to level 500 in Fernswarthy's Basement.

Install this using `git checkout loathers/LoathersBasement release`

## Requirements:
- Fernswarthy's Basement unlocked. Complete [The Wizard of Ego](https://kol.coldfront.net/thekolwiki/index.php/The_Wizard_of_Ego) manually.
- Saucegeyser skill
- Set below ccs as the Custom Combat in KoLMafia.

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
- It is suggested to be level 30 before basement diving.
- Maintaining required stat buffs is expensive. It can cost millions of meat. Closet all meat you don't want to use in the basement.
