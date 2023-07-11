"use strict";

// This is the global list of the stories, an instance of StoryList
let storyList;

/** Get and show stories when site first loads. */

async function getAndShowStoriesOnStart() {
  storyList = await StoryList.getStories();
  $storiesLoadingMsg.remove();

    putStoriesOnPage();
  }

/**
 * A render method to render HTML for an individual Story instance
 * - story: an instance of Story
 *
 * Returns the markup for the story.
 */

function generateStoryMarkup(story, showDeleteBtn = false) {
  // console.debug("generateStoryMarkup", story);
  
  const hostName = story.getHostName();

  // show favorite/not favorite for logged in user
  const showStar = Boolean(currentUser);

  return $(`
      <li id="${story.storyId}">
      <div>
      ${showDeleteBtn ? getDeleteBtnHTML() : ""}
      ${showStar ? getStarHTML(story, currentUser) : ""}
        <a href="${story.url}" target="a_blank" class="story-link">
          ${story.title}
        </a>
        <small class="story-hostname">(${hostName})</small>
        <div class="story-author">by ${story.author}</div>
        <div class="story-user">posted by ${story.username}</div>
        </div>
      </li>
    `);
}

// making delete button html for story

function getDeleteBtnHTML(){
  return ` 
    <span class="trash-can">
      <i cass="fas fa-trash-alt"></i>
    </span>`;
}

// make favorite/not-favorite star for story

function getStarHTML(story, user){
  const isFavorite = user.isFavorite(story);
  const starType = isFavorite ? "fas" : "far";
  return `
  <span class="star">
    <i class="${starType} fa-star"></i>
  </span>`
}

/** Gets list of stories from server, generates their HTML, and puts on page. */

function putStoriesOnPage() {
  console.debug("putStoriesOnPage");

  $allStoriesList.empty();

  // loop through all of our stories and generate HTML for them
  for (let story of storyList.stories) {
    const $story = generateStoryMarkup(story);
    $allStoriesList.append($story);
  }

  $allStoriesList.show();
}

// handle deleting a story

async function deleteStory(evt){
  console.debug("deleteStory");

  const $closestLi = $(evt.target).closest("li");
  const storyId = $closestLi.attr("id");

  await storyList.removeStory(currentUser, storyId);

  // generate story list
  await putUserStoriesOnPage();
}

$ownStories.on("click", ".trash-can", deleteStory);
// hangling submitting new story form

async function submitNewStory(evt){
  console.debug("submitNewStory");
  evt.preventDefault();

  // get all info from form
  const title = $("#create-title").val();
  const url = $("#create-url").val();
  const author = $("#create-author").val();
  const username = currentUser.username;
  const storyData = {title, url, author, username};

  const story = await storyList.addStory(currentUser, storyData);

  const $story = generateStoryMarkup(story);
  $allStoriesList.prepend($story);

  // hide the form and clear it 
  $submitForm.slideUp("slow");
  $submitForm.trigger("reset");
}

$submitForm.on("submit", submitNewStory);

// creating functionality for list of user's own stories

function putUserStoriesOnPage(){
  console.debug("putUserStoriesOnPage");

  $ownStories.empty();

  if(currentUser.ownStories.length === 0){
    $ownStories.append("<h5>No stories added yet!</h5>");
  } else{
    // creating loop to get through all of the users stories and create the HTML for them
    for (let story of currentUser.ownStories){
      let $story = generateStoryMarkup(story, true);
      $ownStories.append($story);
    }
  }

  $ownStories.show();
}

// creating functinality for favorites list and starring/unstarring stories

// putting favorites at the top

function putFavoritesListOnPage(){
  console.debug("putFavoritesListOnPage");

  $favoritedStories.empty();

  if (currentUser.favorites.length === 0){
    $favoritedStories.append("<h5>No favorited stories!</h5>");
  } else {
    //  loop through all favorites and generate HTML
    for (let story of currentUser.favorites){
      const $story = generateStoryMarkup(story);
      $favoritedStories.append($story);
    }
  }

  $favoritedStories.show();
}

// handle favorite/unfavorite of stories

async function toggleStoryFavorite(evt){
  console.debug("toggleStoryFavorite");

  const $tgt = $(evt.target);
  const $closestLi = $tgt.closest("li");
  const storyId = $closestLi.attr("id");
  const story = storyList.stories.find(s => s.storyId === storyId);

  // see if item is favorited
  if ($tgt.hasClass("fas")){
    // currently favorited... unfavorite and remove from lsit
    await currentUser.removeFavorite(story);
    $tgt.closest("i").toggleClass("fas far");
  } else{
    // not a favorite... favorite and add to list
    await currentUser.addFavorite(story);
    $tgt.closest("i").toggleClass("fas far");
  }
}

$storiesLists.on("click", ".star", toggleStoryFavorite);
