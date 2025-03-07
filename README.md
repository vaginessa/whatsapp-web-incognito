# Invisible mode for WhatsApp Web
This is the source code of a chrome extension that disables read receipts and presence updates on WhatsApp Web.
You can find the original extension in [Chrome Web Store](https://chrome.google.com/webstore/detail/waincognito/alhmbbnlcggfcjjfihglopfopcbigmil).

<img src="https://raw.githubusercontent.com/tomer8007/whatsapp-web-incognito/master/promotion.jpg">

## Installing from GitHub directly
To install the extension off-store, download the latest release as a zip file from the [Releases](https://github.com/tomer8007/whats-incognito/releases) page, or better, just clone the source code
**to a directory** and add it to Chrome using the 'Load unpacked extension' option when developer mode is turned on.

## How it works
This extension works by intercepting the WebSocket frames between chrome and WhatsApp's servers using a modified `WebSocket` constructor (see [wsHook](https://github.com/skepticfx/wshook)).

Those frames are then decrypted if needed using local encryption keys, and decoded from their binary XMPP form using a javascript code from WhatsApp's original implementation.

The resulting "nodes" are then simply checked to see if WhatsApp tries to send out a `read` or `presence` action, and if so, the extension blocks it and fakes a failure response from the server.
## Limitations
Unfortunately, in multi-device mode, when last seen is blocked, you will not be able to see other people's last seen. This is apparently because WhatsApp servers do not forward presence updates to offline devices.
## Organization & Internals
The main code of the extension is located in `core/interception.js` and in `core/ui.js`. 

Other files inside the `core` folder deal with the infrastructure that makes the interception and the decoding works. There is also an additional `parsing/` code for parsing messages (such as `message_types.js`) that is rarely used in the extension.
`background.js` mainly keeps track of the saved preferences using `localStorage`.

If you want to see what kind of messages WhatsApp is sending and receiving over WebSocket in real-time, you can type `WAdebugMode = true` in the javascript console. Incoming and outgoing payloads (after decryption) will be printed out.

## Other browsers support
This is more experimental, but should work.
If you want to use this extension in Firefox, you can load it using the developer page as explained in issue [#38](https://github.com/tomer8007/whatsapp-web-incognito/issues/38)

Safari support for macOS was implemented in [@taksh108](https://github.com/taksh108)'s fork [here](https://github.com/tomer8007/whatsapp-web-incognito/pull/63)

## Privacy
No data is ever transmitted to anywhere. Privacy policy [here](https://github.com/tomer8007/whatsapp-web-incognito/wiki/Chrome-Extension-Privacy-Policy).

