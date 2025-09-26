// 사용자 계정 데이터 (실제로는 서버에서 관리해야 하지만, 간단한 구현을 위해 여기에 저장)
// 깃허브 페이지는 정적 사이트이므로, 실제 보안이 필요한 경우 백엔드 서버가 필요합니다
const users = {
    'admin': 'admin123',
    'student1': 'pass1234',
    'student2': 'pass5678'
};

// 현재 로그인 상태
let isLoggedIn = false;
let currentUser = null;

// 페이지 로드 시 로그인 상태 확인
window.addEventListener('DOMContentLoaded', function() {
    checkLoginStatus();
});

// 로그인 모달 열기
function openLoginModal() {
    if (isLoggedIn) {
        logout();
    } else {
        document.getElementById('loginModal').style.display = 'block';
    }
}

// 로그인 모달 닫기
function closeLoginModal() {
    document.getElementById('loginModal').style.display = 'none';
    document.getElementById('errorMessage').textContent = '';
}

// 모달 외부 클릭 시 닫기
window.onclick = function(event) {
    const modal = document.getElementById('loginModal');
    if (event.target === modal) {
        closeLoginModal();
    }
}

// 로그인 처리
function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('errorMessage');
    
    // 사용자 인증
    if (users[username] && users[username] === password) {
        // 로그인 성공
        isLoggedIn = true;
        currentUser = username;
        
        // 세션 스토리지에 저장 (브라우저 탭이 열려있는 동안만 유지)
        sessionStorage.setItem('isLoggedIn', 'true');
        sessionStorage.setItem('currentUser', username);
        
        // UI 업데이트
        updateLoginButton();
        closeLoginModal();
        
        alert(`환영합니다, ${username}님!`);
        
        // 폼 초기화
        document.getElementById('loginForm').reset();
    } else {
        // 로그인 실패
        errorMessage.textContent = '아이디 또는 비밀번호가 올바르지 않습니다.';
    }
}

// 로그아웃
function logout() {
    isLoggedIn = false;
    currentUser = null;
    sessionStorage.removeItem('isLoggedIn');
    sessionStorage.removeItem('currentUser');
    updateLoginButton();
    alert('로그아웃되었습니다.');
}

// 로그인 버튼 업데이트
function updateLoginButton() {
    const loginBtn = document.querySelector('.login-btn');
    if (isLoggedIn) {
        loginBtn.textContent = `로그아웃 (${currentUser})`;
    } else {
        loginBtn.textContent = '로그인';
    }
}

// 로그인 상태 확인 (페이지 새로고침 시)
function checkLoginStatus() {
    const storedLoginStatus = sessionStorage.getItem('isLoggedIn');
    const storedUsername = sessionStorage.getItem('currentUser');
    
    if (storedLoginStatus === 'true' && storedUsername) {
        isLoggedIn = true;
        currentUser = storedUsername;
        updateLoginButton();
    }
}

// 페이지 보호 함수 (다른 페이지에서 사용)
function requireLogin() {
    if (!isLoggedIn) {
        alert('이 페이지에 접근하려면 로그인이 필요합니다.');
        window.location.href = 'index.html';
        return false;
    }
    return true;
}