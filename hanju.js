// 한주 물품 구매 페이지 전용 스크립트

// 전역 변수
let editingItemId = null;

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

    // 현재 날짜로 신청날짜 설정
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('requestDate').value = today;
    
    // 관리자 모드 체크
    checkAdminMode();
    
    // 장바구니 로드
    loadCart();
    
    // 이미지 붙여넣기 이벤트
    setupImagePaste();
});

// 관리자 모드 체크
function checkAdminMode() {
    const adminSection = document.getElementById('adminSection');
    if (currentUser === 'admin') {
        adminSection.style.display = 'block';
    } else {
        adminSection.style.display = 'none';
    }
}

// 단위 변경 처리
function handleUnitChange() {
    const unit = document.getElementById('unit').value;
    const directInput = document.getElementById('unitDirectInput');
    
    if (unit === '직접입력') {
        directInput.style.display = 'flex';
        document.getElementById('unitDirect').required = true;
    } else {
        directInput.style.display = 'none';
        document.getElementById('unitDirect').required = false;
        document.getElementById('unitDirect').value = '';
    }
}

// 사유 변경 처리
function handleReasonChange() {
    const reason = document.getElementById('reason').value;
    const directInput = document.getElementById('reasonDirectInput');
    
    if (reason === '직접입력') {
        directInput.style.display = 'flex';
        document.getElementById('reasonDirect').required = true;
    } else {
        directInput.style.display = 'none';
        document.getElementById('reasonDirect').required = false;
        document.getElementById('reasonDirect').value = '';
    }
}

// 이미지 파일 선택 처리
document.getElementById('imageInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById('previewImage');
            const removeBtn = document.getElementById('removeImageBtn');
            preview.src = e.target.result;
            preview.style.display = 'block';
            removeBtn.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
});

// 이미지 삭제
function removeImage() {
    const preview = document.getElementById('previewImage');
    const removeBtn = document.getElementById('removeImageBtn');
    const imageInput = document.getElementById('imageInput');
    
    preview.src = '';
    preview.style.display = 'none';
    removeBtn.style.display = 'none';
    imageInput.value = '';
}

// 이미지 붙여넣기 설정
function setupImagePaste() {
    document.addEventListener('paste', function(e) {
        const items = e.clipboardData.items;
        
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const blob = items[i].getAsFile();
                const reader = new FileReader();
                
                reader.onload = function(e) {
                    const preview = document.getElementById('previewImage');
                    const removeBtn = document.getElementById('removeImageBtn');
                    preview.src = e.target.result;
                    preview.style.display = 'block';
                    removeBtn.style.display = 'block';
                    
                    // 파일 입력에도 설정
                    const dataTransfer = new DataTransfer();
                    dataTransfer.items.add(blob);
                    document.getElementById('imageInput').files = dataTransfer.files;
                };
                
                reader.readAsDataURL(blob);
                break;
            }
        }
    });
}

