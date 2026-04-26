document.getElementById('registration').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    removeMessages();
    
    // Получаем значения из формы
    const firstName = document.getElementById('first-name').value.trim();
    const lastName = document.getElementById('last-name').value.trim();
    const login = document.getElementById('login').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    if (!firstName) {
        showMessage('Введите имя', 'error');
        return;
    }
    
    if (!lastName) {
        showMessage('Введите фамилию', 'error');
        return;
    }
    
    if (!login) {
        showMessage('Введите логин', 'error');
        return;
    }
    
    if (password.length < 6) {
        showMessage('Пароль должен быть не менее 6 символов', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showMessage('Пароли не совпадают', 'error');
        return;
    }
    
    const formData = new FormData();
    formData.append('first_name', firstName);   
    formData.append('last_name', lastName);     
    formData.append('username', login);
    formData.append('password', password);
    formData.append('confirm_password', confirmPassword);
    
    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            showMessage('Регистрация успешна! Перенаправление на вход...', 'success');
            setTimeout(() => {
                window.location.href = '/';
            }, 1500);
        } else {
            showMessage(data.message, 'error');
        }
    } catch (error) {
        showMessage('Ошибка соединения с сервером', 'error');
    }
});

document.getElementById('back-to-login').addEventListener('click', () => {
    window.location.href = '/';
});

function showMessage(message, type) {
    const form = document.getElementById('registration');
    const messageDiv = document.createElement('div');
    messageDiv.className = `form-message ${type}`;
    messageDiv.textContent = message;
    form.insertBefore(messageDiv, form.firstChild);
}

function removeMessages() {
    const messages = document.querySelectorAll('.form-message');
    messages.forEach(msg => msg.remove());
}