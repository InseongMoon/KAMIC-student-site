// 대원공구 물품 구매 페이지 전용 스크립트

// 전역 변수
let waitingItems = [];
let editingWaitingIndex = null;

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
    
    // 충전금 가격 입력 시 실시간 업데이트
    document.getElementById('chargeAmount').addEventListener('input', updateChargePriceDisplay);
    
    // 물품 가격 입력 시 실시간 업데이트
    document.getElementById('itemPrice').addEventListener('input', updatePriceDisplay);
    document.getElementById('itemQuantity').addEventListener('input', updatePriceDisplay);
    
    // 현재상황 로드
    loadStatus();
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

// 충전금 가격 표시 업데이트
function updateChargePriceDisplay() {
    const price = parseFloat(document.getElementById('chargeAmount').value) || 0;
    const vatIncluded = document.getElementById('chargeVatIncluded').checked;
    const display = document.getElementById('chargePriceDisplay');
    
    if (price <= 0) {
        display.textContent = '';
        return;
    }
    
    if (vatIncluded) {
        const originalPrice = Math.round(price * 100 / 110);
        const vatAmount = price - originalPrice;
        display.innerHTML = `원금액: ${formatCurrency(originalPrice)} | 부가세포함: ${formatCurrency(price)} (부가세: ${formatCurrency(vatAmount)})`;
    } else {
        const totalPrice = Math.round(price * 110 / 100);
        const vatAmount = totalPrice - price;
        display.innerHTML = `원금액: ${formatCurrency(price)} | 부가세포함: ${formatCurrency(totalPrice)} (부가세: ${formatCurrency(vatAmount)})`;
    }
}

// 충전금 추가
function handleAddCharge(event) {
    event.preventDefault();
    
    const chargeDate = document.getElementById('chargeDate').value;
    const chargeAmount = parseFloat(document.getElementById('chargeAmount').value);
    const vatIncluded = document.getElementById('chargeVatIncluded').checked;
    
    if (!chargeDate || !chargeAmount || chargeAmount <= 0) {
        alert('날짜와 충전금액을 올바르게 입력해주세요.');
        return;
    }
    
    // 부가세 계산
    let originalPrice, totalPrice;
    if (vatIncluded) {
        originalPrice = Math.round(chargeAmount * 100 / 110);
        totalPrice = chargeAmount;
    } else {
        originalPrice = chargeAmount;
        totalPrice = Math.round(chargeAmount * 110 / 100);
    }
    
    const charge = {
        id: Date.now(),
        date: chargeDate,
        originalAmount: originalPrice,
        totalAmount: totalPrice,
        createdAt: new Date().toISOString()
    };
    
    saveCharge(charge);
    
    alert('충전금이 추가되었습니다.');
    
    // 폼 초기화
    document.getElementById('chargeDate').value = '';
    document.getElementById('chargeAmount').value = '';
    document.getElementById('chargeVatIncluded').checked = false;
    document.getElementById('chargePriceDisplay').textContent = '';
    
    // 현재상황 새로고침
    loadStatus();
}

// 충전금 저장
function saveCharge(charge) {
    const charges = getCharges();
    charges.push(charge);
    localStorage.setItem('daewonCharges', JSON.stringify(charges));
}

// 충전금 목록 가져오기
function getCharges() {
    const stored = localStorage.getItem('daewonCharges');
    return stored ? JSON.parse(stored) : [];
}

