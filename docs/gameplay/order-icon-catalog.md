# Speech-bubble food and topping icons

Status: **complete art library, ready for visual review**. The [editable sources and guide](../../assets/pixelorama/order-icons-v1/README.md) and [native exports](../../apps/web/public/art/order-icons-v1/README.md) add 30 separate 16×16 PNGs and reuse the approved burger for 31 symbols. The approved bubble and burger stay unchanged. All symbols fit the existing 24×16 bubble content rectangle without scaling. Each icon has a named static source frame, editable Pixelorama layers, palette and metadata. Contact sheets are derived review images, not replacements for the individual assets. No ordering mechanic is included.

## Scope and authority

The [content catalog](content-catalog.md) supplies the six baseline products, pancake counts, milkshake flavors and listed modifiers. Pickles come from the user's explicit bubble example. Tea and soda follow the user's approved front drink direction. Onion rings and hot chocolate are listed upgrade capabilities: their icons are included as visual catalog coverage, **without enabling recipes, upgrades or menu availability**. Do not invent syrup, butter, sugar, milk, bacon, extra flavors or food states. Serving/container details are illustrative, not new recipe or portion rules.

## Food and drink symbols

| ID                     | Meaning                  | Basis                                               |
| ---------------------- | ------------------------ | --------------------------------------------------- |
| `burger`               | Plain bun and beef patty | Approved existing icon; reused                      |
| `hot-dog`              | Plain serving hot dog    | Brief product; no optional condiments baked in      |
| `pancakes-1`           | One pancake              | Explicit ordered count                              |
| `pancakes-2`           | Two pancakes             | Explicit ordered count                              |
| `pancakes-3`           | Three pancakes           | Explicit ordered count                              |
| `fries`                | French fries             | Brief baseline product                              |
| `coffee`               | Plain coffee             | Brief baseline drink                                |
| `milkshake-vanilla`    | Vanilla milkshake        | Required base flavor; no optional toppings baked in |
| `milkshake-chocolate`  | Chocolate milkshake      | Required base flavor; no optional toppings baked in |
| `milkshake-strawberry` | Strawberry milkshake     | Required base flavor; no optional toppings baked in |
| `tea`                  | Tea                      | User front drink direction; no menu activation      |
| `soda`                 | Generic soda             | User front drink direction; no new brands/flavors   |
| `hot-chocolate`        | Hot chocolate            | Upgrade-listed visual coverage only                 |
| `onion-rings`          | Onion rings              | Upgrade-listed visual coverage only                 |

## Separate topping symbols

| ID                  | Meaning           | Catalog association, not implemented recipe validation |
| ------------------- | ----------------- | ------------------------------------------------------ |
| `ketchup`           | Ketchup           | Burger / hot dog                                       |
| `mustard`           | Mustard           | Burger / hot dog                                       |
| `mayonnaise`        | Mayo              | Burger                                                 |
| `lettuce`           | Lettuce           | Burger                                                 |
| `cheese`            | Cheese            | Burger                                                 |
| `onion`             | Onions            | Burger / hot dog                                       |
| `tomato`            | Tomatoes          | Burger                                                 |
| `pickle`            | Pickles           | User's burger-bubble example                           |
| `relish`            | Relish            | Hot dog                                                |
| `whipped-cream`     | Whipped cream     | Milkshake                                              |
| `cherry`            | Cherry            | Milkshake                                              |
| `chocolate-drizzle` | Chocolate drizzle | Milkshake; distinct from solid chocolate               |
| `cherry-drizzle`    | Cherry drizzle    | Milkshake; preserve cherry, not strawberry sauce       |
| `banana`            | Banana            | Pancakes                                               |
| `chocolate`         | Chocolate         | Pancakes                                               |
| `blueberry`         | Blueberry         | Pancakes                                               |
| `strawberry`        | Strawberry        | Pancakes                                               |

## Production and limits

Three artists prepare savory/condiment, pancake/fruit/small-topping and drink/cream/drizzle recipe families. One guarded Pixelorama exporter performs all drawing, native saving and bitmap export with explicit private project targets, preserving other chats' active projects. Source frames are independent static icons, not an animation sequence. Keep clear silhouettes, restrained color ramps, upper-left lighting and transparent padding; annotate intentional disconnected details.

This work adds no runtime ordering/pop-up sequence, notebook, correctness checking, ingredient placement, cooking or eating behavior. No additional bubble shapes or modifier-count rules are introduced. The icon catalog is visual data; any eventual order rules remain separately reviewed engine work.
