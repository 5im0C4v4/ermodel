# ERModel

An Obsidian desktop plugin for embedding PNG previews of ER diagrams created with [JDER](https://github.com/LoryPelli/JDER).

## Requirements

- Obsidian desktop
- Java 11 or later available as `java` on `PATH`
- `jder.jar` placed at `ERModel/jder.jar` in the vault

The plugin does not download or update JDER.

## Create a preview

Open a Markdown note and select **Create jder preview block** from the command palette or the image-plus ribbon button. Enter a diagram name, such as `customer`. The plugin creates the `ERModel/json/` and `ERModel/png/` folders and inserts:

````markdown
```jder
file: customer.json
```
````

In JDER, create or open the diagram and save its JSON file to `ERModel/json/customer.json`. Export its PNG preview to `ERModel/png/customer.png`. The code block displays the PNG and provides **Refresh preview** and **Launch jder** buttons.

JDER does not currently accept a diagram path as a command-line argument, so **Launch jder** starts the application; open the JSON file from JDER using **File → Open Diagram**.
