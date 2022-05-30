const search = instantsearch({
  // MeiliSearch Index name
  indexName: "podcast",
  // MeiliSearch Server url
  searchClient: instantMeiliSearch(
    "http://localhost:7700",
    "8173e0652b7ff753a81bd3a3b0e06d9303b38b760ffcc5b8b958dd62a807c599"
  )
});

search.addWidgets([
  instantsearch.widgets.searchBox({
    container: "#searchbox",
    placeholder: "Search for the Podcast ...",
    // input auto focus (default false)
    autofocus: true,
    // searchAsYouType (default true)
    // showSubmit(button) (default true)
    // showLoadingIndicator (default false)
    cssClasses: {
      submit: "submitBtn",
      submitIcon: "submitIcon"
    }
  }),
  instantsearch.widgets.configure({
    hitsPerPage: 100
  }),
  instantsearch.widgets.infiniteHits({
    container: "#hits",
    templates: {
      empty: 'No results for <q>{{ query }}</q>',
      showMoreText: `
        <div class="show_more">
            <h4>show more results</h4>
        </div>`,
      item(hit) {
        return `
          <div class="row">
            <a href="http://localhost:5000/episode/${hit.episode_uri}">
              <div class="front">
                <div class="img">
                  <img class="poster" src="${hit.poster}"/>
                </div>
                <div class="info">
                  <p class="hit-publisher">
                    ${instantsearch.highlight({ attribute: 'show_name', highlightedTagName: 'mark', hit })}
                  </p>
                  <p class="hit-episode">
                    ${instantsearch.highlight({ attribute: 'episode_name', highlightedTagName: 'mark', hit })}
                  </p>
                </div>
                <div class="description">
                  ${instantsearch.highlight({ attribute: 'episode_description', highlightedTagName: 'mark', hit })}
                </div> 
              </div>
            </a>          
          </div>
        `;
      }
    }
  })
]);

search.start();

// detect input for vue
var input = document.getElementsByClassName("ais-SearchBox-input")[0];
input.setAttribute("v-model", "query");
var hits = document.getElementById("hits");
input.setAttribute("v-bind:show", "typing");