// 물품 추가 처리
function handleAddItem(event) {
    event.preventDefault();
    
    const requestDate = document.getElementById('requestDate').value;
    const itemName = document.getElementById('itemName').value;
    const unit = document.getElementById('unit').value;
    const unitDirect = document.getElementById('unitDirect').value;
    const quantity = parseInt(document.getElementById('quantity').value);
    const reason = document.getElementById('reason').value;
    const reasonDirect = document.getElementById('reasonDirect').value;
    const imageInput = document.getElementById('imageInput');
    const previewImage = document.getElementById('previewImage');
    const messageEl = document.getElementById('itemMessage');
    
    // 유효성 검사
    if (!requestDate || !itemName || !quantity || quantity < 1) {
        messageEl.textContent = '필수 항목을 모두 입력해주세요.';
        messageEl.className = 'error-message';
        messageEl.style.display = 'block';
        return;
    }
    
    if (!unit) {
        messageEl.textContent = '단위를 선택해주세요.';
        messageEl.className = 'error-message';
        messageEl.style.display = 'block';
        return;
    }
    
    if (unit === '직접입력' && !unitDirect) {
        messageEl.textContent = '단위를 직접 입력해주세요.';
        messageEl.className = 'error-message';
        messageEl.style.display = 'block';
        return;
    }
    
    if (!reason) {
        messageEl.textContent = '사유를 선택해주세요.';
        messageEl.className = 'error-message';
        messageEl.style.display = 'block';
        return;
    }
    
    if (reason === '직접입력' && !reasonDirect) {
        messageEl.textContent = '사유를 직접 입력해주세요.';
        messageEl.className = 'error-message';
        messageEl.style.display = 'block';
        return;
    }
    
    // 이미지 처리
    let imageData = '';
    if (imageInput.files && imageInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            imageData = e.target.result;
            if (editingItemId) {
                updateItem(editingItemId, requestDate, itemName, imageData, unit === '직접입력' ? unitDirect : unit, quantity, reason === '직접입력' ? reasonDirect : reason);
            } else {
                saveItem(requestDate, itemName, imageData, unit === '직접입력' ? unitDirect : unit, quantity, reason === '직접입력' ? reasonDirect : reason);
            }
        };
        reader.readAsDataURL(imageInput.files[0]);
    } else if (previewImage.src && previewImage.style.display !== 'none') {
        // 기존 이미지가 있으면 그대로 사용
        imageData = previewImage.src;
        if (editingItemId) {
            updateItem(editingItemId, requestDate, itemName, imageData, unit === '직접입력' ? unitDirect : unit, quantity, reason === '직접입력' ? reasonDirect : reason);
        } else {
            saveItem(requestDate, itemName, imageData, unit === '직접입력' ? unitDirect : unit, quantity, reason === '직접입력' ? reasonDirect : reason);
        }
    } else {
        // 이미지 없음
        if (editingItemId) {
            updateItem(editingItemId, requestDate, itemName, imageData, unit === '직접입력' ? unitDirect : unit, quantity, reason === '직접입력' ? reasonDirect : reason);
        } else {
            saveItem(requestDate, itemName, imageData, unit === '직접입력' ? unitDirect : unit, quantity, reason === '직접입력' ? reasonDirect : reason);
        }
    }
}

// 물품 저장
function saveItem(requestDate, itemName, imageData, unit, quantity, reason) {
    // 쇼핑 중지 상태 확인
    const stopShoppingTime = localStorage.getItem('hanjuStopShoppingTime');
    const isShoppingStopped = stopShoppingTime !== null;
    
    const item = {
        id: Date.now(),
        requestDate: requestDate,
        itemName: itemName,
        image: imageData,
        unit: unit,
        quantity: quantity,
        user: currentUser,
        reason: reason,
        status: isShoppingStopped ? 'will' : 'carting', // 쇼핑 중지 후면 will, 아니면 carting
        createdAt: new Date().toISOString()
    };
    
    const items = getItems();
    items.push(item);
    localStorage.setItem('hanjuItems', JSON.stringify(items));
    
    // 성공 메시지
    const messageEl = document.getElementById('itemMessage');
    if (isShoppingStopped) {
        messageEl.textContent = '물품이 추가되었습니다! (현재는 쇼핑중입니다.)';
    } else {
        messageEl.textContent = '물품이 추가되었습니다!';
    }
    messageEl.className = 'success-message';
    messageEl.style.display = 'block';
    
    // 폼 초기화
    resetForm();
    
    // 장바구니 새로고침
    loadCart();
}