// 가격 표시 업데이트
function updatePriceDisplay() {
    const price = parseFloat(document.getElementById('itemPrice').value) || 0;
    const quantity = parseInt(document.getElementById('itemQuantity').value) || 1;
    const perUnitPrice = document.getElementById('perUnitPrice').checked;
    const vatIncluded = document.getElementById('vatIncluded').checked;
    const display = document.getElementById('priceDisplay');
    
    if (price <= 0) {
        display.textContent = '';
        return;
    }
    
    // 개당 가격 체크 여부에 따라 총 가격 계산
    const totalPriceBeforeVat = perUnitPrice ? price * quantity : price;
    
    if (vatIncluded) {
        // 부가세 포함: 입력가격 * 100/110 (원금액), 입력가격 (부가세포함)
        const originalPrice = Math.round(totalPriceBeforeVat * 100 / 110);
        const vatAmount = totalPriceBeforeVat - originalPrice;
        const unitText = perUnitPrice ? ` (개당 ${formatCurrency(price)} × ${quantity}개)` : '';
        display.innerHTML = `원금액: ${formatCurrency(originalPrice)} | 부가세포함: ${formatCurrency(totalPriceBeforeVat)} (부가세: ${formatCurrency(vatAmount)})${unitText}`;
    } else {
        // 부가세 미포함: 입력가격 (원금액), 입력가격 * 110/100 (부가세포함)
        const totalPrice = Math.round(totalPriceBeforeVat * 110 / 100);
        const vatAmount = totalPrice - totalPriceBeforeVat;
        const unitText = perUnitPrice ? ` (개당 ${formatCurrency(price)} × ${quantity}개)` : '';
        display.innerHTML = `원금액: ${formatCurrency(totalPriceBeforeVat)} | 부가세포함: ${formatCurrency(totalPrice)} (부가세: ${formatCurrency(vatAmount)})${unitText}`;
    }
}

// 대기창에 물품 추가
function handleAddToWaiting(event) {
    event.preventDefault();
    
    const requestDate = document.getElementById('requestDate').value;
    const itemName = document.getElementById('itemName').value;
    const quantity = parseInt(document.getElementById('itemQuantity').value);
    const price = parseFloat(document.getElementById('itemPrice').value);
    const perUnitPrice = document.getElementById('perUnitPrice').checked;
    const vatIncluded = document.getElementById('vatIncluded').checked;
    
    if (!requestDate || !itemName || !quantity || quantity < 1 || !price || price <= 0) {
        alert('모든 필드를 올바르게 입력해주세요.');
        return;
    }
    
    // 개당 가격 체크 여부에 따라 총 가격 계산
    const totalPriceBeforeVat = perUnitPrice ? price * quantity : price;
    
    // 부가세 계산
    let originalPrice, totalPrice;
    if (vatIncluded) {
        originalPrice = Math.round(totalPriceBeforeVat * 100 / 110);
        totalPrice = totalPriceBeforeVat;
    } else {
        originalPrice = totalPriceBeforeVat;
        totalPrice = Math.round(totalPriceBeforeVat * 110 / 100);
    }
    
    const item = {
        requestDate: requestDate,
        itemName: itemName,
        quantity: quantity,
        originalPrice: originalPrice,
        totalPrice: totalPrice,
        vatIncluded: vatIncluded,
        perUnitPrice: perUnitPrice
    };
    
    if (editingWaitingIndex !== null) {
        // 수정 모드
        waitingItems[editingWaitingIndex] = item;
        editingWaitingIndex = null;
    } else {
        // 추가 모드
        waitingItems.push(item);
    }
    
    updateWaitingList();
    updateTotalAmount();
    
    // 폼 초기화
    document.getElementById('itemName').value = '';
    document.getElementById('itemQuantity').value = '';
    document.getElementById('itemPrice').value = '';
    document.getElementById('perUnitPrice').checked = false;
    document.getElementById('vatIncluded').checked = false;
    document.getElementById('priceDisplay').textContent = '';
}

