// app.js
document.addEventListener('DOMContentLoaded', function() {
    // Слушатель состояния аутентификации Firebase
    firebase.auth().onAuthStateChanged(function(user) {
      if (user) {
        // Если пользователь авторизован, скрываем форму логина
        if (document.getElementById('login-container')) {
          document.getElementById('login-container').style.display = 'none';
        }
        if (document.getElementById('admin-container')) {
          document.getElementById('admin-container').style.display = 'block';
        }
      } else {
        // Если пользователь не авторизован, показываем форму логина
        if (document.getElementById('login-container')) {
          document.getElementById('login-container').style.display = 'block';
        }
        if (document.getElementById('admin-container')) {
          document.getElementById('admin-container').style.display = 'none';
        }
      }
    });
  
    // Обработка формы логина (на index.html)
    var loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        var email = document.getElementById('login-email').value;
        var password = document.getElementById('login-password').value;
        firebase.auth().signInWithEmailAndPassword(email, password)
          .then(() => {
            document.getElementById('login-error').textContent = '';
          })
          .catch((error) => {
            document.getElementById('login-error').textContent = error.message;
          });
      });
    }
  
    // Обработка кнопки выхода (для всех страниц)
    var logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', function() {
        firebase.auth().signOut().then(() => {
          console.log('Пользователь вышел из системы');
        }).catch((error) => {
          console.error('Ошибка выхода:', error);
        });
      });
    }
  
    // Если мы на главной админ-панели (index.html), загружаем записи животных
    if (document.getElementById('animal-table-body')) {
      loadAnimalRecords();
    }
  
    // Если мы на странице добавления/редактирования (edit.html), обрабатываем форму
    var animalForm = document.getElementById('animal-form');
    if (animalForm) {
      // Если в URL есть параметр "id", значит редактируем существующую запись
      const urlParams = new URLSearchParams(window.location.search);
      const animalId = urlParams.get('id');
      if (animalId) {
        document.getElementById('form-title').textContent = 'Редактировать питомца';
        // Загружаем данные выбранного питомца для редактирования
        firebase.firestore().collection('animals').doc(animalId).get()
          .then(doc => {
            if (doc.exists) {
              const data = doc.data();
              document.getElementById('animal-name').value = data.name || '';
              document.getElementById('animal-breed').value = data.breed || '';
              document.getElementById('animal-age').value = data.age || '';
              document.getElementById('animal-status').value = data.status || 'Здоров';
              document.getElementById('animal-photo').value = data.photoUrl || '';
            }
          })
          .catch(err => console.error('Ошибка загрузки данных:', err));
      }
  
      animalForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const name = document.getElementById('animal-name').value;
        const breed = document.getElementById('animal-breed').value;
        const age = parseInt(document.getElementById('animal-age').value);
        const status = document.getElementById('animal-status').value;
        const photoUrl = document.getElementById('animal-photo').value;
        const animalData = { name, breed, age, status, photoUrl };
  
        if (animalId) {
          // Обновляем существующую запись
          firebase.firestore().collection('animals').doc(animalId).update(animalData)
            .then(() => {
              document.getElementById('form-message').textContent = 'Запись успешно обновлена';
            })
            .catch(err => {
              document.getElementById('form-message').textContent = 'Ошибка обновления записи: ' + err.message;
            });
        } else {
          // Создаём новую запись
          firebase.firestore().collection('animals').add(animalData)
            .then(() => {
              document.getElementById('form-message').textContent = 'Запись успешно добавлена';
              animalForm.reset();
            })
            .catch(err => {
              document.getElementById('form-message').textContent = 'Ошибка добавления записи: ' + err.message;
            });
        }
      });
  
      // Обработка кнопки "Отмена"
      var cancelBtn = document.getElementById('cancelBtn');
      if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
          window.location.href = 'index.html';
        });
      }
    }
  });
  
  // Функция для загрузки записей о животных и заполнения таблицы
  function loadAnimalRecords() {
    const tableBody = document.getElementById('animal-table-body');
    tableBody.innerHTML = '';
    firebase.firestore().collection('animals').get()
      .then(querySnapshot => {
        querySnapshot.forEach(doc => {
          const animal = doc.data();
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td><img src="${animal.photoUrl || 'https://via.placeholder.com/50'}" alt="Фото" class="img-thumbnail" width="50"></td>
            <td>${animal.name || ''}</td>
            <td>${animal.breed || ''}</td>
            <td>${animal.age || ''}</td>
            <td>${animal.status || ''}</td>
          `;
          // При клике на строку переходим на страницу редактирования с параметром id
          tr.addEventListener('click', function() {
            window.location.href = `edit.html?id=${doc.id}`;
          });
          tableBody.appendChild(tr);
        });
      })
      .catch(error => {
        console.error("Ошибка загрузки записей: ", error);
      });
  }
  