// 물품 수정
function updateItem(itemId, requestDate, itemName, imageData, unit, quantity, reason) {
    const items = getItems();
    const itemIndex = items.findIndex(i => i.id === itemId);
    
    if (itemIndex === -1) {
        alert('물품을 찾을 수 없습니다.');
        return;
    }
    
    // 권한 체크
    if (currentUser !== 'admin' && items[itemIndex].user !== currentUser) {
        alert('본인의 물품만 수정할 수 있습니다.');
        return;
    }
    
    items[itemIndex] = {
        ...items[itemIndex],
        requestDate: requestDate,
        itemName: itemName,
        image: imageData,
        unit: unit,
        quantity: quantity,
        reason: reason
    };
    
    localStorage.setItem('hanjuItems', JSON.stringify(items));
    
    // 성공 메시지
    const messageEl = document.getElementById('itemMessage');
    messageEl.textContent = '물품이 수정되었습니다!';
    messageEl.className = 'success-message';
    messageEl.style.display = 'block';
    
    // 폼 초기화
    cancelEdit();
    
    // 장바구니 새로고침
    loadCart();
}

// 폼 초기화
function resetForm() {
    document.getElementById('itemForm').reset();
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('requestDate').value = today;
    document.getElementById('previewImage').src = '';
    document.getElementById('previewImage').style.display = 'none';
    document.getElementById('removeImageBtn').style.display = 'none';
    document.getElementById('unitDirectInput').style.display = 'none';
    document.getElementById('reasonDirectInput').style.display = 'none';
    editingItemId = null;
    document.getElementById('submitBtn').textContent = '물품 추가';
    document.getElementById('cancelEditBtn').style.display = 'none';
    document.querySelector('.section-title').textContent = '물품 추가';
}

// 수정 취소
function cancelEdit() {
    resetForm();
    document.getElementById('itemMessage').style.display = 'none';
}

// 물품 목록 가져오기
function getItems() {
    const stored = localStorage.getItem('hanjuItems');
    return stored ? JSON.parse(stored) : [];
}

// 장바구니 로드
function loadCart() {
    const items = getItems();
    const stopShoppingTime = localStorage.getItem('hanjuStopShoppingTime');
    
    // 쇼핑 중지 시간 이전의 물품들은 carting으로, 이후는 will로 분류
    const cartingItems = [];
    const willItems = [];
    
    items.forEach(item => {
        // 기존 status가 있으면 사용, 없으면 생성 시간으로 판단
        if (item.status) {
            if (item.status === 'carting') {
                cartingItems.push(item);
            } else if (item.status === 'will') {
                willItems.push(item);
            }
        } else {
            // 기존 데이터 호환성: 생성 시간으로 판단
            if (stopShoppingTime && new Date(item.createdAt) > new Date(stopShoppingTime)) {
                item.status = 'will';
                willItems.push(item);
            } else {
                item.status = 'carting';
                cartingItems.push(item);
            }
        }
    });
    
    // 데이터 저장 (status 업데이트)
    items.forEach(item => {
        if (!item.status) {
            if (stopShoppingTime && new Date(item.createdAt) > new Date(stopShoppingTime)) {
                item.status = 'will';
            } else {
                item.status = 'carting';
            }
        }
    });
    localStorage.setItem('hanjuItems', JSON.stringify(items));
    
    // 장바구니ing 로드
    loadCartingList(cartingItems);
    
    // will 장바구니 로드
    loadWillCartList(willItems);
}

