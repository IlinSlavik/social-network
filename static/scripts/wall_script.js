// DOM элементы
const modal = document.getElementById('post-modal');
const statusModal = document.getElementById('status-modal');
const requestsModal = document.getElementById('requests-modal');
const publishBtn = document.getElementById('publish-btn');
const closeBtn = document.querySelector('.close');
const closeStatusBtn = document.querySelector('.close-status');
const closeRequestsBtn = document.querySelector('.close-requests');
const submitPostBtn = document.getElementById('submit-post-btn');
const saveStatusBtn = document.getElementById('save-status-btn');
const newPostContent = document.getElementById('new-post-content');
const statusInput = document.getElementById('status-input');
const editStatusBtn = document.getElementById('edit-status-btn');
const userStatusElement = document.getElementById('user-status');
const logoutBtn = document.getElementById('logout-btn');
const usernameElement = document.getElementById('username');
const requestsBtn = document.getElementById('requests-btn');
const requestsCountSpan = document.getElementById('requests-count');

const statsContent = document.getElementById('stats-content');

let postsChart = null;

let postImageFile = null;
const postImageInput = document.getElementById('post-image');
const imagePreview = document.getElementById('image-preview');
const previewImg = document.getElementById('preview-img');
const removeImageBtn = document.getElementById('remove-image');

// Элементы для аватара
const avatarPreview = document.getElementById('avatar-preview');
const avatarUpload = document.getElementById('avatar-upload');
let changeAvatarLabel = document.getElementById('change-avatar-btn');

// Элементы для друзей
const friendsTabBtns = document.querySelectorAll('.friends-tab');
const myFriendsList = document.getElementById('my-friends-list');
const findFriendsList = document.getElementById('find-friends-list');

// Элементы вкладок
const wallContent = document.getElementById('wall-content');
const newsContent = document.getElementById('news-content');
const friendsContent = document.getElementById('friends-content');
const navItems = document.querySelectorAll('.nav-item');

// ============ ВКЛАДКИ ============
function switchTab(tabName) {
    if (wallContent) wallContent.style.display = 'none';
    if (newsContent) newsContent.style.display = 'none';
    if (friendsContent) friendsContent.style.display = 'none';
    if (statsContent) statsContent.style.display = 'none';
    
    if (tabName === 'wall' && wallContent) {
        wallContent.style.display = 'block';
        loadPosts();
    } else if (tabName === 'news' && newsContent) {
        newsContent.style.display = 'block';
        loadNews();
    } else if (tabName === 'friends' && friendsContent) {
        friendsContent.style.display = 'block';
        loadMyFriends();
    } else if (tabName === 'stats' && statsContent) {
        statsContent.style.display = 'block';
        loadStats();  // <-- ВЫЗОВ ЗДЕСЬ
    }
    
    navItems.forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-page') === tabName) {
            item.classList.add('active');
        }
    });
}

if (navItems) {
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.getAttribute('data-page');
            if (page) switchTab(page);
        });
    });
}

// ============ МОДАЛЬНЫЕ ОКНА ============
if (publishBtn) {
    publishBtn.onclick = function() {
        if (modal) modal.style.display = 'block';
        if (newPostContent) newPostContent.value = '';
    }
}

if (editStatusBtn && userStatusElement) {
    editStatusBtn.onclick = function() {
        if (statusModal) statusModal.style.display = 'block';
        if (statusInput) {
            const currentStatus = userStatusElement.textContent === 'Укажите ваш статус' ? '' : userStatusElement.textContent;
            statusInput.value = currentStatus;
            updateCharCount();
        }
    }
}

if (requestsBtn) {
    requestsBtn.onclick = function() {
        loadRequests();
        if (requestsModal) requestsModal.style.display = 'block';
    }
}

if (closeBtn) {
    closeBtn.onclick = function() {
        if (modal) modal.style.display = 'none';
    }
}

if (closeStatusBtn) {
    closeStatusBtn.onclick = function() {
        if (statusModal) statusModal.style.display = 'none';
    }
}

if (closeRequestsBtn) {
    closeRequestsBtn.onclick = function() {
        if (requestsModal) requestsModal.style.display = 'none';
    }
}

