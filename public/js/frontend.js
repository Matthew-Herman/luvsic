document.addEventListener("DOMContentLoaded", function() {
  console.log("DOM Loaded");
  // Vue is initialized in vue cdn script in layout.hbs
  const samplesContainer2 = new Vue({
    el: '#samplesContainer2',
    data: {
      samplesJson: {},
      username: "",
      soundurl: "",
      currname: ""
    },
    created: function() {
      // Source MDN docs: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
      fetch('/api/samples')
        .then(function(response) {
          return response.json(); // turns response into js from json
        })
        .then((jsonResponse) => {
          this.samplesJson = jsonResponse.samples; // this === samplesContainer2
          this.username = jsonResponse.username;
        })
        .catch(error => console.error('Error:', error));
    },
    methods: {
      search: function (query) {
        console.log("query: " + query);
        fetch('/api/search?query=' + query)
          .then(function(response) {
            return response.json(); // turns response into js from json
          })
          .then((jsonResponse) => {
            this.samplesJson = jsonResponse;
          })
          .catch(error => console.error('Error:', error));
      },
      play: function (newSound) {
        console.log('play method executed with file /samples/' + newSound['soundid']);
        this.currname = newSound['currname'];
        this.soundurl = '/samples/'+ newSound['soundid'];
      }
    }
  });
});
