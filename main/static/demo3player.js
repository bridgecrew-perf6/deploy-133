// $(function() {
// 	var boxTop = $('.container').offset().top + ($('.container').innerHeight()/2);
// 	setInterval(function(){
// 			// console.clear();
// 		$('.marquee img').each(function(index, el) {
// 			var imgTop = $(this).offset().top + ($(this).innerHeight()/2);
// 			var boxBg = $(this).attr('data-bgcolor');
// 			// console.log(boxTop, imgTop, imgId);
// 			if(imgTop <= boxTop){
// 				$('.container').css('background-color', boxBg);
// 			}
// 		});
// 	}, 100);
// });
let image_links;
const song = document.querySelector('#song');
const progressBar = document.querySelector('#outside'); // element where progress bar appears    
// progressBar.value is audio.currentTime
const outside = document.getElementById('outside');
const inside = document.getElementById('inside');
let pPause = document.querySelector('#play-pause'); // element where play and pause image appears
let caption_all = {};
let currentCaptionIndex;
let currentImageKeyword = "";
let playing = true;
let reco_event;
let reco_loadCap, reco_updateCap;
var service_url = 'https://kgsearch.googleapis.com/v1/entities:search';

function playPause() {
    if (playing) {
        reco_event = setInterval(updateImage, 15000);
        reco_loadCap = setInterval(function(){loadCaption("next")}, 49000);
        reco_updateCap = setInterval(updateCaption, 100);
        // const song = document.querySelector('#song')
        // thumbnail = document.querySelector('#thumbnail');
        $("#play-pause").removeClass('fa-play-circle').addClass('fa-pause-circle');
        // thumbnail.style.transform = "scale(1.15)";
        
        song.play();
        playing = false;
    } else {
        clearInterval(reco_event)
        clearInterval(reco_loadCap)
        clearInterval(reco_updateCap)
        $("#play-pause").removeClass('fa-pause-circle').addClass('fa-play-circle');
        // thumbnail.style.transform = "scale(1)"
        
        song.pause();
        playing = true;
    }
}

function updateProgressValue() {
    progressBar.max = song.duration;
    progressBar.value = song.currentTime;
    // $('#inside').css("width", String(Math.floor((progressBar.value/progressBar.max)*100)) + "%");
    // inside.style.width = String(Math.floor((progressBar.value/progressBar.max)*100)) + "%";
    $('#pgbar').val(Math.floor((progressBar.value/progressBar.max)*100));
    $('#pgbar').css("--val", Math.floor((progressBar.value/progressBar.max)*100));
    document.querySelector('.currentTime').innerHTML = (formatTime(Math.floor(song.currentTime)));
    if (document.querySelector('.durationTime').innerHTML === "NaN:NaN") {
        document.querySelector('.durationTime').innerHTML = "0:00";
    } else {
        document.querySelector('.durationTime').innerHTML = (formatTime(Math.floor(song.duration)));
    }
};

function formatTime(seconds) {
    let min = Math.floor((seconds / 60));
    let sec = Math.floor(seconds - (min * 60));
    if (sec < 10){ 
        sec  = `0${sec}`;
    };
    return `${min}:${sec}`;
};

function loadCaption(time) {
  // console.log(time + " load " + song.currentTime);
  
  if(time == "next"){
    axios.get('http://localhost:5000/episode/' + window.location.pathname.split("/")[2] + "/caption/" + (Math.floor(song.currentTime/60)+1)).then((res) => {
        console.log(res.data);
        caption_all = {...caption_all, ...res.data};
        if(caption_all != null){
          $('#onload').fadeOut();
          $('body').removeClass('hidden');
        }
    });
  } else if (time == "now") {
    axios.get('http://localhost:5000/episode/' + window.location.pathname.split("/")[2] + "/caption/" + Math.floor(song.currentTime/60)).then((res) => {
        console.log(res.data);
        caption_all = {...caption_all, ...res.data};
        if(caption_all != null){
          $('#onload').fadeOut();
          $('body').removeClass('hidden');
        }
    });
  }
}

