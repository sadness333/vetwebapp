// app.js

document.addEventListener('DOMContentLoaded', function() {
  // Отслеживание состояния аутентификации
  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      // Если пользователь авторизован, показываем админ-панель
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

  // Обработка формы логина
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

  // Обработка кнопки выхода
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

  // Если мы на странице списка питомцев (index.html)
  if (document.getElementById('pets-table-body')) {
    loadPetProfiles();
  }

  // Если мы на странице карточки питомца (pet.html)
  if (document.getElementById('pet-details')) {
    loadPetDetails();
  }

  // Обработка показа/скрытия формы редактирования на pet.html
  var editPetBtn = document.getElementById('editPetBtn');
  if (editPetBtn) {
    editPetBtn.addEventListener('click', function() {
      var formContainer = document.getElementById('editPetFormContainer');
      formContainer.style.display = formContainer.style.display === 'none' ? 'block' : 'none';
    });
  }
  var cancelEditBtn = document.getElementById('cancelEditBtn');
  if (cancelEditBtn) {
    cancelEditBtn.addEventListener('click', function() {
      document.getElementById('editPetFormContainer').style.display = 'none';
    });
  }
});


// Загрузка списка питомцев с фильтром
function loadPetProfiles() {
  const tableBody = document.getElementById('pets-table-body');
  tableBody.innerHTML = '';
  let allPets = [];
  firebase.firestore().collection('pets').get()
    .then(querySnapshot => {
      querySnapshot.forEach(doc => {
        const pet = doc.data();
        pet.id = doc.id;
        allPets.push(pet);
      });
      renderPetTable(allPets);
      // Фильтр
      const searchInput = document.getElementById('searchInput');
      searchInput.addEventListener('input', function() {
        const query = searchInput.value.toLowerCase();
        const filteredPets = allPets.filter(pet => {
          return (pet.name && pet.name.toLowerCase().includes(query)) ||
                 (pet.owner && pet.owner.toLowerCase().includes(query)) ||
                 (pet.breed && pet.breed.toLowerCase().includes(query)) ||
                 (pet.age && pet.age.toString().includes(query));
        });
        renderPetTable(filteredPets);
      });
    })
    .catch(error => console.error("Ошибка загрузки питомцев:", error));
}

function renderPetTable(pets) {
  const tableBody = document.getElementById('pets-table-body');
  tableBody.innerHTML = '';
  pets.forEach(pet => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><img src="${pet.photoUrl || 'https://via.placeholder.com/50'}" alt="Фото" class="img-thumbnail" width="50"></td>
      <td>${pet.name || ''}</td>
      <td>${pet.breed || ''}</td>
      <td>${pet.age || ''}</td>
      <td>${pet.owner || ''}</td>
    `;
    // При клике переходим на карточку питомца
    tr.addEventListener('click', function() {
      window.location.href = `pet.html?id=${pet.id}`;
    });
    tableBody.appendChild(tr);
  });
}

// Загрузка данных питомца для страницы pet.html
function loadPetDetails() {
  const urlParams = new URLSearchParams(window.location.search);
  const petId = urlParams.get('id');
  if (!petId) return;
  firebase.firestore().collection('pets').doc(petId).get()
    .then(doc => {
      if (doc.exists) {
        const pet = doc.data();
        pet.id = doc.id;
        displayPetDetails(pet);
      } else {
        document.getElementById('pet-details').textContent = 'Питомец не найден';
      }
    })
    .catch(error => console.error("Ошибка загрузки питомца:", error));
}

function displayPetDetails(pet) {
  const container = document.getElementById('pet-details');
  container.innerHTML = `
    <div class="card mb-3">
      <div class="row no-gutters">
        <div class="col-md-4">
          <img src="${pet.photoUrl || 'https://via.placeholder.com/150'}" class="card-img" alt="Фото питомца">
        </div>
        <div class="col-md-8">
          <div class="card-body">
            <h5 class="card-title">${pet.name || 'Без имени'}</h5>
            <p class="card-text">Порода: ${pet.breed || 'Не указано'}</p>
            <p class="card-text">Возраст: ${pet.age || ''}</p>
            <p class="card-text">Владелец: ${pet.owner || 'Не указан'}</p>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Предзаполнение формы редактирования
  document.getElementById('edit-pet-name').value = pet.name || '';
  document.getElementById('edit-pet-breed').value = pet.breed || '';
  document.getElementById('edit-pet-age').value = pet.age || '';
  document.getElementById('edit-pet-owner').value = pet.owner || '';
  document.getElementById('edit-pet-photo').value = pet.photoUrl || '';
  
  // Обработка формы редактирования
  const editForm = document.getElementById('edit-pet-form');
  editForm.onsubmit = function(e) {
    e.preventDefault();
    updatePetDetails(pet.id);
  };
}

function updatePetDetails(petId) {
  const updatedData = {
    name: document.getElementById('edit-pet-name').value,
    breed: document.getElementById('edit-pet-breed').value,
    age: parseInt(document.getElementById('edit-pet-age').value),
    owner: document.getElementById('edit-pet-owner').value,
    photoUrl: document.getElementById('edit-pet-photo').value
  };
  firebase.firestore().collection('pets').doc(petId).update(updatedData)
    .then(() => {
      document.getElementById('edit-pet-message').textContent = 'Данные обновлены';
      // Обновляем отображение карточки
      displayPetDetails(updatedData);
      document.getElementById('editPetFormContainer').style.display = 'none';
    })
    .catch(error => {
      document.getElementById('edit-pet-message').textContent = 'Ошибка обновления: ' + error.message;
    });
}
