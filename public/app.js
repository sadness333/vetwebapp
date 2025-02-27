document.addEventListener('DOMContentLoaded', function() {
  // Отслеживание состояния аутентификации
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

  // Обработка формы логина
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

  // Обработка кнопки выхода
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
      // Фильтр поиска
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
    // При клике переходим на edit.html с параметром id питомца
    tr.addEventListener('click', function() {
      window.location.href = `edit.html?id=${pet.id}`;
    });
    tableBody.appendChild(tr);
  });
}
