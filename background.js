var session = -1;
var bookmarkFolder = null;
const FOLDERNAME = "Tabs Aside";

// basic error handler
function onRejected(error) {
  console.log(`An error: ${error}`);
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
browser.bookmarks.getTree().then((data) => {
  let root = data[0];

  console.log("searching for Tabs Aside folder");
  outerloop: for (rbm of root.children) {
    for (bm of rbm.children) {
      if (bm.title === FOLDERNAME) {
        bookmarkFolder = bm;
        console.log("Folder found!");
        break outerloop;
      }
    }
  }

  // Tabs Aside folder wasnt found
  if (bookmarkFolder === null) {
    console.log("Folder not found, lets create it!");

    browser.bookmarks.create({
      title: FOLDERNAME
    }).then((bm) => {
      console.log("folder successfully created");

      bookmarkFolder = bm;
    }, onRejected);
  }
}, onRejected);

function aside(tabs) {
  // filter
  tabs = tabs.filter(tab => {
    let isAbout = tab.url.indexOf("about:") === 0;

    return !isAbout;
  });

  if (tabs.length > 0) {
    session++;

    // create session bm folder
    browser.bookmarks.create({
      parentId: bookmarkFolder.id,
      title: `Session #${session}`
    }).then(bm => {
      // move tabs aside one by one
      asideOne(tabs, bm.id);

      // WARNING: this is not synchronous code

      // update storage
      browser.storage.local.set({
        session: session
      });
    }).catch(onRejected);
    
  } else {
    console.log("no tabs to move aside!");
  }
}

// functional style :D
function asideOne(tabs, pID) {

  if (tabs.length > 0) {
    let tab = tabs.pop();

    console.log("create bookmark for " + tab.title);
    // create bookmark
    browser.bookmarks.create({
      parentId: pID,
      title: tab.title,
      url: tab.url
    }).then(() => {
      // close tab
      return browser.tabs.remove(tab.id);
    }).then(() => {
      // next one
      asideOne(tabs, pID);
    }).catch(onRejected);
  } else {
    console.log("nothing else to move aside");
  }
}

browser.browserAction.onClicked.addListener(() => {
  // browser action button clicked

  browser.tabs.query({
    currentWindow: true,
    pinned: false,
    active: false
  }).then((tabs) => {
    console.log("query returned " + tabs.length + " tabs");
    aside(tabs);
  }).catch(onRejected);
  
});