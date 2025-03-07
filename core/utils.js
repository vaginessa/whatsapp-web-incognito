// -------------------
// Helper functions
// --------------------

function findChatEntryElementForJID(jid)
{
    var chatsShown = document.getElementsByClassName(UIClassNames.CHAT_ENTRY_CLASS);
    var blockedChat = null;
    for (var i = 0; i < chatsShown.length; i++)
    {
        var reactElement = FindReact(chatsShown[i]);
        if (reactElement.props.data == undefined) continue;

        var data = reactElement.props.data;
        var id = data.data ? data.data.id : data.chat.id;

        var matches = false;
        if (typeof (jid) == "object" && id == jid)
        {
            matches = true;
        }
        else if (typeof (jid) == "string" && id.user == jid.split("@")[0])
        {
            matches = true;
        }

        if (matches)
        {
            blockedChat = chatsShown[i];
            break;
        }
    }

    return blockedChat;
}

function getCurrentChat()
{
    if (window.WhatsAppAPI && WhatsAppAPI.Store &&  WhatsAppAPI.Store.Chat && WhatsAppAPI.Store.Chat.getActive)
        return WhatsAppAPI.Store.Chat.getActive();

    // fallback to old method
    var elements = document.getElementsByClassName(UIClassNames.CHAT_PANEL_CLASS);
    var elements2 = document.getElementsByClassName(UIClassNames.CHAT_PANEL_CLASS_2);
    if (elements.length > 0)
    {
        var reactResult = FindReact(elements[0], traverseUp = 2);
        var chat = reactResult.props.children.props.children.props.chat;
    }
    else
    {
        var reactResult = FindReact(elements2[0], traverseUp = 3);
        var chat = reactResult.props.children.props.children.props.children.props.chat;
    }
    
    return chat;
}

function getCurrentChatPanel()
{
    var elements = document.getElementsByClassName(UIClassNames.CHAT_PANEL_CLASS);
    var elements2 = document.getElementsByClassName(UIClassNames.CHAT_PANEL_CLASS_2);
    if (elements.length > 0 ) return elements[0];
    else return elements2[0];
}

function isChatBlocked(jid)
{
    var user = jid.split("@")[0]

    for (jid in blockedChats)
    {
        if (jid.split("@")[0] == user)
            return true;
    }

    return false;
}

async function getChatByJID(jid)
{
    if (window.WhatsAppAPI && WhatsAppAPI.Store && WhatsAppAPI.Store.Chat && WhatsAppAPI.Store.Chat.find)
        return WhatsAppAPI.Store.Chat.find(jid);

    // fallback to old method
    var chat = findChatEntryElementForJID(jid);
    if (chat != null)
    {
        var data = FindReact(chat).props.data;
        if (data.data) chat = data.data;
        else chat = data.chat;
    }
    else
    {
        chat = chats[jid];
    }

    return new Promise(function(resolve, reject) {resolve(chat);});
}

