/***********************/
/*    custom script    */
/***********************/
// JSON Polyfill for safari version 4.x.x
if (!window.JSON) {
  window.JSON = {
    parse: function(sJSON) { return eval('(' + sJSON + ')'); },
    stringify: (function () {
      var toString = Object.prototype.toString;
      var hasOwnProperty = Object.prototype.hasOwnProperty;
      var isArray = Array.isArray || function (a) { return toString.call(a) === '[object Array]'; };
      var escMap = {'"': '\\"', '\\': '\\\\', '\b': '\\b', '\f': '\\f', '\n': '\\n', '\r': '\\r', '\t': '\\t'};
      var escFunc = function (m) { return escMap[m] || '\\u' + (m.charCodeAt(0) + 0x10000).toString(16).substr(1); };
      var escRE = /[\\"\u0000-\u001F\u2028\u2029]/g;
      return function stringify(value) {
        if (value == null) {
          return 'null';
        } else if (typeof value === 'number') {
          return isFinite(value) ? value.toString() : 'null';
        } else if (typeof value === 'boolean') {
          return value.toString();
        } else if (typeof value === 'object') {
          if (typeof value.toJSON === 'function') {
            return stringify(value.toJSON());
          } else if (isArray(value)) {
            var res = '[';
            for (var i = 0; i < value.length; i++)
              res += (i ? ', ' : '') + stringify(value[i]);
            return res + ']';
          } else if (toString.call(value) === '[object Object]') {
            var tmp = [];
            for (var k in value) {
              // in case "hasOwnProperty" has been shadowed
              if (hasOwnProperty.call(value, k))
                tmp.push(stringify(k) + ': ' + stringify(value[k]));
            }
            return '{' + tmp.join(', ') + '}';
          }
        }
        return '"' + value.toString().replace(escRE, escFunc) + '"';
      };
    })()
  };
}

/* keyword search function  */
function search() {
  var keyword = $('#keywords').val();
  var word = $.trim(keyword);
  var chapter = getCurChapterId();

  var redirect_word = normalizeWordOnRedirect(word)

  if (_config.behavior.redirect[redirect_word]) {
    location.href = './' + _config.behavior.redirect[redirect_word] + "?skw=" + redirect_word.replace(/#/, '');
    return false;
  }

  if (word != '') {
    location.href = './result.htm?w=' + encodeURIComponent(word) + '&chapter='+encodeURIComponent(chapter);
    return false;
  }
  return false;
}

function enter(keyCode) {
  if (keyCode == 13) {
    search();
  }
}

function genQuery(param, word, opt_start) {
  var start = opt_start || 0;
  var query = "";
  query = "q=" + encodeURIComponent(word);
  query += "&start=" + start;

  $.each(param, function (k, v) {
    switch (k) {
      case "fq":
        var fq = "&" + k + "=" + v;
        query += fq;
        break;
      case "return":
        var ret = "&" + k + "=" + v.join(",");
        query += ret;
        break;
      case "q.options":
        var opt = "&" + k + "=" + encodeURIComponent(JSON.stringify(v));
        query += opt;
        break;
      case "highlight":
        var high = "";
        $.each(v, function (label, value) {
          high += "&" + k + "." + _config.fields[label] + "=" + encodeURIComponent(JSON.stringify(value));
        });
        query += high;
        break;
      default:
    }
  });
  return query;
}

/* CloudSearch */
function setSearchWordCS(word, start) {
  var query = genQuery(_config.query.search, normalizeWord(word), start);
  // var query;
  var result = '';
  $.ajax({
    url: _config.url,
    type: _config.type,
    crossDomain: _config.crossDomain,
    data: query,
    timeout: _config.timeout,
    statusCode: {
      400: function (response) {
        $("div#keyword-title").html(getHttpStatusError(response.status));
      },
      404: function (response) {
        $("div#keyword-title").html(getHttpStatusError(response.status));
      },
      408: function (response) {
        $("div#keyword-title").html(getHttpStatusError(response.status));
      },
      429: function (response) {
        $("div#keyword-title").html(getHttpStatusError(response.status));
      },
      503: function (response) {
        $("div#keyword-title").html(getHttpStatusError(response.status));
      },
      507: function (response) {
        $("div#keyword-title").html(getHttpStatusError(response.status));
      },
      509: function (response) {
        $("div#keyword-title").html(getHttpStatusError(response.status));
      }
    }
  }).then(
    // OK
    function (data) {
      if (data.hits) {
        $('ul.pagination').html("");
        $('div#result').html();

        var hits = data.hits.hit;
        var max_count_in_page = 10;
        var max_view_pages = 5;
        var all_pages = Math.ceil(data.hits.found / max_count_in_page);

        var cur = parseInt(start);
        var first = 0;
        var last = (all_pages) * 10;
        var next = (cur + 10) > last ? last : (cur + 10);
        var prev = 0 > (cur - 10) ? 0 : (cur - 10);

        var item_start = (cur + 1);
        var item_last = data.hits.found;
        var item_end = (cur + 10) > item_last ? item_last : (cur + 10);
        if (_config.lang == 'ja') {
          $('div#keyword-title').html("<b>" + sanitizeWord(word) + "</b> " + _config.message.resulttitle);
        } else {
          $('div#keyword-title').html(_config.message.resulttitle + " <b>" + sanitizeWord(word) + "</b> ");
        }
        $('#keywords').val(word);

        if (!jQuery.isEmptyObject(hits)) {
          $('div#keyword-title').append(' ( ' + item_start + '-' + item_end + ' / ' + item_last + ' ) ');

          var cur_page = Math.ceil(cur / 10) + 1;
          cur_page = (cur_page == 0) ? 1 : cur_page;

          var cur_offset = cur_page - Math.ceil(max_view_pages / 2)
          cur_offset = (0 > cur_offset) ? 0 : cur_offset;

          var max_page = max_view_pages + cur_offset;
          max_page = (max_page > all_pages) ? all_pages : max_page;

          var max_page_offset = (max_page - max_view_pages) > 0 ? (max_page - max_view_pages) : 0;
          cur_offset = max_page_offset > cur_offset ? cur_offset : max_page_offset;
          var cur_anchor_id = "start" + cur;

          var url = "./result.htm?w=" + encodeURIComponent(word) + "&s=";

          $('ul.pagination').append('<li class="first"><a href="' + url + prev + '" aria-label="Previous"><span aria-hidden="true">&laquo;</span> <span class="hidden-xs" aria-hidden="true">' + _config.message.prev + '</span></a></li>');

          if (cur_page == 1) {
            $('ul.pagination li.first').addClass("disabled");
            $('ul.pagination li.first a').removeAttr("href");
          }

          for (var i = cur_offset; i < max_page; i++) {
            var hits_range = i * 10;
            var anchor_id = "start" + hits_range;
            var page_num = (i + 1);
            var anchor = $('<li><a type="button" id="' + anchor_id + '"href="' + url + hits_range + '">' + page_num + '</a><li>');
            if (cur_anchor_id == anchor_id) { anchor.addClass("active"); }
            $('ul.pagination').append(anchor);
          }

          $('ul.pagination').append('<li class="last"><a href="' + url + next + '" aria-label="Next"><span class="hidden-xs" aria-hidden="true">'+ _config.message.next + '</span> <span aria-hidden="true">&raquo;</span></a></li>');


          if (cur_page == all_pages) {
            $('ul.pagination li.last').addClass("disabled");
            $('ul.pagination li.last a').removeAttr("href");
          }

          $.each(hits, function (key, obj) {
            var entry = $('<div class="entry"></div>');
            var e_title = $('<div class="entry-title"></div>');
            var e_os_info = $('<div class="entry-os"></div>');
            var e_body = $('<div class="entry-body"></div>');
            var title;
            if (obj.highlights && obj.highlights[_config.fields.title]) {
              title = obj.highlights[_config.fields.title];
            } else {
              title = obj.fields[_config.fields.title];
            }
            if (!title) { title = ''; }

            // em -> b
            title = title.replace(/<em>/g, "<b>").replace(/<\/em>/g, "</b>");
            var url = obj.fields.name;
            var anchor = $('<a href="./' + url + '?kw=' + encodeURIComponent(word) + '">'
              + title + '</a>');
            e_title.append(anchor);

            var os = !obj.fields.os ? "" : obj.fields.os;
            $.each(os.split(","), function (k, v) {
              var label = ""
              switch (v) {
                case "win":
                  label = "Windows";
                  break;
                case "mac":
                  label = "Mac OS";
                  break;
                case "android":
                  label = "Android";
                  break;
                case "ios":
                  label = "iOS";
                  break;
              }
              e_os_info.append('<span class="badge badge-default ">' + label + '</span>  ');
            });

            var text;
            if (obj.highlights && obj.highlights[_config.fields.text]) { text = obj.highlights[_config.fields.text]; }
            else { text = obj.fields[_config.fields.text]; }
            if (!text) {
              text = '';
              return;
            }
            // em -> b (highlight.FIELDで指定も可能)
            // text = text.replace(/<em>/g, "<b>").replace(/<\/em>/g, "</b>").substr(0, 150) + "...";
            text = text.replace(/<em>/g, "<b>").replace(/<\/em>/g, "</b>");

            e_body.append(text);

            entry.append(e_title);
            entry.append(e_os_info);
            entry.append(e_body);
            $('div#result').append(entry);
          });
        };
        if (data.hits.found == 0) {
          $('div#result').html(_config.message["nohit"]);
        };
      } else {
      }
    },
    // for Timeout Error
    function (XMLHttpRequest, textStatus, errorThrown) {
      // error hadling for timeout
      if (textStatus == "timeout") { $("div#keyword-title").html(getHttpStatusError(408)); }
      else { $("div#keyword-title").html(getHttpStatusError(XMLHttpRequest.statusCode)); }
    }
  );
}

function sanitizeWord(word) {
  word = $.trim(word.replace(/</gi, '&lt;'));
  return word; // replace slash to space.
}

function getHttpStatusError(statuscode) {
  var message = "";
  switch (statuscode) {
    case 400:
      message = _config.message["400"];
      break;
    case 404:
      message = _config.message["404"];
      break;
    case 408:
      message = _config.message["408"];
      break;
    case 429:
      message = _config.message["429"];
      break;
    case 503:
      message = _config.message["503"];
      break;
    case 507:
      message = _config.message["507"];
      break;
    case 509:
      message = _config.message["509"];
      break;
    default:
      message = _config.message["509"];
  }
  return message;
}

/* Autocomplete 対応 */
$(function () {

  // load header, side menu, footer
  // _load_common_contents();
  _load_common_contents_multi();

  _seemore_view_action();
  _top_link_action();
  _ua_action();
  paramBehavior();

  $("#search").on("click", function (e) {
    search();
  });

  $('#keywords').autocomplete({
    source: function (request, response) {

      if (!$.trim(request.term)) { return; } // trimming multi byte and harf width spaces.
      var word = $.trim(request.term);  // trimming
      if (!normalizeWord(word)) { return; } // normalize check

      $.cookie("keyword", word);

      // ja, ko, tc, sc, th only
      if ($.inArray(_config.lang, _config.notsep) > -1) {
        complete_cs_search(word, response);
        return;
      }

      // other languages
      if (word.match(/\s/)) { // insert spaces
        complete_cs_search(word, response);
        return;
      }
      var delimiter = request.term.substr(-1, 1); // delimiter check
      if (delimiter.match(/\s/)) {
        complete_cs_search(word, response);
        return;
      }
    },
    minLength: 2,
    select: function (event, ui) {
      location.href = './result.htm?w=' + encodeURIComponent(ui.item.value);
    }
  });

  $(".switch-group > a").on("click", function () {
    $(".faq .nav-item ul li p.img").hide();
  });

  var cancel = true;
  $(".tab-nav-wrap div.hover i").on('click', function(e){
    e.preventDefault();
    if(cancel){
      cancel = false;
      var scroll_pos;
      var cur = $('.tab-menu-top li.active');
      if (cur.is('li:last-child')) {
        scroll_pos = 0;
        $('.tab-menu-top li').first().children('a').tab('show');
      } else {
        scroll_pos = $('.tab-menu-top').scrollLeft() + cur.width();
        cur.next().children('a').tab('show');
      }
      $('.tab-menu-top').animate({scrollLeft: scroll_pos}, 100);
      setTimeout(function(){ cancel = true; },150);
    }
  });

  $(".tab-nav-wrap div.hover i").on('dblclick', function(e){
    e.preventDefault();
  });

});

var index = "index.htm";
var link = "link.htm";
var result = "result.htm";

function paramBehavior() {
  var url = getCurFileUrl();
  switch(url) {
    case index:
      paramBehaviorTabOpen();
      _faq_link_action();
      break;
    case link:
      paramBehaviorRedirect();
      break;
    case result:
      paramBehaviorSearch();
      break;
    default :
      break;
  }  
}

function paramBehaviorRedirect() {
  var id = urlParams('pageid');
  window.location.href = (id in _config.behavior.redirect) && _config.behavior.redirect[id] + "?pageid=" + id || index;
}

function paramBehaviorTabOpen() {
  var tab = urlParams('tab');
  var opentab = '.nav-tabs li a[href="#' + tab +'"]';
  var deftab = '.nav-tabs li:first-child a';
  var selector = _config.behavior.tab.indexOf(tab) >= 0 && opentab || deftab;
  $(selector).tab('show');
  var cur = $('.tab-menu-top li.active');
  $('.tab-menu-top').animate({scrollLeft: cur.position().left}, 100);
}

function paramBehaviorSearch() {
  var keyword = urlParams('w');
  var cookie_keyword = $.cookie("keyword");
  if (cookie_keyword) {
    $('#keywords').val(cookie_keyword);
  } else if (keyword) {
    $('#keywords').val(keyword);
  } else {
    $('#keywords').val("");
  }
}

function complete_cs_search(input, response) {
  var query = genQuery(_config.query.autocomplete, normalizeWord(input));
  terms = [];
  $.ajax({
    url: _config.url,
    type: _config.type,
    crossDomain: _config.crossDomain,
    data: query,
    timeout: _config.timeout
  })
    .then(
      // response ok
      function (data) {
        if (data.hits && data.hits.found > 0) {
          var hits = data.hits.hit;
          if (!jQuery.isEmptyObject(hits)) {
            $.each(hits, function (key, obj) {
                var title = obj.fields[_config.fields.title];
                if ($.inArray(title, terms) >= 0) { return true;}
              terms.push(obj.fields[_config.fields.title]);
            });
          }
        } else {
          // no message in no hit case.
        }
        response(terms);
      },
      // Error
      function (XMLHttpRequest, textStatus, errorThrown) {
        // no error hadleing and return empty responses.
        response(terms); // term is empty
      }
    );
}

function urlParams(key) {
  var value = "";
  var pathname = $(location).attr('pathname');
  var search = $(location).attr('href').split('?').pop();
  var hash = $(location).attr('hash');
  if (!search) { return value; }
  var params = search.split("&");
  for (var i = 0; i < params.length; i++) {
    param = params[i].split("=");
    if (param[0] == key) {
      value = decodeURIComponent(param[1]);
    }
  }
  if (param[0] != key) { return value; }

  return value;
}

function normalizeWordOnRedirect(word) {
  word = $.trim(word.replace(/\//gi, ' ')
                    .replace(/Ｔ/, 't')
                    .replace(/Ｇ/, 'g')
                    .replace(/ｔ/, 't')
                    .replace(/ｇ/, 'g')
                    .replace(/T/, 't')
                    .replace(/G/, 'g')
                    .replace(/０/, '0')
                    .replace(/１/, '1')
                    .replace(/２/, '2')
                    .replace(/３/, '3')
                    .replace(/４/, '4')
                    .replace(/５/, '5')
                    .replace(/６/, '6')
                    .replace(/７/, '7')
                    .replace(/８/, '8')
                    .replace(/９/, '9')
                    .replace(/＃/, '#')
                );
  return word; // replace slash to space.
}

function normalizeWord(word) {
  word = $.trim(word.replace(/\//gi, ' '));
  return word; // replace slash to space.
}

function _ua_action() {
  var parser = new UAParser();
  var ua = parser.getResult();
  var major = ua.os.version.split(".")[0];

  if (ua.os.name == 'Android' && major < 5) {
    $(".print-btn-pc").hide();
  } else {
  }
}

function _top_link_action() {
  var topBtn = $('#page-top');
  topBtn.hide();

  $(window).scroll(function () {
    if ($(this).scrollTop() > 100) {
      topBtn.fadeIn();
    } else {
      topBtn.fadeOut();
    }
  });

  topBtn.click(function () {
    $('body,html').animate({
      scrollTop: 0
    }, 500);
    return false;
  });
}

function _faq_link_action() {
  var faqBtn = $('.contents-btn');
  var faq = $('.faq-panel');
  faqBtn.fadeIn();

  $(window).scroll(function () {
    if ($(this).scrollTop() > (faq.offset().top - $(this).height())) {
      faqBtn.fadeOut();
    } else {
      faqBtn.fadeIn();
    }
  });

  faqBtn.click(function () {
    $('body,html').animate({
      scrollTop: faq.offset().top
    }, 500);
    return false;
  });
}

function _page_link_action() {
  var pageLink = $('.page-link a');
  pageLink.click(function () {
    var href = $(this).attr("href");
    var target = $('a[name=' + href.substr(1) + ']');
    var position = target.offset().top;
    $('body,html').animate({
      scrollTop: position
    }, 500);
    return false;
  });
}

function _seemore_view_action() {
  // for see more function in sub pages.
  var seemore_limit = 3;

  $("ul.child-topic-list > li > ul > li").each(function (i, element) {
    preceding_sibling = $(element).prevUntil().length
    var li_item_number = $(element).parent("ul").children("li").length;

    if (seemore_limit > preceding_sibling) {
      $(element).addClass("open");
    } else if (seemore_limit == preceding_sibling) {
      // check add or none seemore element.
      if (seemore_limit < li_item_number) {
        $(element).before("<li class=\"seemore\"><p>" + _config.message["more"] + "</p></li>")
      }
      $(element).addClass("closed");
    }
    else {
      $(element).addClass("closed");
    }
  });
  // for click event
  $("ul.child-topic-list > li > ul > li.seemore").on("click", function () {
    $(this).hide();
    $(this).nextAll().fadeIn().addClass("open");
  });

  // for main contents
  $(".main .viewimage ul.child-topic-list > li").each(function (i, element) {
    preceding_sibling = $(element).prevUntil().length
    var li_item_number = $(element).parent("ul").children("li").length;

    if (seemore_limit > preceding_sibling) {
      $(element).addClass("open");
    } else if (seemore_limit == preceding_sibling) {
      // check add or none seemore element.
      if (seemore_limit < li_item_number) {
        $(element).before("<li class=\"seemore\"><p>" + _config.message["more"] + "</p></li>")
      }
      $(element).addClass("closed");
    }
    else {
      $(element).addClass("closed");
    }
  });
  // for click event
  $(".main .viewimage ul.child-topic-list > li.seemore").on("click", function () {
    $(this).hide();
    $(this).nextAll().fadeIn().addClass("open");
  });

}

function isCheckBreadClumbList() {
  var file = getCurFileUrl();
  if (file == "index.htm") { return false }
  else if(file == "result.htm") {return false}
  else if(file == "link.htm") {return false}
  else {return true}
}

function getCurFileUrl() {
  var url = $(location).attr('href').split('/').pop().split('#').shift().split('?').shift();
  return url != "" && url || "index.htm";
}

function getCurFileId() {
  return getCurFileUrl().split('.').shift();
}

function getCurChapterId() {
  var param = urlParams('chapter');
  var breadClumb = $('.bread-clumlist').children('*:nth-child(2)');
  var url = getCurFileId();
  if (url == 'result') {
    if (param) {
      return param;
    } else {
      return $('ul.col-menu-toc').children('li:nth-child(1)').children("a").attr("href").split('.').shift();
    }
  } else if (url == 'index') {
    return $('ul.col-menu-toc').children('li:nth-child(1)').children("a").attr("href").split('.').shift() 
  } else {
    if (param) {
      return  param;
    } else if (breadClumb.length > 0) {
      return breadClumb.attr("id");
    } else {
      return;
    }
  }
}

function getCurChapterUrl() {
  return isCheckBreadClumbList() ? getCurChapterId() + ".htm" : ""; 
}

var menu_json_path = "files/menu.json"

function isFaq(val) {
  return val["meta"].indexOf("faq") > 0 && true || false;
}

function _load_mobile_menu() {
  var level = 1;
  var file = getCurFileUrl();
 
  var menu = $('ul.dl-menu.col-menu-toc');

  $.ajax({
    type: 'GET',
    url: menu_json_path,
    dataType: 'json',
    async: true,
    cache: true, 
    success: function(data) { 
      
      /* generate dom */ 
      var menu_ul = [];

      $.each(data, function (key, val) {
        // for mobile menu
        var li = [];
        li.push(expandMenuListMobile(level, val));
        menu_ul.push(li.join(''));
      });
      menu.append($(menu_ul.join('')));

      // mobile menu event 
      $('#dl-menu').dlmenu();

      var target = menu.find('li:not(.dl-parent) > a' + '[href="'+file+'"]'); 
      target.parent('li').addClass('active');
      target.parents('ul').last().addClass('dl-subview');
      target.parents('li').parents('li').addClass('dl-subview');
      target.parents('li').first().parents('li').first().addClass('dl-subviewopen').removeClass('dl-subview');
    }
  });
}

function _load_side_menu() {
  var level = 1;
  var file = getCurFileUrl();
  var toc_panel = $('<div class="toc-menu"></div>'); 
  var switcher = $('<ul class="nav nav-pills nav-stacked nav-tabs chapter-switch dropdown" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false"></ul>');
  var chapterDropdown = $('<ul class="dropdown-menu"></ul>');
  var tabcontent = $('<div class="tab-content"></div>');
  var chapterToggle = $('<li class="nav-link dropdown-toggle" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false"><span class="glyphicon glyphicon-triangle-bottom" aria-hidden="true"></span></li>'); 

  $.ajax({
    type: 'GET',
    url: menu_json_path,
    dataType: 'json',
    async: true,
    cache: true, 
    success: function(data) { 

      var tabs = [];
      $.each(data, function (key, val) {
          // for side menu 
        var tabpanel = [];
        tabpanel.push('<div role="tabpanel" id="' + key + '" ');
        if(isFaq(val)) {tabpanel.push('class="tab-pane faq fade"')} 
        else {tabpanel.push('class="tab-pane fade"')};
        tabpanel.push('>');
        var chaptertoc = [];
        chaptertoc.push('<ul class="chapter-toc">');

        // tab side menu
        var li_tab = switchChapter(level, val, chaptertoc);
        chapterDropdown.append(li_tab);
        chaptertoc.push('</ul>');
        tabpanel.push(chaptertoc.join(''));
        tabpanel.push('</div>');
        tabs.push(tabpanel.join(''));
      });

      tabcontent.append(tabs.join(''));
      switcher.append(chapterToggle).append(chapterDropdown);
      toc_panel.append(switcher).append(tabcontent);
      $(".col-menu").append(toc_panel);

      // side menu event
      if (file != 'index.htm' && file != 'result.htm') {
        var selector = '.tab-content li a[href=\"' + file + '\"]';
        $(selector).parents("ul.dropdown-menu").removeClass("dropdown-menu");
        $(selector).addClass("active");
        $(selector).parents("li.dropdown").last().addClass("active");
        $("li.dropdown:not(.active)").hide();
      }

      $(".chapter-switch").on('show.bs.dropdown', function () {
        $(".dropdown-menu li.active").removeClass("active");
      });

      $(".chapter-switch").on('shown.bs.tab', function () {
        var selected = $(".dropdown-menu li.active").text();
        var icon_text = '<span class="glyphicon glyphicon-triangle-bottom toggle-down" aria-hidden="true"></span> ';
        $(".chapter-switch li.dropdown-toggle").text(selected);
        $(".chapter-switch > li.dropdown-toggle").append(icon_text);
      });

      var chapterid = getCurChapterId();
      var switcherselector = '.chapter-switch ul.dropdown-menu a[href=\"#' + chapterid + '\"]';
      $(".chapter-switch .dropdown-toggle").trigger('click');
      $(switcherselector).trigger('click');
    }
  });
}

function _load_print_menu() {
  var level = 1;
  var file = getCurFileUrl();
  var print_menu = $('.pages-tree'); 
  var chapter_url = getCurChapterUrl();
 
  $.ajax({
    type: 'GET',
    url: menu_json_path,
    dataType: 'json',
    async: true,
    cache: true, 
    success: function(data) { 
      var print_ul = [];
      print_ul.push('<ul class="print-list">');
      $.each(data, function (key, val) {
          // print contents 
        if (chapter_url == val["url"]) {
          var li = genPrintContentsTree(level, val);
          print_ul.push(li);
        }
      });
      print_ul.push('</ul>');
      print_menu.append(print_ul.join(''));

      // print dialog event
      $('span.label-title').on('click', function (e) {
        $(this).prev().trigger("click");
      }); 

      $(".is-print-check").on("click", function (e) {
        var check = $(this).prop("checked");
        $(this).next().next().find('input').prop("checked", function (index, prop) {
          return check;
        });

        var checked = $('.is-print-check:checked');
        if (checked.length == 0) { $('#print-dialog-btn').prop("disabled", true); } 
        else { $('#print-dialog-btn').prop("disabled", false); }
      });

      // for print-dialog event
      $('#print-page').on('show.bs.modal', function (e) {
        var selector = '#print-page .select-contents .is-print-check[data-target="' + getCurFileUrl()+  '"]';
        $(selector).first().trigger('click');
      });

      $('#print-page').on('hidden.bs.modal', function (e) {
        // clear contents
        $(this).removeData('bs.modal');
        $('#print-area .contents').remove();
        $('#print-page .select-contents input').prop('checked', false);
      });
    }
  });
}

function _load_common_contents_multi() {

  var file = getCurFileUrl();
  _load_mobile_menu();
  if (file != 'index.htm') {
    _load_side_menu();
    _load_print_menu();
  }
}

$('#external-modal').on('loaded.bs.modal', function (e) { 
  var contents = $('#external-modal .contents');
  var id = contents.find('div.topic > a').attr('name');
  var modal_id = 'modal_'+id;
  contents.attr('id', modal_id);
  $('#print-area').append(contents.clone(true));
  $('#print-area #' + modal_id).css("display", "block").css("page-break-after", "auto");
});

$('#external-modal').on('hidden.bs.modal', function (e) { 
  $(this).removeData('bs.modal');
  var contents = $('#external-modal .contents');
  var id = contents.find('div.topic > a').attr('name');
  var modal_id = 'modal_'+id;
  $('#print-area #' + modal_id).remove();
});

function pageResultPrint() {
  $(".contents").css("display", "block");
  window.print();
}

function sendTrackingEvent2GA(category, action, url) {
  var cur = getCurFileUrl();
  gtag('event', 'print',  {
    print_page: url
  });
}

function pagePrint() {
  var checked = $("ul.print-list input:checked");
  var last = checked.length - 1;

  $('#print-dialog-btn').prop('disabled', true);
  $('#print-page').css("cursor","wait");

  // reset
  $(this).removeData('bs.modal');
  $('#print-area .contents').remove();

  var done = 1;
  var selector = " .contents";

  var jqXHRs = [];
  var responses = [];

  checked.each(function(i, elem){
    var url = $(elem).attr("data-target");
    sendTrackingEvent2GA("manual", "print", url);
    jqXHRs.push(
      $.ajax({
          type: 'GET',
          url: url,
          cache : false,
          async: true,
          dataType: 'html'
      })
    );
  });

  $.when.apply($, jqXHRs).done(function () {
    if (checked.length == 1) {
      var contents = $(arguments[0]).find(selector);
      contents.css("display", "block").css("page-break-after", "auto");
      $('#print-area').append(contents);
      doPrint();
    } else {
      for (var i = 0; i < arguments.length; i++) {
        var contents = $(arguments[i][0]).find(selector);
        contents.css("display", "block");
        if (last == i) {
          contents.css("page-break-after", "auto");
        }
        $('#print-area').append(contents);
        if (last == i) {
          doPrint();
        }
      }
    }
  });  
}

function doPrint() {
  $('#print-area img').imagesLoaded( function() {
    $('#print-page').css("cursor","");
    window.print();
    setTimeout(function(){
      $('#print-dialog-btn').prop('disabled', false);
    },2000);
  });
}

function genPrintContentsTree(level, entry) {
  var title = entry["title"];
  var url = entry["url"];
  var child = "child" in entry == true ? true : false;
  var li = [];
  li.push('<li>');
  li.push('<input class="form-check-input is-print-check" type="checkbox" aria-label="..." data-target="' + url + '"/>');
  li.push('<span class="label-title">' + title + '</span>');

  if (child == true) {
    var ul = [];
    ul.push('<ul>');
    $.each(entry["child"], function (key, val) {
      ul.push(genPrintContentsTree(level + 1, val));
    });
    ul.push('</ul>');
    li.push(ul.join(''));
  }
  li.push('</li>');
  return li.join('');
}

function switchChapter(level, entry, chaptertoc) {
  var title = entry["title"];
  var url = entry["url"];
  var id = url.split('.').shift();
  var child = "child" in entry == true ? true : false;

  switch (level) {
    case 1:
      var li = [];
      li.push('<li role="presentation">');
      li.push('<a aria-controls="' + id + '" data-toggle="tab" role="tab" href="' + "#" + id + '">' + title + '</a>');
      if (child == true) {
        var ul = [];
        ul.push('<ul class="dropdown-menu">');
        $.each(entry["child"], function (key, val) {
          chaptertoc.push(switchChapter(level + 1, val, ul));
        });
        ul.push('</ul>');
        li.push(ul.join(''));
      }
      li.push('</li>');
      return li.join('');
    default:
      var li = [];
      li.push('<li>');
      li.push('<a href="' + url + '">' + title + '</a>');
      if (child == true) {
        var ul = [];
        ul.push('<ul class="dropdown-menu">');
        $.each(entry["child"], function (key, val) {
          ul.push(switchChapter(level + 1, val, ul));
        });
        ul.push('</ul>');
        li.push(ul.join(''));
      }
      li.push('</li>');
      return li.join('');
  }
}

function expandMenuListMobile(level, entry) {
  var title = entry["title"];
  var url = entry["url"];
  var child = "child" in entry == true ? true : false;
  var li = [];
  li.push('<li>');
  li.push('<a href="' + url + '">' + title + '</a>');
  if (child == true) {
    var ul = [];
     ul.push('<ul class="dl-submenu">');
    $.each(entry["child"], function (key, val) {
      ul.push(expandMenuListMobile(level + 1, val));
    });
    ul.push('</ul>');
    li.push(ul.join(''));
  }
  li.push('</li>');
  return li.join('');
}
