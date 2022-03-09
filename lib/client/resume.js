(async () => {
  const pageViewsContainer = document.getElementById("page-views");
  try {
    let response = await fetch("https://resumeapi.adamljayne.com");
    let { views } = await response.json();
    pageViewsContainer.innerText = `Page Views: ${views}`;
  } catch (e) {
    console.error("Something went wrong");
  }
  console.log("Welcome to the console! Sadly there's nothing here yet!");
})();
