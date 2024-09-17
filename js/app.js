const API_KEY = "11049b8b-9e41-4f03-94cb-1108868a7ac4";
const API_URL_POPULAR = "https://kinopoiskapiunofficial.tech/api/v2.2/films/top?type=TOP_100_POPULAR_FILMS";
const API_URL_SEARCH = "https://kinopoiskapiunofficial.tech/api/v2.1/films/search-by-keyword?keyword=";
const API_URL_MOVIE_DETAILS = "https://kinopoiskapiunofficial.tech/api/v2.2/films/";

let currentPage = 1; // Текущая страница
let totalPages = 10; // Всего страниц
let allMovies = []; // Для хранения всех фильмов

// Загружаем популярные фильмы для текущей страницы
async function getMovies(page = 1) {
  const url = `${API_URL_POPULAR}&page=${page}`;
  try {
    const resp = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": API_KEY,
      },
    });
    const respData = await resp.json();
    allMovies = respData.films; // Сохраняем все фильмы
    showMovies(allMovies); // Показываем фильмы
    updatePagination(); // Обновляем пагинацию
  } catch (error) {
    console.error("Ошибка при загрузке фильмов:", error);
    document.querySelector(".movies").innerHTML = '<p>Ошибка загрузки фильмов.</p>';
  }
}

// Функция для фильтрации фильмов по жанру
function filterMoviesByGenre(movies, genre) {
  if (!genre) return movies; // Если жанр не выбран, возвращаем все фильмы
  return movies.filter(movie => 
    movie.genres.some(g => g.genre.toLowerCase() === genre.toLowerCase())
  );
}

function getClassByRate(vote) {
  if (vote >= 7) {
    return "green";
  } else if (vote > 5) {
    return "orange";
  } else {
    return "red";
  }
}

function showMovies(movies) {
  const moviesEl = document.querySelector(".movies");
  moviesEl.innerHTML = "";

  if (movies.length === 0) {
    moviesEl.innerHTML = '<p>Фильм не найден</p>';
    return;
  }

  movies.forEach((movie) => {
    const movieEl = document.createElement("div");
    movieEl.classList.add("movie");
    movieEl.innerHTML = `
      <div class="movie__cover-inner">
        <img
          src="${movie.posterUrlPreview}"
          class="movie__cover"
          alt="${movie.nameRu}"
        />
        <div class="movie__cover--darkened"></div>
      </div>
      <div class="movie__info">
        <div class="movie__title">${movie.nameRu}</div>
        <div class="movie__category">${movie.genres.map(
          (genre) => ` ${genre.genre}`
        )}</div>
        ${
          movie.rating &&
          `
        <div class="movie__average movie__average--${getClassByRate(
          movie.rating
        )}">${movie.rating}</div>
        `
        }
      </div>
    `;
    movieEl.addEventListener("click", () => openModal(movie.filmId));
    moviesEl.appendChild(movieEl);
  });
}

function updatePagination() {
  const paginationEl = document.querySelector(".pagination");
  paginationEl.innerHTML = "";

  for (let page = 1; page <= totalPages; page++) {
    const pageEl = document.createElement("button");
    pageEl.textContent = page;
    pageEl.classList.add("pagination__button");
    if (page === currentPage) {
      pageEl.classList.add("pagination__button--active");
    }
    pageEl.addEventListener("click", () => {
      currentPage = page;
      getMovies(currentPage);
    });
    paginationEl.appendChild(pageEl);
  }
}

const form = document.querySelector("form");
const search = document.querySelector("#search-input");
const genreSelect = document.querySelector("#genre-select");

// Обработчик отправки формы поиска
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const searchValue = search.value.trim();
  const genreValue = genreSelect.value;

  if (searchValue) {
    // Поиск по названию фильма
    const apiSearchUrl = `${API_URL_SEARCH}${encodeURIComponent(searchValue)}`;
    try {
      const resp = await fetch(apiSearchUrl, {
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": API_KEY,
        },
      });
      const data = await resp.json();
      allMovies = data.films || []; // Обновляем все фильмы
      showMovies(filterMoviesByGenre(allMovies, genreValue)); // Применяем фильтрацию по жанру
    } catch (error) {
      console.error("Ошибка при поиске фильмов:", error);
      document.querySelector(".movies").innerHTML = '<p>Ошибка поиска фильмов.</p>';
    }
  } else if (genreValue) {
    // Поиск по жанру
    const filteredMovies = filterMoviesByGenre(allMovies, genreValue);
    if (filteredMovies.length === 0) {
      document.querySelector(".movies").innerHTML = '<p>Фильм не найден</p>';
    } else {
      showMovies(filteredMovies);
    }
  } else {
    // Если ничего не введено, показываем все фильмы
    showMovies(allMovies);
  }
});

// Обработчик изменения жанра
genreSelect.addEventListener("change", () => {
  const genreValue = genreSelect.value;
  if (search.value.trim() === "") {
    const filteredMovies = filterMoviesByGenre(allMovies, genreValue);
    if (filteredMovies.length === 0) {
      document.querySelector(".movies").innerHTML = '<p>Фильм не найден</p>';
    } else {
      showMovies(filteredMovies);
    }
  }
});

// Модальное окно
const modalEl = document.querySelector(".modal");

async function openModal(id) {
  try {
    const resp = await fetch(API_URL_MOVIE_DETAILS + id, {
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": API_KEY,
      },
    });
    const respData = await resp.json();
    
    modalEl.classList.add("modal--show");
    document.body.classList.add("stop-scrolling");

    modalEl.innerHTML = `
      <div class="modal__card">
        <img class="modal__movie-backdrop" src="${respData.posterUrl}" alt="">
        <h2>
          <span class="modal__movie-title">${respData.nameRu}</span>
          <span class="modal__movie-release-year"> - ${respData.year}</span>
        </h2>
        <ul class="modal__movie-info">
          <div class="loader"></div>
          <li class="modal__movie-genre">Жанр - ${respData.genres.map((el) => `<span>${el.genre}</span>`).join(', ')}</li>
          ${respData.filmLength ? `<li class="modal__movie-runtime">Время - ${respData.filmLength} минут</li>` : ''}
          <li>Сайт: <a class="modal__movie-site" href="${respData.webUrl}">${respData.webUrl}</a></li>
          ${respData.description ? `<li class="modal__movie-overview">Описание - ${respData.description}</li>` : ''}
        </ul>
        <button type="button" class="modal__button-close">Закрыть</button>
      </div>
    `;
    
    const btnClose = document.querySelector(".modal__button-close");
    btnClose.addEventListener("click", () => closeModal());
  } catch (error) {
    console.error("Ошибка при загрузке деталей фильма:", error);
    modalEl.innerHTML = '<p>Ошибка загрузки деталей фильма.</p>';
  }
}

function closeModal() {
  modalEl.classList.remove("modal--show");
  document.body.classList.remove("stop-scrolling");
}

window.addEventListener("click", (e) => {
  if (e.target === modalEl) {
    closeModal();
  }
});

window.addEventListener("keydown", (e) => {
  if (e.keyCode === 27) {
    closeModal();
  }
});

// Начальная загрузка популярных фильмов
getMovies();
