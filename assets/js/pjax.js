var pjax = function(url, flag, callback) {
  var xhr = new XMLHttpRequest();
  xhr.onloadend = function() {
    xhr.onloadend = null;
    xhr = null;
    callback && callback();
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
      if (flag) window.history.pushState({url: url}, title, url);
      else window.history.replaceState({url: url}, title);
      xhr.onreadystatechange = null;
    }
  };
  xhr.open('GET', url, true);
  xhr.send(null);
};
var pjaxCallback = function() {
  window.ga && ga('send', 'pageview');
  if (/^\/articles\/.+/.test(window.location.pathname)) {
    var disqus_config = function() {
      this.page.url = window.location.href;
      this.page.identifier = window.location.pathname;
    };
    if (window.DISQUS) {
      DISQUS.reset({
        reload: true,
        config: disqus_config
      });
    } else {
      (function() {
        var d = document, s = d.createElement('script');
        s.src = '//muou.disqus.com/embed.js';
        s.setAttribute('data-timestamp', +new Date());
        (d.head || d.body).appendChild(s);
      })();
    }
  }
};
pjaxCallback();
document.addEventListener('click', function(e) {
  var ele = e.target;
  if (ele &&
      ele.nodeName === 'A' &&
      !ele.target &&
      ele.hostname === location.hostname) {
    if (!window.history) return;
    e.preventDefault();
    pjax(ele.pathname, 1, pjaxCallback);
  }
});
window.addEventListener('popstate', function(e) {
  pjax(e.state.url, 0, pjaxCallback);
});