// 대기창 목록 업데이트
function updateWaitingList() {
    const container = document.getElementById('waitingItemsList');
    
    if (waitingItems.length === 0) {
        container.innerHTML = '<p class="no-items">대기 중인 물품이 없습니다.</p>';
        return;
    }
    
    container.innerHTML = '';
    
    waitingItems.forEach((item, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'waiting-item';
        itemDiv.innerHTML = `
            <div class="waiting-item-info">
                <strong>${item.itemName}</strong> - ${item.quantity}개 | 
                원금액: ${formatCurrency(item.originalPrice)} | 
                부가세포함: ${formatCurrency(item.totalPrice)} (총 ${formatCurrency(item.totalPrice * item.quantity)})
            </div>
            <div class="waiting-item-actions">
                <button class="edit-btn" onclick="editWaitingItem(${index})">수정</button>
                <button class="delete-btn" onclick="removeWaitingItem(${index})">삭제</button>
            </div>
        `;
        container.appendChild(itemDiv);
    });
}

// 대기창 물품 수정
function editWaitingItem(index) {
    const item = waitingItems[index];
    
    document.getElementById('requestDate').value = item.requestDate;
    document.getElementById('itemName').value = item.itemName;
    document.getElementById('itemQuantity').value = item.quantity;
    
    // 개당 가격인지 확인하여 가격 입력
    if (item.perUnitPrice) {
        // 개당 가격이었던 경우: 원금액 또는 부가세포함 금액을 개수로 나눔
        const unitPrice = item.vatIncluded ? item.totalPrice / item.quantity : item.originalPrice / item.quantity;
        document.getElementById('itemPrice').value = Math.round(unitPrice);
    } else {
        // 총 가격이었던 경우: 그대로 사용
        document.getElementById('itemPrice').value = item.vatIncluded ? item.totalPrice : item.originalPrice;
    }
    
    document.getElementById('perUnitPrice').checked = item.perUnitPrice || false;
    document.getElementById('vatIncluded').checked = item.vatIncluded;
    
    updatePriceDisplay();
    
    editingWaitingIndex = index;
    
    // 폼으로 스크롤
    document.getElementById('itemName').scrollIntoView({ behavior: 'smooth' });
}

// 대기창 물품 삭제
function removeWaitingItem(index) {
    waitingItems.splice(index, 1);
    updateWaitingList();
    updateTotalAmount();
}

// 총합 가격 업데이트
function updateTotalAmount() {
    const total = waitingItems.reduce((sum, item) => sum + (item.totalPrice * item.quantity), 0);
    document.getElementById('totalAmount').textContent = formatCurrency(total);
}

// 쇼핑완료
function completeShopping() {
    if (waitingItems.length === 0) {
        alert('추가할 물품이 없습니다.');
        return;
    }
    
    const requestDate = document.getElementById('requestDate').value;
    const totalAmount = waitingItems.reduce((sum, item) => sum + (item.totalPrice * item.quantity), 0);
    
    // 현재상황에 추가
    const order = {
        id: Date.now(),
        requestDate: requestDate,
        buyer: currentUser,
        items: waitingItems.map(item => ({
            itemName: item.itemName,
            quantity: item.quantity,
            originalPrice: item.originalPrice,
            totalPrice: item.totalPrice
        })),
        totalAmount: totalAmount,
        createdAt: new Date().toISOString()
    };
    
    saveOrder(order);
    
    // 대기창 초기화
    waitingItems = [];
    editingWaitingIndex = null;
    updateWaitingList();
    updateTotalAmount();
    
    // 폼 초기화
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('requestDate').value = today;
    document.getElementById('itemName').value = '';
    document.getElementById('itemQuantity').value = '';
    document.getElementById('itemPrice').value = '';
    document.getElementById('perUnitPrice').checked = false;
    document.getElementById('vatIncluded').checked = false;
    document.getElementById('priceDisplay').textContent = '';
    
    alert('쇼핑이 완료되었습니다!');
    
    // 현재상황 새로고침
    loadStatus();
}

// 주문 저장
function saveOrder(order) {
    // 주문의 원금액 계산
    const originalTotal = order.items.reduce((sum, item) => sum + (item.originalPrice * item.quantity), 0);
    order.originalAmount = originalTotal;
    
    const orders = getOrders();
    orders.push(order);
    localStorage.setItem('daewonOrders', JSON.stringify(orders));
}