// 장바구니ing 로드
function loadCartingList(items) {
    const tbody = document.getElementById('cartingList');
    
    if (items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="no-items">장바구니ing가 비어있습니다.</td></tr>';
        return;
    }
    
    // 최신순으로 정렬
    items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    tbody.innerHTML = '';
    
    items.forEach(item => {
        const canEdit = currentUser === 'admin' || item.user === currentUser;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <input type="checkbox" class="item-checkbox" data-item-id="${item.id}" data-status="carting">
            </td>
            <td>${formatDate(item.requestDate)}</td>
            <td>${item.itemName}</td>
            <td>
                ${item.image ? `<img src="${item.image}" alt="${item.itemName}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px;">` : '<span style="color: #999;">이미지 없음</span>'}
            </td>
            <td>${item.unit}</td>
            <td>${item.quantity}</td>
            <td>${item.user}</td>
            <td>${item.reason}</td>
            <td>
                ${canEdit ? `
                    <button class="edit-btn" onclick="editItem(${item.id})">수정</button>
                    <button class="delete-btn" onclick="deleteItem(${item.id})">삭제</button>
                ` : '<span style="color: #999;">-</span>'}
            </td>
        `;
        tbody.appendChild(row);
    });
}

// will 장바구니 로드
function loadWillCartList(items) {
    const tbody = document.getElementById('willCartList');
    const stopShoppingTime = localStorage.getItem('hanjuStopShoppingTime');
    const isShoppingStopped = stopShoppingTime !== null;
    
    if (items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="no-items">will 장바구니가 비어있습니다.</td></tr>';
        return;
    }
    
    // 최신순으로 정렬
    items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    tbody.innerHTML = '';
    
    items.forEach(item => {
        const canEdit = currentUser === 'admin' || item.user === currentUser;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <input type="checkbox" class="item-checkbox" data-item-id="${item.id}" data-status="will">
            </td>
            <td>${formatDate(item.requestDate)}</td>
            <td>${item.itemName} ${isShoppingStopped ? '<span style="color: #e74c3c; font-size: 0.9rem;">(현재는 쇼핑중입니다.)</span>' : ''}</td>
            <td>
                ${item.image ? `<img src="${item.image}" alt="${item.itemName}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px;">` : '<span style="color: #999;">이미지 없음</span>'}
            </td>
            <td>${item.unit}</td>
            <td>${item.quantity}</td>
            <td>${item.user}</td>
            <td>${item.reason}</td>
            <td>
                ${canEdit ? `
                    <button class="edit-btn" onclick="editItem(${item.id})">수정</button>
                    <button class="delete-btn" onclick="deleteItem(${item.id})">삭제</button>
                ` : '<span style="color: #999;">-</span>'}
            </td>
        `;
        tbody.appendChild(row);
    });
}

// 물품 수정 (폼에 데이터 채우기)
function editItem(itemId) {
    const items = getItems();
    const item = items.find(i => i.id === itemId);
    
    if (!item) {
        alert('물품을 찾을 수 없습니다.');
        return;
    }
    
    // 권한 체크
    if (currentUser !== 'admin' && item.user !== currentUser) {
        alert('본인의 물품만 수정할 수 있습니다.');
        return;
    }
    
    editingItemId = itemId;
    
    // 폼에 데이터 채우기
    document.getElementById('requestDate').value = item.requestDate;
    document.getElementById('itemName').value = item.itemName;
    
    // 단위 처리
    const unitOptions = ['개', '박스', '장', '자루', '켤레'];
    if (unitOptions.includes(item.unit)) {
        document.getElementById('unit').value = item.unit;
        document.getElementById('unitDirectInput').style.display = 'none';
    } else {
        document.getElementById('unit').value = '직접입력';
        document.getElementById('unitDirect').value = item.unit;
        document.getElementById('unitDirectInput').style.display = 'flex';
    }
    
    // 사유 처리
    const reasonOptions = ['손용 박사님', '이협 박사님', '하철우 박사님', '연시모 선임님', '윤종천 선임님', '어두림 박사님', '김영원 박사님', '구자건 박사님', '이지선 선임님', '강동석 연구원님'];
    if (reasonOptions.includes(item.reason)) {
        document.getElementById('reason').value = item.reason;
        document.getElementById('reasonDirectInput').style.display = 'none';
    } else {
        document.getElementById('reason').value = '직접입력';
        document.getElementById('reasonDirect').value = item.reason;
        document.getElementById('reasonDirectInput').style.display = 'flex';
    }
    
    document.getElementById('quantity').value = item.quantity;
    
    // 이미지 처리
    if (item.image) {
        const preview = document.getElementById('previewImage');
        const removeBtn = document.getElementById('removeImageBtn');
        preview.src = item.image;
        preview.style.display = 'block';
        removeBtn.style.display = 'block';
    }
    
    // 폼 제목 및 버튼 변경
    document.querySelector('.section-title').textContent = '물품 수정';
    document.getElementById('submitBtn').textContent = '수정하기';
    document.getElementById('cancelEditBtn').style.display = 'block';
    
    // 폼으로 스크롤
    document.querySelector('.section').scrollIntoView({ behavior: 'smooth' });
}

