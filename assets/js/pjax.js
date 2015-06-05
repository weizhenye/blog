function pjax(url, flag) {
  var xhr = new XMLHttpRequest();
  var progress = document.querySelector('#progress');
  xhr.onprogress = function(e) {
    progress.style.width = (e.loaded / e.total) * 100 + '%';
  };
  xhr.onload = function() {
    progress.style.width = '0%';
  };
  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4 && xhr.status === 200) {
      var text = xhr.responseText;
      if (!text) return;
      var tmpDOM = document.implementation.createHTMLDocument('', 'html', null);
      tmpDOM.documentElement.innerHTML = text;
      document.querySelector('#pjax-container').innerHTML = tmpDOM.querySelector('#pjax-container').innerHTML;
      var title = tmpDOM.querySelector('title').text;
      if (flag) {
        window.history.pushState({ url: url }, title, url);
      } else {
        window.history.replaceState({ url: url }, title);
      }
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