window.onclick = function(event) {
    if (event.target == modal && modal) modal.style.display = 'none';
    if (event.target == statusModal && statusModal) statusModal.style.display = 'none';
    if (event.target == requestsModal && requestsModal) requestsModal.style.display = 'none';
}

// ============ СТАТУС ============
function updateCharCount() {
    if (statusInput) {
        const count = statusInput.value.length;
        const counter = document.querySelector('.char-counter');
        if (counter) counter.textContent = `${count}/200`;
    }
}

if (statusInput) {
    statusInput.addEventListener('input', updateCharCount);
}

async function saveStatus() {
    if (!statusInput) return;
    
    const newStatus = statusInput.value.trim();
    
    const formData = new FormData();
    formData.append('status', newStatus);
    
    try {
        const response = await fetch('/api/me/status', {
            method: 'PUT',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success && userStatusElement) {
            userStatusElement.textContent = newStatus || 'Укажите ваш статус';
            if (statusModal) statusModal.style.display = 'none';
        } else {
            alert(data.message || 'Ошибка сохранения статуса');
        }
    } catch (error) {
        console.error('Ошибка сохранения статуса:', error);
        alert('Ошибка сохранения статуса');
    }
}

if (saveStatusBtn) {
    saveStatusBtn.addEventListener('click', saveStatus);
}

// ============ ПОЛЬЗОВАТЕЛЬ ============
async function loadUserInfo() {
    try {
        const response = await fetch('/api/me');
        const data = await response.json();
        
        if (data.success) {
            if (usernameElement) usernameElement.textContent = data.user.full_name;
            if (userStatusElement) userStatusElement.textContent = data.user.status || 'Укажите ваш статус';
            if (avatarPreview && data.user.avatar) {
                avatarPreview.src = data.user.avatar + '?t=' + new Date().getTime();
            }
        } else {
            window.location.href = '/';
        }
    } catch (error) {
        console.error('Ошибка загрузки пользователя:', error);
        window.location.href = '/';
    }
}

// ============ АВАТАР ============
async function loadAvatar() {
    try {
        const response = await fetch('/api/me/avatar');
        const data = await response.json();
        
        if (data.success && avatarPreview && data.avatar_url) {
            avatarPreview.src = data.avatar_url + '?t=' + new Date().getTime();
        }
    } catch (error) {
        console.error('Ошибка загрузки аватара:', error);
    }
}

if (changeAvatarLabel) {
    const newBtn = changeAvatarLabel.cloneNode(true);
    changeAvatarLabel.parentNode.replaceChild(newBtn, changeAvatarLabel);
    changeAvatarLabel = newBtn;
    
    changeAvatarLabel.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        if (avatarUpload) {
            avatarUpload.click();
        }
    });
}

if (avatarUpload) {
    avatarUpload.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            alert('Разрешены только изображения (JPEG, PNG, GIF, WEBP)');
            avatarUpload.value = '';
            return;
        }
        
        if (file.size > 5 * 1024 * 1024) {
            alert('Файл не должен превышать 5MB');
            avatarUpload.value = '';
            return;
        }
        
        const formData = new FormData();
        formData.append('avatar', file);
        
        try {
            const response = await fetch('/api/me/avatar', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (data.success) {
                if (avatarPreview) {
                    avatarPreview.src = data.avatar_url + '?t=' + new Date().getTime();
                }
                alert('Аватар успешно обновлен!');
            } else {
                alert(data.message || 'Ошибка загрузки аватара');
            }
        } catch (error) {
            console.error('Ошибка загрузки аватара:', error);
            alert('Ошибка загрузки аватара');
        }
        
        avatarUpload.value = '';
    });
}

// ============ ПОСТЫ ============
// Предпросмотр изображения
if (postImageInput) {
    postImageInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            postImageFile = file;
            const reader = new FileReader();
            reader.onload = function(event) {
                previewImg.src = event.target.result;
                imagePreview.style.display = 'inline-block';
            }
            reader.readAsDataURL(file);
        }
    });
}

