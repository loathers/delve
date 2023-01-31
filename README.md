# ![delve_logo](https://user-images.githubusercontent.com/17497392/215860797-a12abb8b-5504-40da-a48b-2c572337fc09.png)
Script to get to level 500 in Fernswarthy's Basement.

Install using `git checkout loathers/delve release` then just run `delve`

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