let lastCaption = "";
function updateCaption() {
  // check every 0.1 sec before until 0.2
  for(let i = 0; i < 0.2; i += 0.1){
    
    let time = (Math.round((song.currentTime+i)*10)/10).toFixed(3);
    if(time == Math.floor(time)) time = Math.floor(time);
    
    if(caption_all[time] != null) {
      // check caption found
      if(caption_all[time] == lastCaption) break;
      else lastCaption = caption_all[time];
      // find all match keyword
      let captionHTML = createCaptionHTML(caption_all[time]);
      // update caption
      document.getElementById("caption").innerHTML = captionHTML;
      // find caption then break
      break;
    }
  }
}

function createCaptionHTML(captionHTML) {
  if(captionHTML == "") return "";

  // age current tags
  // ageCurrentTags();

  // get future tags
  // let tags = getFutureTags();

  // get all tags
  let tags = getAllTags();

  let green = "#56ac2f";
  let red = "#da3c36";
  let keywords = [currentImageKeyword, ...tags];

  // tag highlight
  keywords.forEach(function(item, index, array){
    
    let lowerCaption = captionHTML.toLowerCase();
    let pos = lowerCaption.indexOf(item.toLowerCase());
    
    // determine color by keyword part
    if(index == 0) color = green;
    else color = red;

    // change every keyword and not colored
    if(pos != -1 && captionHTML[pos-1] != ">"){
      let keywordLength = item.length;

      let start = captionHTML[pos-1];
      let end = captionHTML[pos+keywordLength];

      // keyword not in other word
      if((pos == 0 || start == " ") && (end == " " || end == "." || end == ",")){
        // make "future" tag "current"
        // ageFutureTag(item);

        // color the keyword
        captionHTML = captionHTML.slice(0, pos) 
                    + "<span style='color:"+color+"'>"
                    + captionHTML.slice(pos, pos+keywordLength) 
                    + "</span>"
                    + captionHTML.slice(pos+keywordLength);

        // // find next match
        // lowerCaption = captionHTML.toLowerCase();
        // // 35 is length of "<span>...</span>"
        // pos = lowerCaption.indexOf(item.toLowerCase(), pos+35);
      }
    }
  });

  return captionHTML;
}

function getAllTags() {
  let tags = [];

  document.querySelectorAll('[data-toggle="tooltip"]').forEach(function(item, index, array){
    tags.push(item.innerText);
  });

  return tags;
}

function getFutureTags() {
  let tags = [];

  document.querySelectorAll('[class="btn btn-success btn-xs kw-tag list-complete-item tag-style3"]').forEach(function(item, index, array){
    tags.push(item.innerText);
  });

  return tags;
}

function ageCurrentTags() {
  document.querySelectorAll('[class="btn btn-success btn-xs kw-tag list-complete-item tag-style1"]').forEach(function(item, index, array){
    item.className = "btn btn-success btn-xs kw-tag list-complete-item tag-style2";
  });
}

function ageFutureTag(keyword) {
  document.querySelectorAll('[class="btn btn-success btn-xs kw-tag list-complete-item tag-style3"]').forEach(function(item, index, array){
    if(item.innerText == keyword) item.className = "btn btn-success btn-xs kw-tag list-complete-item tag-style1";
  });
}

// do when load page
$(document).ready(function() {
	$('.marquee1').css('visibility', 'hidden');
  
  // place this within dom ready function
  function showmarquee1() {     
  	$('.marquee1').css('visibility', 'visible');
  }
  
  $(function () {
    $('[data-toggle="tooltip"]').tooltip({
      animated: 'fade',
      placement: 'top',
      html: true
    });
  })
 
  progressBar.value = 0;
  // use setTimeout() to execute
  // if($("#poster").attr("src")===null){
  setTimeout(showmarquee1, 19000);
  setInterval(updateProgressValue, 500);
  updateImage();
  loadCaption("now");
  updateCaption();
  //  setTimeout(showmarquee1, 13000)
  // }
});

outside.addEventListener('click', function(e) {
    var pct = e.offsetX / outside.offsetWidth;
    progressBar.value=pct*song.duration
    song.currentTime = progressBar.value;
    // $('#inside').css('width', e.offsetX + "px");
    // inside.style.width = e.offsetX + "px";
    changeProgressBar();
    loadCaption("now");
    // calculate the %  
    // inside.innerHTML = pct + " %";
  }, false);

