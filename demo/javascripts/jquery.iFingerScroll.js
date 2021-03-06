/*
 *  jquery.iFingerScroll.js
 *  A jQuery Plugin that emulates the iPad flick scroll
 * 
 *  Based on the Overscroll jQuery library
 *  http://azoffdesign.com/overscroll
 *
 * Intended for use with the latest jQuery
 *  http://code.jquery.com/jquery-latest.js
 *
 * Copyright 2010, 2011, TANAKA Kotaro
 * Dual licensed under the MIT or GPL Version 2 licenses.
 *  http://jquery.org/license
 *
 */
 
 (function($, o) {
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
        "position" : "absolute",
        "top" : "0",
        "webkit-transition-propaty" : "top left",
        "-webkit-transition-timing-function" : "ease-out"
      });
      
      data.target = target;
      data.inner = inner;
    },
    
    wheel: function(e, delta) {
      
      if ( e.wheelDelta ) { delta = e.wheelDelta/12000; }
      if ( e.detail     ) { delta = -e.detail/3; }
      
      e.data.inner.css({
        "-webkit-transition-duration" : o.constants.scrollDuration,
        "top" : o._calcScroll(e.data, (delta * o.constants.wheelDeltaMod) ).top
      });
      
      return false;
    },
    
    start: function(e) {
    
      e.data.target
        .bind(o.events.drag, e.data, o.drag)
        .stop(true, true);
      
      e.data.position = { 
        x: (e.pageX || event.changedTouches[0].clientX),
        y: (e.pageY || event.changedTouches[0].clientY)
      };
      
      var dtop = (e.pageY || event.changedTouches[0].clientY) - e.data.position.y;
      var dleft = (e.pageX || event.changedTouches[0].clientX) - e.data.position.x;
      
      var scr = o._calcScroll(e.data, dtop, dleft);
      e.data.inner.css({
        "-webkit-transition-duration" : "0",
        "top" : scr.top,
        "left" : scr.left
      });
      
      e.data.capture = {};
      
      e.data.isDragging = false;
    
      event.preventDefault();
      // return false;  // for other event(Tap etc...)
    },
  
    drag: function(e) {
      var dtop = (e.pageY || event.changedTouches[0].clientY) - e.data.position.y;
      var dleft = (e.pageX || event.changedTouches[0].clientX) - e.data.position.x;
      
      var scr = o._calcScroll(e.data, dtop, dleft);
      e.data.inner.css({
        "-webkit-transition-duration" : "0",
        "top" : scr.top,
        "left" : scr.left
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
      
      event.preventDefault();
      return true;
    },
  
    stop: function(e) {
      if( typeof e.data.position !== "undefined" ) {
        e.data.target.unbind(o.events.drag, o.drag);

        if ( e.data.isDragging ) {
          var dtop = o.constants.scrollDeltaMod * ( (e.pageY || event.changedTouches[0].clientY) - e.data.capture.y);
          var dleft = o.constants.scrollDeltaMod * ( (e.pageX || event.changedTouches[0].clientX) - e.data.capture.y);
          var scr = o._calcScroll(e.data, dtop, dleft);
          e.data.inner.css({
            "-webkit-transition-duration" : o.constants.scrollDuration,
            "top" : scr.top,
            "left" : scr.left
          });
        }
        
        e.data.capture = e.data.position = undefined;
      }
      
      event.preventDefault();
      return !e.data.isDragging;
    },
    
    _calcScroll : function(data, dtop, dleft) {
      var pos = data.inner.position();
      // console.log("top:" + pos.top + " / pageY:" + (e.pageY || event.changedTouches[0].clientY) + " / position.y:" + e.data.position.y);
      var top = pos.top + dtop;
      var left = (dleft) ? pos.left + dleft : pos.left;
      top = Math.max( Math.min(0, top), -( data.inner.height()-data.target.height()) );
      left = Math.max( Math.min(0, left), -( data.inner.width()-data.target.width()) );
      return {top: top, left: left};
    },

    // determines what elements are clickable
    clickableRegExp: (/input|textarea|select|a/i),
    
    constants: {
      scrollDuration: "0.8s",
      captureThreshold: 4,
      wheelDeltaMod: -200,
      scrollDeltaMod: 4.7
    }
    
  });
  
})(jQuery)