// Удаление изображения
if (removeImageBtn) {
    removeImageBtn.addEventListener('click', function() {
        postImageFile = null;
        postImageInput.value = '';
        imagePreview.style.display = 'none';
        previewImg.src = '';
    });
}
async function loadPosts() {
    try {
        const response = await fetch('/api/posts');
        const data = await response.json();
        
        const postsFeed = document.getElementById('posts-feed');
        if (!postsFeed) return;
        
        if (data.success) {
            if (data.posts.length === 0) {
                postsFeed.innerHTML = '<div class="post-card"><p style="text-align: center; color: #888;">У вас пока нет постов. Создайте первый!</p></div>';
            } else {
                postsFeed.innerHTML = '';
                for (const post of data.posts) {
                    postsFeed.innerHTML += createPostHTML(post);
                }
            }
        } else {
            postsFeed.innerHTML = '<div class="post-card"><p style="text-align: center; color: #888;">Ошибка загрузки постов</p></div>';
        }
    } catch (error) {
        console.error('Ошибка загрузки постов:', error);
        const postsFeed = document.getElementById('posts-feed');
        if (postsFeed) postsFeed.innerHTML = '<div class="post-card"><p style="text-align: center; color: #888;">Ошибка загрузки постов</p></div>';
    }
}

function createPostHTML(post) {
    const likedClass = post.user_liked ? 'liked' : '';
    const likeIcon = post.user_liked ? '❤️' : '🤍';
    const commentsCount = post.comments_count || 0;
    const imageHtml = post.image_url ? `<img src="${post.image_url}" class="post-image" alt="post image">` : '';
    
    return `
        <div class="post-card" id="post-${post.id}" data-post-id="${post.id}">
            <div class="post-header">
                <div class="post-author">
                    <div class="post-avatar"></div>
                    <span class="post-author-name">${escapeHtml(post.author_name)}</span>
                </div>
                <div class="post-date">${new Date(post.created_at).toLocaleString('ru-RU')}</div>
            </div>
            <div class="post-content">
                <p>${escapeHtml(post.content)}</p>
                ${imageHtml}
            </div>
            <div class="post-stats">
                <span class="likes">❤️ <span id="likes-${post.id}">${post.likes_count}</span></span>
                <span class="comments">💬 <span class="comments-count" id="comments-count-${post.id}">${commentsCount}</span></span>
            </div>
            <div class="post-actions-buttons">
                <button class="action-btn like-btn ${likedClass}" onclick="likePost(${post.id})">
                    ${likeIcon} Нравится
                </button>
                <button class="action-btn toggle-comments-btn" onclick="toggleComments(${post.id})">
                    💬 Показать комментарии
                </button>
                <button class="action-btn delete-post-btn" onclick="deletePost(${post.id})">🗑️ Удалить</button>
            </div>
            <div id="comments-block-${post.id}" class="comments-block" style="display: none;">
                <div id="comments-container-${post.id}" class="comments-container">
                    <div class="comment-placeholder">Загрузка...</div>
                </div>
                <div class="add-comment">
                    <input type="text" id="comment-input-${post.id}" placeholder="Написать комментарий..." class="comment-input">
                    <button class="comment-submit" onclick="addComment(${post.id})">Отправить</button>
                </div>
            </div>
        </div>
    `;
}

