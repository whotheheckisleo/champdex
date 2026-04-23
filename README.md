# ChampDex

## What is ChampDex?

ChampDex is a companion web app for Pokemon Champions. Its main two features at the moment are the Dex and the Team Builder.

## Dex

The Dex consists of 4 separate smaller dexes. The main one is the Pokedex, which contains all the Pokemon that have been released in Pokemon Champions. The other three are the MoveDex, the AbilityDex and the ItemDex, which contain all the moves, abilities and items that have been released in Pokemon Champions respectively.

The Pokedex allows you to search for Pokemon by name or type. You can also show Mega Evolutions instead of normal Pokemon. The MoveDex, AbilityDex and ItemDex allow you to search for moves, abilities and items by name.

By pressing on a Pokemon, move, ability or item, you can see more details about it. For Pokemon, you can see its stats, types, abilities, moves and more. For moves, you can see its type, category, power, accuracy and more. For abilities, you can see its description. For items, you can see its description.

## Team Builder

The Team Builder allows you to create a team of 6 Pokemon. You can search for Pokemon by name or type and add them to your team. You can also remove Pokemon from your team. Once you have added Pokemon to your team, you can see their stats, types, abilities and moves. You can also import or export your team in the typical Pokemon Showdown format.

## Deployment

The site is deployed to GitHub Pages at **https://whotheheckisleo.github.io/champdex/**.

Deployment is fully automated via GitHub Actions whenever commits are pushed to `main`.

To enable it in a fork:
1. Go to **Settings → Pages** and set **Source** to **GitHub Actions**.
2. Push to `main` — the workflow in `.github/workflows/deploy.yml` will build and publish the site automatically.

## Special thanks

- [otterlyclueless](https://github.com/otterlyclueless) for [their repository](https://github.com/otterlyclueless/pokemon-champions-data) containing all data I needed in order to be able to create the Dex.