function updateImage() {
  axios.get('http://localhost:5000/recommend_image/'+window.location.pathname.split("/")[2]+'/'+progressBar.value+'/')
  .then((res) => {
    console.log(res);
    image_links=res;
    
    tags_generator.growup()
    tags_generator.addInput([
      image_links.data.result[0][image_links.data.result[0].length-4][0],
      "",
      undefined,
      "btn btn-success btn-xs kw-tag list-complete-item tag-style1"
    ]);
    check_complete = 0

    $.each(image_links.data.result[0].slice(0,-4), function(t, item){
      if(tags_generator.exist_key.includes(item[0])){
      let duindex = tags_generator.exist_key.indexOf(item[0])
      tags_generator.inputs.splice(duindex,1)
      tags_generator.exist_key.splice(duindex,1)
      tags_generator.age.splice(duindex,1)  
      }
    });
    $.each(image_links.data.result[1], function(t, item){
      if(tags_generator.exist_key.includes(item[0])){
      let duindex = tags_generator.exist_key.indexOf(item[0])
      tags_generator.inputs.splice(duindex,1)
      tags_generator.exist_key.splice(duindex,1)
      tags_generator.age.splice(duindex,1)  
      }
    });

    while(tags_generator.exist_key.join('').length+image_links.data.result[2]>260){
          tags_generator.removeTags()
    }

    $.each(image_links.data.result[0].slice(0,-4), function(t, item){

      var params = {
        'query': item[0],
        'limit': 1,
        'indent': true,
        'key' : 'AIzaSyB5UtPW_MpxtKb6HwF9cxDxEUflDqX4Wyk',
      };
      // tags_generator.removeIfMax()
      $.getJSON(service_url + '?callback=?', params, function(response) {
        if(0 || response.itemListElement.length == 0 || ((parseInt(response.itemListElement[0]['resultScore'],10)<10000)&&(response.itemListElement[0]['result']['name'].toLowerCase()!=item[0].toLowerCase()))){
          tags_generator.addInput([item[0],"",undefined,"btn btn-success btn-xs kw-tag list-complete-item tag-style1"]);
        } else {
          $.each(response.itemListElement, function(i, element) {
            var name = element['result']['name'];
            var des = "";
            var url = "";
            if(typeof element['result']['description'] === 'undefined') {
                  if(typeof element['result']['detailedDescription'] === 'undefined') {
                  }
                  else{
                  des = element['result']['detailedDescription']['articleBody'];
                  }
            } else {
              des = element['result']['description'];
            }
            url = element['result']['url'];
            tags_generator.addInput([item[0],"["+name+"]"+des,url,"btn btn-success btn-xs kw-tag list-complete-item tag-style1"]);
            $(function () {
              $('[data-toggle="tooltip"]').tooltip({
                animated: 'fade',
                placement: 'top',
                html: true
              });
            });
          });

        }
        check_complete+=1
        if(check_complete===image_links.data.result[0].length-4){
          $.each(image_links.data.result[1], function(t, item){
            tags_generator.addInput([item[0],"",undefined,"btn btn-success btn-xs kw-tag list-complete-item tag-style3"]);
          })
        }
      });
    });

    if(image_links.data.result[0].length == 4){
      $.each(image_links.data.result[1], function(t, item){          
        tags_generator.addInput([item[0],"",undefined,"btn btn-success btn-xs kw-tag list-complete-item tag-style3"]);
      })
    }


    // tags_generator.removeIfMax()



    $(function () {
      $('[data-toggle="tooltip"]').tooltip({
        animated: 'fade',
        placement: 'top',
        html: true
        });
    });

    $("#image1").attr("src",image_links.data.result[0][0][1][0]).attr("title",image_links.data.result[0][0][0])
    $("#image2").attr("src",image_links.data.result[0][1][1][0]).attr("title",image_links.data.result[0][1][0])
    $("#image3").attr("src",image_links.data.result[0][2][1][0]).attr("title",image_links.data.result[0][2][0])
    $("#image4").attr("src",image_links.data.result[0][3][1][0]).attr("title",image_links.data.result[0][3][0])
    $("#image5").attr("src",image_links.data.result[0][0][1][1]).attr("title",image_links.data.result[0][0][0])
    $("#image6").attr("src",image_links.data.result[0][1][1][1]).attr("title",image_links.data.result[0][1][0])
    $("#image7").attr("src",image_links.data.result[0][2][1][1]).attr("title",image_links.data.result[0][2][0])
    $("#image8").attr("src",image_links.data.result[0][3][1][1]).attr("title",image_links.data.result[0][3][0])
    $("#image9").attr("src",image_links.data.result[0][0][1][2]).attr("title",image_links.data.result[0][0][0])
    $("#image10").attr("src",image_links.data.result[0][1][1][2]).attr("title",image_links.data.result[0][1][0])
    $("#image11").attr("src",image_links.data.result[0][2][1][2]).attr("title",image_links.data.result[0][2][0])
    $("#image12").attr("src",image_links.data.result[0][3][1][2]).attr("title",image_links.data.result[0][3][0])
    $("#image13").attr("src",image_links.data.result[0][0][1][3]).attr("title",image_links.data.result[0][0][0])
    $("#image14").attr("src",image_links.data.result[0][1][1][3]).attr("title",image_links.data.result[0][1][0])
    $("#image15").attr("src",image_links.data.result[0][2][1][3]).attr("title",image_links.data.result[0][2][0])
    $("#image16").attr("src",image_links.data.result[0][3][1][3]).attr("title",image_links.data.result[0][3][0]) 

  });
};


