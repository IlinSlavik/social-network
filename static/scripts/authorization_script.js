document.getElementById('autorization').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const login = document.getElementById('login').value;
    const password = document.getElementById('password').value;
    
    const formData = new FormData();
    formData.append('username', login);
    formData.append('password', password);
    
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Сохраняем токен в cookie
            document.cookie = `session_token=${data.token}; path=/`;
            window.location.href = '/wall';
        } else {
            alert(data.message);
        }
    } catch (error) {
        alert('Ошибка соединения с сервером');
    }
});

document.getElementById('create-account').addEventListener('click', () => {
    window.location.href = '/register';
});