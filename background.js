chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading') {
    if (
      /https:\/\/web\.fciencias\.unam\.mx\/docencia\/horarios\/202[0-9][0-9]/.test(
        changeInfo.url
      )
    ) {
      chrome.tabs.executeScript(null, { file: './content.js' });
    }
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  firstNames = [];
  lastNames = [];
  for (professor of request.msg) {
    firstNames.push(getFirstName(professor));
    lastNames.push(getLastName(professor));
  }
  console.log(firstNames, lastNames);
  fetchProfessorsInfo(firstNames, lastNames);
});

function getLastName(name) {
  let arr = name.split(' ').splice(-2);
  let lastName = arr[0] + ' ' + arr[1];
  return lastName;
}

function getFirstName(name) {
  let arr = name.split(' ');
  let firstName = arr[0];
  return firstName;
}

function removeSpecialChars(name) {
  let removed = name
    .normalize('NFD')
    .replace(
      /([^n\u0300-\u036f]|n(?!\u0303(?![\u0300-\u036f])))[\u0300-\u036f]+/gi,
      '$1'
    )
    .normalize();
  return removed;
}

function getLastNameRegex(name, unicode) {
  let removed = removeSpecialChars(name);
  let arrAccent = unicode.split(' ');
  let arrRemoved = removed.split(' ');
  let optionalName =
    '(' +
    arrAccent[0] +
    '|' +
    arrAccent[0].toLowerCase() +
    '|' +
    arrRemoved[0] +
    '|' +
    arrRemoved[0].toLowerCase() +
    '|' +
    arrRemoved[0].toUpperCase() +
    ')[^}]*(' +
    arrAccent[1] +
    '|' +
    arrAccent[1].toLowerCase() +
    '|' +
    arrRemoved[1] +
    '|' +
    arrRemoved[1].toLowerCase() +
    '|' +
    arrRemoved[1].toLowerCase() +
    ')';
  return optionalName;
}

function transformSpecialChars(strings) {
  var specialChars = [225, 233, 237, 243, 250, 193, 201, 205, 211, 218, 241];
  var unicode = [];
  for (string of strings) {
    console.log('String before: ', string);
    var stringUnicode = '';
    for (idx in string) {
      if (specialChars.includes(string.charCodeAt(idx))) {
        stringUnicode += '\\\\u00' + string.charCodeAt(idx).toString(16);
      } else {
        stringUnicode += string[idx];
      }
    }
    console.log('String unicode: ', stringUnicode);
    unicode.push(stringUnicode);
  }
  return unicode;
}

function fetchProfessorsInfo(firstNames, lastNames) {
  fetch('https://www.misprofesores.com/escuelas/Facultad-de-Ciencias-UNAM_2842')
    .then(function (response) {
      switch (response.status) {
        // status "OK"
        case 200:
          return response.text();
        // status "Not Found"
        case 404:
          throw response;
      }
    })
    .then((template) => {
      firstUnicode = transformSpecialChars(firstNames);
      lastUnicode = transformSpecialChars(lastNames);
      console.log(firstUnicode, lastUnicode);
      for (i = 0; i < firstUnicode.length; i++) {
        let regExString =
          '\\{[^}]*(' +
          firstUnicode[i] +
          '|' +
          firstUnicode[i].toLowerCase() +
          '|' +
          removeSpecialChars(firstNames[i]) +
          '|' +
          removeSpecialChars(firstNames[i]).toLowerCase() +
          '|' +
          removeSpecialChars(firstNames[i]).toUpperCase() +
          ')[^}]*' +
          getLastNameRegex(lastNames[i], lastUnicode[i]) +
          '.*?\\}';
        let regEx = new RegExp(regExString);
        console.log(regEx);
        // Try searching with regex
        if (regEx.test(template)) {
          let result = template.match(regEx);
          console.log(result[0]);
          profObject = JSON.parse(result[0]);
          console.log(profObject);
        }
      }
    })
    .catch(function (response) {
      // "Not Found"
      console.log(response.statusText);
    });
}
