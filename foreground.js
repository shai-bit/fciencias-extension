// Get professors info and send it to background
let tables = document.getElementsByTagName('table');
let professors = [];
for (let i = 0; i < tables.length; i++) {
  professors.push(tables[i].rows[0].cells[1].innerText);
}
chrome.runtime.sendMessage({ msg: professors });
