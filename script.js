// 사용자 계정 데이터는 users-config.js에서 가져옵니다
// USERS 객체가 users-config.js에 정의되어 있어야 합니다

// 현재 로그인 상태
let isLoggedIn = false;
let currentUser = null;

// 페이지 로드 시 로그인 상태 확인 및 저장된 정보 불러오기
window.addEventListener('DOMContentLoaded', function() {
    checkLoginStatus();
    loadRememberedCredentials();
    // 초기 갤러리 표시 상태 설정
    updateGalleryVisibility();
});

// 로그인 모달 열기
function openLoginModal() {
    if (isLoggedIn) {
        logout();
    } else {
        document.getElementById('loginModal').style.display = 'block';
        // 모달이 열릴 때 저장된 정보가 있으면 불러오기
        loadRememberedCredentials();
    }
}

// 로그인 모달 닫기
function closeLoginModal() {
    document.getElementById('loginModal').style.display = 'none';
    document.getElementById('errorMessage').textContent = '';
}

// 모달 외부 클릭 시 닫기 (물품 구매 모달 포함)
window.onclick = function(event) {
    const loginModal = document.getElementById('loginModal');
    const purchaseModal = document.getElementById('purchaseModal');
    
    if (event.target === loginModal) {
        closeLoginModal();
    }
    if (event.target === purchaseModal) {
        closePurchaseModal();
    }
}

// 로그인 처리
function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('rememberMe').checked;
    const errorMessage = document.getElementById('errorMessage');
    
    // 사용자 인증 (users-config.js의 USERS 객체 사용)
    if (typeof USERS === 'undefined') {
        errorMessage.textContent = '사용자 설정 파일을 불러올 수 없습니다.';
        return;
    }
    
    if (USERS[username] && USERS[username] === password) {
        // 로그인 성공
        isLoggedIn = true;
        currentUser = username;
        
        // 로그인 유지 체크박스에 따라 저장 방식 결정
        if (rememberMe) {
            // localStorage에 저장 (브라우저를 닫아도 유지)
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('currentUser', username);
            localStorage.setItem('rememberedUsername', username);
            // 보안상 비밀번호는 저장하지 않음
        } else {
            // sessionStorage에 저장 (탭을 닫으면 사라짐)
            sessionStorage.setItem('isLoggedIn', 'true');
            sessionStorage.setItem('currentUser', username);
            // localStorage에서 이전 정보 제거
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('currentUser');
            localStorage.removeItem('rememberedUsername');
        }
        
        // UI 업데이트
        updateLoginButton();
        updateGalleryVisibility();
        closeLoginModal();
        
        alert(`환영합니다, ${username}님!`);
        
        // 폼 초기화 (로그인 유지가 체크되어 있으면 아이디는 유지)
        if (!rememberMe) {
            document.getElementById('loginForm').reset();
        } else {
            document.getElementById('password').value = '';
        }
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
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('currentUser');
    // 로그인 유지 정보는 유지 (아이디만 기억)
    updateLoginButton();
    updateGalleryVisibility();
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
    // localStorage를 먼저 확인 (로그인 유지)
    let storedLoginStatus = localStorage.getItem('isLoggedIn');
    let storedUsername = localStorage.getItem('currentUser');
    
    // localStorage에 없으면 sessionStorage 확인
    if (!storedLoginStatus || !storedUsername) {
        storedLoginStatus = sessionStorage.getItem('isLoggedIn');
        storedUsername = sessionStorage.getItem('currentUser');
    }
    
    if (storedLoginStatus === 'true' && storedUsername) {
        isLoggedIn = true;
        currentUser = storedUsername;
        updateLoginButton();
        updateGalleryVisibility();
    }
}

// 저장된 로그인 정보 불러오기 (아이디만)
function loadRememberedCredentials() {
    const rememberedUsername = localStorage.getItem('rememberedUsername');
    if (rememberedUsername) {
        document.getElementById('username').value = rememberedUsername;
        document.getElementById('rememberMe').checked = true;
    }
}

// 갤러리 표시/숨김 업데이트
function updateGalleryVisibility() {
    const gallerySection = document.getElementById('gallerySection');
    if (gallerySection) {
        if (isLoggedIn) {
            gallerySection.style.display = 'block';
        } else {
            gallerySection.style.display = 'none';
        }
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

// 갤러리 더보기/접기 토글
function toggleGalleryMore() {
    const moreRows = document.querySelectorAll('.gallery-more');
    const moreText = document.querySelector('.more-text');
    const lessText = document.querySelector('.less-text');
    const btn = document.querySelector('.gallery-more-btn');
    
    if (moreRows[0].style.display === 'none' || moreRows[0].style.display === '') {
        // 더보기 클릭 - 펼치기
        moreRows.forEach(row => {
            row.style.display = 'flex';
        });
        moreText.style.display = 'none';
        lessText.style.display = 'inline';
    } else {
        // 접기 클릭 - 접기
        moreRows.forEach(row => {
            row.style.display = 'none';
        });
        moreText.style.display = 'inline';
        lessText.style.display = 'none';
    }
}

// 물품 구매 모달 열기
function openPurchaseModal() {
    document.getElementById('purchaseModal').style.display = 'block';
}

// 물품 구매 모달 닫기
function closePurchaseModal() {
    document.getElementById('purchaseModal').style.display = 'none';
}