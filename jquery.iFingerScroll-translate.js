/*
 *  jquery.iFingerScroll-translate.js
 *  A jQuery Plugin that emulates the iPad flick scroll (with css transition)
 * 
 *  Based on the Overscroll jQuery library
 *  http://azoffdesign.com/overscroll
 *
 * Intended for use with the jQuery　1.4.2
 *  http://code.jquery.com/jquery-1.4.2.js
 *
 * Copyright 2010, 2011, TANAKA Kotaro
 * Dual licensed under the MIT or GPL Version 2 licenses.
 *  http://jquery.org/license
 *
 */

(function($, o) {
  
  $.fx.step["WebkitTransform"] = function(fx){
    if ( fx.state == 0 || fx.start == 0) {
      fx.start = getTranslate($(fx.elem).css("-webkit-transform"));
      fx.end = getTranslate(fx.end);
    }

    fx.elem.style["-webkit-transform"] = "translate3d(" + [
      parseInt((fx.pos * (fx.end[0] - fx.start[0])) + fx.start[0])+"px",
      parseInt((fx.pos * (fx.end[1] - fx.start[1])) + fx.start[1])+"px",
      parseInt((fx.pos * (fx.end[2] - fx.start[2])) + fx.start[2])+"px"
    ].join(",") + ")";
  };

  function getTranslate(attr) {
    var m = attr.match(/translate3d\((.+)px,\s*(.+)px,\s*(.+)px\)/);
    return [ parseInt(m[1], 10), parseInt(m[2], 10), parseInt(m[3], 10)];
  };
  
  o = $.fn.iFingerScroll = function() {
    return this.each(o.init);
  };
  
  $.extend(o, {
    events: {
      wheel: "mousewheel DOMMouseScroll",
      start: "select mousedown touchstart",
      drag: "mousemove touchmove",
      end: "mouseup mouseleave touchend",
      ignored: "dragstart drag"
    },
    
    init: function(data, target, size) {
      data = {};
      target = $(this)
        .css({
          "position" : "relative",
          "overflow" : "hidden"
        })
        .bind(o.events.wheel, data, o.wheel)
        .bind(o.events.start, data, o.start)
        .bind(o.events.end, data, o.stop)
        .bind(o.events.ignored, function(){return false;}); // disable proprietary drag handlers
        
      if(target.find(".scroll-inner").length == 0) target.wrapInner('<div class="scroll-inner" />')
      var inner = target.find(".scroll-inner").css({
        "-webkit-transform" : "translate3d(0px, 0px, 0px)",
      });
      
      data.target = target;
      data.inner = inner;
    },
    
    wheel: function(e, delta) {
      
      if ( e.wheelDelta ) { delta = e.wheelDelta/12000; }
      if ( e.detail     ) { delta = -e.detail/3; }
      
      var scr = o._calcScroll(e.data, (delta * o.constants.wheelDeltaMod) );
      e.data.inner.css({
        "-webkit-transform" : "translate3d("+scr.left+"px, "+scr.top+"px, 0px)"
      });
      
      return false;
    },
    
    start: function(e) {
    
      e.data.target
        .bind(o.events.drag, e.data, o.drag);
      
      e.data.position = { 
        x: (e.pageX || event.changedTouches[0].clientX),
        y: (e.pageY || event.changedTouches[0].clientY)
      };
      
      var dtop = (e.pageY || event.changedTouches[0].clientY) - e.data.position.y;
      var dleft = (e.pageX || event.changedTouches[0].clientX) - e.data.position.x;
      
      var scr = o._calcScroll(e.data, dtop, dleft, true);
      e.data.inner.stop(true, true).css({
        "-webkit-transform" : "translate3d("+scr.left+"px, "+scr.top+"px, 0px)"
      });
      
      e.data.capture = {};
      
      e.data.isDragging = false;
    
      event.preventDefault();
      // return false;  // for other event(Tap etc...)
    },
  
    drag: function(e) {
      var dtop = (e.pageY || event.changedTouches[0].clientY) - e.data.position.y;
      var dleft = (e.pageX || event.changedTouches[0].clientX) - e.data.position.x;
      
      var scr = o._calcScroll(e.data, dtop, dleft, true);
      e.data.inner.css({
        "-webkit-transform" : "translate3d("+scr.left+"px, "+scr.top+"px, 0px)"
      });
      
      e.data.position.x = (e.pageX || event.changedTouches[0].clientX);
      e.data.position.y = (e.pageY || event.changedTouches[0].clientY);
      
      if (typeof e.data.capture.index === "undefined" || --e.data.capture.index === 0 ) {
        e.data.isDragging = true;
        e.data.capture = {
          x: (e.pageX || event.changedTouches[0].clientX),
          y: (e.pageY || event.changedTouches[0].clientY),
          index: o.constants.captureThreshold
        };
      }
      
      if(event) event.preventDefault();
      return true;
    },
  
    stop: function(e) {
      if( typeof e.data.position !== "undefined" ) {
        e.data.target.unbind(o.events.drag, o.drag);

        if ( e.data.isDragging ) {
          var dtop = o.constants.scrollDeltaMod * ( (e.pageY || event.changedTouches[0].clientY) - e.data.capture.y);
          var dleft = o.constants.scrollDeltaMod * ( (e.pageX || event.changedTouches[0].clientX) - e.data.capture.y);
          var scr = o._calcScroll(e.data, dtop, dleft);
          e.data.inner.stop(true, true).animate({
            "WebkitTransform" : "translate3d("+scr.left+"px, "+scr.top+"px, 0px)"
          },{ 
            queue: false, 
            duration: o.constants.scrollDuration, 
            easing: "cubicEaseOut"
          });
        } else {
          var scr = o._calcScroll(e.data, 0, 0);
          e.data.inner.css({
            "-webkit-transform" : "translate3d("+scr.left+"px, "+scr.top+"px, 0px)"
          });
        }
        
        e.data.capture = e.data.position = undefined;
      }
      
      if(event) event.preventDefault();
      return !e.data.isDragging;
    },
    
    _calcScroll : function(data, dtop, dleft, ofT, ofL) {
      // var pos = data.inner.position();
      var t = getTranslate(data.inner.css("-webkit-transform"));
      var pos = {
        top: t[1],
        left: t[0]
      };
      var inner_size = {
        width : data.inner.width()-data.target.width(),
        height : data.inner.height()-data.target.height()
      };
      
      var top = pos.top + dtop;
      var left = (dleft) ? pos.left + dleft : pos.left;
      if(!ofT) {
        top = Math.max( Math.min(0, top), -inner_size.height );
      } else {
        if(top > 0) top -= o.constants.dumper * top;
        if(top < -inner_size.height) top -= o.constants.dumper * (top + inner_size.height);
      }
      if(!ofL) {
        left = Math.max( Math.min(0, left), -inner_size.width );
      } else {
        if(left > 0) top -= o.constants.dumper * left;
        if(left < -inner_size.width) top -= o.constants.dumper * (left + inner_size.width);
      }
      return {top: top, left: left};
    },
    
    // determines what elements are clickable
    clickableRegExp: (/input|textarea|select|a/i),
    
    constants: {
      scrollDuration: 800,
      captureThreshold: 4,
      wheelDeltaMod: -200,
      scrollDeltaMod: 4.7,
      dumper: 0.02
    }
    
  });
  
  // jQuery adapted Penner animation
  //    created by Jamie Lemon
  $.extend( $.easing, {
    
    cubicEaseOut: function(p, n, firstNum, diff) {
      var c = firstNum + diff;
      return c*((p=p/1-1)*p*p + 1) + firstNum;
    }
    
  });

})(jQuery)