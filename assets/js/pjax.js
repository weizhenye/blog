function $x(url, callback) {
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4 && xhr.status === 200) {
      callback && callback(xhr.responseText, xhr);
    }
  }
  xhr.open('GET', url, true);
  xhr.send(null);
}
function pjax(url, flag) {
  $x(url, function(text, xhr) {
    if (!text) return;
    var tmpDOM = document.implementation.createHTMLDocument('', 'html', null);
    tmpDOM.documentElement.innerHTML = text;
    document.querySelector('#pjax-container').innerHTML = tmpDOM.querySelector('#pjax-container').innerHTML;
    document.head.innerHTML = tmpDOM.head.innerHTML;
    var title = tmpDOM.querySelector('title').text;
    if (flag) {
      window.history.pushState({
        url: url,
        title: title
      }, title, url);
    } else {
      window.history.replaceState({
        url: url,
        title: title
      }, title);
    }
  });
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
