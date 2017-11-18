const FOLDERNAME = "Tabs Aside";
const BMPREFIX = "Session #";

var session = -1;
var bookmarkFolder = null;

// basic error handler
function onRejected(error) {
  console.log(`An error: ${error}`);
}

// tmp bookmark API fix
function isBMFolder(bm) {
  return bm.type === "folder" || !bm.url;
}

// load session index
browser.storage.local.get("session").then(data => {
  if (data.session) {
    session = data.session;
  } else {
    session = 0;

    browser.storage.local.set({
      session: session
    });
  }
}, onRejected);

// load root bookmark folder (Tabs Aside folder)
browser.bookmarks.getTree().then(data => {
  let root = data[0];

  console.log("searching for Tabs Aside folder");

  outerloop: for (rbm of root.children) {
    for (bm of rbm.children) {
      if (bm.title === FOLDERNAME && isBMFolder(bm)) {
        bookmarkFolder = bm;
        // Folder found
        break outerloop;
      }
    }
  }

  // Tabs Aside folder wasnt found
  if (bookmarkFolder === null) {
    console.log("Folder not found, lets create it!");

    browser.bookmarks.create({
      title: FOLDERNAME
    }).then(bm => {
      console.log("Folder successfully created");

      bookmarkFolder = bm;

      setTimeout(refresh, 42);
    }, onRejected);
  }
}, onRejected);


// tab filter function
function tabFilter(tab) {
  let url = tab.url;

  // only http(s), file and view-source
  return url.indexOf("http") === 0 || url.indexOf("view-source:") === 0;
}

function aside(tabs, closeTabs) {
  if (tabs.length > 0) {
    session++;

    // create session bm folder
    browser.bookmarks.create({
      parentId: bookmarkFolder.id,
      title: BMPREFIX + session
    }).then(bm => {
      // move tabs aside one by one
      asideOne(tabs, bm.id, closeTabs);

      // WARNING: this is not synchronous code

      // update storage
      browser.storage.local.set({
        session: session
      });
    }).catch(onRejected);
    
  } else {
    //console.log("no tabs to move aside!");
  }
}

// functional style :D
function asideOne(tabs, pID, closeTabs) {

  if (tabs.length > 0) {
    let tab = tabs.shift();

    //console.log("create bookmark for " + tab.title);
    // create bookmark
    browser.bookmarks.create({
      parentId: pID,
      title: tab.title,
      url: tab.url
    }).then(() => {
      if (closeTabs) {
        // close tab
        return browser.tabs.remove(tab.id);
      } else {
        return Promise.resolve();
      }
    }).then(() => {
      
      if (tabs.length === 0) {
        refresh();
      } else {
        // next one
        asideOne(tabs, pID, closeTabs);
      }
    }).catch(onRejected);
  }
}

/*browser.browserAction.onClicked.addListener(() => {
  // browser action button clicked
  
});*/

// message listener
browser.runtime.onMessage.addListener(message => {
  if (message.command === "aside") {

    var closeTabs = message.save !== true;

    browser.tabs.query({
      currentWindow: true,
      pinned: false
    }).then((tabs) => {
      if (closeTabs) {
        // open a new empty tab (async)
        browser.tabs.create({});
      }

      // tabs aside!
      aside(tabs.filter(tabFilter), closeTabs);
    }).catch(onRejected);
    
  } else if (message.command === "refresh") {
    // don't do anything...
  } else {
    console.error("Unknown message: " + JSON.stringify(message));
  }
});

function refresh() {
  browser.runtime.sendMessage({ command: "refresh" });
}