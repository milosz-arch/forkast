/* =====================================================================
   DANIA STARTOWE PO ANGIELSKU — warstwa do wyświetlania (decyzja 130).

   Jedno danie, jedno `id`, dwie warstwy językowe. Polska warstwa w
   `talia-startowa.js` zostaje źródłem prawdy: z niej liczy się lista zakupów,
   czas przygotowania, wykrywanie sprzętu i wersja restauracyjna. Ten plik mówi
   wyłącznie, co pokazać przy angielskim stole — nazwę i kroki.

   Nazwy własne zostają po polsku z angielskim dopiskiem („Gołąbki — Polish
   cabbage rolls in tomato sauce”); nazwy opisowe są tłumaczone normalnie.
   Angielszczyzna brytyjska. Każda liczba z polskiego kroku — gramy, minuty,
   stopnie, stopnie mocy — stoi też w angielskim; pilnuje tego test-talia-en.mjs.

   Nowe danie w talii = nowa pozycja tutaj, pod tym samym `id`. Test oblewa,
   dopóki jej nie ma.
   ===================================================================== */

export const DANIA_EN = {
  "t1": {
    "nazwa": "Porridge with fruit and nuts",
    "kroki": [
      "Bring the semi-skimmed milk (2%) to the boil in a small pan, add the rolled oats and cook over low heat for 5 minutes, stirring.",
      "Slice the bananas and chop the walnuts.",
      "Divide the porridge between bowls, top with the bananas and walnuts and drizzle with honey."
    ]
  },
  "t2": {
    "nazwa": "Scrambled eggs with tomatoes",
    "kroki": [
      "Halve the cherry tomatoes.",
      "Melt the butter in a frying pan over medium heat (5/9) and fry the cherry tomatoes for 2 minutes.",
      "Beat the eggs, pour them into the pan and stir over low heat for 3-4 minutes until set.",
      "Sprinkle the finished eggs with chopped chives."
    ]
  },
  "t3": {
    "nazwa": "Avocado and egg sandwiches",
    "kroki": [
      "Hard-boil the eggs in boiling water for 9 minutes, cool and peel.",
      "Mash the avocado with a fork and the lemon juice.",
      "Spread the slices of wholemeal rye bread with the avocado.",
      "Slice the eggs and lay them on the sandwiches."
    ]
  },
  "t4": {
    "nazwa": "Crêpes with twaróg (Polish curd cheese)",
    "kroki": [
      "Blend the plain flour, eggs and semi-skimmed milk (2%) into a smooth crêpe batter.",
      "Fry thin crêpes in butter in a hot frying pan (6/9), about a minute on each side.",
      "Mash the half-fat twaróg with a fork until smooth.",
      "Spread the twaróg over the crêpes and roll them up."
    ]
  },
  "t5": {
    "nazwa": "Tomato soup with rice",
    "kroki": [
      "Finely dice the onion, carrot and garlic.",
      "Fry the onion, carrot and garlic in olive oil over medium heat for 5 minutes.",
      "Add the tomato passata and 1000 ml of water and simmer for 15 minutes.",
      "Cook the basmati rice in a separate pan according to the packet.",
      "Serve the soup over rice in the bowl."
    ]
  },
  "t6": {
    "nazwa": "Chicken curry with rice",
    "kroki": [
      "Dice the chicken breast and finely chop the onion, garlic and fresh ginger.",
      "Fry the onion, garlic and ginger in olive oil for 3 minutes, add the curry powder and toast for 30 seconds.",
      "Add the chicken and brown on all sides for 5 minutes, to an internal temperature of 74°C.",
      "Pour in the coconut milk and simmer over low heat for 12 minutes.",
      "Cook the basmati rice separately and serve together."
    ]
  },
  "t7": {
    "nazwa": "Pasta with pesto and cherry tomatoes",
    "kroki": [
      "Cook the pasta in salted water according to the packet, about 9-11 minutes.",
      "Halve the cherry tomatoes.",
      "Drain the pasta and toss it with the pesto in a frying pan.",
      "Add the cherry tomatoes, stir and sprinkle with grated Parmesan."
    ]
  },
  "t8": {
    "nazwa": "Greek salad with feta",
    "kroki": [
      "Halve the cherry tomatoes and dice the cucumber and onion.",
      "Mix the cherry tomatoes, cucumber and onion in a bowl.",
      "Crumble the feta on top, drizzle with olive oil and sprinkle with oregano."
    ]
  },
  "t9": {
    "nazwa": "Beef goulash with buckwheat",
    "kroki": [
      "Dice the beef sirloin and finely chop the onion and garlic.",
      "Brown the beef in a hot frying pan (7/9) for 4 minutes.",
      "Add the onion, garlic and smoked paprika and fry for 3 minutes.",
      "Pour in the tomato passata and half of 1000 ml of water and simmer covered for 90 minutes until the meat is tender.",
      "Cook the buckwheat groats separately and serve with the goulash."
    ]
  },
  "t10": {
    "nazwa": "Roast salmon with vegetables",
    "kroki": [
      "Preheat the oven to 200°C, fan.",
      "Lay the fresh salmon, broccoli and cherry tomatoes on a baking tray.",
      "Drizzle everything with olive oil and lemon juice and sprinkle with thyme.",
      "Roast for 15 minutes, until the salmon reaches an internal temperature of 60°C."
    ]
  },
  "t11": {
    "nazwa": "Potato pancakes",
    "kroki": [
      "Finely grate the potatoes and onion.",
      "Squeeze the excess water out of the grated potatoes and onion.",
      "Mix the potatoes and onion with the egg and plain flour and season with salt.",
      "Fry the pancakes in olive oil in a hot frying pan (6/9), 3 minutes on each side."
    ]
  },
  "t12": {
    "nazwa": "Chilli con carne",
    "kroki": [
      "Dice the onion and pepper.",
      "Brown the minced beef in a frying pan (7/9) for 6 minutes.",
      "Add the onion and pepper and fry for 4 minutes.",
      "Add the chilli powder and cumin, stir and toast for 30 seconds.",
      "Add the tomato passata and chickpeas and simmer covered for 25 minutes."
    ]
  },
  "t13": {
    "nazwa": "Cream of broccoli soup",
    "kroki": [
      "Cut the broccoli, potatoes and onion into smaller pieces.",
      "Fry the onion and garlic in olive oil for 3 minutes.",
      "Add the broccoli, potatoes and 1000 ml of water and simmer for 20 minutes until soft.",
      "Blend the soup until smooth and stir in the Greek yoghurt."
    ]
  },
  "t14": {
    "nazwa": "Hummus and vegetable sandwiches",
    "kroki": [
      "Thinly slice the cucumber, pepper and radishes.",
      "Spread the slices of wholemeal rye bread with hummus.",
      "Top the sandwiches with the cucumber, pepper and radishes."
    ]
  },
  "t15": {
    "nazwa": "Fruit and yoghurt smoothie",
    "kroki": [
      "Peel the bananas and cut them into pieces.",
      "Blend the Greek yoghurt, bananas, blueberries and honey into a smooth drink."
    ]
  },
  "t16": {
    "nazwa": "Chickpea and vegetable salad",
    "kroki": [
      "Drain the tinned chickpeas and tip them into a bowl.",
      "Dice the cherry tomatoes, cucumber and onion and add to the chickpeas.",
      "Crumble the feta on top and drizzle with olive oil and lemon juice."
    ]
  },
  "t17": {
    "nazwa": "Avocado toast with a poached egg",
    "kroki": [
      "Bring 1500 ml of water with 15 g of vinegar to the boil, stir a whirlpool, crack in the egg and poach for 3 minutes.",
      "Toast the slices of wholemeal rye bread in a toaster.",
      "Mash the avocado with the lemon juice and spread over the toast.",
      "Place a poached egg on top of each toast."
    ]
  },
  "t18": {
    "nazwa": "Egg fried rice with vegetables",
    "kroki": [
      "Cook the basmati rice in advance and let it cool (ideally the day before).",
      "Fry the ginger and garlic in a hot frying pan (7/9) for 1 minute.",
      "Add the stir-fry vegetables and fry for 3 minutes.",
      "Crack the eggs into a clear space in the pan and stir through once set.",
      "Add the rice and soy sauce and fry everything for 3 minutes, stirring often."
    ]
  },
  "t19": {
    "nazwa": "Chicken and vegetable wraps",
    "kroki": [
      "Cut the chicken breast into strips and thinly slice the pepper and onion.",
      "Fry the chicken in a frying pan (7/9) for 6 minutes, to an internal temperature of 74°C.",
      "Add the pepper and onion and fry together for 4 minutes.",
      "Warm the flour tortilla in a dry frying pan for 20 seconds on each side.",
      "Spoon the filling onto the tortilla, top with Greek yoghurt and roll up."
    ]
  },
  "t20": {
    "nazwa": "Roasted sweet potatoes with feta",
    "kroki": [
      "Preheat the oven to 200°C, fan.",
      "Dice the sweet potatoes, drizzle with olive oil and sprinkle with thyme.",
      "Roast the sweet potatoes for 30 minutes, stirring halfway through.",
      "Crumble the feta on top once they are out of the oven."
    ]
  },
  "t21": {
    "nazwa": "Garlic prawns with pasta",
    "kroki": [
      "Cook the pasta in salted water according to the packet.",
      "Chop the garlic and parsley.",
      "Fry the garlic in olive oil for 1 minute, add the prawns and fry for 3 minutes until golden.",
      "Toss the prawns with the drained pasta, lemon juice and parsley."
    ]
  },
  "t22": {
    "nazwa": "Caprese salad",
    "kroki": [
      "Halve the cherry tomatoes and cut the mozzarella into pieces of a similar size.",
      "Arrange the cherry tomatoes and mozzarella on a plate with basil leaves in between.",
      "Drizzle with olive oil and season with salt and pepper."
    ]
  },
  "t23": {
    "nazwa": "Overnight oats with yoghurt",
    "kroki": [
      "Mix the rolled oats, Greek yoghurt and milk in a jar.",
      "Leave in the fridge overnight (at least 6 hours).",
      "Slice the bananas and arrange them on top before serving, then drizzle with honey."
    ]
  },
  "t24": {
    "nazwa": "Lentil soup",
    "kroki": [
      "Finely dice the carrot and onion and chop the garlic.",
      "Fry the onion, carrot and garlic in olive oil for 5 minutes.",
      "Add the cumin, lentils, tomato passata and 1000 ml of water.",
      "Simmer covered for 25 minutes, until the lentils are soft."
    ]
  },
  "t25": {
    "nazwa": "Roast chicken with potatoes",
    "kroki": [
      "Preheat the oven to 200°C, fan.",
      "Quarter the potatoes, drizzle with olive oil and sprinkle with smoked paprika and chopped garlic.",
      "Lay the chicken breast and potatoes on a baking tray.",
      "Roast for 35 minutes, until the chicken reaches an internal temperature of 74°C and the potatoes are golden."
    ]
  },
  "t26": {
    "nazwa": "Tuna with rice and vegetables",
    "kroki": [
      "Cook the basmati rice according to the packet.",
      "Fry the stir-fry vegetables in olive oil for 4 minutes.",
      "Drain the tinned tuna and add it to the vegetables with the soy sauce, then heat through for 2 minutes.",
      "Serve the tuna and vegetables on the rice, sprinkled with sesame seeds."
    ]
  },
  "t27": {
    "nazwa": "Egg and chive sandwich",
    "kroki": [
      "Hard-boil the eggs in boiling water for 9 minutes, cool and peel.",
      "Butter the slices of wholemeal rye bread.",
      "Slice the eggs, lay them on the bread and sprinkle with chopped chives."
    ]
  },
  "t28": {
    "nazwa": "Banana pancakes",
    "kroki": [
      "Mash the bananas with a fork until smooth.",
      "Blend the plain flour, eggs, milk and mashed bananas into a batter.",
      "Fry thin pancakes in a hot frying pan (6/9), a minute on each side.",
      "Drizzle the finished pancakes with honey."
    ]
  },
  "t29": {
    "nazwa": "Quinoa and vegetable salad",
    "kroki": [
      "Cook the quinoa according to the packet and let it cool.",
      "Dice the cucumber, pepper and cherry tomatoes.",
      "Mix the quinoa with the vegetables, olive oil, lemon juice and chopped parsley."
    ]
  },
  "t30": {
    "nazwa": "Soy sauce chicken with vegetables",
    "kroki": [
      "Dice the chicken breast and finely chop the ginger and garlic.",
      "Fry the ginger and garlic in olive oil for 1 minute, add the chicken and fry for 6 minutes, to an internal temperature of 74°C.",
      "Add the stir-fry vegetables and soy sauce and fry together for 4 minutes.",
      "Cook the basmati rice separately and serve with the chicken."
    ]
  },
  "t31": {
    "nazwa": "Cream of sweet potato soup",
    "kroki": [
      "Dice the sweet potatoes and onion.",
      "Fry the onion and garlic in olive oil for 3 minutes, add the turmeric and toast for 30 seconds.",
      "Add the sweet potatoes and 1000 ml of water and simmer for 20 minutes until soft.",
      "Blend the soup until smooth and stir in the Greek yoghurt."
    ]
  },
  "t32": {
    "nazwa": "Courgette fritters",
    "kroki": [
      "Grate the courgette and squeeze out the excess water.",
      "Mix the courgette with the egg, plain flour and crumbled feta.",
      "Fry the fritters in olive oil in a hot frying pan (6/9), 3 minutes on each side."
    ]
  },
  "t33": {
    "nazwa": "Yoghurt with granola and fruit",
    "kroki": [
      "Slice the bananas.",
      "Spoon the Greek yoghurt into bowls and sprinkle with granola.",
      "Top with the bananas and blueberries and drizzle with honey."
    ]
  },
  "t34": {
    "nazwa": "Salad: quinoa, smoked salmon, kale and orange",
    "kroki": [
      "Cook the quinoa (rinsed first in cold water) for 12-14 minutes, leave covered for 5 minutes, then spread on a tray to cool.",
      "Massage the kale with salt, a teaspoon of olive oil and the juice of a quarter of a lemon for 1-2 minutes, until it softens and darkens.",
      "Cut the smoked salmon into strips across the grain and slice the radishes thinly.",
      "Peel the orange with a knife and cut out the segments from between the membranes.",
      "Mix the Greek yoghurt, the juice of the remaining lemon, crushed garlic and parsley into a dressing.",
      "Toast the sesame and sunflower seeds in a dry frying pan for 2-3 minutes, stirring constantly.",
      "Arrange the quinoa, kale, radishes and salmon on a plate, add the orange, pour over the dressing and sprinkle with the seeds."
    ]
  },
  "t35": {
    "nazwa": "Smoked mackerel with potatoes, cucumber and yoghurt",
    "kroki": [
      "Boil the potatoes in their skins until tender, cool, peel and dice.",
      "Flake the smoked mackerel with your fingers, removing the skin.",
      "Cut the cucumber into half-moons, salt it and leave for 10 minutes, then squeeze out the excess water.",
      "Pour boiling water over the onion for 30 seconds and drain, to soften its bite.",
      "Toast the sesame and sunflower seeds in a dry frying pan for 2-3 minutes.",
      "Mix the Greek yoghurt, mustard, lemon juice, chives and chopped parsley into a sauce.",
      "Combine the potatoes, cucumber and onion, lay the mackerel on top, pour over the sauce and sprinkle with the seeds."
    ]
  },
  "t36": {
    "nazwa": "Buckwheat with roasted sweet potato, kale and cashews",
    "kroki": [
      "Preheat the oven to 220°C, fan. Dice the sweet potato, spread it in a single layer on a tray and roast for 25 minutes.",
      "Cook the buckwheat groats at a ratio of 1:2 for 10-12 minutes, drain and spread out to cool.",
      "Chop the kale, drizzle with olive oil and lemon juice and massage with your hands for a minute, until it softens and darkens.",
      "Toast the cashews in a dry frying pan for 3 minutes, adding the sesame and sunflower seeds for the last minute.",
      "Mix the Greek yoghurt with crushed garlic and 15 g of lemon juice into a sauce.",
      "Arrange the buckwheat and sweet potato, top with the kale, sprinkle with the cashews and seeds and pour over the sauce."
    ]
  },
  "t37": {
    "nazwa": "Prawns with pasta, garlic and spinach",
    "kroki": [
      "Cook the pasta in salted water according to the packet and drain.",
      "Fry the onion and garlic in olive oil for 2 minutes, add the cherry tomatoes and simmer for 8-10 minutes into a sauce.",
      "Heat a frying pan until very hot and fry the prawns for 60-90 seconds on each side, until they curl into a C shape.",
      "Add the sauce, pasta and spinach to the prawns and toss over the heat for 60 seconds, until the spinach wilts.",
      "Take off the heat, sprinkle with lemon juice and scatter with parsley."
    ]
  },
  "t38": {
    "nazwa": "Scrambled eggs with smoked salmon",
    "kroki": [
      "Beat the eggs with a fork with salt and pepper.",
      "Cook the eggs in butter over low heat, stirring constantly, until set.",
      "Take the pan off the heat and only now add the smoked salmon, stirring gently.",
      "Halve the cherry tomatoes and fry them separately over high heat for a minute, skin side down.",
      "Toast the wholemeal rye bread, spread it with the rest of the butter and sprinkle the eggs with chives."
    ]
  },
  "t39": {
    "nazwa": "Twaróg pancakes with blueberries",
    "kroki": [
      "Mash the twaróg with the eggs and rolled oats into a smooth mixture and leave for 10 minutes.",
      "Fry the pancakes in butter over medium heat, 2-3 minutes on each side.",
      "Top the fried pancakes with blueberries and drizzle with honey."
    ]
  },
  "t40": {
    "nazwa": "Shakshuka",
    "kroki": [
      "Soften the onion and pepper in olive oil over medium heat, about 5 minutes.",
      "Add the tomato passata, season and simmer until the sauce thickens.",
      "Make hollows in the sauce, crack the eggs into them, cover and cook over low heat for 5-6 minutes, until the whites set.",
      "Take off the heat and crumble the feta on top.",
      "Toast the wholemeal rye bread and serve on the side."
    ]
  },
  "t41": {
    "nazwa": "Roast salmon with sweet potato and broccoli",
    "kroki": [
      "Preheat the oven to 220°C, fan. Dice the sweet potato, drizzle with olive oil and roast for 15 minutes.",
      "Add the salmon, skin side down, to the same tray and roast for another 12-14 minutes.",
      "Steam the broccoli for 4 minutes.",
      "Mix the Greek yoghurt with lemon juice into a sauce and serve on the side."
    ]
  },
  "t42": {
    "nazwa": "Turkey stir-fry with rice",
    "kroki": [
      "Cook the basmati rice (rinsed first until the water runs clear) and set aside.",
      "Cut the turkey breast into strips across the grain.",
      "Heat the frying pan with olive oil over high heat for 4 minutes and fry the turkey in batches, so it does not stew in its own juices.",
      "Add the stir-fry vegetables and fry for 3 minutes, adding the ginger and garlic for the last 30 seconds.",
      "Toast the cashews separately in a dry frying pan and add them at the end.",
      "Pour in the soy sauce, fry for another 30 seconds over high heat and serve with the rice."
    ]
  },
  "t43": {
    "nazwa": "Beef meatballs in tomato sauce with buckwheat",
    "kroki": [
      "Grate the onion and mix it with the minced beef, crushed garlic, salt and pepper.",
      "Shape walnut-sized meatballs without pressing them too hard.",
      "Brown the meatballs on all sides in olive oil over high heat, then pour over the tomato passata and simmer over low heat for 15 minutes.",
      "Cook the buckwheat groats separately, 10-12 minutes at a ratio of 1:2.",
      "Serve the meatballs with the buckwheat and crumble the feta on top."
    ]
  },
  "t44": {
    "nazwa": "Chicken and lentil curry with rice",
    "kroki": [
      "Fry the onion in olive oil for 8-10 minutes, until golden.",
      "Add the garlic, ginger, turmeric, cumin and smoked paprika and toast for 30 seconds in the hot oil.",
      "Add the diced chicken breast, tomato passata and lentils and cook over low heat for 25 minutes, until the lentils fall apart.",
      "Take off the heat and stir in the Greek yoghurt, so it does not curdle.",
      "Cook the basmati rice separately, serve together and sprinkle with parsley."
    ]
  },
  "t45": {
    "nazwa": "Hard-boiled eggs with a banana",
    "kroki": [
      "Hard-boil the eggs in boiling water for 9 minutes, cool in cold water and peel.",
      "Serve the eggs with a banana."
    ]
  },
  "t46": {
    "nazwa": "Kotlet schabowy — Polish breaded pork cutlet with potatoes and cucumber salad",
    "kroki": [
      "Pound the pork loin with a meat mallet into slices 1 cm thick and season with salt and pepper.",
      "Coat the cutlets in plain flour, then beaten eggs, then breadcrumbs.",
      "Fry the cutlets in rapeseed oil over medium heat (6/9) for 4 minutes on each side, to 70°C inside.",
      "Boil the potatoes in salted water for 20 minutes.",
      "Grate the cucumber, squeeze out the water, mix with the 18% sour cream and dill."
    ]
  },
  "t47": {
    "nazwa": "Gołąbki — Polish cabbage rolls in tomato sauce",
    "kroki": [
      "Blanch the white cabbage in boiling water for 10 minutes and separate the leaves.",
      "Cook the basmati rice until half-done, 8 minutes.",
      "Fry the onion in rapeseed oil for 5 minutes, then mix with the minced beef and rice.",
      "Spoon the filling onto the cabbage leaves and roll them up.",
      "Pour over the tomato passata and simmer covered for 60 minutes."
    ]
  },
  "t48": {
    "nazwa": "Rosół — Polish chicken soup with noodles",
    "kroki": [
      "Cover the chicken with cold water, bring to the boil and skim off the foam.",
      "Char the onion and add it with the carrot, parsley root, celeriac and leek.",
      "Simmer on the lowest heat for 2.5 hours, uncovered.",
      "Cook the pasta separately, pour over the broth and sprinkle with parsley."
    ]
  },
  "t49": {
    "nazwa": "Bigos — Polish hunter's stew",
    "kroki": [
      "Squeeze out the sauerkraut and shred the white cabbage.",
      "Fry the smoked bacon for 5 minutes, add the sliced kiełbasa and the onion and fry for 8 minutes.",
      "Combine both cabbages with the meat and add the tomato passata and prunes.",
      "Simmer covered for 2 hours over low heat, stirring every half hour."
    ]
  },
  "t50": {
    "nazwa": "Pork patties with potatoes",
    "kroki": [
      "Grate the onion and mix it with the minced pork, egg and half of the breadcrumbs.",
      "Shape the patties and coat them in the remaining breadcrumbs.",
      "Fry in rapeseed oil (6/9) for 5 minutes on each side, to 71°C inside.",
      "Boil the potatoes for 20 minutes and sprinkle with dill."
    ]
  },
  "t51": {
    "nazwa": "Żurek — Polish sour rye soup with white sausage",
    "kroki": [
      "Simmer the biała kiełbasa in 1000 ml of water for 20 minutes, take it out and slice.",
      "Fry the smoked bacon with the onion for 6 minutes and add to the stock.",
      "Cook the diced potatoes in the same pot for 15 minutes.",
      "Pour in the żurek sour starter, add the marjoram and crushed garlic and cook for 10 minutes without boiling.",
      "Take off the heat, stir in the 18% sour cream and add the sausage."
    ]
  },
  "t52": {
    "nazwa": "Kopytka — Polish potato dumplings with butter",
    "kroki": [
      "Boil the potatoes for 20 minutes, press them through a ricer and let them cool.",
      "Make a dough from the potatoes, plain flour and egg, without kneading for too long.",
      "Roll into logs and cut diagonally into dumplings.",
      "Cook in batches in boiling water for 2 minutes after they float.",
      "Fry the breadcrumbs in butter and pour over the dumplings."
    ]
  },
  "t53": {
    "nazwa": "Pierogi — Polish dumplings with sauerkraut and mushrooms",
    "kroki": [
      "Soak the dried mushrooms in warm water for 2 hours, cook for 30 minutes and chop.",
      "Cook the squeezed-out sauerkraut for 40 minutes, squeeze again and chop.",
      "Fry the onion in rapeseed oil for 8 minutes and combine with the sauerkraut and mushrooms.",
      "Knead a dough from the plain flour, 3 g of salt and boiling water, then leave for 30 minutes.",
      "Roll out, cut out rounds, add the filling and pinch the edges together.",
      "Cook the pierogi for 3 minutes after they float."
    ]
  },
  "t54": {
    "nazwa": "Dill pickle soup",
    "kroki": [
      "Coarsely grate the dill pickles and soften them in butter for 10 minutes.",
      "Cook the carrot and parsley root in 1000 ml of water for 15 minutes.",
      "Add the diced potatoes and cook for another 15 minutes.",
      "Add the softened pickles and cook for 5 minutes.",
      "Stir in the 18% sour cream and sprinkle with dill."
    ]
  },
  "t55": {
    "nazwa": "Schabowy — Polish braised pork loin with buckwheat",
    "kroki": [
      "Slice the pork loin and brown in rapeseed oil (7/9) for 2 minutes on each side.",
      "Fry the onion for 6 minutes and add the marjoram.",
      "Pour 250 ml of water over the meat and simmer covered for 45 minutes, until tender.",
      "Cook the buckwheat groats separately, 12 minutes."
    ]
  },
  "t56": {
    "nazwa": "Leczo — pepper and sausage stew",
    "kroki": [
      "Fry the sliced kiełbasa in rapeseed oil for 6 minutes.",
      "Add the onion and pepper and fry for 8 minutes.",
      "Add the courgette and smoked paprika and fry for 3 minutes.",
      "Pour in the tomato passata and simmer covered for 25 minutes."
    ]
  },
  "t57": {
    "nazwa": "Fasolka po bretońsku — Polish beans in tomato sauce with sausage",
    "kroki": [
      "Fry the smoked bacon for 5 minutes, add the kiełbasa and onion and fry for 8 minutes.",
      "Pour in the tomato passata and simmer for 15 minutes.",
      "Add the drained tinned white beans and marjoram and cook for another 15 minutes."
    ]
  },
  "t58": {
    "nazwa": "Roast chicken with vegetables",
    "kroki": [
      "Preheat the oven to 200°C, fan.",
      "Chop the potatoes, carrots and onion and toss with rapeseed oil, marjoram and crushed garlic.",
      "Lay the chicken breast on the vegetables.",
      "Roast for 40 minutes, until the chicken reaches 74°C inside."
    ]
  },
  "t59": {
    "nazwa": "Racuchy — Polish apple fritters",
    "kroki": [
      "Coarsely grate the apples.",
      "Mix the plain flour, eggs and semi-skimmed milk (2%) into a thick batter and add the apples and cinnamon.",
      "Fry the fritters in rapeseed oil (6/9) for 3 minutes on each side."
    ]
  },
  "t60": {
    "nazwa": "Polish vegetable salad with mayonnaise",
    "kroki": [
      "Boil the potatoes, carrots and parsley root in their skins for 25 minutes, cool and dice.",
      "Hard-boil the eggs for 9 minutes, peel and chop.",
      "Dice the dill pickles and squeeze them out.",
      "Mix everything with the tinned peas, mayonnaise and Dijon mustard."
    ]
  },
  "t61": {
    "nazwa": "Barszcz — Polish beetroot soup with mushroom dumplings",
    "kroki": [
      "Roast the beetroot in foil at 200°C for 60 minutes, peel and grate.",
      "Make a stock from the carrot and parsley root, 30 minutes.",
      "Add the grated beetroot, crushed garlic and cider vinegar and heat without boiling.",
      "Soak the dried mushrooms, cook and chop them as a filling for small dumplings made from plain flour dough.",
      "Cook the dumplings for 3 minutes and serve them in the barszcz."
    ]
  },
  "t62": {
    "nazwa": "Krokiety — Polish breaded pancake rolls with meat",
    "kroki": [
      "Blend the plain flour, some of the eggs and the semi-skimmed milk (2%) into a batter and fry thin pancakes.",
      "Fry the minced pork with the onion for 12 minutes and season with salt and pepper.",
      "Spoon the filling onto the pancakes and roll them into parcels.",
      "Coat in beaten egg and breadcrumbs and fry in rapeseed oil for 3 minutes on each side."
    ]
  },
  "t63": {
    "nazwa": "Tofu, sweet potato and tahini bowl",
    "kroki": [
      "Preheat the oven to 200°C, fan. Dice the sweet potatoes, drizzle with extra virgin olive oil and roast for 25 minutes.",
      "Press the plain tofu, dice it and roast it for the last 15 minutes.",
      "Cook the quinoa for 14 minutes.",
      "Mix the tahini with lemon juice and water into a smooth sauce.",
      "Arrange the quinoa, sweet potatoes, tofu and kale in a bowl and pour over the sauce."
    ]
  },
  "t64": {
    "nazwa": "Chickpea and spinach curry",
    "kroki": [
      "Fry the onion in olive oil for 6 minutes, add the garlic and fresh ginger and fry for a minute.",
      "Add the curry powder and toast for 30 seconds.",
      "Pour in the tomato passata and coconut milk and cook for 10 minutes.",
      "Add the drained tinned chickpeas and simmer for 12 minutes.",
      "Stir in the baby spinach at the end and serve with basmati rice."
    ]
  },
  "t65": {
    "nazwa": "Salmon and avocado bowl",
    "kroki": [
      "Cook the basmati rice and let it cool.",
      "Roast the fresh salmon at 200°C for 12 minutes, to 60°C inside.",
      "Slice the avocado and cucumber.",
      "Arrange everything in a bowl, drizzle with soy sauce and lemon juice and sprinkle with sesame seeds."
    ]
  },
  "t66": {
    "nazwa": "Lentil and roasted beetroot salad",
    "kroki": [
      "Roast the beetroot in foil at 200°C for 50 minutes, peel and dice.",
      "Cook the lentils for 20 minutes and drain.",
      "Massage the kale with extra virgin olive oil for a minute.",
      "Toast the walnuts in a dry frying pan for 3 minutes.",
      "Mix everything, crumble over the feta and sprinkle with cider vinegar."
    ]
  },
  "t67": {
    "nazwa": "Cream of pumpkin soup with ginger",
    "kroki": [
      "Fry the onion and fresh ginger in extra virgin olive oil for 5 minutes.",
      "Add the chopped pumpkin and carrot, pour in 1000 ml of water and cook for 25 minutes.",
      "Blend until smooth and stir in the coconut milk.",
      "Toast the sunflower seeds and sprinkle over before serving."
    ]
  },
  "t68": {
    "nazwa": "Bean and sweetcorn tacos",
    "kroki": [
      "Fry the onion and pepper for 6 minutes, add the cumin and toast for 30 seconds.",
      "Add the drained tinned kidney beans and tinned sweetcorn and fry for 6 minutes.",
      "Mash the avocado with lemon juice.",
      "Warm the flour tortillas in a dry frying pan and fill with the beans and avocado."
    ]
  },
  "t69": {
    "nazwa": "Pasta with courgette and ricotta",
    "kroki": [
      "Cook the pasta, keeping 250 ml of the cooking water.",
      "Grate the courgette and fry it in extra virgin olive oil with garlic for 6 minutes.",
      "Add the pasta, ricotta and cooking water and stir into a creamy sauce.",
      "Sprinkle with lemon juice."
    ]
  },
  "t70": {
    "nazwa": "Millet and roasted pumpkin salad",
    "kroki": [
      "Roast the diced pumpkin at 200°C for 25 minutes, drizzled with extra virgin olive oil.",
      "Cook the millet for 15 minutes, rinsing it first.",
      "Toast the cashews in a dry frying pan for 3 minutes.",
      "Mix with the baby spinach and dress with lemon and honey."
    ]
  },
  "t71": {
    "nazwa": "Turkey and vegetable stir-fry",
    "kroki": [
      "Cut the turkey breast into strips across the grain.",
      "Heat the frying pan over high heat for 4 minutes and fry the turkey in batches for 3 minutes, to 74°C inside.",
      "Add the stir-fry vegetables, fresh ginger and garlic and fry for 4 minutes.",
      "Pour in the soy sauce, sprinkle with sesame seeds and serve with basmati rice."
    ]
  },
  "t72": {
    "nazwa": "Egg mayonnaise and chive sandwiches",
    "kroki": [
      "Hard-boil the eggs for 9 minutes, cool and peel.",
      "Mash the eggs with a fork and mix with the mayonnaise and Dijon mustard.",
      "Sprinkle with chives and spread on wholemeal rye bread."
    ]
  },
  "t73": {
    "nazwa": "Milk porridge with banana",
    "kroki": [
      "Bring the semi-skimmed milk (2%) to the boil, add the rolled oats and cook for 5 minutes, stirring.",
      "Slice the bananas.",
      "Spoon the porridge into bowls and add the bananas, 100% peanut butter and cinnamon."
    ]
  },
  "t74": {
    "nazwa": "French toast with fruit",
    "kroki": [
      "Beat the eggs with the semi-skimmed milk (2%).",
      "Soak the slices of wholemeal rye bread in the mixture for 30 seconds on each side.",
      "Fry in butter (5/9) for 2 minutes on each side.",
      "Serve with blueberries and honey."
    ]
  },
  "t75": {
    "nazwa": "Poached eggs on toast",
    "kroki": [
      "Bring water with cider vinegar to the boil, stir a whirlpool and crack in the eggs one at a time, cooking for 3 minutes.",
      "Fry the baby spinach in butter for 2 minutes.",
      "Toast the wholemeal rye bread and top with the spinach and eggs."
    ]
  },
  "t76": {
    "nazwa": "Baked pasta with cheese",
    "kroki": [
      "Cook the pasta al dente, 8 minutes.",
      "Fry the onion in extra virgin olive oil, add the minced beef and fry for 8 minutes.",
      "Pour in the tomato passata and simmer for 12 minutes.",
      "Mix with the pasta, transfer to a baking dish and sprinkle with grated hard cheese.",
      "Bake at 200°C for 20 minutes, until the cheese is golden."
    ]
  },
  "t77": {
    "nazwa": "Creamy chicken with rice",
    "kroki": [
      "Cut the chicken breast into strips and brown in butter for 6 minutes, to 74°C inside.",
      "Add the onion and sliced mushrooms and fry for 8 minutes.",
      "Pour in the 18% sour cream and simmer over low heat for 6 minutes, without boiling.",
      "Cook the basmati rice separately and sprinkle with parsley."
    ]
  },
  "t78": {
    "nazwa": "Vegetable soup",
    "kroki": [
      "Cook the carrot, parsley root and celeriac in one and a half 1000 ml of water for 20 minutes.",
      "Add the diced potatoes and cook for 15 minutes.",
      "Add the broccoli florets for the last 6 minutes.",
      "Add the butter and sprinkle with dill."
    ]
  },
  "t79": {
    "nazwa": "Goulash soup",
    "kroki": [
      "Brown the diced beef sirloin in rapeseed oil for 5 minutes.",
      "Add the onion and smoked paprika and fry for 4 minutes.",
      "Pour in the tomato passata and 1000 ml of water and simmer for 70 minutes, until the meat is tender.",
      "Add the potatoes and pepper and cook for another 20 minutes."
    ]
  },
  "t80": {
    "nazwa": "Pan-fried chicken breast with vegetables",
    "kroki": [
      "Dice the chicken breast and brown in extra virgin olive oil for 6 minutes, to 74°C inside.",
      "Add the courgette and pepper and fry for 6 minutes.",
      "Add the cherry tomatoes, garlic and thyme and fry for 3 minutes."
    ]
  },
  "t81": {
    "nazwa": "Buckwheat with mushrooms and onion",
    "kroki": [
      "Cook the buckwheat groats for 12 minutes at a ratio of 1:2.",
      "Fry the onion in butter for 6 minutes, add the sliced mushrooms and fry for 10 minutes.",
      "Mix with the buckwheat and sprinkle with parsley."
    ]
  },
  "t82": {
    "nazwa": "Chicken ramen with marinated egg",
    "kroki": [
      "Boil the eggs for exactly 6.5 minutes and move them straight into iced water — the point is to keep the yolk runny, and the cold stops the cooking at that very second.",
      "Peel the eggs and cover them with a half-and-half mix of soy sauce and water; leave for at least 2 hours, ideally overnight.",
      "Cover the chicken breast with just enough water, add crushed garlic and slices of fresh ginger and cook on the lowest heat for 20 minutes — the broth should tremble, not bubble, because boiling clouds it and dries out the meat.",
      "Take out the chicken and rest it for 10 minutes before slicing so the juices settle, then slice thinly across the grain.",
      "Loosen the white miso in a ladle of hot broth before adding it to the pot — dropped straight into the soup it stays in lumps.",
      "Take the broth off the heat and only now stir in the miso: boiled, it loses flavour and some of its beneficial bacteria.",
      "Cook the ramen noodles separately according to the packet and drain — cooked in the broth they cloud it with starch.",
      "Put the noodles into bowls, pour over the broth, add the chicken, the halved egg, nori and chives, and drizzle with sesame oil."
    ]
  },
  "t83": {
    "nazwa": "Bibimbap with beef and vegetables",
    "kroki": [
      "Cut the beef sirloin into thin strips and marinate in soy sauce with half the garlic and the sesame oil for 20 minutes.",
      "Cook the basmati rice and leave it covered — in bibimbap it should be warm and slightly sticky, so it mixes with everything else.",
      "Blanch the baby spinach in boiling water for 30 seconds, rinse under cold water and squeeze hard — unsqueezed, it waters down the whole bowl.",
      "Cut the carrot into thin matchsticks and fry for 2 minutes, just to soften while staying crunchy.",
      "Fry the mushrooms over high heat for 5 minutes without stirring too often — moved all the time, they release water and stew instead of browning.",
      "Fry the marinated beef in a very hot frying pan for 2 minutes, in batches.",
      "Fry the eggs sunny side up so the yolk stays runny — it takes the place of part of the sauce.",
      "Put the rice into bowls, arrange all the toppings in separate piles around it, the egg in the middle and the gochujang alongside, and sprinkle with sesame seeds. The mixing is up to whoever eats it."
    ]
  },
  "t84": {
    "nazwa": "Chicken katsu curry",
    "kroki": [
      "Pound the chicken breast to an even thickness of about 1.5 cm — an uneven cutlet dries out on one side before the other is cooked.",
      "Coat in plain flour, then beaten egg, then panko, pressing the crumbs on with your hand.",
      "Put the breaded cutlets in the fridge for 10 minutes so the coating sets and does not come off in the pan.",
      "Fry the onion and carrot in a spoonful of rapeseed oil for 8 minutes, until the onion is translucent and sweet.",
      "Add the curry powder and toast for 40 seconds in the oil — the spice only releases its aroma when heated; added to liquid it stays raw-tasting.",
      "Pour in the coconut milk and 250 ml of water, add the honey, simmer for 15 minutes and blend into a smooth sauce.",
      "Fry the cutlets in hot rapeseed oil for 4 minutes on each side, to 74°C inside, and drain on a rack, not on paper — on paper the coating steams and goes soft.",
      "Slice the katsu into strips and serve on basmati rice, with the sauce alongside or around it."
    ]
  },
  "t85": {
    "nazwa": "Prawn pad thai",
    "kroki": [
      "Soak the rice noodles in warm water for 25 minutes, until pliable but still firm in the middle — they finish cooking in the pan.",
      "Mix the fish sauce, tamarind paste and cane sugar into a sauce; taste and balance it so you can taste sour, sweet and salty at once.",
      "Heat the frying pan until very hot — pad thai is quick and needs high heat; over medium heat it turns into a stew.",
      "Fry the prawns in rapeseed oil for 90 seconds on each side, until they curl into a C shape, and take them out.",
      "Crack the eggs into the pan, stir and let them set without drying out.",
      "Add the drained rice noodles and the sauce and toss vigorously for 2 minutes, until the noodles absorb the liquid.",
      "Add the bean sprouts and prawns and toss for another 30 seconds — the sprouts should stay crunchy.",
      "Sprinkle with chopped peanuts and chives and serve with a lemon wedge to squeeze over."
    ]
  },
  "t86": {
    "nazwa": "Spanish potato tortilla",
    "kroki": [
      "Thinly slice the potatoes and cut the onion into thin wedges.",
      "Cover the potatoes and onion with extra virgin olive oil in a frying pan and cook gently over low heat for 25 minutes — this is not frying: the potatoes should soften in the oil, not brown.",
      "Drain the vegetables, keeping the oil, and let them cool for 5 minutes so they do not set the eggs when mixed.",
      "Beat the eggs, salt them, combine with the potatoes and leave for 10 minutes — the potatoes need to soak up the egg so the tortilla holds together.",
      "Heat 20 ml of the reserved oil, pour in the mixture and cook over medium heat for 6 minutes, shaking the pan so it does not stick.",
      "Cover the pan with a plate, flip the whole thing over and slide the tortilla back in, other side down.",
      "Cook for another 4 minutes — the middle should stay slightly moist; in Spain a dry tortilla counts as a failure.",
      "Leave for 5 minutes before cutting, so it firms up."
    ]
  },
  "t87": {
    "nazwa": "Aubergine moussaka",
    "kroki": [
      "Slice the aubergine, salt generously and leave for 30 minutes, then pat dry — the salt draws out bitterness and water; without it the moussaka will be watery.",
      "Bake the aubergine slices drizzled with extra virgin olive oil at 200°C for 20 minutes instead of frying — aubergine soaks up oil like a sponge.",
      "Fry the onion for 6 minutes, add the minced beef and fry for 8 minutes until browned.",
      "Pour in the tomato passata, add the cinnamon and simmer for 20 minutes until the sauce thickens — the cinnamon is what sets moussaka apart from ordinary meat in tomato sauce.",
      "Melt the butter, add the plain flour and cook for 2 minutes, stirring — raw flour leaves a gluey taste.",
      "Pour in the semi-skimmed milk (2%) slowly, stirring all the time, and cook the béchamel for 5 minutes until thick.",
      "Layer up: aubergine, meat, aubergine, then béchamel and grated hard cheese on top.",
      "Bake at 190°C for 40 minutes and leave for 15 minutes before cutting, or it will run all over the plate."
    ]
  },
  "t88": {
    "nazwa": "Chakapuli — Georgian lamb with tarragon",
    "kroki": [
      "Cut the lamb into large pieces — smaller ones fall apart during the long braise and leave nothing but strands.",
      "Layer it in a pot with the sliced onion, without browning: this dish is deliberately pale and sour.",
      "Pour over the dry wine, cover and simmer over low heat for 40 minutes.",
      "Add the tkemali and garlic and simmer for another 30 minutes, until the meat pulls apart with a spoon.",
      "Add whole sprigs of fresh tarragon for the last 10 minutes — cooked longer it turns bitter and loses the aniseed scent that matters most in this dish.",
      "Take off the heat, stir in the chopped fresh coriander and leave covered for 10 minutes.",
      "Taste and only now season with salt — the plums and wine bring their own acidity, so salt added earlier easily overdoes it."
    ]
  },
  "t89": {
    "nazwa": "Cod ceviche with lime",
    "kroki": [
      "Use only fresh fish or frozen and thawed — nothing in ceviche is heated, so the quality of the fish is the whole dish.",
      "Cut the cod into cubes of about 1.5 cm; smaller pieces break down into mush in the acid.",
      "Squeeze the limes and pour the juice over the fish so it is covered.",
      "Leave in the fridge for 12–15 minutes and watch: the fish should turn white on the outside and stay translucent in the middle. Left for half an hour it goes dry and rubbery.",
      "Cut the red onion into thin slivers and rinse under cold water to take off its sharpness.",
      "Pour off most of the lime juice and mix the fish with the onion, chopped chilli and fresh coriander.",
      "Add the diced avocado at the very end, mix gently and drizzle with extra virgin olive oil."
    ]
  },
  "t90": {
    "nazwa": "Red lentil dal",
    "kroki": [
      "Rinse the red lentils 3–4 times, until the water is no longer cloudy — the cloudiness is starch, which would turn the dal into glue.",
      "Cover the lentils with 1000 ml of water and the turmeric and cook for 20 minutes, skimming off the foam, until they fall apart.",
      "In a separate frying pan heat the ghee and add the cumin — the seeds should sizzle and become fragrant within 20 seconds.",
      "Add the onion and fry for 8 minutes, until browned at the edges; it gives the dal its sweetness, so do not cut this step short.",
      "Add the garlic and fresh ginger and fry for a minute, then the tinned tomatoes, and simmer for 8 minutes until the fat starts to separate at the edges — a sign that the base is ready.",
      "Tip everything from the frying pan into the pot of lentils, stir and cook together for 5 minutes.",
      "Add the garam masala only at the end and take off the heat — this blend is for aroma, not a base, and cooking destroys it.",
      "Sprinkle with fresh coriander before serving."
    ]
  },
  "t91": {
    "nazwa": "Chicken gyros with tzatziki",
    "kroki": [
      "Marinate the chicken breast, cut into strips, in extra virgin olive oil, lemon juice, dried oregano and smoked paprika for at least 30 minutes.",
      "Coarsely grate the cucumber, salt it and leave for 15 minutes, then squeeze hard — unsqueezed, it waters down the tzatziki within a quarter of an hour.",
      "Mix the Greek yoghurt with the squeezed cucumber and crushed garlic and chill so the flavours come together.",
      "Heat the frying pan really hot and fry the chicken in batches for 3 minutes — all at once it starts to stew in its own juices and will not brown.",
      "Do not move the meat for the first 90 seconds, so it browns and releases from the pan by itself.",
      "Check the chicken is 74°C inside and rest it for 5 minutes.",
      "Warm the flour tortilla in a dry frying pan for 20 seconds on each side — cold, it cracks when rolled.",
      "Add the chicken, tzatziki and red onion and roll up tightly."
    ]
  },
  "t92": {
    "nazwa": "Miso soup with tofu and seaweed",
    "kroki": [
      "Soak the wakame in cold water for 10 minutes — it expands several times over, so do not use more.",
      "Bring 700 ml of water to the boil and take off the heat.",
      "Loosen the white miso in a ladle of hot water, pressing with a spoon until every lump is gone.",
      "Pour the loosened miso into the pot and do not boil again — boiling kills the bacteria and flattens the flavour, which is why miso always goes in at the end.",
      "Dice the plain tofu and put it into the hot soup for 2 minutes, just to warm through.",
      "Add the drained wakame and season with soy sauce.",
      "Sprinkle with chives and crumbled nori just before serving."
    ]
  },
  "t93": {
    "nazwa": "Oven-baked ratatouille",
    "kroki": [
      "Fry the onion and garlic in extra virgin olive oil for 8 minutes, add the tinned tomatoes and simmer for 15 minutes into a thick sauce.",
      "Spread the sauce over the bottom of an ovenproof dish — it is the base the vegetables bake on rather than boil in.",
      "Slice the courgette, aubergine and pepper to the same thickness, about 5 mm; uneven slices mean some stay raw while others turn to mush.",
      "Arrange the slices tightly on the sauce, overlapping and alternating.",
      "Drizzle with extra virgin olive oil, sprinkle with thyme and cover with baking paper — the cover traps the steam and finishes cooking the vegetables; without it they dry out.",
      "Bake at 190°C for 45 minutes covered, then 15 minutes uncovered so the top browns.",
      "Leave for 10 minutes and scatter with fresh basil — added earlier it turns black in the oven."
    ]
  },
  "t94": {
    "nazwa": "Chickpea and sweet potato stew",
    "kroki": [
      "Fry the onion in extra virgin olive oil for 8 minutes, until soft and starting to turn golden — this is the flavour base of the whole dish.",
      "Add the garlic, cumin and smoked paprika and toast for 40 seconds in the oil so the spices release their aroma.",
      "Add the diced sweet potatoes and stir for 3 minutes until coated in the spices.",
      "Pour in the tinned tomatoes and 250 ml of water and cook covered for 20 minutes.",
      "Add the drained tinned chickpeas and cook uncovered for another 10 minutes so the sauce thickens.",
      "Crush 2–3 pieces of sweet potato with a spoon — the released starch thickens the sauce without cream.",
      "Season with salt only at the end; tinned chickpeas are often salted already."
    ]
  },
  "t95": {
    "nazwa": "Lentil and millet patties",
    "kroki": [
      "Cook the red lentils for 20 minutes, until they fall apart completely, and cook off the excess water.",
      "Cook the millet separately for 15 minutes and let it cool — a warm mixture will not hold together.",
      "Fry the onion and garlic for 8 minutes until translucent.",
      "Combine everything with the breadcrumbs and smoked paprika and leave for 20 minutes so the mixture firms up.",
      "Shape the patties with wet hands — dry hands tear the mixture.",
      "Fry in rapeseed oil for 4 minutes on each side, without moving them for the first two minutes so they form a crust.",
      "Drain on a rack, not on paper — on paper they go soft from the steam."
    ]
  },
  "t96": {
    "nazwa": "Aubergine and coconut milk curry",
    "kroki": [
      "Dice the aubergine, salt it and leave for 20 minutes, then pat dry — the salt draws out bitterness and makes the aubergine soak up less oil.",
      "Fry the aubergine in rapeseed oil over high heat for 8 minutes, until golden, and set aside.",
      "In the same frying pan soften the onion for 6 minutes, add the fresh ginger and garlic and fry for a minute.",
      "Add the curry powder and toast for 40 seconds — untoasted it stays raw-tasting.",
      "Pour in the coconut milk and cook over low heat for 10 minutes without boiling, so it does not split.",
      "Return the aubergine to the pan and simmer for 8 minutes.",
      "Cook the basmati rice and serve sprinkled with fresh coriander."
    ]
  },
  "t97": {
    "nazwa": "Roasted cauliflower and tahini salad",
    "kroki": [
      "Preheat the oven to 220°C — cauliflower needs high heat to char rather than steam.",
      "Break the cauliflower into florets, toss with extra virgin olive oil and cumin and spread in a single layer on a tray.",
      "Roast for 25 minutes, until the edges are deeply charred — that is where all the flavour is.",
      "Pat the chickpeas dry and add them to the tray for the last 10 minutes so they crisp up.",
      "Mix the tahini with lemon juice, crushed garlic and water — the sauce thickens first, then loosens and goes smooth; that is normal.",
      "Toss the warm cauliflower with the chickpeas, pour over the sauce and sprinkle with parsley."
    ]
  },
  "t98": {
    "nazwa": "Pasta with tomatoes and basil",
    "kroki": [
      "Put on plenty of salted water — pasta needs room; in a small pot it sticks together with starch.",
      "Fry the garlic in extra virgin olive oil over low heat for 2 minutes, just until fragrant; browned garlic turns bitter.",
      "Add the cherry tomatoes and simmer for 10 minutes, pressing them with a spoon until they release their juice.",
      "Cook the pasta a minute less than the packet says and keep 250 ml of the cooking water.",
      "Transfer the pasta straight into the pan with the sauce and toss vigorously, adding the cooking water — its starch binds the sauce to the pasta.",
      "Take off the heat and stir in the fresh basil; cooked, it loses its scent."
    ]
  },
  "t99": {
    "nazwa": "Cream of roasted red pepper soup",
    "kroki": [
      "Roast the whole peppers at 220°C for 30 minutes, until the skin blackens in places.",
      "Put the hot peppers in a bowl and cover for 10 minutes — the steam loosens the skin by itself, no scraping needed.",
      "Peel the peppers and remove the seeds.",
      "Fry the onion and garlic in extra virgin olive oil for 6 minutes.",
      "Add the potatoes, peppers and half of 1000 ml of water and cook for 20 minutes.",
      "Blend until smooth, stir in the coconut milk and season with smoked paprika."
    ]
  },
  "t100": {
    "nazwa": "Sweet and sour tofu with rice",
    "kroki": [
      "Press the plain tofu under something heavy for 20 minutes — the less water, the better it browns instead of falling apart.",
      "Dice it and fry in rapeseed oil for 8 minutes, turning rarely, until every side is golden.",
      "Take out the tofu and in the same frying pan fry the pepper and onion for 5 minutes, keeping them crunchy.",
      "Mix the soy sauce, cider vinegar, honey and grated fresh ginger.",
      "Pour the sauce into the pan and cook for 2 minutes, until it thickens and starts to coat the vegetables.",
      "Return the tofu to the pan and mix gently so it does not break.",
      "Serve with cooked basmati rice."
    ]
  },
  "t101": {
    "nazwa": "Chickpea falafel",
    "kroki": [
      "Soak the dried chickpeas in cold water overnight — falafel uses soaked chickpeas, NEVER cooked ones, because cooked chickpeas fall apart in the oil.",
      "Grind the soaked chickpeas with the onion, garlic, parsley and fresh coriander into a coarse, moist mixture.",
      "Add the cumin and plain flour, mix and chill for 30 minutes.",
      "Shape small balls and flatten them slightly.",
      "Heat the rapeseed oil to 170°C — test with a piece of the mixture: it should sizzle straight away and float up.",
      "Fry in batches for 3 minutes, until deep golden; dropped in all at once they cool the oil and soak it up.",
      "Drain on a rack and serve straight away — falafel is at its best in the first ten minutes."
    ]
  },
  "t102": {
    "nazwa": "Oat drink porridge with banana",
    "kroki": [
      "Bring the oat drink to the boil in a small pan, add the rolled oats and cook over low heat for 5 minutes, stirring.",
      "Slice the bananas.",
      "Divide the porridge between bowls, top with the bananas, add the peanut butter and sprinkle with cinnamon."
    ]
  },
  "t103": {
    "nazwa": "Porridge with caramelised apple and cinnamon",
    "kroki": [
      "Dice the apples and cook them in a dry frying pan over medium heat for 6 minutes until soft; towards the end add the cinnamon and 15 g of the maple syrup.",
      "Bring the oat drink to the boil in a small pan, add the rolled oats and cook over low heat for 5 minutes, stirring.",
      "Divide the porridge between bowls, top with the apples, sprinkle with sunflower seeds and drizzle with the rest of the maple syrup."
    ]
  },
  "t104": {
    "nazwa": "Tofu scramble with chives and cherry tomatoes",
    "kroki": [
      "Drain the plain tofu and break it up with a fork into rough pieces — mashed finely it goes mushy.",
      "Heat the rapeseed oil in a frying pan over medium heat (5/9) and fry the chopped onion for 4 minutes.",
      "Add the tofu and turmeric, stir and fry for 6 minutes, stirring now and then.",
      "Add the halved cherry tomatoes and fry for another 2 minutes.",
      "Sprinkle with chopped chives and serve straight away."
    ]
  },
  "t105": {
    "nazwa": "Tomato and basil toasts",
    "kroki": [
      "Toast the slices of wholemeal rye bread in a dry frying pan for 2 minutes on each side, until crisp.",
      "Halve a garlic clove and rub it over the warm toast — on cold toast the scent will not come out.",
      "Quarter the cherry tomatoes and mix them with extra virgin olive oil.",
      "Spoon the tomatoes onto the toast and scatter with torn fresh basil."
    ]
  },
  "t106": {
    "nazwa": "Green smoothie with spinach and banana",
    "kroki": [
      "Put the baby spinach, peeled bananas, pitted dates and flaxseed into a blender and pour in the oat drink.",
      "Blend for 1 minute until smooth and divide equally between two glasses."
    ]
  },
  "t107": {
    "nazwa": "Blueberry oat smoothie",
    "kroki": [
      "Put the rolled oats, blueberries, peeled banana and peanut butter into a blender and pour in the oat drink.",
      "Blend for 1 minute until smooth and divide equally between two glasses."
    ]
  },
  "t108": {
    "nazwa": "Gram flour and courgette fritters",
    "kroki": [
      "Mix the gram flour with 250 ml of cold water and the turmeric into a thick, lump-free batter and leave it for 10 minutes.",
      "Coarsely grate the courgette and squeeze the water out with your hands — unsqueezed, it waters down the batter and the fritters fall apart.",
      "Finely chop the onion and stir it into the batter with the courgette and chopped parsley.",
      "Heat the rapeseed oil in a frying pan over medium heat (6/9).",
      "Spoon in 60 g portions of batter and fry the fritters for 3 minutes on each side, until golden."
    ]
  },
  "t109": {
    "nazwa": "Oat bars with dates and cocoa",
    "kroki": [
      "Pour 100 ml of hot water over the pitted dates and wait 5 minutes until they soften.",
      "Blend the drained dates with the peanut butter and maple syrup into a thick paste, 1 minute.",
      "Mix the paste with the rolled oats, cocoa powder and chopped walnuts.",
      "Press the mixture into a rectangular dish lined with baking paper, pushing down firmly with your hand.",
      "Chill for 60 minutes, then cut into 8 bars; keep them in the fridge."
    ]
  },
  "t110": {
    "nazwa": "Chickpea and tahini sandwich spread",
    "kroki": [
      "Drain the tinned chickpeas and mash them with a fork into a coarse spread — leave some pieces.",
      "Add the tahini, lemon juice and Dijon mustard and mix.",
      "Stir in the chopped chives.",
      "Spread over slices of wholemeal rye bread."
    ]
  },
  "t111": {
    "nazwa": "Avocado and radish sandwiches",
    "kroki": [
      "Mash the avocado with a fork and the lemon juice.",
      "Spread the slices of wholemeal rye bread with the avocado.",
      "Thinly slice the radishes and halve the cherry tomatoes, then arrange them on the sandwiches."
    ]
  },
  "t112": {
    "nazwa": "Millet porridge with coconut milk and orange",
    "kroki": [
      "Rinse the millet with boiling water in a sieve — unrinsed, it comes out bitter.",
      "Bring the coconut milk and 200 ml of water to the boil, add the millet and chopped pitted dates and cook covered over low heat for 15 minutes.",
      "Peel the oranges and cut them into segments.",
      "Divide the porridge between bowls, top with the oranges and sprinkle with cinnamon."
    ]
  },
  "t113": {
    "nazwa": "Hummus with crunchy vegetables",
    "kroki": [
      "Peel the carrot and cut it into sticks, and cut the cucumber and pepper into long strips.",
      "Spoon the hummus into a small bowl and serve with the vegetables for dipping."
    ]
  }
};
