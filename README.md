# Keyboard Opacity

A [Decky Loader](https://github.com/SteamDeckHomebrew/decky-loader) plugin that makes the Steam Deck's on-screen keyboard translucent, so you can see what's behind it while you type.

![Preview](assets/preview.png)

## Features

- **Translucent keyboard**: turn the effect on or off.
- **Background opacity slider** (0–100%): fades the keyboard and key backgrounds while the key labels stay crisp and readable.
- **See through to the screen**: the keyboard floats over the page instead of pushing it up, so there's actually something to see through it.
- **Show keyboard to preview** button to check your settings right away.

Settings are saved and applied automatically at startup.

## How it works

Steam normally shrinks the page above the keyboard and draws a dark blurred panel behind it, so simply lowering the keyboard's opacity shows nothing but black. This plugin injects a small stylesheet into the Steam UI that:

1. makes the keyboard and key backgrounds semi-transparent,
2. hides the dark backdrop behind the keyboard, and
3. (optionally) overlays the keyboard on the page instead of resizing it.

Steam's hashed CSS class names are looked up at runtime with `findModule`, so the plugin should keep working across Steam client updates.

## Building

```sh
pnpm install
pnpm build
```

## License

BSD-3-Clause

## Installing

This plugin is not on the Decky Plugin Store. To install it:

1. In Decky, open **Settings → General** and turn on **Developer mode**.
2. Go to **Settings → Developer → Install Plugin from URL** and enter:
   `https://github.com/kaioh1990/decky-keyboard-opacity/releases/download/v1.3.1/Keyboard-Opacity-v1.3.1.zip`
