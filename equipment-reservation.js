// 장비 예약 페이지 전용 스크립트

// 페이지 로드 시 초기화
window.addEventListener('DOMContentLoaded', function() {
    // 로그인 상태 확인
    checkLoginStatus();
    
    // 로그인 버튼 업데이트
    updateLoginButton();
    
    // 로그인 체크
    if (!isLoggedIn) {
        alert('이 페이지에 접근하려면 로그인이 필요합니다.');
        window.location.href = 'index.html';
        return;
    }

    // 시간 선택 옵션 생성 (00-24시)
    initializeTimeSelects();
    
    // 관리자 모드 체크
    checkAdminMode();
    
    // 내 예약 목록 로드
    loadMyReservations();
    
    // 달력 초기화
    loadCalendar();
});

// 시간 선택 옵션 초기화 (00-24시)
function initializeTimeSelects() {
    const startHour = document.getElementById('startHour');
    const endHour = document.getElementById('endHour');
    
    for (let i = 0; i <= 24; i++) {
        const hour = String(i).padStart(2, '0');
        const option1 = document.createElement('option');
        option1.value = hour;
        option1.textContent = hour + '시';
        startHour.appendChild(option1);
        
        const option2 = document.createElement('option');
        option2.value = hour;
        option2.textContent = hour + '시';
        endHour.appendChild(option2);
    }
}

// 당일사용 체크박스 변경 처리
function handleSameDayChange() {
    const sameDay = document.getElementById('sameDay').checked;
    const startDate = document.getElementById('startDate');
    const endDate = document.getElementById('endDate');
    
    if (sameDay) {
        // 당일사용 체크 시 종료 날짜를 시작 날짜와 동일하게 설정
        if (startDate.value) {
            endDate.value = startDate.value;
        }
        endDate.disabled = true;
        
        // 시작 날짜 변경 시 종료 날짜도 자동 업데이트
        startDate.addEventListener('change', updateEndDateForSameDay);
    } else {
        endDate.disabled = false;
        startDate.removeEventListener('change', updateEndDateForSameDay);
    }
}

// 당일사용 시 종료 날짜 업데이트
function updateEndDateForSameDay() {
    const sameDay = document.getElementById('sameDay').checked;
    const startDate = document.getElementById('startDate');
    const endDate = document.getElementById('endDate');
    
    if (sameDay && startDate.value) {
        endDate.value = startDate.value;
    }
}

// 예약 처리
function handleReservation(event) {
    event.preventDefault();
    
    const editingId = document.getElementById('editingReservationId').value;
    const startDate = document.getElementById('startDate').value;
    const startHour = document.getElementById('startHour').value;
    const endDate = document.getElementById('endDate').value;
    const endHour = document.getElementById('endHour').value;
    const equipment = document.getElementById('equipment').value;
    const messageEl = document.getElementById('reservationMessage');
    
    // 유효성 검사
    if (!startDate || !startHour || !endDate || !endHour || !equipment) {
        messageEl.textContent = '모든 필드를 입력해주세요.';
        messageEl.className = 'error-message';
        messageEl.style.display = 'block';
        return;
    }
    
    // 날짜 및 시간 결합
    const startDateTime = new Date(startDate + 'T' + startHour + ':00:00');
    const endDateTime = new Date(endDate + 'T' + endHour + ':00:00');
    
    // 종료 시간이 시작 시간보다 이전인지 확인
    if (endDateTime <= startDateTime) {
        messageEl.textContent = '종료 시간은 시작 시간보다 늦어야 합니다.';
        messageEl.className = 'error-message';
        messageEl.style.display = 'block';
        return;
    }
    
    // 수정 모드인지 확인
    if (editingId) {
        // 수정 모드: 기존 예약 제외하고 중복 확인
        if (checkReservationConflict(startDateTime, endDateTime, equipment, editingId)) {
            messageEl.textContent = '해당 시간대에 이미 예약이 있습니다.';
            messageEl.className = 'error-message';
            messageEl.style.display = 'block';
            return;
        }
        
        // 예약 수정
        updateReservation(editingId, {
            startDateTime: startDateTime.toISOString(),
            endDateTime: endDateTime.toISOString(),
            equipment: equipment
        });
        
        messageEl.textContent = '예약이 수정되었습니다!';
        messageEl.className = 'success-message';
        messageEl.style.display = 'block';
        
        // 수정 모드 해제
        cancelEdit();
    } else {
        // 새 예약: 중복 확인
        if (checkReservationConflict(startDateTime, endDateTime, equipment)) {
            messageEl.textContent = '해당 시간대에 이미 예약이 있습니다.';
            messageEl.className = 'error-message';
            messageEl.style.display = 'block';
            return;
        }
        
        // 예약 저장
        const reservation = {
            id: Date.now(),
            startDateTime: startDateTime.toISOString(),
            endDateTime: endDateTime.toISOString(),
            equipment: equipment,
            user: currentUser,
            createdAt: new Date().toISOString()
        };
        
        saveReservation(reservation);
        
        // 성공 메시지
        messageEl.textContent = '예약이 완료되었습니다!';
        messageEl.className = 'success-message';
        messageEl.style.display = 'block';
        
        // 폼 초기화
        document.getElementById('reservationForm').reset();
        document.getElementById('sameDay').checked = false;
        document.getElementById('endDate').disabled = false;
    }
    
    // 목록 및 달력 새로고침
    loadMyReservations();
    loadCalendar();
    
    // 관리자 모드면 목록도 새로고침
    if (currentUser === 'admin') {
        loadAdminReservations();
    }
}