// 주문 목록 가져오기
function getOrders() {
    const stored = localStorage.getItem('daewonOrders');
    return stored ? JSON.parse(stored) : [];
}

// 현재상황 로드
function loadStatus() {
    const orders = getOrders();
    const charges = getCharges();
    const tbody = document.getElementById('statusList');
    
    // 모든 이벤트(충전금 + 주문)를 날짜순으로 정렬
    const allEvents = [];
    
    charges.forEach(charge => {
        allEvents.push({
            type: 'charge',
            date: charge.date,
            originalAmount: charge.originalAmount,
            totalAmount: charge.totalAmount,
            id: charge.id,
            createdAt: charge.createdAt
        });
    });
    
    orders.forEach(order => {
        // 주문의 원금액 계산
        const originalTotal = order.items.reduce((sum, item) => sum + (item.originalPrice * item.quantity), 0);
        
        allEvents.push({
            type: 'order',
            date: order.requestDate,
            order: order,
            originalAmount: originalTotal,
            totalAmount: order.totalAmount,
            id: order.id,
            createdAt: order.createdAt
        });
    });
    
    // 날짜순으로 정렬 (오래된 것부터)
    allEvents.sort((a, b) => {
        const dateCompare = new Date(a.date) - new Date(b.date);
        if (dateCompare !== 0) return dateCompare;
        // 같은 날짜면 충전금이 먼저
        if (a.type === 'charge' && b.type === 'order') return -1;
        if (a.type === 'order' && b.type === 'charge') return 1;
        // 같은 타입이면 생성 시간순
        return new Date(a.createdAt) - new Date(b.createdAt);
    });
    
    if (allEvents.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" class="no-items">주문 내역이 없습니다.</td></tr>';
        document.getElementById('remainingAmount').textContent = '';
        return;
    }
    
    // 오래된 순서대로 누적 잔여금액 계산
    let remainingOriginal = 0;
    let remainingTotal = 0;
    
    allEvents.forEach(event => {
        if (event.type === 'charge') {
            remainingOriginal += event.originalAmount;
            remainingTotal += event.totalAmount;
            event.remainingOriginal = remainingOriginal;
            event.remainingTotal = remainingTotal;
        } else if (event.type === 'order') {
            remainingOriginal -= event.originalAmount;
            remainingTotal -= event.totalAmount;
            event.remainingOriginal = remainingOriginal;
            event.remainingTotal = remainingTotal;
        }
    });
    
    // 최종 잔여금액 저장
    const finalRemainingOriginal = remainingOriginal;
    const finalRemainingTotal = remainingTotal;
    
    // 최신순으로 역순 정렬 (표시용)
    const displayEvents = [...allEvents].reverse();
    
    tbody.innerHTML = '';
    
    displayEvents.forEach((event, index) => {
        if (event.type === 'charge') {
            // 충전금 행
            const row = document.createElement('tr');
            row.className = 'charge-row';
            row.innerHTML = `
                <td>-</td>
                <td>${formatDate(event.date)}</td>
                <td><strong style="color: #28a745;">충전금</strong></td>
                <td>${formatCurrency(event.originalAmount)}(${formatCurrency(event.totalAmount)})</td>
                <td>-</td>
                <td>-</td>
                <td>-</td>
                <td>${formatCurrency(event.originalAmount)}(${formatCurrency(event.totalAmount)})</td>
                <td>${formatCurrency(event.remainingOriginal)}(${formatCurrency(event.remainingTotal)})</td>
                <td>-</td>
            `;
            tbody.appendChild(row);
        } else if (event.type === 'order') {
            // 주문 행
            const order = event.order;
            const canEdit = currentUser === 'admin' || order.buyer === currentUser;
            
            // 주문의 원금액과 부가세포함 금액 계산
            const orderOriginalTotal = order.items.reduce((sum, item) => sum + (item.originalPrice * item.quantity), 0);
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <input type="checkbox" class="order-checkbox" data-order-id="${order.id}">
                </td>
                <td>${formatDate(order.requestDate)}</td>
                <td><strong style="color: #667eea;">주문</strong></td>
                <td>${order.buyer}</td>
                <td>
                    <div class="item-details">
                        ${order.items.map(item => `<div class="item-detail-row">${item.itemName}</div>`).join('')}
                    </div>
                </td>
                <td>
                    <div class="item-details">
                        ${order.items.map(item => `<div class="item-detail-row">${item.quantity}</div>`).join('')}
                    </div>
                </td>
                <td>
                    <div class="item-details">
                        ${order.items.map(item => `<div class="item-detail-row">${formatCurrency(item.totalPrice)}</div>`).join('')}
                    </div>
                </td>
                <td>${formatCurrency(orderOriginalTotal)}(${formatCurrency(order.totalAmount)})</td>
                <td>${formatCurrency(event.remainingOriginal)}(${formatCurrency(event.remainingTotal)})</td>
                <td>
                    ${canEdit ? `
                        <button class="edit-btn" onclick="editOrder(${order.id})">수정</button>
                        <button class="delete-btn" onclick="deleteOrder(${order.id})">삭제</button>
                    ` : '<span style="color: #999;">-</span>'}
                </td>
            `;
            tbody.appendChild(row);
        }
    });
    
    // 잔여금액 표시 (최종 잔여금액)
    document.getElementById('remainingAmount').textContent = `잔여금액: ${formatCurrency(finalRemainingOriginal)}(${formatCurrency(finalRemainingTotal)})`;
}

// 주문 수정
function editOrder(orderId) {
    const orders = getOrders();
    const order = orders.find(o => o.id === orderId);
    
    if (!order) {
        alert('주문을 찾을 수 없습니다.');
        return;
    }
    
    // 권한 체크
    if (currentUser !== 'admin' && order.buyer !== currentUser) {
        alert('본인의 주문만 수정할 수 있습니다.');
        return;
    }
    
    // 대기창에 물품 추가
    waitingItems = order.items.map(item => ({
        requestDate: order.requestDate,
        itemName: item.itemName,
        quantity: item.quantity,
        originalPrice: item.originalPrice,
        totalPrice: item.totalPrice,
        vatIncluded: item.totalPrice === item.originalPrice ? false : true
    }));
    
    document.getElementById('requestDate').value = order.requestDate;
    
    updateWaitingList();
    updateTotalAmount();
    
    // 주문 삭제 (수정 후 다시 추가할 예정)
    deleteOrder(orderId, false);
    
    // 물품추가 섹션으로 스크롤
    document.querySelector('.section').scrollIntoView({ behavior: 'smooth' });
}

// 주문 삭제
function deleteOrder(orderId, showAlert = true) {
    if (showAlert) {
        const orders = getOrders();
        const order = orders.find(o => o.id === orderId);
        
        if (!order) {
            alert('주문을 찾을 수 없습니다.');
            return;
        }
        
        // 권한 체크
        if (currentUser !== 'admin' && order.buyer !== currentUser) {
            alert('본인의 주문만 삭제할 수 있습니다.');
            return;
        }
        
        if (!confirm('정말로 이 주문을 삭제하시겠습니까?')) {
            return;
        }
    }
    
    const orders = getOrders();
    const updatedOrders = orders.filter(o => o.id !== orderId);
    
    localStorage.setItem('daewonOrders', JSON.stringify(updatedOrders));
    
    if (showAlert) {
        alert('주문이 삭제되었습니다.');
    }
    
    // 현재상황 새로고침
    loadStatus();
}


// 날짜 포맷팅
function formatDate(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
}

// 통화 포맷팅
function formatCurrency(amount) {
    return new Intl.NumberFormat('ko-KR', {
        style: 'currency',
        currency: 'KRW'
    }).format(Math.round(amount));
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