async function createPost() {
    const content = newPostContent.value.trim();
    
    if (!content && !postImageFile) {
        alert('Напишите что-нибудь или добавьте изображение!');
        return;
    }
    
    const formData = new FormData();
    formData.append('content', content || '');
    if (postImageFile) {
        formData.append('image', postImageFile);
    }
    
    try {
        const response = await fetch('/api/posts', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            modal.style.display = 'none';
            newPostContent.value = '';
            postImageFile = null;
            postImageInput.value = '';
            imagePreview.style.display = 'none';
            previewImg.src = '';
            await loadPosts();
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error('Ошибка создания поста:', error);
        alert('Ошибка создания поста');
    }
}

async function deletePost(postId) {
    if (!confirm('Вы уверены, что хотите удалить этот пост?')) return;
    
    try {
        const response = await fetch(`/api/posts/${postId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Пост удален');
            await loadPosts();
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error('Ошибка удаления поста:', error);
        alert('Ошибка удаления поста');
    }
}

async function likePost(postId) {
    try {
        const response = await fetch(`/api/posts/${postId}/like`, {
            method: 'POST'
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Обновляем счетчик лайков на стене
            const likesSpan = document.getElementById(`likes-${postId}`);
            if (likesSpan) {
                likesSpan.textContent = data.likes_count;
            }
            
            // Обновляем кнопку лайка на стене
            const likeBtn = document.getElementById(`like-btn-${postId}`);
            if (likeBtn) {
                if (data.liked) {
                    likeBtn.classList.add('liked');
                    likeBtn.innerHTML = '❤️ Нравится';
                } else {
                    likeBtn.classList.remove('liked');
                    likeBtn.innerHTML = '🤍 Нравится';
                }
            }
            
            // Обновляем в ленте новостей
            const newsLikesSpan = document.getElementById(`news-likes-${postId}`);
            if (newsLikesSpan) {
                newsLikesSpan.textContent = data.likes_count;
            }
        }
    } catch (error) {
        console.error('Ошибка лайка:', error);
    }
}

if (submitPostBtn) {
    submitPostBtn.addEventListener('click', createPost);
}

// ============ НОВОСТИ ============
async function loadNews() {
    try {
        const response = await fetch('/api/news');
        const data = await response.json();
        
        const newsFeed = document.getElementById('news-feed');
        if (!newsFeed) return;
        
        if (data.success) {
            if (data.posts.length === 0) {
                newsFeed.innerHTML = '<div class="post-card"><p style="text-align: center; color: #888;">Новостей пока нет. Добавьте друзей!</p></div>';
            } else {
                newsFeed.innerHTML = '';
                for (const post of data.posts) {
                    newsFeed.innerHTML += createNewsPostHTML(post);
                }
            }
        } else {
            newsFeed.innerHTML = '<div class="post-card"><p style="text-align: center; color: #888;">Ошибка загрузки новостей</p></div>';
        }
    } catch (error) {
        console.error('Ошибка загрузки новостей:', error);
        const newsFeed = document.getElementById('news-feed');
        if (newsFeed) newsFeed.innerHTML = '<div class="post-card"><p style="text-align: center; color: #888;">Ошибка загрузки новостей</p></div>';
    }
}

function createNewsPostHTML(post) {
    const likedClass = post.user_liked ? 'liked' : '';
    const likeIcon = post.user_liked ? '❤️' : '🤍';
    const commentsCount = post.comments_count || 0;
    const imageHtml = post.image_url ? `<img src="${post.image_url}" class="post-image" alt="post image">` : '';
    
    return `
        <div class="post-card" id="post-${post.id}" data-post-id="${post.id}">
            <div class="post-header">
                <div class="post-author">
                    <div class="post-avatar"></div>
                    <span class="post-author-name">${escapeHtml(post.author_name)}</span>
                </div>
                <div class="post-date">${new Date(post.created_at).toLocaleString('ru-RU')}</div>
            </div>
            <div class="post-content">
                <p>${escapeHtml(post.content)}</p>
                ${imageHtml}
            </div>
            <div class="post-stats">
                <span class="likes">❤️ <span id="news-likes-${post.id}">${post.likes_count}</span></span>
                <span class="comments">💬 <span class="comments-count" id="news-comments-count-${post.id}">${commentsCount}</span></span>
            </div>
            <div class="post-actions-buttons">
                <button class="action-btn like-btn ${likedClass}" onclick="likeNewsPost(${post.id})">
                    ${likeIcon} Нравится
                </button>
                <button class="action-btn toggle-comments-btn" onclick="toggleComments(${post.id})">
                    💬 Показать комментарии
                </button>
            </div>
            <div id="comments-block-${post.id}" class="comments-block" style="display: none;">
                <div id="comments-container-${post.id}" class="comments-container">
                    <div class="comment-placeholder">Загрузка...</div>
                </div>
                <div class="add-comment">
                    <input type="text" id="comment-input-${post.id}" placeholder="Написать комментарий..." class="comment-input">
                    <button class="comment-submit" onclick="addComment(${post.id})">Отправить</button>
                </div>
            </div>
        </div>
    `;
}

async function likeNewsPost(postId) {
    try {
        const response = await fetch(`/api/posts/${postId}/like`, {
            method: 'POST'
        });
        
        const data = await response.json();
        console.log('Лайк ответ (новости):', data);
        
        if (data.success) {
            const postCard = document.querySelector(`#news-feed .post-card[data-post-id="${postId}"]`);
            if (postCard) {
                const likesSpan = postCard.querySelector('.likes span');
                if (likesSpan) {
                    likesSpan.textContent = data.likes_count;
                }
                
                // Обновляем кнопку лайка
                const likeBtn = postCard.querySelector('.like-btn');
                if (likeBtn) {
                    if (data.liked) {
                        likeBtn.classList.add('liked');
                        likeBtn.innerHTML = '❤️ Нравится';
                    } else {
                        likeBtn.classList.remove('liked');
                        likeBtn.innerHTML = '🤍 Нравится';
                    }
                }
            }
            
            const wallPostCard = document.querySelector(`#posts-feed .post-card[data-post-id="${postId}"]`);
            if (wallPostCard) {
                const likesSpan = wallPostCard.querySelector('.likes span');
                if (likesSpan) {
                    likesSpan.textContent = data.likes_count;
                }
                
                const likeBtn = wallPostCard.querySelector('.like-btn');
                if (likeBtn) {
                    if (data.liked) {
                        likeBtn.classList.add('liked');
                        likeBtn.innerHTML = '❤️ Нравится';
                    } else {
                        likeBtn.classList.remove('liked');
                        likeBtn.innerHTML = '🤍 Нравится';
                    }
                }
            }
        }
    } catch (error) {
        console.error('Ошибка лайка в новостях:', error);
    }
}

async function loadComments(postId) {
    try {
        const response = await fetch(`/api/posts/${postId}/comments`);
        const data = await response.json();
        
        const commentsContainer = document.getElementById(`comments-container-${postId}`);
        if (!commentsContainer) return;
        
        if (data.success && data.comments.length > 0) {
            commentsContainer.innerHTML = '';
            for (const comment of data.comments) {
                commentsContainer.innerHTML += `
                    <div class="comment">
                        <div class="comment-header">
                            <strong class="comment-author">${escapeHtml(comment.author_name)}</strong>
                            <span class="comment-date">${new Date(comment.created_at).toLocaleString('ru-RU')}</span>
                        </div>
                        <div class="comment-text">${escapeHtml(comment.content)}</div>
                    </div>
                `;
            }
        } else {
            commentsContainer.innerHTML = '<div class="comment-placeholder">Нет комментариев. Будьте первым!</div>';
        }
    } catch (error) {
        console.error('Ошибка загрузки комментариев:', error);
    }
}

async function addComment(postId) {
    const input = document.getElementById(`comment-input-${postId}`);
    const content = input.value.trim();
    
    if (!content) {
        alert('Напишите комментарий!');
        return;
    }
    
    const formData = new FormData();
    formData.append('post_id', postId);
    formData.append('content', content);
    
    try {
        const response = await fetch('/api/comments', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            input.value = '';
            await loadComments(postId);
            // Обновляем счетчик комментариев
            const commentsCountSpan = document.querySelector(`#post-${postId} .comments-count`);
            if (commentsCountSpan) {
                const currentCount = parseInt(commentsCountSpan.textContent) || 0;
                commentsCountSpan.textContent = currentCount + 1;
            }
        } else {
            alert(data.message || 'Ошибка добавления комментария');
        }
    } catch (error) {
        console.error('Ошибка добавления комментария:', error);
        alert('Ошибка добавления комментария');
    }
}

async function toggleComments(postId) {
    const commentsBlock = document.getElementById(`comments-block-${postId}`);
    const commentsBtn = document.querySelector(`#post-${postId} .toggle-comments-btn`);
    
    if (commentsBlock.style.display === 'none') {
        commentsBlock.style.display = 'block';
        if (commentsBtn) commentsBtn.textContent = '💬 Скрыть комментарии';
        await loadComments(postId);
    } else {
        commentsBlock.style.display = 'none';
        if (commentsBtn) commentsBtn.textContent = '💬 Показать комментарии';
    }
}

// ============ ДРУЗЬЯ ============
async function loadMyFriends() {
    if (!myFriendsList) return;
    
    try {
        const response = await fetch('/api/friends');
        const data = await response.json();
        
        if (data.success) {
            if (data.friends.length === 0) {
                myFriendsList.innerHTML = '<div class="friend-card"><p style="color: #888; text-align: center; width: 100%;">У вас пока нет друзей</p></div>';
            } else {
                myFriendsList.innerHTML = data.friends.map(friend => `
                    <div class="friend-card">
                        <div class="friend-info">
                            <span class="friend-name">${escapeHtml(friend.full_name)}</span>
                            <span class="friend-status">${escapeHtml(friend.status || '')}</span>
                        </div>
                        <div class="friend-actions">
                            <button class="friend-action-btn remove-friend-btn" onclick="removeFriend(${friend.id})">Удалить</button>
                        </div>
                    </div>
                `).join('');
            }
        }
    } catch (error) {
        console.error('Ошибка загрузки друзей:', error);
        myFriendsList.innerHTML = '<div class="friend-card"><p style="color: #888; text-align: center; width: 100%;">Ошибка загрузки</p></div>';
    }
}

async function loadFindFriends() {
    if (!findFriendsList) return;
    
    try {
        const response = await fetch('/api/friends/suggestions');
        const data = await response.json();
        
        if (data.success) {
            if (data.users.length === 0) {
                findFriendsList.innerHTML = '<div class="friend-card"><p style="color: #888; text-align: center; width: 100%;">Нет пользователей для добавления</p></div>';
            } else {
                findFriendsList.innerHTML = data.users.map(user => `
                    <div class="friend-card">
                        <div class="friend-info">
                            <span class="friend-name">${escapeHtml(user.full_name)}</span>
                            <span class="friend-status">${escapeHtml(user.status || '')}</span>
                        </div>
                        <div class="friend-actions">
                            <button class="friend-action-btn add-friend-btn" onclick="sendFriendRequest(${user.id})">Добавить в друзья</button>
                        </div>
                    </div>
                `).join('');
            }
        }
    } catch (error) {
        console.error('Ошибка загрузки предложений:', error);
        findFriendsList.innerHTML = '<div class="friend-card"><p style="color: #888; text-align: center; width: 100%;">Ошибка загрузки</p></div>';
    }
}

async function sendFriendRequest(friendId) {
    try {
        const response = await fetch(`/api/friends/request/${friendId}`, {
            method: 'POST'
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Заявка отправлена');
            loadFindFriends();
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error('Ошибка отправки заявки:', error);
        alert('Ошибка отправки заявки');
    }
}

async function removeFriend(friendId) {
    if (!confirm('Вы уверены, что хотите удалить этого друга?')) return;
    
    try {
        const response = await fetch(`/api/friends/${friendId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Друг удален');
            loadMyFriends();
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error('Ошибка удаления друга:', error);
        alert('Ошибка удаления друга');
    }
}

async function loadRequests() {
    try {
        const response = await fetch('/api/friends/requests/incoming');
        const data = await response.json();
        
        if (data.success) {
            const count = data.requests.length;
            if (requestsCountSpan) {
                if (count > 0) {
                    requestsCountSpan.textContent = count;
                    requestsCountSpan.style.display = 'inline-block';
                } else {
                    requestsCountSpan.textContent = '';
                    requestsCountSpan.style.display = 'none';
                }
            }
            
            const requestsList = document.getElementById('requests-list');
            if (requestsList) {
                if (data.requests.length === 0) {
                    requestsList.innerHTML = '<p style="text-align: center; color: #888;">Нет входящих заявок</p>';
                } else {
                    requestsList.innerHTML = data.requests.map(req => `
                        <div class="friend-card">
                            <div class="friend-info">
                                <span class="friend-name">${escapeHtml(req.full_name)}</span>
                                <span class="friend-status">хочет добавить вас в друзья</span>
                            </div>
                            <div class="friend-actions">
                                <button class="friend-action-btn accept-btn" onclick="acceptRequest(${req.id})">Принять</button>
                                <button class="friend-action-btn reject-btn" onclick="rejectRequest(${req.id})">Отклонить</button>
                            </div>
                        </div>
                    `).join('');
                }
            }
        }
    } catch (error) {
        console.error('Ошибка загрузки заявок:', error);
    }
}

async function acceptRequest(requestId) {
    try {
        const response = await fetch(`/api/friends/accept/${requestId}`, {
            method: 'POST'
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Заявка принята');
            loadRequests();
            loadMyFriends();
            if (requestsModal) requestsModal.style.display = 'none';
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error('Ошибка принятия заявки:', error);
        alert('Ошибка принятия заявки');
    }
}

async function rejectRequest(requestId) {
    try {
        const response = await fetch(`/api/friends/reject/${requestId}`, {
            method: 'POST'
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Заявка отклонена');
            loadRequests();
            if (requestsModal) requestsModal.style.display = 'none';
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error('Ошибка отклонения заявки:', error);
        alert('Ошибка отклонения заявки');
    }
}

if (friendsTabBtns) {
    friendsTabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.getAttribute('data-friend-tab');
            
            friendsTabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            if (tab === 'my' && myFriendsList && findFriendsList) {
                myFriendsList.style.display = 'flex';
                findFriendsList.style.display = 'none';
                loadMyFriends();
            } else if (findFriendsList && myFriendsList) {
                myFriendsList.style.display = 'none';
                findFriendsList.style.display = 'flex';
                loadFindFriends();
            }
        });
    });
}

// ============ СТАТИСТИКА ============
async function loadStats() {
    try {
        const response = await fetch('/api/stats/posts');
        const data = await response.json();
        
        if (data.success) {
            const stats = data.stats;
            const days = stats.map(s => s.day);
            const counts = stats.map(s => s.count);
            const totalPosts = counts.reduce((a, b) => a + b, 0);
            const maxCount = Math.max(...counts);
            const bestDay = stats.find(s => s.count === maxCount);
            
            // Обновляем сводку
            const summaryDiv = document.getElementById('stats-summary');
            if (summaryDiv) {
                summaryDiv.innerHTML = `
                    <div class="total-posts">Всего постов: ${totalPosts}</div>
                    ${bestDay && bestDay.count > 0 ? `<div class="best-day">📈 Лучший день: ${bestDay.day} (${bestDay.count} постов)</div>` : ''}
                `;
            }
            
            // Создаем или обновляем график
            const ctx = document.getElementById('postsChart').getContext('2d');
            
            if (postsChart) {
                postsChart.destroy();
            }
            
            postsChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: days,
                    datasets: [{
                        label: 'Количество постов',
                        data: counts,
                        backgroundColor: 'rgba(76, 175, 80, 0.7)',
                        borderColor: 'rgba(76, 175, 80, 1)',
                        borderWidth: 1,
                        borderRadius: 8
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                stepSize: 1,
                                color: '#888888'
                            },
                            grid: {
                                color: '#2a2a2a'
                            }
                        },
                        x: {
                            ticks: {
                                color: '#888888'
                            },
                            grid: {
                                color: '#2a2a2a'
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            labels: {
                                color: '#ffffff'
                            }
                        }
                    }
                }
            });
        }
    } catch (error) {
        console.error('Ошибка загрузки статистики:', error);
        const summaryDiv = document.getElementById('stats-summary');
        if (summaryDiv) {
            summaryDiv.innerHTML = '<div class="stats-summary">Ошибка загрузки статистики</div>';
        }
    }
}


// ============ ВЫХОД ============
async function logout() {
    try {
        await fetch('/api/logout', { method: 'POST' });
    } catch (error) {
        console.error('Ошибка выхода:', error);
    }
    document.cookie = 'session_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    window.location.href = '/';
}

if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
}

// ============ ЗАЩИТА ============
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============ ИНИЦИАЛИЗАЦИЯ ============
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM загружен, инициализация...');
    loadUserInfo();
    loadAvatar();
    loadPosts();
});