const arrayBufferToBase64 = (buffer) =>
{
    var binary = '';
    var bytes = new Uint8Array(buffer);
    var len = bytes.byteLength;
    for (var i = 0; i < len; i++)
    {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

function showToast(message)
{
    var appElement = document.getElementsByClassName("app-wrapper-web")[0];
    var toast = document.createElement("div");
    toast.setAttribute("class", "f1UZe");
    toast.style.transformOrigin = "left top";
    toast.innerHTML = "<div class=\"hYvJ8\">" + message + "</div>";
    appElement.insertBefore(toast, appElement.firstChild);
    Velocity(toast, { scale: [1, 0], opacity: [1, 0] }, { defaultDuration: 300, easing: [.1, .82, .25, 1] });
    setTimeout(function () { Velocity(toast, { scale: [0, 1], opacity: [0, 1] }, { defaultDuration: 300, easing: [.1, .82, .25, 1] }); }, 4000);
}

function exportIdbDatabase(idbDatabase) 
{
    return new Promise((resolve, reject) => 
    {
      const exportObject = {};
      if (idbDatabase.objectStoreNames.length === 0) 
      {
        resolve(JSON.stringify(exportObject));
      } 
      else 
      {
        const transaction = idbDatabase.transaction(idbDatabase.objectStoreNames,'readonly');
        transaction.addEventListener('error', reject);
  
        for (const storeName of idbDatabase.objectStoreNames) 
        {
          const allObjects = [];
          transaction.objectStore(storeName).openCursor().addEventListener('success', event => 
          {
              const cursor = event.target.result;
              if (cursor) {
                // Cursor holds value, put it into store data
                allObjects.push(cursor.value);
                cursor.continue();
              } 
              else 
              {
                // No more values, store is done
                exportObject[storeName] = allObjects;
  
                // Last store was handled
                if (idbDatabase.objectStoreNames.length === Object.keys(exportObject).length) {
                  resolve(exportObject);
                }
              }
            })
        }
      }
    })
}

function importToIdbDatabase(idbDatabase, importObject) 
{
    return new Promise((resolve, reject) => {
      const transaction = idbDatabase.transaction(
        idbDatabase.objectStoreNames,
        'readwrite'
      )
      transaction.addEventListener('error', reject)
  
      for (const storeName of idbDatabase.objectStoreNames) {
        let count = 0
        for (const toAdd of importObject[storeName]) {
          const request = transaction.objectStore(storeName).add(toAdd)
          request.addEventListener('success', () => {
            count++
            if (count === importObject[storeName].length) {
              // Added all objects for this store
              delete importObject[storeName]
              if (Object.keys(importObject).length === 0) {
                // Added all object stores
                resolve()
              }
            }
          })
        }
      }
    })
}

function clearDatabase(idbDatabase) 
{
    return new Promise((resolve, reject) => {
        const transaction = idbDatabase.transaction(
        idbDatabase.objectStoreNames,
        'readwrite'
        )
        transaction.addEventListener('error', reject)

        let count = 0
        for (const storeName of idbDatabase.objectStoreNames) {
        transaction
            .objectStore(storeName)
            .clear()
            .addEventListener('success', () => {
            count++
            if (count === idbDatabase.objectStoreNames.length) {
                // Cleared all object stores
                resolve()
            }
            })
        }
    })
}

// Based on https://stackoverflow.com/a/39165137/1806873
function FindReact(dom, traverseUp = 0) 
{
    const key = Object.keys(dom).find(key=>{
        return key.startsWith("__reactFiber$") // react 17+
            || key.startsWith("__reactInternalInstance$"); // react <17
    });
    const domFiber = dom[key];
    if (domFiber == null) return null;

    // react <16
    if (domFiber._currentElement) {
        let compFiber = domFiber._currentElement._owner;
        for (let i = 0; i < traverseUp; i++) {
            compFiber = compFiber._currentElement._owner;
        }
        return compFiber._instance;
    }

    // react 16+
    const GetCompFiber = fiber=>{
        //return fiber._debugOwner; // this also works, but is __DEV__ only
        let parentFiber = fiber.return;
        while (typeof parentFiber.type == "string") {
            parentFiber = parentFiber.return;
        }
        return parentFiber;
    };
    let compFiber = GetCompFiber(domFiber);
    for (let i = 0; i < traverseUp; i++) {
        compFiber = GetCompFiber(compFiber);
    }
    return compFiber.stateNode;
}

function fixCSSPositionIfNeeded(drop)
{
    if (drop.style.transform.includes("translateX") && drop.style.transform.includes("translateY"))
    {
        var matrix = drop.style.transform.replace(/[^0-9\-.,\s]/g, '').split(' ');
        drop.style.left = matrix[0] + "px";
        drop.style.top = matrix[1] + "px";
        drop.style.transform = "";
    }
}

function getCSSRule(ruleName)
{
    var rules = {};
    var styleSheets = document.styleSheets;
    var styleSheetRules = null;
    for (var i = 0; i < styleSheets.length; ++i)
    {
        try
        {
            styleSheetRules = styleSheets[i].cssRules;
        }
        catch (e)
        {
            // Assume Chrome 64+ doesn't let us access this CSS due to security policies or whatever, just ignore
            continue;
        }
        if (styleSheetRules == null) continue;
        for (var j = 0; j < styleSheetRules.length; ++j)
            rules[styleSheetRules[j].selectorText] = styleSheetRules[j];
    }
    return rules[ruleName];
}