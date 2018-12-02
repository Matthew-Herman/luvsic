// Vue initialized with cdn script in layout.hbs
// Components must be registered before DOM loaded :)
Vue.component('sample', {
  props: {
    username: String,
    user: String,
    name: String,
    instruments: String,
    description: String,
    imageid: String,
    soundid: String,
    dateUploaded: String,
    numdownloads: String
  },
  data: function () {
    return {
      local_numdownloads: this.numdownloads
    };
  },
  methods: {
    updatenumdownloads: function () {
      console.log('downloadclick');
      fetch('/api/download?soundname=' + this.name)
        .then((response) => {
          return response.json(); // turns response into js from json
        })
        .then((response) => {
          this.local_numdownloads = (parseInt(this.local_numdownloads, 10)+1)+"";
        })
        .catch(error => console.error('Error:', error));
    }
  },
  template: `
  <div class="sample">
    <sampleImageContainer v-bind:imageid="imageid">
    </sampleImageContainer>
    <sampleText
      v-bind:user="user"
      v-bind:name="name"
      v-bind:instruments="instruments"
      v-bind:description="description"
      v-bind:soundid="soundid"
      v-bind:dateUploaded="dateUploaded"
      v-bind:numdownloads="local_numdownloads"
      v-bind:username="username"
      v-on:play="$emit('play', {'currname': name, 'soundid': soundid})"
      v-on:downloadclick="updatenumdownloads"
    >
    </sampleText>
  </div>`
});

Vue.component('sampleImageContainer', {
  props: {
    imageid: String
  },
  data: function () {
    return {
    };
  },
  template: `
  <div class="sampleImageContainer">
    <img v-bind:src="'/img/'+imageid">
  </div>
  `
});

Vue.component('sampleText', {
  props: {
    username: String,
    user: String,
    name: String,
    instruments: String,
    description: String,
    soundid: String,
    dateUploaded: String,
    numdownloads: String
  },
  data: function() {
    return {
    };
  },
  template: `
  <div class="sampleText">
    <h3>{{name}}</h3>
    <p>{{user}} - {{dateUploaded}}</p>
    <p>Downloads: {{numdownloads}}</p>
    <p>Instruments: {{instruments}}<p>
    <p>{{description}}</p>
    <div style="display: flex; justify-content: space-between;">
      <p><a v-on:click="$emit('downloadclick')"v-bind:href="'/samples/'+soundid"">Download link</a></p>
      <p><button ref="player" v-on:click="$emit('play')">Play</button></p>
      <p><a v-if="user === username" v-bind:href="'/modify/?sample='+name"">Edit</a></p>
    </div>
  </div>
  `
});

// Audio source: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/audio
Vue.component('soundplayer', {
  props: {
    soundurl: String,
    currname: String
  },
  data: function () {
    return {
    };
  },
  template: `
  <figure>
      <figcaption style="text-align: center; ">{{currname}}</figcaption>
      <audio ref="player"
          controls
          autoplay
          loop
          v-bind:src="soundurl">
          Your browser does not support the
          <code>audio</code> element.
      </audio>
  </figure>
  `
});

Vue.component('search', {
  props: {
  },
  data: function () {
    return {
      query: ''
    };
  },
  template: `
  <div style="text-align: center">
    <p>Search by substrings of username, name, instruments, or description</p>
    <input id="searchField" v-model="query">
    <button v-on:click="$emit('searchclick', query)">Search</button>
  </div>
  `
});