function changeProgressBar() {
  axios.get('http://localhost:5000/recommend_image/'+window.location.pathname.split("/")[2]+'/'+song.currentTime+'/')
  .then((res) => {
    console.log(res);
    image_links=res;
    // tags_generator.inputs=[]
    // tags_generator.exist_key=[]
    tags_generator.growup()
    tags_generator.addInput([
      image_links.data.result[0][image_links.data.result[0].length-4][0],
      "",
      undefined,
      "btn btn-success btn-xs kw-tag list-complete-item tag-style1"
    ]);
    check_complete=0

    $.each(image_links.data.result[0].slice(0,-4), function(t, item){
      if(tags_generator.exist_key.includes(item[0])){
      let duindex = tags_generator.exist_key.indexOf(item[0])
      tags_generator.inputs.splice(duindex,1)
      tags_generator.exist_key.splice(duindex,1)
      tags_generator.age.splice(duindex,1)  
      }
    });
    $.each(image_links.data.result[1], function(t, item){
      if(tags_generator.exist_key.includes(item[0])){
      let duindex = tags_generator.exist_key.indexOf(item[0])
      tags_generator.inputs.splice(duindex,1)
      tags_generator.exist_key.splice(duindex,1)
      tags_generator.age.splice(duindex,1)  
      }
    });
    while(tags_generator.exist_key.join('').length+image_links.data.result[2]>260){
          tags_generator.removeTags()
    }    
    $.each(image_links.data.result[0].slice(0,-4), function(t, item){ //.slice(0,-4)   
      var params = {
        'query': item[0],
        'limit': 1,
        'indent': true,
        'key' : 'AIzaSyB5UtPW_MpxtKb6HwF9cxDxEUflDqX4Wyk',
      };
      // tags_generator.removeIfMax()
      $.getJSON(service_url + '?callback=?', params, function(response) {
        if(response.itemListElement.length==0||((parseInt(response.itemListElement[0]['resultScore'],10)<10000)&&(response.itemListElement[0]['result']['name'].toLowerCase()!=item[0].toLowerCase()))){
          tags_generator.addInput([item[0],"",undefined,"btn btn-success btn-xs kw-tag list-complete-item tag-style1"]);
        } else {
          $.each(response.itemListElement, function(i, element) {
            var name=element['result']['name']
            var des=""
            var url=""
            if(typeof element['result']['description'] === 'undefined') {
                  if(typeof element['result']['detailedDescription'] === 'undefined') {
                  }
                  else{
                  des = element['result']['detailedDescription']['articleBody'];
                  }
            } else {
              des=element['result']['description']
            }
            url=element['result']['url']
            tags_generator.addInput([item[0],"["+name+"]"+des,url,"btn btn-success btn-xs kw-tag list-complete-item tag-style1"]);
            $(function () {
              $('[data-toggle="tooltip"]').tooltip({
                animated: 'fade',
                placement: 'top',
                html: true
              })
            })
          });
        }
        check_complete+=1
        if(check_complete===image_links.data.result[0].length-4){
          $.each(image_links.data.result[1], function(t, item){
            tags_generator.addInput([item[0],"",undefined,"btn btn-success btn-xs kw-tag list-complete-item tag-style3"]);
          })
        }
      });
    });
    if(image_links.data.result[0].length-4==0){
       $.each(image_links.data.result[1], function(t, item){          
        tags_generator.addInput([item[0],"",undefined,"btn btn-success btn-xs kw-tag list-complete-item tag-style3"]);          
      })
    }
    
    $(function () {
      $('[data-toggle="tooltip"]').tooltip({
        animated: 'fade',
        placement: 'top',
        html: true
      });
    });

    $("#image1").attr("src",image_links.data.result[0][0][1][0]).attr("title",image_links.data.result[0][0][0])
    $("#image2").attr("src",image_links.data.result[0][1][1][0]).attr("title",image_links.data.result[0][1][0])
    $("#image3").attr("src",image_links.data.result[0][2][1][0]).attr("title",image_links.data.result[0][2][0])
    $("#image4").attr("src",image_links.data.result[0][3][1][0]).attr("title",image_links.data.result[0][3][0])
    $("#image5").attr("src",image_links.data.result[0][0][1][1]).attr("title",image_links.data.result[0][0][0])
    $("#image6").attr("src",image_links.data.result[0][1][1][1]).attr("title",image_links.data.result[0][1][0])
    $("#image7").attr("src",image_links.data.result[0][2][1][1]).attr("title",image_links.data.result[0][2][0])
    $("#image8").attr("src",image_links.data.result[0][3][1][1]).attr("title",image_links.data.result[0][3][0])
    $("#image9").attr("src",image_links.data.result[0][0][1][2]).attr("title",image_links.data.result[0][0][0])
    $("#image10").attr("src",image_links.data.result[0][1][1][2]).attr("title",image_links.data.result[0][1][0])
    $("#image11").attr("src",image_links.data.result[0][2][1][2]).attr("title",image_links.data.result[0][2][0])
    $("#image12").attr("src",image_links.data.result[0][3][1][2]).attr("title",image_links.data.result[0][3][0])
    $("#image13").attr("src",image_links.data.result[0][0][1][3]).attr("title",image_links.data.result[0][0][0])
    $("#image14").attr("src",image_links.data.result[0][1][1][3]).attr("title",image_links.data.result[0][1][0])
    $("#image15").attr("src",image_links.data.result[0][2][1][3]).attr("title",image_links.data.result[0][2][0])
    $("#image16").attr("src",image_links.data.result[0][3][1][3]).attr("title",image_links.data.result[0][3][0]) 
  });
//   axios.get('http://localhost:5000/recommend_summary/'+window.location.pathname.split("/")[2]+'/'+song.currentTime+'/')
//   .then((res) => {
//     console.log(res);
//     $("#summary").text(res.data.result);
// });
};

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

