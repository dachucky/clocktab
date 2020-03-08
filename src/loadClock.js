/*
<p>
P.S. Clock Tab is open source (<a href="https://github.com/brillout/clocktab">github.com/brillout/clocktab</a>)! Also check my other open source work at <a href="https://github.com/brillout">github.com/brillout</a> which inclues many programming tools and Clock Tab's big brother <a href="http://www.timer-tab.com/">Timer Tab</a>.
</p>
*/

// This code is over a decade old.
// I'm more than happy to accept a PR to modernize all this :-)

import ml from './ml';
import {hasBeenAutoReloaded} from './autoReloadPage';
import setBackground from './setBackground';

export default loadClock;

async function loadClock() {
  let resolveAwaitClockFont;
  const awaitClockFont = new Promise(r => resolveAwaitClockFont = r);

  var DEFAULT_12HOUR   = /(AM)|(PM)/.test(new Date().toLocaleTimeString())||window.navigator.language==='en-US';
  var DEFAULT_BG_COLOR = '#000000';
  var DEFAULT_BG_IMAGE = '';
  var DEFAULT_FONT     = 'Orbitron';
  var DEFAULT_FCOL     = '#FFFFFF';
//var DEFAULT_ICOL     = '#cc0000';
//var DEFAULT_ICOL     = '#007000';
  var DEFAULT_ICOL     = '#545454';
  var DEFAULT_SHADOW   = '';
  var DEFAULT_THEME    = 'custom';
  var FS_NAME          = "fs";
  var MIN_WIDTH        = 580;
  var timeEl           = document.getElementById('time');
  var timeTableEl      = document.getElementById('timeTable');
  var timeRowEl        = document.getElementById('timeRow');
  var dateEl           = document.getElementById('date');
  var contentEl        = document.getElementById('content');

  /* SIZE of time */
  var timeout;
  function setSize(noTimeout){
  //{{{
    function do_(){
      var time_new_size = ml.getTextSize(timeRowEl,Math.min(window.innerWidth,parseInt(getOpt('font_size'),10)||Infinity),window.innerHeight);
      ml.assert(time_new_size.width && time_new_size.height);
      if(dateEl.innerHTML!="")
      {
        var date_new_size = ml.getTextSize(dateEl,time_new_size.width*0.95,window.innerHeight);
        var diff = time_new_size.height+date_new_size.height-window.innerHeight;
        if(diff>0)
        {
          time_new_size = ml.getTextSize(timeRowEl,window.innerWidth  ,window.innerHeight-date_new_size.height);
          date_new_size = ml.getTextSize(dateEl,time_new_size.width,window.innerHeight-time_new_size.height);
          time_new_size = ml.getTextSize(timeRowEl,window.innerWidth  ,window.innerHeight-date_new_size.height);
        }
        dateEl.style.fontSize = date_new_size.fontSize+'px';
      }
      timeTableEl.style.fontSize = time_new_size.fontSize  +'px';
    }
    window.clearTimeout(timeout);
    if(timeout===undefined||noTimeout) do_();
    else timeout=setTimeout(do_,300);
  //}}}
  }
  window.addEventListener('resize',function(){setSize()},false);

  /* OPTIONS */
  var getOpt;
  (function(){
  //{{{
   var opts = [
     {id:'theme'             ,description:'theme'           ,default_:DEFAULT_THEME                             },
     {id:'clock_font'        ,description:'font'            ,default_:DEFAULT_FONT        ,negDependency:'theme'},
     {id:'color_font'        ,description:'font color'      ,default_:DEFAULT_FCOL        ,negDependency:'theme'},
     {id:'font_shadow'       ,description:'font shadow'     ,default_:DEFAULT_SHADOW      ,negDependency:'theme',placeholder:'see css text-shadow'},
     {id:'font_size'         ,description:'font size'       ,default_:MIN_WIDTH.toString()                },
     {id:'bg_color'          ,description:'background color',default_:DEFAULT_BG_COLOR    ,negDependency:'theme'},
     {id:'bg_image'          ,description:'background image',default_:DEFAULT_BG_IMAGE    ,negDependency:'theme',placeholder:'image url'},
     {id:'color_icon'        ,description:'icon color'      ,default_:DEFAULT_ICOL                        },
     {id:'show_seconds_title',description:'seconds in title',default_:false                               },
     {id:'show_seconds'      ,description:'seconds'         ,default_:true                                },
     {id:'12_hour'           ,description:'12-hour'         ,default_:DEFAULT_12HOUR                      },
     {id:'show_pm'           ,description:'am/pm'           ,default_:true                ,dependency:'12_hour'          },
     {id:'show_date'         ,description:'date'            ,default_:true                                               },
     {id:'show_week'         ,description:'week'            ,default_:false               ,dependency:'show_date'        }
   ];

    getOpt=function(id) {
      for(var i=0;i<opts.length;i++) {
        var opt = opts[i];
        if (opt.id === id) {
          return opt.default_;
        }
      }
    };

    var loadClockFont;
    (function() {
    //{{{
      var bodyFontLoader;
      loadClockFont=function(_force){
        let resolve;
        const promise = new Promise(r => resolve = r);
        if(bodyFontLoader) {
          bodyFontLoader(_force, () => {resolve()});
        } else {
          resolve();
        }
        return promise;
      };
      setTimeout(function loadFontApi(){
        ml.loadASAP('https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js',function(){
          if(!window['WebFont']||!window['WebFont']['load']) {
            setTimeout(loadFontApi,2000);
            return;
          }
          function fontLoader(fontName,callback){
            if( !fontName ){
              return;
            }
            var attempts=0;
            (function do_(){
              window['WebFont']['load']({'google':{'families':[fontName]},
                                         'fontactive':callback,
                                         'fontinactive':function(){setTimeout(do_,Math.max(Math.pow(2,attempts++)*1000,60000))}
                                       });
            })();
          }
          bodyFontLoader=function(_force, callback){
            var fontName = getOpt('clock_font');
            fontLoader(fontName,function(){
              if( _force || fontName===getOpt('clock_font') && document.body.style.fontFamily!==fontName ){
                document.body.style.fontFamily=fontName;
                setSize(true);
              }
              callback();
            })
          };
          loadClockFont().then(() => {
            console.log("load-progress", "clock font loaded");
            resolveAwaitClockFont();
          });
        });
      },0);
    //}}}
    })();

    //refresh options onchange
    //{{{
    (function(){
        const bg_color_val = getOpt('bg_color');
        setBackground(bg_color_val);
        document.documentElement.style.color=getOpt('color_font' )
    })();
    //}}}
  //}}}
  })();

  /* TIME */
  var domBeat;
  var spark;
  (function(){
  //{{{
    var content = document.getElementById('content');
    var digit1  = document.getElementById('digit1');
    var digit2  = document.getElementById('digit2');

    var lastMinutes,
        lastTitle,
        lastDay,
        lastTime;
    domBeat=function(force)
    //{{{
    {
      var d= new Date();

      var title = ml.date.readable.getHours(d,getOpt('12_hour')) + ":" + ml.date.readable.getMinutes(d) + (getOpt('show_seconds_title')?":"+ml.date.readable.getSeconds(d):"");
      if(lastTitle===undefined || lastTitle!==title || force)
      {
        lastTitle      = title;
        document.title = title;
      }

      var minutes = ml.date.readable.getMinutes(new Date);
      if(!lastMinutes || lastMinutes!==minutes || force)
      {
        lastMinutes=minutes;
        ml.changeIcon(ml.timeIcon(undefined,getOpt('color_icon'),getOpt('12_hour')));
      }

      ml.reqFrame(function(){
        var refreshSize;

        document.body['classList'][d.getHours()<12?'remove':'add']('isPm');

        var seconds = ml.date.readable.getSeconds(d);

        digit1.innerHTML=seconds[0];
        digit2.innerHTML=seconds[1];
        //screenshot
        //digit1.innerHTML=0;
        //digit2.innerHTML=0;

        var newTime = ml.date.readable.getHours(d,getOpt('12_hour')) + ":" + ml.date.readable.getMinutes(d);
      //var newTime = "&nbsp; 01:37 PM &nbsp;";
        if(lastTime===undefined || lastTime!==newTime || force)
        {
          lastTime         = newTime;
          timeEl.innerHTML = newTime;
          //screenshot
          //timeEl.innerHTML = '01:37';
          refreshSize = true;
        }

        var day = d.getDay();
        if(!lastDay || lastDay!==day || force){
          lastDay=day;
          dateEl.innerHTML = getOpt('show_date')?(ml.date.readable.getDay(d)   + " - " + ml.date.readable.getMonth(d) + " "+ ml.date.readable.getDate(d) + (getOpt('show_week')?" - Week " + ml.date.getWeek(d):"")):"";
          //screenshot
          //dateEl.innerHTML = "Thursday - January 01";
          refreshSize = true;
        }
        if(refreshSize) setSize();
      });

      //metroTile&&metroTile(lastTime,lastDay);
    };
    //}}}

    var sparked;
    spark=function() {
      ml.assert(!sparked);
      sparked=true;
      (function repeater(){
        domBeat();
        window.setTimeout(repeater,1000);
      })();
    };
  //}}}
  })();

  spark();

  await Promise.race([awaitClockFont, sleep(0.4)]);
};

function sleep(seconds) {
  return new Promise(resolve => setTimeout(resolve, seconds*1000));
}