// 예약 중복 확인
function checkReservationConflict(startDateTime, endDateTime, equipment, excludeId = null) {
    const reservations = getReservations();
    
    return reservations.some(res => {
        // 수정 시 자신의 예약은 제외
        if (excludeId && res.id == excludeId) return false;
        
        if (res.equipment !== equipment) return false;
        
        const resStart = new Date(res.startDateTime);
        const resEnd = new Date(res.endDateTime);
        
        // 시간대가 겹치는지 확인
        return (startDateTime < resEnd && endDateTime > resStart);
    });
}

// 예약 저장
function saveReservation(reservation) {
    const reservations = getReservations();
    reservations.push(reservation);
    localStorage.setItem('equipmentReservations', JSON.stringify(reservations));
}

// 예약 목록 가져오기
function getReservations() {
    const stored = localStorage.getItem('equipmentReservations');
    return stored ? JSON.parse(stored) : [];
}

// 내 예약 목록 로드
function loadMyReservations() {
    const reservations = getReservations().filter(r => r.user === currentUser);
    const container = document.getElementById('myReservationsList');
    
    if (reservations.length === 0) {
        container.innerHTML = '<div class="no-reservations">예약한 장비가 없습니다.</div>';
        return;
    }
    
    // 최신순으로 정렬
    reservations.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    container.innerHTML = '';
    
    reservations.forEach(res => {
        const item = document.createElement('div');
        item.className = 'my-reservation-item';
        
        const startDate = new Date(res.startDateTime);
        const endDate = new Date(res.endDateTime);
        
        item.innerHTML = `
            <div class="reservation-info-text">
                <h3>${res.equipment}</h3>
                <p>시작: ${formatDateTime(startDate)}</p>
                <p>종료: ${formatDateTime(endDate)}</p>
            </div>
            <div class="reservation-actions">
                <button class="edit-btn" onclick="editReservation(${res.id})">수정</button>
                <button class="delete-btn" onclick="deleteReservation(${res.id})">삭제</button>
            </div>
        `;
        
        container.appendChild(item);
    });
}

