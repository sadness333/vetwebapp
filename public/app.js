document.addEventListener('DOMContentLoaded', function() {
  // Авторизация
  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      if (document.getElementById('login-container')) {
        document.getElementById('login-container').style.display = 'none';
      }
      if (document.getElementById('admin-container')) {
        document.getElementById('admin-container').style.display = 'block';
      }
    } else {
      if (document.getElementById('login-container')) {
        document.getElementById('login-container').style.display = 'block';
      }
      if (document.getElementById('admin-container')) {
        document.getElementById('admin-container').style.display = 'none';
      }
    }
  });

  // Форма логина
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;
      firebase.auth().signInWithEmailAndPassword(email, password)
        .then(() => {
          document.getElementById('login-error').textContent = '';
        })
        .catch((error) => {
          document.getElementById('login-error').textContent = error.message;
        });
    });
  }

  // Кнопка выхода
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
      firebase.auth().signOut().then(() => {
        console.log('Пользователь вышел из системы');
      }).catch((error) => {
        console.error('Ошибка выхода:', error);
      });
    });
  }

  // Если на странице списка питомцев (index.html)
  if (document.getElementById('pets-table-body')) {
    loadPetProfiles();
  }

  // Обработка кнопки поиска
  const searchButton = document.getElementById('searchButton');
  if (searchButton) {
    searchButton.addEventListener('click', performSearch);
  }
});

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
      const searchInput = document.getElementById('searchInput');
      searchInput.addEventListener('input', performSearch);
      window.allPets = allPets;
    })
    .catch(error => console.error("Ошибка загрузки питомцев:", error));
}

function performSearch() {
  const query = document.getElementById('searchInput').value.toLowerCase();
  const filteredPets = window.allPets.filter(pet => {
    return (pet.name && pet.name.toLowerCase().includes(query)) ||
           (pet.owner && pet.owner.toLowerCase().includes(query)) ||
           (pet.breed && pet.breed.toLowerCase().includes(query)) ||
           (pet.age && pet.age.toString().includes(query));
  });
  renderPetTable(filteredPets);
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
    tr.addEventListener('click', function() {
      window.location.href = `edit.html?id=${pet.id}`;
    });
    tableBody.appendChild(tr);
  });
}

document.addEventListener('DOMContentLoaded', function() {
  // Для страницы edit.html
  function loadPetDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const petId = urlParams.get('id');
    if (!petId) return;
    firebase.firestore().collection('pets').doc(petId).get()
      .then(doc => {
        if (doc.exists) {
          const pet = doc.data();
          pet.id = doc.id;
          fillPetForm(pet);
        } else {
          document.getElementById('pet-details-form').innerHTML = 'Питомец не найден';
        }
      })
      .catch(error => console.error("Ошибка загрузки питомца:", error));
  }

  function fillPetForm(pet) {
    document.getElementById('pet-name').value = pet.name || '';
    document.getElementById('pet-breed').value = pet.breed || '';
    document.getElementById('pet-age').value = pet.age || '';
    document.getElementById('pet-owner').value = pet.owner || '';
    document.getElementById('pet-photo').value = pet.photoUrl || '';
    document.getElementById('pet-feeding').value = pet.feedingRegime || '';
    document.getElementById('pet-medical').value = pet.medicalRecord || '';
  }

  // Если мы находимся на edit.html, добавляем обработчики для редактирования
  if (window.location.pathname.includes('edit.html')) {
    loadPetDetails();

    const editButton = document.getElementById('editButton');
    const saveButton = document.getElementById('saveButton');
    const cancelButton = document.getElementById('cancelButton');
    const form = document.getElementById('pet-details-form');

    editButton.addEventListener('click', function() {
      Array.from(form.elements).forEach(el => el.disabled = false);
      editButton.style.display = 'none';
      saveButton.style.display = 'inline-block';
      cancelButton.style.display = 'inline-block';
    });

    cancelButton.addEventListener('click', function() {
      const urlParams = new URLSearchParams(window.location.search);
      const petId = urlParams.get('id');
      firebase.firestore().collection('pets').doc(petId).get()
        .then(doc => {
          if (doc.exists) {
            fillPetForm(doc.data());
            Array.from(form.elements).forEach(el => el.disabled = true);
            editButton.style.display = 'inline-block';
            saveButton.style.display = 'none';
            cancelButton.style.display = 'none';
          }
        });
    });

    saveButton.addEventListener('click', function() {
      const urlParams = new URLSearchParams(window.location.search);
      const petId = urlParams.get('id');
      const updatedData = {
        name: document.getElementById('pet-name').value,
        breed: document.getElementById('pet-breed').value,
        age: parseInt(document.getElementById('pet-age').value),
        owner: document.getElementById('pet-owner').value,
        photoUrl: document.getElementById('pet-photo').value,
        feedingRegime: document.getElementById('pet-feeding').value,
        medicalRecord: document.getElementById('pet-medical').value
      };
      firebase.firestore().collection('pets').doc(petId).update(updatedData)
        .then(() => {
          document.getElementById('edit-message').textContent = 'Данные обновлены';
          Array.from(form.elements).forEach(el => el.disabled = true);
          editButton.style.display = 'inline-block';
          saveButton.style.display = 'none';
          cancelButton.style.display = 'none';
        })
        .catch(error => {
          document.getElementById('edit-message').textContent = 'Ошибка обновления: ' + error.message;
        });
    });
  }
});