// document.addEventListener("DOMContentLoaded", function(event) {
//    document.querySelectorAll('img').forEach(function(img){
//     var count1=getRandomInt(4);
//     var count2=getRandomInt(4);
//     console.log(image_links)
//     img.onerror = function(){this.src=image_links.data.result[count1][1][count2]};
//    })
// });

$('img').on("error", function() {
  var count1=getRandomInt(4);
  var count2=getRandomInt(4);
  $(this).attr('src', image_links.data.result[0][count1][1][count2]);
});

$(".left-marquee").hover(function(){
    $(".left-marquee").css("animation-play-state","paused");
    },function(){
    $(".left-marquee").css("animation-play-state","running");
});
$(".right-marquee").hover(function(){
    $(".right-marquee").css("animation-play-state","paused");
    },function(){
    $(".right-marquee").css("animation-play-state","running");
});


var tags_generator = new Vue({
  delimiters: ['%%%', '%%%'],
  el: '#kw-vue',
  name: 'Adding kw-tags',
  data() {
    return {
      inputs: [],
      exist_key: [],
      age: []
    }
  },
  methods: {
    addInput(e) {
      // // tag made of words
      // if(e[0].indexOf(" ") != -1 && e[1] == ""){
      //   for(i = 0; i < e[0].split(" ").length; i++) {
      //     this.addInput([
      //       e[0].split(" ")[i],
      //       e[1],
      //       e[2],
      //       e[3]
      //     ]);
      //   }
      // }
      // // tag not exist
      // else 
      if(!(this.exist_key.includes(e[0]))){
        this.age.push(1)
        this.inputs.push(e)
        this.exist_key.push(e[0])
      }
      // tag exist 
      else {
	      let duindex = this.exist_key.indexOf(e[0])
	      this.inputs.splice(duindex,1)
	      this.exist_key.splice(duindex,1)
	      this.age.splice(duindex,1)	
	      this.addInput(e)
	    }
    },
    removeTags(){
        this.inputs.shift()
        this.exist_key.shift()
        this.age.shift()
    },
    growup(){
        this.age.forEach(function(item, index, array){
          array[index] = item + 1;
        });
    }
    // removeIfMax(){
    //     while(this.exist_key.join('').length>85){
    //         this.removeTags()
    //     }
    // }
  },
  computed: {
    buttonText() {
      return this.showInput ? 'Hide input' : 'Show input'
    }
  },
  watch: {
    exist_key(){
        while(this.exist_key.join('').length>260){
            this.removeTags()
        }
    },
    age(){
      var that=this.inputs
      this.age.forEach(function(item, index, array){
        if(item>=2){
          //round2
          // console.log("2")
          that[index][3]="btn btn-success btn-xs kw-tag list-complete-item tag-style2"
        }
        // else if(item>=3){
        //   //round3
        //   // console.log("3")
        //   that[index][3]="btn btn-success btn-xs kw-tag list-complete-item tag-style3"
        // }
      });
    }
  }
})