// 예약 수정
function editReservation(id) {
    const reservations = getReservations();
    const reservation = reservations.find(r => r.id === id && r.user === currentUser);
    
    if (!reservation) {
        alert('예약을 찾을 수 없거나 수정 권한이 없습니다.');
        return;
    }
    
    const startDate = new Date(reservation.startDateTime);
    const endDate = new Date(reservation.endDateTime);
    
    // 폼에 데이터 채우기
    document.getElementById('editingReservationId').value = id;
    document.getElementById('startDate').value = startDate.toISOString().split('T')[0];
    document.getElementById('startHour').value = String(startDate.getHours()).padStart(2, '0');
    document.getElementById('endDate').value = endDate.toISOString().split('T')[0];
    document.getElementById('endHour').value = String(endDate.getHours()).padStart(2, '0');
    document.getElementById('equipment').value = reservation.equipment;
    
    // 폼 제목 및 버튼 변경
    document.getElementById('formTitle').textContent = '예약 수정';
    document.getElementById('submitBtn').textContent = '수정하기';
    document.getElementById('cancelEditBtn').style.display = 'block';
    
    // 폼으로 스크롤
    document.getElementById('reservationFormSection').scrollIntoView({ behavior: 'smooth' });
}

// 예약 삭제
function deleteReservation(id) {
    if (!confirm('정말로 이 예약을 삭제하시겠습니까?')) {
        return;
    }
    
    const reservations = getReservations();
    const reservation = reservations.find(r => r.id === id && r.user === currentUser);
    
    if (!reservation) {
        alert('예약을 찾을 수 없거나 삭제 권한이 없습니다.');
        return;
    }
    
    // 예약 삭제
    const updatedReservations = reservations.filter(r => r.id !== id);
    localStorage.setItem('equipmentReservations', JSON.stringify(updatedReservations));
    
    alert('예약이 삭제되었습니다.');
    
    // 목록 및 달력 새로고침
    loadMyReservations();
    loadCalendar();
    
    // 관리자 모드면 목록도 새로고침
    if (currentUser === 'admin') {
        loadAdminReservations();
    }
}

// 예약 수정
function updateReservation(id, updates) {
    const reservations = getReservations();
    const index = reservations.findIndex(r => r.id === id && r.user === currentUser);
    
    if (index === -1) {
        alert('예약을 찾을 수 없거나 수정 권한이 없습니다.');
        return;
    }
    
    // 예약 업데이트
    reservations[index] = {
        ...reservations[index],
        ...updates
    };
    
    localStorage.setItem('equipmentReservations', JSON.stringify(reservations));
}

// 수정 취소
function cancelEdit() {
    document.getElementById('editingReservationId').value = '';
    document.getElementById('reservationForm').reset();
    document.getElementById('sameDay').checked = false;
    document.getElementById('endDate').disabled = false;
    document.getElementById('formTitle').textContent = '장비 예약';
    document.getElementById('submitBtn').textContent = '예약하기';
    document.getElementById('cancelEditBtn').style.display = 'none';
    document.getElementById('reservationMessage').style.display = 'none';
}

// 관리자 모드 체크
function checkAdminMode() {
    const adminSection = document.getElementById('adminSection');
    const reservationFormSection = document.getElementById('reservationFormSection');
    
    if (currentUser === 'admin') {
        adminSection.style.display = 'block';
        loadAdminReservations();
    } else {
        adminSection.style.display = 'none';
    }
}

// 관리자 예약 목록 로드
function loadAdminReservations() {
    const reservations = getReservations();
    const tbody = document.getElementById('adminReservationList');
    
    // 최신순으로 정렬
    reservations.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    tbody.innerHTML = '';
    
    if (reservations.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">예약이 없습니다.</td></tr>';
        return;
    }
    
    reservations.forEach(res => {
        const row = document.createElement('tr');
        const startDate = new Date(res.startDateTime);
        const endDate = new Date(res.endDateTime);
        
        row.innerHTML = `
            <td>${formatDateTime(startDate)}</td>
            <td>${formatDateTime(endDate)}</td>
            <td>${res.equipment}</td>
            <td>${res.user}</td>
        `;
        
        tbody.appendChild(row);
    });
}

// 날짜 시간 포맷팅
function formatDateTime(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    
    return `${year}/${month}/${day} ${hours}시`;
}

// 달력 로드
function loadCalendar() {
    const equipment = document.getElementById('calendarEquipment').value;
    const container = document.getElementById('calendarContainer');
    
    if (!equipment) {
        container.innerHTML = '<p style="text-align: center; color: #666;">장비를 선택하고 조회 버튼을 눌러주세요.</p>';
        return;
    }
    
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    
    // 해당 장비의 예약 목록 가져오기
    const reservations = getReservations().filter(r => r.equipment === equipment);
    
    // 달력 생성
    const calendar = generateCalendar(year, month, reservations);
    container.innerHTML = calendar;
}

