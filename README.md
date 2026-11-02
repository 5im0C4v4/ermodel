# ERModel

An Obsidian desktop plugin for embedding PNG previews of ER diagrams created with [JDER](https://github.com/LoryPelli/JDER).

## Requirements

- Obsidian desktop
- Java 11 or later available as `java` on `PATH`
- `JDER.jar` placed at `ERModel/JDER.jar` in the vault

The plugin does not download or update JDER.

## Create a preview

Open a Markdown note and select **Create jder preview block** from the command palette or the image-plus ribbon button. Enter a diagram name, such as `customer`. The plugin creates the `ERModel/json/` and `ERModel/png/` folders and inserts:

````markdown
```jder
file: customer.json
```
````

The **Launch diagram editor** button opens the block's JSON file directly and gives JDER its matching PNG path. For example, `customer.json` uses `ERModel/png/customer.png`. JDER updates the PNG automatically while editing; use **Refresh preview** in the note to reload the image.

Save the JSON from JDER (or enable JDER's autosave) to persist diagram changes. If the JSON file does not exist yet, JDER opens a new ER diagram for that path.
