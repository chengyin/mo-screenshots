import ext from "./utils/ext";
import storage from "./utils/storage";

var popup = document.getElementById("app");

function getAllTabURLs(cb) {
  ext.tabs.query({currentWindow: true}, function(tabs) {
    cb(tabs.map((t) => t.url));
  });
}

popup.addEventListener("click", function(e) {
  if(e.target && e.target.matches("#save-btn")) {
    e.preventDefault();
    var data = e.target.getAttribute("data-bookmark");
    ext.runtime.sendMessage({ action: "perform-save", data: data }, function(response) {
      if(response && response.action === "saved") {
        renderMessage("Your bookmark was saved successfully!");
      } else {
        renderMessage("Sorry, there was an error while saving your bookmark.");
      }
    })
  }
});

const output = document.getElementById('output');

getAllTabURLs((urls) => {
  const html = urls.map((url) => `<li>${url}</li>`).join('');
  output.innerHTML = `<ul>${html}</ul>`;
});

function sendMessage(data) {
  chrome.runtime.sendMessage(data, function() {});
}

document.getElementById('submit').onclick = function() {
  getAllTabURLs((urls) => {
    sendMessage({
      message: 'capture',
      urls: urls
    });
    window.close();
  });
};
