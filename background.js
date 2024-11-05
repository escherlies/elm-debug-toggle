const CSS = `
body > div:last-of-type {
  display: none !important;
}
`;
const TITLE_APPLY = "Hide Elm Debugger";
const TITLE_REMOVE = "Show Elm Debugger";

const APPLICABLE_PROTOCOLS = ["http:", "https:"];

/*
Toggle CSS: based on the current title, insert or remove the CSS.
Update the page action's title and icon to reflect its state.
*/
function toggleCSS(tab) {
  function gotTitle(title) {
    if (title === TITLE_APPLY) {
      browser.pageAction.setIcon({ tabId: tab.id, path: "icons/off.png" });
      browser.pageAction.setTitle({ tabId: tab.id, title: TITLE_REMOVE });
      browser.tabs.insertCSS({ code: CSS });
      // Save state to storage
      browser.storage.local.set({ ["elm_debug_hidden"]: true });
    } else {
      browser.pageAction.setIcon({ tabId: tab.id, path: "icons/on.png" });
      browser.pageAction.setTitle({ tabId: tab.id, title: TITLE_APPLY });
      browser.tabs.removeCSS({ code: CSS });
      // Save state to storage
      browser.storage.local.set({ ["elm_debug_hidden"]: false });
    }
  }

  let gettingTitle = browser.pageAction.getTitle({ tabId: tab.id });
  gettingTitle.then(gotTitle);
}

/*
Returns true only if the URL's protocol is in APPLICABLE_PROTOCOLS.
Argument url must be a valid URL string.
*/
function protocolIsApplicable(url) {
  const protocol = new URL(url).protocol;
  return APPLICABLE_PROTOCOLS.includes(protocol);
}

/*
Initialize the page action: set icon and title, then show.
Only operates on tabs whose URL's protocol is applicable.
*/
function initializePageAction(tab) {
  if (protocolIsApplicable(tab.url)) {
    browser.pageAction.setIcon({ tabId: tab.id, path: "icons/on.png" });
    browser.pageAction.setTitle({ tabId: tab.id, title: TITLE_APPLY });
    browser.pageAction.show(tab.id);

    // Check state from storage
    browser.storage.local.get("elm_debug_hidden").then((result) => {
      if (result["elm_debug_hidden"]) {
        browser.tabs.insertCSS({ code: CSS });
        browser.pageAction.setIcon({ tabId: tab.id, path: "icons/off.png" });
        browser.pageAction.setTitle({ tabId: tab.id, title: TITLE_REMOVE });
      }
    });
  }
}

/*
When first loaded, initialize the page action for all tabs.
*/
let gettingAllTabs = browser.tabs.query({});
gettingAllTabs.then((tabs) => {
  for (let tab of tabs) {
    initializePageAction(tab);
  }
});

/*
Each time a tab is updated, reset the page action for that tab.
*/
browser.tabs.onUpdated.addListener((id, changeInfo, tab) => {
  initializePageAction(tab);
});

/*
Toggle CSS when the page action is clicked.
*/
browser.pageAction.onClicked.addListener(toggleCSS);
