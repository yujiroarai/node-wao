$(function(){'use strict';
  var movePage = function() {
    var src = 'md/API.md';
    $.ajax({
      url: src,
    }).success(function(data){
      $('#markdown_content').html(marked(data));
      $('pre code').each(function(i, e) {hljs.highlightBlock(e);});
    }).error(function(data){
      console.dir(data);
      if (data.status === 404) {
        $('#markdown_content').html(data.status + ' ' + data.statusText);
      } else {
        $('#markdown_content').html(data.status + ' ' + data.statusText);
      }
    });
  };
  // ハッシュが変わった時
  $(window).hashchange(function(){
    movePage();
  });
  hljs.configure({classPrefix: 'hljs-'});
  movePage();
});
