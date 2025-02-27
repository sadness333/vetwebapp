// app.js

document.addEventListener('DOMContentLoaded', function() {
  // Отслеживание состояния аутентификации
  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      // Если пользователь авторизован, показываем админ-панель
      if(document.getElementById('login-container')) {
        document.getElementById('login-container').style.display = 'none';
      }
      if(document.getElementById('admin-container')) {
        document.getElementById('admin-container').style.display = 'block';
      }
    } else {
      // Если пользователь не авторизован, показываем форму логина
      if(document.getElementById('login-container')) {
        document.getElementById('login-container').style.display = 'block';
      }
      if(document.getElementById('admin-container')) {
        document.getElementById('admin-container').style.display = 'none';
      }
    }
  });
  
  // Логин
  var loginForm = document.getElementById('login-form');
  if(loginForm) {
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
  
  // Выход
  var logoutBtn = document.getElementById('logoutBtn');
  if(logoutBtn) {
    logoutBtn.addEventListener('click', function() {
      firebase.auth().signOut().then(() => {
        console.log('Пользователь вышел');
      }).catch((error) => {
        console.error('Ошибка выхода:', error);
      });
    });
  }
  
  // Если мы на странице профилей питомцев (index.html)
  if(document.getElementById('pets-table-body')) {
    loadPetProfiles();
  }
  
  // Если мы на странице дневника здоровья
  if(document.getElementById('diary-form')) {
    loadDiaryEntries();
    document.getElementById('diary-form').addEventListener('submit', function(e) {
      e.preventDefault();
      saveDiaryEntry();
    });
  }
  
  // Если мы на странице диет
  if(document.getElementById('diet-form')) {
    loadDiets();
    document.getElementById('diet-form').addEventListener('submit', function(e) {
      e.preventDefault();
      saveDiet();
    });
  }
  
  // Если мы на странице заболеваний
  if(document.getElementById('disease-form')) {
    loadDiseases();
    document.getElementById('disease-form').addEventListener('submit', function(e) {
      e.preventDefault();
      saveDisease();
    });
  }
});


// Функция для загрузки профилей питомцев
function loadPetProfiles() {
  const tableBody = document.getElementById('pets-table-body');
  tableBody.innerHTML = '';
  firebase.firestore().collection('pets').get()
    .then(querySnapshot => {
      querySnapshot.forEach(doc => {
        const pet = doc.data();
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><img src="${pet.photoUrl || 'https://via.placeholder.com/50'}" alt="Фото" class="img-thumbnail" width="50"></td>
          <td>${pet.name || ''}</td>
          <td>${pet.breed || ''}</td>
          <td>${pet.age || ''}</td>
          <td>${pet.status || ''}</td>
        `;
        tableBody.appendChild(tr);
      });
    })
    .catch(error => console.error("Ошибка загрузки питомцев:", error));
}

// Функция для загрузки записей дневника здоровья
function loadDiaryEntries() {
  const tableBody = document.getElementById('diary-table-body');
  tableBody.innerHTML = '';
  firebase.firestore().collection('healthDiary').orderBy('timestamp', 'desc').get()
    .then(querySnapshot => {
      querySnapshot.forEach(doc => {
        const entry = doc.data();
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${new Date(entry.timestamp.seconds * 1000).toLocaleString()}</td>
          <td>${entry.weight || ''}</td>
          <td>${entry.feeding || ''}</td>
          <td>${entry.symptoms || ''} / ${entry.disease || ''}</td>
          <td>${entry.photoUrl ? `<img src="${entry.photoUrl}" width="50" class="img-thumbnail">` : ''}</td>
          <td>${entry.notes || ''}</td>
        `;
        tableBody.appendChild(tr);
      });
    })
    .catch(error => console.error("Ошибка загрузки дневника:", error));
}

// Функция для сохранения записи дневника
function saveDiaryEntry() {
  const entry = {
    weight: document.getElementById('diary-weight').value,
    feeding: document.getElementById('diary-feeding').value,
    symptoms: document.getElementById('diary-symptoms').value,
    disease: document.getElementById('diary-disease').value,
    photoUrl: document.getElementById('diary-photo').value,
    notes: document.getElementById('diary-notes').value,
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  };
  firebase.firestore().collection('healthDiary').add(entry)
    .then(() => {
      document.getElementById('diary-message').textContent = 'Запись сохранена';
      loadDiaryEntries();
      document.getElementById('diary-form').reset();
    })
    .catch(error => {
      document.getElementById('diary-message').textContent = 'Ошибка сохранения: ' + error.message;
    });
}

// Функция для загрузки назначенных диет
function loadDiets() {
  const tableBody = document.getElementById('diet-table-body');
  tableBody.innerHTML = '';
  firebase.firestore().collection('diets').orderBy('assignedAt', 'desc').get()
    .then(querySnapshot => {
      querySnapshot.forEach(doc => {
        const diet = doc.data();
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${diet.petId || ''}</td>
          <td>${diet.dietName || ''}</td>
          <td>${diet.description || ''}</td>
          <td>${new Date(diet.assignedAt.seconds * 1000).toLocaleString()}</td>
        `;
        tableBody.appendChild(tr);
      });
    })
    .catch(error => console.error("Ошибка загрузки диет:", error));
}

// Функция для сохранения диеты
function saveDiet() {
  const diet = {
    petId: document.getElementById('diet-petId').value,
    dietName: document.getElementById('diet-name').value,
    description: document.getElementById('diet-description').value,
    assignedAt: firebase.firestore.FieldValue.serverTimestamp()
  };
  firebase.firestore().collection('diets').add(diet)
    .then(() => {
      document.getElementById('diet-message').textContent = 'Диета назначена';
      loadDiets();
      document.getElementById('diet-form').reset();
    })
    .catch(error => {
      document.getElementById('diet-message').textContent = 'Ошибка: ' + error.message;
    });
}

// Функция для загрузки списка заболеваний
function loadDiseases() {
  const tableBody = document.getElementById('disease-table-body');
  tableBody.innerHTML = '';
  firebase.firestore().collection('diseases').orderBy('createdAt', 'desc').get()
    .then(querySnapshot => {
      querySnapshot.forEach(doc => {
        const disease = doc.data();
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${disease.name || ''}</td>
          <td>${disease.description || ''}</td>
          <td>${disease.treatment || ''}</td>
          <td>${new Date(disease.createdAt.seconds * 1000).toLocaleString()}</td>
        `;
        tableBody.appendChild(tr);
      });
    })
    .catch(error => console.error("Ошибка загрузки заболеваний:", error));
}

// Функция для сохранения заболевания
function saveDisease() {
  const disease = {
    name: document.getElementById('disease-name').value,
    description: document.getElementById('disease-description').value,
    treatment: document.getElementById('disease-treatment').value,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };
  firebase.firestore().collection('diseases').add(disease)
    .then(() => {
      document.getElementById('disease-message').textContent = 'Заболевание добавлено';
      loadDiseases();
      document.getElementById('disease-form').reset();
    })
    .catch(error => {
      document.getElementById('disease-message').textContent = 'Ошибка: ' + error.message;
    });
}
