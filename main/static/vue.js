Vue.use(VueInstantSearch);

window['vue-js-toggle-button'].default.install(Vue);

var app = new Vue({
    el: '#app',
    delimiters: ["[[", "]]"],
    data: {
        searchClient: instantMeiliSearch(
            //'http://localhost:7700',
            'http://3.143.173.120/',
            ''
        ),
        title: "SPODify",
        firstclick: false,
        // auto load more params
        scrollTop: 0,
        scrollHeight: 0,
        offsetHeight: 0,
        scrollHitsBottom: false,
        // random initial page (1~7)
        initialUiState: {
            podcast: {
                page: Math.floor(Math.random()*7)
            }
        },
        // scroll infiniteHits to top when searching
        searchFunction: function (helper) {
            helper.search();
        },
        // focus and preview
        focus: null, 
        preview: null,
        fade: null,
        focusAudio: null,
        fadeAudio: null,
        // change episode by key
        nextEpisode: null,
        lastEpisode: null,
        lock: false, key: false,
        timer: 0,
        // player
        playing: false,
        // 'up', 'down', 'off', 'mute'
        volume: "off",
        currentTime: 0,
        renderTime: "0:30",
        // roundslider
        sliderValue: 0,
        // toggle button
        darkmode: false,
        color: "#FCF7F4",
        lightBackground: "#FCF7F4",
        lightItem: "#FFFFFF",
        lightText: "#da3c36",
        darkBackground: "#434343af",
        darkBar: "#1b1b1b",
        darkItem: "#727272",
        darkText: "#FFFFFF",
        black: "#000000"
    },
    watch: {
        // change params to do first click animations
        firstclick: function(val) {
            if(this.firstclick){
                this.addScrolltoInfiniteHits();
                this.scrolltoTop();
            }
        },
        lock: function(val) {},
        // when episode hover
        focus: function(newF, oldF) {
            if(!this.preview) {
                this.fade = null;
                this.nextEpisode = null;
                this.lastEpisode = null;
            }
        },
        preview: function(newP, oldP) {
            // episode fade 
            if(!this.focus && !newP && oldP) {
                this.fade = oldP;
                this.stopAudio(oldP);
            }
            // episode preview (clicked)
            else if(newP) {
                this.getNextEpisode(newP, false);
                this.getLastEpisode(newP, false);
                this.loadAudio(newP);
                this.volumeChange(newP, this.volume);
                if (!this.key) {
                    this.previewScroll(newP, false, 250);
                } else this.key = false;
            }
        },
        // when mouse leave
        fade: function(newF, oldF) {
            if(!oldF && newF){
                this.fadeScroll(newF, false);
            }
        },
        nextEpisode: function(val) {},
        lastEpisode: function(val) {},
        scrollHitsBottom: function(newS, oldS) {
            if(newS) this.loadMore();
        },
        currentTime: function(val) {},
        focusAudio: function(val) {},
        fadeAudio: function(val) {},
        sliderValue: function(val) {}
    },
    methods: {
        // add scroll eventlistener to infiniteHits
        addScrolltoInfiniteHits() {
            this.$refs.infiniteHits.$el.addEventListener("scroll", this.scrollUpdate);
        },
        // auto load on infiniteHits
        scrollUpdate() {
            // update scrollTop when scroll
            this.scrollTop = this.$refs.infiniteHits.$el.scrollTop;
            this.scrollHeight = this.$refs.infiniteHits.$el.scrollHeight;
            this.offsetHeight = this.$refs.infiniteHits.$el.offsetHeight;
            // detect scroll hits bottom
            if(this.scrollTop + this.offsetHeight >= this.scrollHeight) this.scrollHitsBottom = true;
            else this.scrollHitsBottom = false;
        },
        // load more hits by infiniteHits
        loadMore() {
            if(this.scrollHitsBottom) this.$refs.infiniteHits.refineNext();
        },
        scrolltoTop() {
            this.$refs.infiniteHits.$el.scrollTop = 0;
        },
        scrollPage(dir) {
            if(dir == "next")      this.$refs.infiniteHits.$el.scrollTop += 900;
            else if(dir == 'last') this.$refs.infiniteHits.$el.scrollTop -= 900;
        },
        // get last episode uri
        getLastEpisode(episode_uri, force) {
            if(!this.lock || force)
            this.lastEpisode = this.$refs[episode_uri][0].previousSibling.id;
        },
        // get next episode uri
        getNextEpisode(episode_uri, force) {
            if(!this.lock || force)
            this.nextEpisode = this.$refs[episode_uri][0].nextSibling.id;
        },
        // scroll to target episode at preview
        previewScroll(episode_uri, force, num) {
            if(!this.lock || force) 
                this.$refs.infiniteHits.$el.scrollTop = this.$refs[episode_uri][0].offsetTop - num;
        },
        // scroll to target episode at fade
        fadeScroll(episode_uri, force) {
            if(!this.lock || force)
                this.$refs.infiniteHits.$el.scrollTop = this.$refs[episode_uri][0].offsetTop - 900;
        },
        fadeEpisode(uri) {
            this.$refs[uri][0].classList.add("fadeEpisode");
            this.$refs[uri+'poster'][0].classList.add("fadePoster");
            this.$refs[uri+'showname'][0].classList.add("fadeShowname");
            this.$refs[uri+'publisher'][0].classList.add("fadePublisher");
            this.$refs[uri+'episodename'][0].classList.add("fadeEpisodeName");
        },
        openEpisode(uri) {
            this.$refs[uri][0].classList.add("previewEpisode");
            this.$refs[uri+'poster'][0].classList.add("previewPoster");
            this.$refs[uri+'showname'][0].classList.add("previewShowname");
            this.$refs[uri+'publisher'][0].classList.add("previewPublisher");
            this.$refs[uri+'episodename'][0].classList.add("previewEpisodeName");
            this.$refs[uri+'description'][0].classList.add("previewDescription");
        },
        // focus and preview next episode
        previewEpisode(way) {
            this.key = true;
            if(!this.getLastEpisode && way =="last") return;
            if(!this.getNextEpisode && way =="next") return;
            this.lock = true;
            // fade current episode
            this.fadeEpisode(this.focus);
            // preview next episode
            if(way == "next"){
                this.openEpisode(this.nextEpisode);
                // preview scroll force
                this.previewScroll(this.nextEpisode, true, 1000);
                // set css animate timer
                this.timer = setTimeout(() => {
                    this.preview = this.focus;
                    this.lock = false;
                }, 300);
            }
            else if (way == "last") {
                this.openEpisode(this.lastEpisode);
                // preview scroll force
                this.previewScroll(this.lastEpisode, true, 250);
                // set css animate timer
                this.timer = setTimeout(() => {
                    this.preview = this.focus;
                    this.lock = false;
                }, 300);
            }
        },
        loadAudio(uri) {
            this.$refs[uri+'audio'].currentTime = 0;
            this.currentTime = 0;
            this.updateTime(uri);
        },
        playAudio(uri) {
            // play audio
            this.$refs[uri+'audio'][0].play();
            this.playing = true;
        },
        stopAudio(uri) {
            this.$refs[uri+'audio'][0].pause();
            this.playing = false;
        },
        volumeChange(uri, volume) {
            this.volume = volume;
            if(volume == "up")
                this.$refs[uri+'audio'][0].volume = 1;
            else if(volume == "down")
                this.$refs[uri+'audio'][0].volume = 0.6;
            else if(volume == "off")
                this.$refs[uri+'audio'][0].volume = 0.3;
            else if(volume == "mute")
                this.$refs[uri+'audio'][0].volume = 0;
        },
        updateTime(uri) {
            this.currentTime = Math.round(this.$refs[uri+'audio'][0].currentTime*10)/10;
            this.renderTime = "0:" + ('00'+(30-Math.round(this.currentTime))).slice(-2);
            this.sliderValue = this.currentTime*100/30;
            // change icon to stop when audio ends
            if(this.$refs[uri+'audio'][0].ended) {
                this.stopAudio(uri);
                this.$refs[uri+'audio'].currentTime = 0;
                this.currentTime = 0;
                this.renderTime = "0:30";
                this.sliderValue = 0;
            }
        },
        timeChange(uri, sec) {
            this.$refs[uri+'audio'][0].currentTime += sec;
            this.updateTime(uri);
        }
    },
    // any keyup will scroll infiniteHits to top
    mounted() {
        window.addEventListener('keyup', (event) => {
            if (event.code == "ArrowLeft"){
                if(this.preview) this.previewEpisode("last");
                else this.scrollPage("last");
            }
            else if (event.code == "ArrowRight"){
                if(this.preview) this.previewEpisode("next");
                else this.scrollPage("next");
            }
            else if (event.code == "ArrowUp"); //console.log("RIGHT");
            else if (event.code == "ArrowDown"); //console.log("RIGHT");
            // other keys
            else this.scrolltoTop();
        })
    }
}); 
