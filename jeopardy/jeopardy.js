// categories is the main data structure for the app; it looks like this:

//  [
//    { title: "Math",
//      clues: [
//        {question: "2+2", answer: 4, showing: null},
//        {question: "1+1", answer: 2, showing: null}
//        ...
//      ],
//    },
//    { title: "Literature",
//      clues: [
//        {question: "Hamlet Author", answer: "Shakespeare", showing: null},
//        {question: "Bell Jar Author", answer: "Plath", showing: null},
//        ...
//      ],
//    },
//    ...
//  ]


let categories = [];
const BASE_URL = `https://jservice.io/api`;
const QUESTION_COUNT = 5;
const CATEGORY_COUNT = 6;


/** Get NUM_CATEGORIES random category from API.
 *
 * Returns array of category ids
 */
class Category {

  static async getCategoryIds() {
    let response = await axios.get(`${BASE_URL}/categories`, {
      params: {
        count: "100",
        offset: Math.floor(Math.random() * (500 - 1) + 1) // RNG to vary offset between each request
      }
    });

    // Lodash selects 6 random categories
    let randomCategories = _.sampleSize(response.data, CATEGORY_COUNT)

    // make new array with only the category IDs
    let categoryIds = randomCategories.map((catObj) => {
      return catObj.id;
    });

    return categoryIds;
  }

  // Fill 'categories' array with 6 objects, each with 5 questions
  static async getAllCategoriesAndQuestions() {
    categories = [];
    let categoryIds = await Category.getCategoryIds();
    for (let categoryId of categoryIds) {
      let fullCategory = await Category.getCategory(categoryId);
      categories.push(fullCategory);
    }
    return categories;
  }


  /** Return object with data about a category:
  *
  *  Returns { title: "Math", clues: clue-array }
  *
  * Where clue-array is:
  *   [
  *      {question: "Hamlet Author", answer: "Shakespeare", showing: null},
  *      {question: "Bell Jar Author", answer: "Plath", showing: null},
  *      ...
  *   ]
  */
  static async getCategory(catId) {
    let response = await axios.get(`${BASE_URL}/clues`, {
      params: {
        category: catId
      }
    });
    // Lodash selects 5 random questions
    let selectFiveQuestions = _.sampleSize(response.data, QUESTION_COUNT);

    // format each question object inside array
    let questionArray = selectFiveQuestions.map((question) => {
      //
      if (question.answer.startsWith('<i>')) {
        question.answer = question.answer.slice(3, -3);
      }
      return {
        question: question.question,
        answer: question.answer,
        showing: null
      }
    });

    let categoryQuestions = {
      title: response.data[0].category.title,
      clues: questionArray
    }
    return categoryQuestions;
  }
}


// 

$(async function () {
  const $button = $("button");
  const $tDiv = $("#table-data");

  // for formatting category titles
  function toTitleCase(str) {
    let lcStr = str.toLowerCase();
    return lcStr.replace(/(?:^|\s)\w/g, (match) => {
      return match.toUpperCase();
    });
  }


  /** Fill the HTML table#jeopardy with the categories & cells for questions.
   *
   * - The <thead> should be filled w/a <tr>, and a <td> for each category
   * - The <tbody> should be filled w/NUM_QUESTIONS_PER_CAT <tr>s,
   *   each with a question for each category in a <td>
   *   (initally, just show a "?" where the question/answer would go.)
   */
  async function fillTable() {
    let $tHead = $("<thead>");
    let $tBody = $("<tbody>");
    let $table = $("<table border='1' id='jeopardy'>")
      .prepend($tHead)
      .append($tBody);

    // generate each table cell with '?', add coordinate ID, append to row, row appends to tbody
    for (let j = 0; j < QUESTION_COUNT; j++) {
      let $tRow = $("<tr>");
      for (let i = 0; i < CATEGORY_COUNT; i++) {
        let $qMark = $("<i>")
          .attr("class", "fa fa-question");
        let $tCell = $("<td>")
          .attr("id", `${i}-${j}`)
          .append($qMark);
        $tRow.append($tCell);
      }
      $tBody.append($tRow);
    }

    // generate header cells, apply category title on the way, append to thead
    for (let k = 0; k < CATEGORY_COUNT; k++) {
      let $tCell = $("<th>")
        .attr("id", `cat-${k}`)
        .text(toTitleCase(categories[k].title));
      $tHead.append($tCell);
    }

    $tDiv.append($table);

  }

  /** Handle clicking on a clue: show the question or answer.
  *
  * Uses .showing property on clue to determine what to show:
  * - if currently null, show question & set .showing to "question"
  * - if currently "question", show answer & set .showing to "answer"
  * - if currently "answer", ignore click
  * */
  function showQuestionOrAnswer(id) {
    let $clickedCell = $(`#${id}`);
    let category = id.slice(0, 1);
    let question = id.slice(2);

    let theCell = categories[category].clues[question];
    let theQuestion = theCell.question;
    let theAnswer = theCell.answer;

    if (theCell.showing === null) {
      $clickedCell.text(theQuestion);
      theCell.showing = "question";
    }
    else if (theCell.showing === "question") {
      $clickedCell.toggleClass("answer")
      $clickedCell.text(theAnswer);
      theCell.showing = "answer";
      $clickedCell.toggleClass("not-allowed");
    }
  }

  /** Wipe the current Jeopardy board, show the loading spinner,
   * and update the button used to fetch data.
   */
  function showLoadingView() {
    $button.text("Loading...").toggleClass("not-allowed");
    $tDiv.empty();
    let $loading = $("<i>")
      .attr("class", "");
    $tDiv.append($loading);
  }

  /** Remove the loading spinner and update the button used to fetch data. */
  function hideLoadingView() {
    $button.text("Restart").toggleClass("not-allowed");
    $tDiv.empty();
  }

  /** Start game:
 *
 * - get random category Ids
 * - get data for each category
 * - create HTML table
 * */
  async function setupAndStart() {
    showLoadingView();
    await Category.getAllCategoriesAndQuestions();
    hideLoadingView();
    fillTable();
    addListeners();
  }

  /** On click of start / restart button, set up game. */

  // TODO

  /** On page load, add event handler for clicking clues */

  // TODO 

  $button.on("click", async () => {
    setupAndStart();
  });

  async function addListeners() {
    const $gameTable = $("table");
    $gameTable.on("click", "td", (evt) => {
      showQuestionOrAnswer(evt.target.id);
    });
  }

});

