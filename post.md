# Implementing a Google Chrome extension that talks to Google Sheet API

This post describes how to implement a Chrome extension that is capable of
updating a spreadsheet with information scrapped from a web page.

# The real problem I need to solve

My wife has an e-commerce and she uses a SaaS to handle shipments. This
SaaS is integrated with the e-commerce software and it's capable of fetching
the orders and generating a list of shipments.

The problem is that this system is not capable of generating a document called
'romaneio', which is basically a list with all the boxes I will hand over to
the nice folks that collect the shipments. In case something goes wrong,
this list is a prove that the boxes were collected.

That said, I wanted to implement an automated way to generate the romaneio,
which needs to be done daily. (TODO: XKCD here).

# The solution

To generate the romaneio, I need to:

1. fetch data from Mandae
2. send data to a spreadsheet
3. print it to dead trees

Simple enough right?

## First iteration

My first try was like this:

1. Chrome extension that fetches data from the page and sends to a backend
2. Python backend sends data to Google

So far so good, I implmented this in a few hours and have been using this for
some months. The problem is that the backend is running on my machine, and
I will take some weeks off and wont be able to do it. My wife's machine is
a Windows box and I don't want to run a backend there (because I don't want to
touch a Windows box). I also don't want to manage a server, neither a serverless
server, or a server on someoneelse server.

## Second iteration

Kill the backend, move everything to the extension. It's tediously simple, the
info is already there in the browser, just send it directly to Google. Then
hell went loose...

# The new problem

And so security got int the way :( Turns out fetching data from a page and
sending them to Google is something dangerous. I mean, you can fetch the data
and send it to a random non-encrypted HTTP endpoint on the net, no problem,
but if you dare to load Google JavaScript libraries, all the security accronyms
will make your life miserable.

At some point I though it was impossible, but turns out you just need to take
the long way home, fck security.

## Why is this so complicated?

Again, it's all about security. The most challenging action for me was trying to
authenticate to Google services. I have tried and failed to do it:

1. From the content script code
2. From a sandboxed page
3. From the background service

Maybe I will post how this fails in a future post :)

### CSP

Minimal policy:

```
{
  // ...
  "content_security_policy": {
    "extension_pages": "script-src 'self' 'wasm-unsafe-eval'; object-src 'self';"
  }
  // ...
}
```
https://developer.chrome.com/docs/extensions/reference/manifest/content-security-policy

Error when loading Google API scripts:

```
Refused to load the script 'https://apis.google.com/js/api.js' because it violates the following Content Security Policy directive: "script-src 'self' 'wasm-unsafe-eval'".
```

## Pulo do gato

In Brazil, 'pulo do gato' is something like 'the trick', the not obvious
solution to the problem, which in this case consists of:

1. Use an iframe.
2. The contents of the iframe MUST be served from a remote HTTP server.

I missed the second step and almost gave up, assuming that what I was trying to
do was impossible. Then I re-read this post and figured I have assumed I could
serve the iframe HTML from the extension itself, but that doesn't work, you need
to fetch it from the net.

# The working extension

The following Google Chrome features were used:

- content script: scraps data from the open web page
- background service: handles the extension button and communication with others
- sandbox: this is where we access Google APIs
- offscreen: make the sandbox page invisible (we only need it for working around
  the security limitations, not to display information to the user.)

## Information flow

This extension will gather some information for a web page and send it to a
spreadsheet. The flow of information throught the components is like this:

0. User triggers the flow by clicking the extension icon
1. Background service detects the click and injects content script into the correct tab
2. Content script scraps the data on the tab and send a message to the background script
3. Background script forwards the message to the offscreen document
4. Offscreen document forwards the message to the inner iframe document, the sandbox
5. The sandbox document sends the information to the final destination, a Google spreadsheet.

# References

https://developer.chrome.com/docs/extensions/how-to/security/sandboxing-eval
https://firebase.google.com/docs/auth/web/chrome-extension#use_offscreen_documents
https://developer.chrome.com/docs/extensions/how-to/integrate/oauth

