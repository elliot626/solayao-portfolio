# Emmanuel C. Solayao | Portfolio

Plain HTML, CSS, and JavaScript. No build step, no libraries.

## Files
- `index.html`  homepage (all sections on one page)
- `style.css`   appearance: colour tokens for dark and light themes, fluid type and spacing, animations
- `script.js`   theme switch, mobile drawer, eased scrolling, scroll reveals, project filter,
                animated hero network, count-ups, confetti, copy button
- `images/`     photos and the quiz score record

## Preview in VS Code (Live Preview)
1. Install **Live Preview** (publisher: Microsoft) from the Extensions panel.
2. File > Open Folder, and choose this `portfolio` folder (the one containing index.html).
3. Open `index.html`, then click the preview icon at the top right of the editor
   (or right-click the file > Show Preview).
4. Resize the preview narrow (under 760px) to test the slide-in menu.

The local address (e.g. 127.0.0.1:3000) is for your computer only.
Submit the public link after you publish.

## Things you may want to change

**Colours.** Everything is a variable at the top of `style.css`. Dark values are in `:root`,
light values are in `:root[data-theme="light"]`.

**Default theme.** First-time visitors get their device's setting (dark or light). After they
press the sun/moon button, their choice is remembered. To always start in dark, change
`'light'` to `'dark'` in the small script at the top of `index.html`.

**Add a project.**
1. In the `project-grid` in `index.html`, copy an existing `<article>` and edit it.
2. Set its `data-category` (for example `data-category="networking"`).
3. If the category is new, copy one `filter` button and set its `data-filter` to the same word.
The count on each button updates by itself.

**Page width.** `--wrap-max` in `style.css` controls how wide the content gets on large screens.

## Accessibility notes
- All motion switches off when the visitor's device asks for reduced motion.
- The menu, theme button, and filter buttons work with the keyboard. Escape closes the menu.
- Both themes keep text contrast at WCAG AA or better.
- Without JavaScript, the page still shows every section and a plain row of links.

## Tools used
Built with AI assistance (Claude) from my own content, photos, and links.