// 물품 삭제
function deleteItem(itemId) {
    const items = getItems();
    const item = items.find(i => i.id === itemId);
    
    if (!item) {
        alert('물품을 찾을 수 없습니다.');
        return;
    }
    
    // 권한 체크
    if (currentUser !== 'admin' && item.user !== currentUser) {
        alert('본인의 물품만 삭제할 수 있습니다.');
        return;
    }
    
    if (!confirm('정말로 이 물품을 삭제하시겠습니까?')) {
        return;
    }
    
    const updatedItems = items.filter(i => i.id !== itemId);
    
    localStorage.setItem('hanjuItems', JSON.stringify(updatedItems));
    
    alert('물품이 삭제되었습니다.');
    
    // 장바구니 새로고침
    loadCart();
}

// 그만담기 (관리자 전용)
function stopShopping() {
    if (currentUser !== 'admin') {
        alert('관리자만 사용할 수 있는 기능입니다.');
        return;
    }
    
    if (!confirm('그만담기를 시작하시겠습니까? 이후 추가되는 물품은 will 장바구니에 담깁니다.')) {
        return;
    }
    
    const now = new Date().toISOString();
    localStorage.setItem('hanjuStopShoppingTime', now);
    
    // 모든 기존 물품을 carting으로 설정
    const items = getItems();
    items.forEach(item => {
        if (!item.status || item.status === 'will') {
            // will 상태인 물품 중 그만담기 시간 이전의 것들은 carting으로
            if (!item.status || new Date(item.createdAt) <= new Date(now)) {
                item.status = 'carting';
            }
        }
    });
    localStorage.setItem('hanjuItems', JSON.stringify(items));
    
    alert('그만담기가 시작되었습니다.');
    
    // 장바구니 새로고침
    loadCart();
}

// 쇼핑완료 (관리자 전용)
function completeShopping() {
    if (currentUser !== 'admin') {
        alert('관리자만 사용할 수 있는 기능입니다.');
        return;
    }
    
    if (!confirm('쇼핑을 완료하시겠습니까? 체크된 항목은 제거되고, will 장바구니의 모든 항목이 장바구니ing로 이동합니다.')) {
        return;
    }
    
    const items = getItems();
    const cartingCheckboxes = document.querySelectorAll('#cartingList .item-checkbox:checked');
    const checkedIds = Array.from(cartingCheckboxes).map(cb => parseFloat(cb.dataset.itemId));
    
    // 체크된 carting 항목 제거
    let updatedItems = items.filter(item => {
        if (item.status === 'carting' && checkedIds.includes(item.id)) {
            return false; // 삭제
        }
        return true;
    });
    
    // will 장바구니의 모든 항목을 carting으로 이동
    updatedItems = updatedItems.map(item => {
        if (item.status === 'will') {
            item.status = 'carting';
        }
        return item;
    });
    
    // 그만담기 시간 초기화
    localStorage.removeItem('hanjuStopShoppingTime');
    
    localStorage.setItem('hanjuItems', JSON.stringify(updatedItems));
    
    alert('쇼핑이 완료되었습니다.');
    
    // 장바구니 새로고침
    loadCart();
}

// 날짜 포맷팅
function formatDate(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
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

// 로그인 버튼 업데이트
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

// 로그인 처리 (오버라이드)
const originalHandleLogin = window.handleLogin;
window.handleLogin = function(event) {
    if (originalHandleLogin) {
        originalHandleLogin(event);
    }
    
    setTimeout(() => {
        if (isLoggedIn) {
            window.location.reload();
        }
    }, 100);
}