function showIframe() {
  /* Parent element */
  var widget = document.createElement("div");
  widget.style.position="fixed";
  widget.style.top="100px";
  widget.style.left="100px";
  widget.style.width="800px";
  widget.style.height="600px";

  /* picture uploading page frame */
  var iframe = document.createElement("iframe");
  iframe.src = "https://www.itread01.com/content/1542414730.html"; // use your picture upload URL here

  /* Add to document */
  widget.appendChild(iframe);
  document.body.appendChild(widget);
}

$('.slideshow').each(function () {

  let slideImgs = $(this).find('img');
  let slideImgsCount = slideImgs.length;
  let currentIndex = 0;

  slideImgs.eq(currentIndex).fadeIn();

  setInterval(showNextSlide, 5000);

  function showNextSlide() {
    let nextIndex = (currentIndex + 1) % slideImgsCount;
    $(".background-image").fadeOut();
    slideImgs.eq(currentIndex).fadeOut(600);
    
    $('.background-image').css("background-image", "url('"+slideImgs.eq(nextIndex).attr('src')+"')");
    
    currentImageKeyword = slideImgs.eq(nextIndex).attr("title");
    document.getElementById("currentKeyword").innerHTML = currentImageKeyword;

    $('.background-image').fadeIn();
    slideImgs.eq(nextIndex).fadeIn();
    currentIndex = nextIndex;

    // find all match keyword in caption
    let captionHTML = createCaptionHTML(document.getElementById("caption").innerHTML);
    // replace caption
    document.getElementById("caption").innerHTML = captionHTML;
  }
})



// 拉音樂框框
const _R = document.querySelector('[type=range]');

document.documentElement.classList.add('js');

_R.addEventListener('input', e => {
  _R.style.setProperty('--val', +_R.value);
}, false);