// 달력 생성
function generateCalendar(year, month, reservations) {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    
    let html = `<h3 style="text-align: center; margin-bottom: 1rem;">${year}년 ${monthNames[month]}</h3>`;
    html += '<div class="calendar">';
    
    // 요일 헤더
    dayNames.forEach(day => {
        html += `<div class="calendar-header">${day}</div>`;
    });
    
    // 빈 칸 (첫 주의 시작일 이전)
    for (let i = 0; i < startingDayOfWeek; i++) {
        html += '<div class="calendar-day other-month"></div>';
    }
    
    // 날짜 칸
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const isToday = date.toDateString() === today.toDateString();
        const dayReservations = getDayReservations(date, reservations);
        
        html += `<div class="calendar-day ${isToday ? 'today' : ''}">`;
        html += `<div class="day-number">${day}</div>`;
        
        // 예약 정보 표시
        dayReservations.forEach(res => {
            const startDate = new Date(res.startDateTime);
            const endDate = new Date(res.endDateTime);
            const startHour = String(startDate.getHours()).padStart(2, '0');
            const endHour = String(endDate.getHours()).padStart(2, '0');
            
            html += `<div class="reservation-info">${startHour}시-${endHour}시<br>${res.user}</div>`;
        });
        
        html += '</div>';
    }
    
    html += '</div>';
    
    return html;
}

// 특정 날짜의 예약 가져오기
function getDayReservations(date, reservations) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    
    return reservations.filter(res => {
        const resDate = new Date(res.startDateTime);
        return resDate.getFullYear() === year &&
               resDate.getMonth() === month &&
               resDate.getDate() === day;
    });
}

// 로그인 처리 (equipment-reservation 페이지용 오버라이드)
const originalHandleLogin = window.handleLogin;
window.handleLogin = function(event) {
    if (originalHandleLogin) {
        originalHandleLogin(event);
    }
    
    // 로그인 성공 시 페이지 새로고침
    setTimeout(() => {
        if (isLoggedIn) {
            window.location.reload();
        }
    }, 100);
}

// 로그인 모달 열기
function openLoginModal() {
    if (isLoggedIn) {
        logout();
        window.location.reload();
    } else {
        document.getElementById('loginModal').style.display = 'block';
        loadRememberedCredentials();
    }
}

// 로그인 모달 닫기
function closeLoginModal() {
    document.getElementById('loginModal').style.display = 'none';
    const errorMessage = document.getElementById('errorMessage');
    if (errorMessage) {
        errorMessage.textContent = '';
    }
}

// 모달 외부 클릭 시 닫기
window.onclick = function(event) {
    const modal = document.getElementById('loginModal');
    if (event.target === modal) {
        closeLoginModal();
    }
}

// 로그인 버튼 업데이트 (equipment-reservation 페이지용)
function updateLoginButton() {
    const loginBtn = document.querySelector('.login-btn');
    if (loginBtn) {
        if (isLoggedIn) {
            loginBtn.textContent = `로그아웃 (${currentUser})`;
        } else {
            loginBtn.textContent = '로그인';
        }
    }
}

// 로그인 후 페이지 새로고침
function refreshAfterLogin() {
    if (isLoggedIn) {
        window.location.reload();
    }
}

// 엑셀로 내보내기
function exportToExcel() {
    const reservations = getReservations();
    
    if (reservations.length === 0) {
        alert('내보낼 예약이 없습니다.');
        return;
    }
    
    // CSV 형식으로 변환
    let csv = '예약 시작 시간,예약 종료 시간,장비,사용자\n';
    
    reservations.forEach(res => {
        const startDate = new Date(res.startDateTime);
        const endDate = new Date(res.endDateTime);
        csv += `"${formatDateTime(startDate)}","${formatDateTime(endDate)}","${res.equipment}","${res.user}"\n`;
    });
    
    // BOM 추가 (한글 깨짐 방지)
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `장비예약_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

