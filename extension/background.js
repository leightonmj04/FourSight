// Clicking the FourSight toolbar icon opens the planner in a new tab. The planner is an ordinary
// extension page (index.html), so it needs no permissions.
chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
});

// Open the planner once right after installing, so students see it immediately.
chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === 'install') chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
});
