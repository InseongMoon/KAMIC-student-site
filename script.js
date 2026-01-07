// 사용자 계정 데이터는 users-config.js에서 가져옵니다
// USERS 객체가 users-config.js에 정의되어 있어야 합니다

// 현재 로그인 상태
let isLoggedIn = false;
let currentUser = null;

// 생일 배경 음악
let birthdayMusic = null;

// 페이지 로드 시 로그인 상태 확인 및 저장된 정보 불러오기
window.addEventListener('DOMContentLoaded', function() {
    checkLoginStatus();
    loadRememberedCredentials();
    // 초기 갤러리 표시 상태 설정
    updateGalleryVisibility();
    // 생일 섹션 업데이트
    updateBirthdaySection();
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
    // 생일 섹션도 업데이트
    updateBirthdaySection();
}

// 오늘 날짜 가져오기 (MM-DD 형식)
function getTodayString() {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${month}-${day}`;
}

// 오늘 생일인 사람들 가져오기
function getTodayBirthdays() {
    if (typeof BIRTHDAYS === 'undefined') return [];
    const todayStr = getTodayString();
    return BIRTHDAYS.filter(person => person.birthday === todayStr);
}

// 특정 월의 생일자 가져오기
function getBirthdaysByMonth(month) {
    if (typeof BIRTHDAYS === 'undefined') return [];
    const monthStr = String(month).padStart(2, '0');
    return BIRTHDAYS.filter(person => person.birthday.startsWith(monthStr + '-'));
}

// 생일 섹션 업데이트
function updateBirthdaySection() {
    const birthdaySection = document.getElementById('birthdaySection');
    const todayBirthdaySection = document.getElementById('todayBirthdaySection');
    
    if (!birthdaySection || !todayBirthdaySection) return;
    
    // 로그인 상태가 아니면 둘 다 숨김
    if (!isLoggedIn) {
        birthdaySection.style.display = 'none';
        todayBirthdaySection.style.display = 'none';
        removeConfetti();
        stopBirthdayMusic();
        return;
    }
    
    // 오늘 생일인 사람들 확인
    const todayBirthdays = getTodayBirthdays();
    
    if (todayBirthdays.length > 0) {
        // 생일 당일: 오늘 생일자만 표시
        birthdaySection.style.display = 'none';
        todayBirthdaySection.style.display = 'block';
        renderTodayBirthdays(todayBirthdays);
        createConfetti();
        playBirthdayMusic();
    } else {
        // 생일 아닌 날: 월별 캘린더 표시
        todayBirthdaySection.style.display = 'none';
        birthdaySection.style.display = 'block';
        renderMonthlyBirthdays();
        removeConfetti();
        stopBirthdayMusic();
    }
}

// 오늘 생일자 렌더링
function renderTodayBirthdays(birthdays) {
    const container = document.getElementById('todayBirthdayContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    birthdays.forEach((person, index) => {
        const card = document.createElement('div');
        card.className = 'today-birthday-card';
        card.style.animationDelay = `${index * 0.2}s`;
        
        card.innerHTML = `
            <img src="${person.photo}" alt="${person.name}" class="today-birthday-photo" 
                 onerror="this.src='images/default-profile.png'">
            <div class="today-birthday-name">${person.name}</div>
            <div class="today-birthday-message">생일 축하합니다! 🎊</div>
        `;
        
        container.appendChild(card);
    });
}

// 월별 생일자 렌더링
function renderMonthlyBirthdays() {
    for (let month = 1; month <= 12; month++) {
        const monthCard = document.querySelector(`.month-card[data-month="${month}"]`);
        if (!monthCard) continue;
        
        const membersContainer = monthCard.querySelector('.month-members');
        if (!membersContainer) continue;
        
        membersContainer.innerHTML = '';
        
        const monthBirthdays = getBirthdaysByMonth(month);
        
        if (monthBirthdays.length === 0) {
            membersContainer.innerHTML = '<div class="no-birthday">-</div>';
        } else {
            monthBirthdays.forEach(person => {
                const day = person.birthday.split('-')[1];
                const memberItem = document.createElement('div');
                memberItem.className = 'member-item';
                
                memberItem.innerHTML = `
                    <img src="${person.photo}" alt="${person.name}" class="member-photo"
                         onerror="this.src='images/default-profile.png'">
                    <div class="member-info">
                        <div class="member-name">${person.name}</div>
                        <div class="member-date">${parseInt(day)}일</div>
                    </div>
                `;
                
                membersContainer.appendChild(memberItem);
            });
        }
    }
}

// 색종이 애니메이션 인터벌
let confettiInterval = null;

// 색종이 효과 생성
function createConfetti() {
    // 이미 색종이가 있으면 생성하지 않음
    if (confettiInterval) return;
    
    // 초기 색종이 생성
    for (let i = 0; i < 50; i++) {
        setTimeout(() => createSingleConfetti(), i * 100);
    }
    
    // 지속적으로 색종이 생성
    confettiInterval = setInterval(() => {
        createSingleConfetti();
    }, 200);
    
    // 폭죽 효과도 시작
    createFireworks();
}

// 단일 색종이 생성
function createSingleConfetti() {
    const colors = ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3', '#1dd1a1', '#ff6348', '#ffd32a', '#gold', '#silver'];
    const shapes = ['circle', 'square', 'ribbon', 'star'];
    
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    const shape = shapes[Math.floor(Math.random() * shapes.length)];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const size = 8 + Math.random() * 12;
    const startX = Math.random() * 100;
    const duration = 4 + Math.random() * 3;
    const swayAmount = 100 + Math.random() * 100;
    const rotations = 2 + Math.random() * 3;
    
    confetti.style.cssText = `
        position: fixed;
        left: ${startX}vw;
        top: -20px;
        width: ${size}px;
        height: ${size}px;
        z-index: 999;
        pointer-events: none;
        animation: confettiFall${Math.random() > 0.5 ? 'Left' : 'Right'} ${duration}s linear forwards;
    `;
    
    // 모양별 스타일
    if (shape === 'circle') {
        confetti.style.backgroundColor = color;
        confetti.style.borderRadius = '50%';
    } else if (shape === 'square') {
        confetti.style.backgroundColor = color;
        confetti.style.borderRadius = '2px';
    } else if (shape === 'ribbon') {
        confetti.style.width = `${size * 0.4}px`;
        confetti.style.height = `${size * 1.5}px`;
        confetti.style.backgroundColor = color;
        confetti.style.borderRadius = '2px';
    } else if (shape === 'star') {
        confetti.innerHTML = '★';
        confetti.style.backgroundColor = 'transparent';
        confetti.style.color = color;
        confetti.style.fontSize = `${size}px`;
        confetti.style.width = 'auto';
        confetti.style.height = 'auto';
        confetti.style.textShadow = `0 0 5px ${color}`;
    }
    
    document.body.appendChild(confetti);
    
    // 애니메이션 완료 후 제거
    setTimeout(() => {
        confetti.remove();
    }, duration * 1000);
}

// 색종이 효과 제거
function removeConfetti() {
    // 색종이 생성 중지
    if (confettiInterval) {
        clearInterval(confettiInterval);
        confettiInterval = null;
    }
    // 기존 색종이 제거
    const confettis = document.querySelectorAll('.confetti');
    confettis.forEach(c => c.remove());
    // 폭죽도 제거
    removeFireworks();
}

// 폭죽 효과 생성
let fireworksInterval = null;

function createFireworks() {
    // 이미 폭죽이 있으면 무시
    if (fireworksInterval) return;
    
    // 폭죽 컨테이너 생성
    const container = document.createElement('div');
    container.id = 'fireworks-container';
    container.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 998;
        overflow: hidden;
    `;
    document.body.appendChild(container);
    
    // 주기적으로 폭죽 발사
    launchFirework();
    fireworksInterval = setInterval(launchFirework, 2000);
}

// 폭죽 발사
function launchFirework() {
    const container = document.getElementById('fireworks-container');
    if (!container) return;
    
    const colors = ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3', '#1dd1a1'];
    const x = 10 + Math.random() * 80; // 화면 10%~90% 위치
    const y = 20 + Math.random() * 40; // 화면 20%~60% 높이
    
    // 폭죽 중심
    const firework = document.createElement('div');
    firework.className = 'firework';
    firework.style.cssText = `
        position: absolute;
        left: ${x}%;
        top: ${y}%;
    `;
    
    // 폭죽 파편 생성
    const particleCount = 30 + Math.floor(Math.random() * 20);
    const mainColor = colors[Math.floor(Math.random() * colors.length)];
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'firework-particle';
        const angle = (i / particleCount) * Math.PI * 2; // 라디안으로 변환
        const distance = 50 + Math.random() * 100;
        const size = 4 + Math.random() * 4;
        const duration = 1 + Math.random() * 0.5;
        
        // 목표 위치 계산
        const targetX = Math.cos(angle) * distance;
        const targetY = Math.sin(angle) * distance;
        
        particle.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            background: ${mainColor};
            border-radius: 50%;
            box-shadow: 0 0 ${size * 2}px ${mainColor}, 0 0 ${size * 4}px ${mainColor};
            transform: translate(0, 0) scale(1);
            opacity: 1;
            transition: all ${duration}s ease-out;
        `;
        
        firework.appendChild(particle);
        
        // 약간의 지연 후 애니메이션 시작
        setTimeout(() => {
            particle.style.transform = `translate(${targetX}px, ${targetY}px) scale(0)`;
            particle.style.opacity = '0';
        }, 50);
    }
    
    container.appendChild(firework);
    
    // 2초 후 폭죽 제거
    setTimeout(() => {
        firework.remove();
    }, 2000);
}

// 폭죽 효과 제거
function removeFireworks() {
    if (fireworksInterval) {
        clearInterval(fireworksInterval);
        fireworksInterval = null;
    }
    const container = document.getElementById('fireworks-container');
    if (container) container.remove();
}

// 음악 재생 상태 추적
let isMusicPlaying = false;

// 생일 음악 초기화 및 버튼 표시
function playBirthdayMusic() {
    // 음악 객체가 없으면 생성
    if (!birthdayMusic) {
        birthdayMusic = new Audio('images/birthdays/happy_birthday.mp3');
        birthdayMusic.loop = true; // 반복 재생
        birthdayMusic.volume = 0.5; // 볼륨 50%
    }
    
    // 음악 컨트롤 버튼 표시
    showMusicControlButton();
    
    // 음악 자동 재생 시도
    birthdayMusic.play().then(function() {
        isMusicPlaying = true;
        updateMusicButtonState();
    }).catch(function(error) {
        console.log('자동 재생이 차단되었습니다. 버튼을 클릭해주세요.');
        isMusicPlaying = false;
        updateMusicButtonState();
    });
}

// 생일 음악 중지 및 버튼 제거
function stopBirthdayMusic() {
    if (birthdayMusic) {
        birthdayMusic.pause();
        birthdayMusic.currentTime = 0;
        isMusicPlaying = false;
    }
    // 음악 버튼 제거
    hideMusicControlButton();
}

// 음악 재생/일시정지 토글
function toggleBirthdayMusic() {
    if (!birthdayMusic) return;
    
    if (isMusicPlaying) {
        birthdayMusic.pause();
        isMusicPlaying = false;
    } else {
        birthdayMusic.play().then(function() {
            isMusicPlaying = true;
        }).catch(function(error) {
            console.log('재생 실패:', error);
        });
    }
    updateMusicButtonState();
}

// 음악 컨트롤 버튼 표시 (생일일 때만)
function showMusicControlButton() {
    // 이미 버튼이 있으면 무시
    if (document.getElementById('musicControlBtn')) return;
    
    const btn = document.createElement('button');
    btn.id = 'musicControlBtn';
    btn.innerHTML = '🎵 음악 재생';
    btn.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        background: linear-gradient(135deg, #ff6b6b 0%, #feca57 100%);
        color: white;
        border: none;
        padding: 15px 25px;
        border-radius: 50px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        box-shadow: 0 4px 20px rgba(255, 107, 107, 0.4);
        z-index: 9999;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        gap: 8px;
    `;
    
    btn.onclick = toggleBirthdayMusic;
    
    // 호버 효과
    btn.onmouseenter = function() {
        btn.style.transform = 'scale(1.05)';
        btn.style.boxShadow = '0 6px 25px rgba(255, 107, 107, 0.6)';
    };
    btn.onmouseleave = function() {
        btn.style.transform = 'scale(1)';
        btn.style.boxShadow = '0 4px 20px rgba(255, 107, 107, 0.4)';
    };
    
    document.body.appendChild(btn);
    updateMusicButtonState();
}

// 음악 버튼 상태 업데이트
function updateMusicButtonState() {
    const btn = document.getElementById('musicControlBtn');
    if (!btn) return;
    
    if (isMusicPlaying) {
        btn.innerHTML = '⏸️ 음악 일시정지';
        btn.style.background = 'linear-gradient(135deg, #5f27cd 0%, #667eea 100%)';
    } else {
        btn.innerHTML = '🎵 음악 재생';
        btn.style.background = 'linear-gradient(135deg, #ff6b6b 0%, #feca57 100%)';
    }
}

// 음악 컨트롤 버튼 숨기기
function hideMusicControlButton() {
    const btn = document.getElementById('musicControlBtn');
    if (btn) btn.remove();
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

// PDF 병합 페이지로 이동 (로그인 체크)
function goToPdfMerge() {
    if (!isLoggedIn) {
        alert('PDF 병합 기능을 사용하려면 로그인이 필요합니다.');
        openLoginModal();
        return;
    }
    window.location.href = 'pdf-merge.html';
}