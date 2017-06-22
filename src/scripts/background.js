import ext from "./utils/ext";

const sizes = [[375, 667], [768, 1024], [1024, 768], [1440, 800]];

ext.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.message === "capture") {
      captureAll();
    }
  }
);

function getAllTabURLs(cb) {
  ext.tabs.query({currentWindow: true}, function(tabs) {
    cb(tabs.map((t) => t.url));
  });
}

function getFilenameForTab(tab, size) {
  const { url } = tab;
  const [width, height] = size;

  let filename = `${url}__${width}x${height}`;
  filename = filename.replace(/[%&\(\)\\\/\:\*\?\"\<\>\|\/\]]/g,'_');

  return filename;
}

function captureTabAtSize(tab, size, cb) {
  const [width, height] = size;

  chrome.windows.getCurrent(({ id }) => {
    chrome.windows.update(id, { left: 0, top: 0, height, width }, function() {
      chrome.tabs.captureVisibleTab(null, {
        format: 'png'
      }, function(data) {
        saveToDisk(toBlob(toBase64(data)), getFilenameForTab(tab, size));
        cb && cb();
      });
    });
  });
}

function captureTabAtSizes(tab, [size, ...newSizes], cb) {
  if (!size) { cb(); return; }

  captureTabAtSize(tab, size, () => { captureTabAtSizes(tab, newSizes, cb); });
}

function captureTab(tab, cb) {
  chrome.tabs.update(tab.id, {active: true}, () => {
    captureTabAtSizes(tab, sizes, cb);
  });
}

function captureTabs([tab, ...newTabs]) {
  if (!tab) return;

  captureTab(tab, () => {
    captureTabs(newTabs);
  });
}

function captureAll() {
  ext.tabs.query({currentWindow: true}, function(tabs) {
    captureTabs(tabs);
  });
}

var toBase64 = function(data) {
  return data.slice(data.indexOf(',') + 1);
};

var toBlob = function(dataURI) {
  var binary = atob(dataURI);
  var array = [];
  for (var i = 0; i < binary.length; i++) {
    array.push(binary.charCodeAt(i));
  }

  return new Blob([new Uint8Array(array)], {type: 'image/png'})
};

function saveToDisk(blob, filename) {
  var url = URL.createObjectURL(blob);
  filename += '.png' ;
  var evt = document.createEvent("MouseEvents"); evt.initMouseEvent("click", true, true, window,0, 0, 0, 0, 0, false, true, false, false, 0, null);
  var a = document.createElement('a');
  document.body.appendChild(a);
  a.setAttribute('href', url);
  a.setAttribute('download', filename);
  a.dispatchEvent(evt);
}
