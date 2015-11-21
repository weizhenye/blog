var pjax = function(url, flag) {
  var xhr = new XMLHttpRequest();
  xhr.onloadend = function() {
    xhr.onloadend = null;
    xhr = null;
  };
  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4 && xhr.status === 200) {
      var text = xhr.responseText;
      if (!text) return;
      var parser = new DOMParser();
      var tmpDOM = parser.parseFromString(text, 'text/html');
      var title = tmpDOM.title;
      document.title = title;
      document.querySelector('#pjax-container').innerHTML =
        tmpDOM.querySelector('#pjax-container').innerHTML;
      if (flag) {
        window.history.pushState({ url: url }, title, url);
      } else {
        window.history.replaceState({ url: url }, title);
      }
      xhr.onreadystatechange = null;
    }
  };
  xhr.open('GET', url, true);
  xhr.send(null);
}
document.addEventListener('click', function(e) {
  var ele = e.target;
  if (ele &&
      ele.nodeName === 'A' &&
      !ele.target &&
      ele.hostname === location.hostname) {
    if (!window.history) return;
    e.preventDefault();
    pjax(ele.pathname, 1);
  }
});
window.addEventListener('popstate', function(e) {
  pjax(e.state.url, 0);
});
