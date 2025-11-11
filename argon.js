// Ar가스 주문 페이지 전용 스크립트

// 전역 변수
let gasList = [];
let editingOrderId = null;

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

    // 관리자 모드 체크
    checkAdminMode();
    
    // 내 주문 목록 로드
    loadMyOrders();
});

// 가스 목록에 추가
function addGasToList() {
    const gasType = document.getElementById('gasType').value;
    const quantity = parseInt(document.getElementById('gasQuantity').value);
    
    if (!gasType || !quantity || quantity < 1) {
        alert('가스 종류와 주문량을 올바르게 입력해주세요.');
        return;
    }
    
    gasList.push({
        type: gasType,
        quantity: quantity
    });
    
    updateGasListDisplay();
    
    // 입력 필드 초기화
    document.getElementById('gasType').value = '';
    document.getElementById('gasQuantity').value = 1;
}

// 가스 목록에서 삭제
function removeGasFromList(index) {
    gasList.splice(index, 1);
    updateGasListDisplay();
}

// 가스 목록 표시 업데이트
function updateGasListDisplay() {
    const container = document.getElementById('gasList');
    
    if (gasList.length === 0) {
        container.innerHTML = '';
        return;
    }
    
    container.innerHTML = '';
    
    gasList.forEach((gas, index) => {
        const item = document.createElement('div');
        item.className = 'gas-item';
        item.innerHTML = `
            <div class="gas-item-info">
                <strong>${gas.type}</strong> - ${gas.quantity}개
            </div>
            <button type="button" class="delete-gas-btn" onclick="removeGasFromList(${index})">삭제</button>
        `;
        container.appendChild(item);
    });
}

// 사용목적 변경 처리
function handlePurposeChange() {
    const purpose = document.getElementById('purpose').value;
    const directInput = document.getElementById('purposeDirectInput');
    
    if (purpose === '직접입력') {
        directInput.style.display = 'flex';
        document.getElementById('purposeDirect').required = true;
    } else {
        directInput.style.display = 'none';
        document.getElementById('purposeDirect').required = false;
        document.getElementById('purposeDirect').value = '';
    }
}

// 입고예정일 모름 체크 처리
function handleDeliveryUnknown() {
    const unknown = document.getElementById('deliveryUnknown').checked;
    const deliveryDate = document.getElementById('deliveryDate');
    const deliveryTime = document.getElementById('deliveryTime');
    
    if (unknown) {
        deliveryDate.disabled = true;
        deliveryTime.disabled = true;
        deliveryDate.value = '';
        deliveryTime.value = '';
    } else {
        deliveryDate.disabled = false;
        deliveryTime.disabled = false;
    }
}

// 주문 처리
function handleOrder(event) {
    event.preventDefault();
    
    const orderDate = document.getElementById('orderDate').value;
    const purpose = document.getElementById('purpose').value;
    const purposeDirect = document.getElementById('purposeDirect').value;
    const deliveryDate = document.getElementById('deliveryDate').value;
    const deliveryTime = document.getElementById('deliveryTime').value;
    const deliveryUnknown = document.getElementById('deliveryUnknown').checked;
    const messageEl = document.getElementById('orderMessage');
    
    // 유효성 검사
    if (!orderDate) {
        messageEl.textContent = '주문일을 입력해주세요.';
        messageEl.className = 'error-message';
        messageEl.style.display = 'block';
        return;
    }
    
    if (gasList.length === 0 && !editingOrderId) {
        messageEl.textContent = '가스 종류를 최소 1개 이상 추가해주세요.';
        messageEl.className = 'error-message';
        messageEl.style.display = 'block';
        return;
    }
    
    if (!purpose) {
        messageEl.textContent = '사용목적을 선택해주세요.';
        messageEl.className = 'error-message';
        messageEl.style.display = 'block';
        return;
    }
    
    if (purpose === '직접입력' && !purposeDirect) {
        messageEl.textContent = '사용목적을 직접 입력해주세요.';
        messageEl.className = 'error-message';
        messageEl.style.display = 'block';
        return;
    }
    
    const finalPurpose = purpose === '직접입력' ? purposeDirect : purpose;
    const finalDeliveryDate = deliveryUnknown ? '모름' : (deliveryDate + (deliveryTime ? ' ' + deliveryTime : ''));
    
    // 수정 모드인지 확인
    if (editingOrderId) {
        // 수정 모드
        updateOrder(editingOrderId, {
            orderDate: orderDate,
            gasList: gasList,
            purpose: finalPurpose,
            deliveryDate: finalDeliveryDate
        });
        
        messageEl.textContent = '주문이 수정되었습니다!';
        messageEl.className = 'success-message';
        messageEl.style.display = 'block';
        
        cancelEdit();
    } else {
        // 새 주문: 가스 종류별로 개별 주문 생성
        gasList.forEach(gas => {
            const order = {
                id: Date.now() + Math.random(),
                orderDate: orderDate,
                gasType: gas.type,
                quantity: gas.quantity,
                user: currentUser,
                purpose: finalPurpose,
                deliveryDate: finalDeliveryDate,
                createdAt: new Date().toISOString()
            };
            
            saveOrder(order);
        });
        
        messageEl.textContent = '주문이 완료되었습니다!';
        messageEl.className = 'success-message';
        messageEl.style.display = 'block';
        
        // 폼 초기화
        document.getElementById('orderForm').reset();
        gasList = [];
        updateGasListDisplay();
        document.getElementById('purposeDirectInput').style.display = 'none';
        document.getElementById('deliveryDate').disabled = false;
        document.getElementById('deliveryTime').disabled = false;
    }
    
    // 목록 새로고침
    loadMyOrders();
    
    // 관리자 모드면 목록도 새로고침
    if (currentUser === 'admin') {
        loadAdminOrders();
    }
}

// 주문 저장
function saveOrder(order) {
    const orders = getOrders();
    orders.push(order);
    localStorage.setItem('argonOrders', JSON.stringify(orders));
}

// 주문 목록 가져오기
function getOrders() {
    const stored = localStorage.getItem('argonOrders');
    return stored ? JSON.parse(stored) : [];
}

// 내 주문 목록 로드 (최근 1개월)
function loadMyOrders() {
    const orders = getOrders().filter(o => o.user === currentUser);
    const now = new Date();
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    
    // 최근 1개월 필터링
    const recentOrders = orders.filter(o => {
        const orderDate = new Date(o.orderDate);
        return orderDate >= oneMonthAgo;
    });
    
    // 최신순으로 정렬
    recentOrders.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
    
    const tbody = document.getElementById('myOrderList');
    
    if (recentOrders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="no-orders">주문 내역이 없습니다.</td></tr>';
        return;
    }
    
    tbody.innerHTML = '';
    
    recentOrders.forEach(order => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatDate(order.orderDate)}</td>
            <td>${order.gasType}</td>
            <td>${order.quantity}</td>
            <td>${order.user}</td>
            <td>${order.purpose}</td>
            <td>${order.deliveryDate}</td>
            <td>
                <button class="edit-btn" onclick="editOrder(${order.id})">수정</button>
                <button class="delete-btn" onclick="deleteOrder(${order.id})">삭제</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// 주문 수정
function editOrder(id) {
    const orders = getOrders();
    const order = orders.find(o => o.id === id && o.user === currentUser);
    
    if (!order) {
        alert('주문을 찾을 수 없거나 수정 권한이 없습니다.');
        return;
    }
    
    editingOrderId = id;
    
    // 폼에 데이터 채우기
    document.getElementById('editingOrderId').value = id;
    document.getElementById('orderDate').value = order.orderDate;
    document.getElementById('purpose').value = order.purpose;
    
    // 사용목적이 직접입력인지 확인
    const purposeOptions = ['WAAM', 'PBD M280', 'LP-DED&박스로', 'LW-DED&부품열처리기', '세포방'];
    if (!purposeOptions.includes(order.purpose)) {
        document.getElementById('purpose').value = '직접입력';
        document.getElementById('purposeDirect').value = order.purpose;
        handlePurposeChange();
    }
    
    // 입고예정일 처리
    if (order.deliveryDate === '모름') {
        document.getElementById('deliveryUnknown').checked = true;
        handleDeliveryUnknown();
    } else {
        const parts = order.deliveryDate.split(' ');
        document.getElementById('deliveryDate').value = parts[0];
        if (parts[1]) {
            document.getElementById('deliveryTime').value = parts[1];
        }
    }
    
    // 가스 목록에 추가
    gasList = [{
        type: order.gasType,
        quantity: order.quantity
    }];
    updateGasListDisplay();
    
    // 폼 제목 및 버튼 변경
    document.getElementById('formTitle').textContent = '주문 수정';
    document.getElementById('submitBtn').textContent = '수정하기';
    document.getElementById('cancelEditBtn').style.display = 'block';
    
    // 폼으로 스크롤
    document.getElementById('orderFormSection').scrollIntoView({ behavior: 'smooth' });
}

// 주문 삭제
function deleteOrder(id) {
    if (!confirm('정말로 이 주문을 삭제하시겠습니까?')) {
        return;
    }
    
    const orders = getOrders();
    const order = orders.find(o => o.id === id && o.user === currentUser);
    
    if (!order) {
        alert('주문을 찾을 수 없거나 삭제 권한이 없습니다.');
        return;
    }
    
    // 주문 삭제
    const updatedOrders = orders.filter(o => o.id !== id);
    localStorage.setItem('argonOrders', JSON.stringify(updatedOrders));
    
    alert('주문이 삭제되었습니다.');
    
    // 목록 새로고침
    loadMyOrders();
    
    // 관리자 모드면 목록도 새로고침
    if (currentUser === 'admin') {
        loadAdminOrders();
    }
}

// 주문 수정
function updateOrder(id, updates) {
    const orders = getOrders();
    const index = orders.findIndex(o => o.id === id && o.user === currentUser);
    
    if (index === -1) {
        alert('주문을 찾을 수 없거나 수정 권한이 없습니다.');
        return;
    }
    
    // 기존 주문 삭제
    orders.splice(index, 1);
    
    // 새로운 주문들 생성 (가스 종류별로)
    updates.gasList.forEach(gas => {
        const order = {
            id: id + Math.random(), // 새로운 ID 생성
            orderDate: updates.orderDate,
            gasType: gas.type,
            quantity: gas.quantity,
            user: currentUser,
            purpose: updates.purpose,
            deliveryDate: updates.deliveryDate,
            createdAt: new Date().toISOString()
        };
        
        orders.push(order);
    });
    
    localStorage.setItem('argonOrders', JSON.stringify(orders));
}

// 수정 취소
function cancelEdit() {
    editingOrderId = null;
    document.getElementById('editingOrderId').value = '';
    document.getElementById('orderForm').reset();
    gasList = [];
    updateGasListDisplay();
    document.getElementById('purposeDirectInput').style.display = 'none';
    document.getElementById('deliveryDate').disabled = false;
    document.getElementById('deliveryTime').disabled = false;
    document.getElementById('deliveryUnknown').checked = false;
    document.getElementById('formTitle').textContent = 'Ar가스 주문';
    document.getElementById('submitBtn').textContent = '주문하기';
    document.getElementById('cancelEditBtn').style.display = 'none';
    document.getElementById('orderMessage').style.display = 'none';
}

// 관리자 모드 체크
function checkAdminMode() {
    const adminSection = document.getElementById('adminSection');
    const orderFormSection = document.getElementById('orderFormSection');
    
    if (currentUser === 'admin') {
        adminSection.style.display = 'block';
        loadAdminOrders();
        loadGasPrices();
    } else {
        adminSection.style.display = 'none';
    }
}

// 관리자 주문 목록 로드 (1년치)
function loadAdminOrders() {
    const orders = getOrders();
    const now = new Date();
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    
    // 최근 1년 필터링
    const recentOrders = orders.filter(o => {
        const orderDate = new Date(o.orderDate);
        return orderDate >= oneYearAgo;
    });
    
    // 날짜순으로 정렬
    recentOrders.sort((a, b) => new Date(a.orderDate) - new Date(b.orderDate));
    
    const tbody = document.getElementById('adminOrderList');
    
    if (recentOrders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="no-orders">주문 내역이 없습니다.</td></tr>';
        return;
    }
    
    tbody.innerHTML = '';
    let cumulativeAmount = 0;
    
    // 결제 내역 가져오기
    const payments = getPayments();
    
    // 결제 내역을 날짜순으로 정렬
    payments.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // 모든 이벤트(주문 + 결제)를 날짜순으로 정렬
    const allEvents = [];
    
    recentOrders.forEach(order => {
        // 주문 날짜에 맞는 가격 가져오기
        const prices = getGasPricesForDate(order.orderDate);
        const price = prices[order.gasType] || 0;
        const totalAmount = price * order.quantity;
        // 저장된 미수금액이 있으면 사용, 없으면 총 금액과 동일
        const unpaidAmount = order.unpaidAmount !== undefined ? order.unpaidAmount : totalAmount;
        
        allEvents.push({
            type: 'order',
            date: order.orderDate,
            order: {
                ...order,
                unpaidAmount: unpaidAmount
            },
            totalAmount: totalAmount,
            unpaidAmount: unpaidAmount
        });
    });
    
    payments.forEach(payment => {
        allEvents.push({
            type: 'payment',
            date: payment.date,
            amount: -payment.amount // 음수로 표시
        });
    });
    
    // 날짜순으로 정렬
    allEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    allEvents.forEach((event, index) => {
        if (event.type === 'order') {
            // 저장된 미수금액이 있으면 사용, 없으면 총 금액과 동일
            const savedUnpaidAmount = event.order.unpaidAmount !== undefined ? event.order.unpaidAmount : event.totalAmount;
            cumulativeAmount += savedUnpaidAmount;
            
            const row = document.createElement('tr');
            row.setAttribute('data-order-id', event.order.id);
            row.innerHTML = `
                <td>${formatDate(event.order.orderDate)}</td>
                <td>${event.order.gasType}</td>
                <td>${event.order.quantity}</td>
                <td>${event.order.user}</td>
                <td>${formatCurrency(event.totalAmount)}</td>
                <td>
                    <input type="number" 
                           class="unpaid-amount-input" 
                           value="${savedUnpaidAmount}" 
                           data-order-id="${event.order.id}"
                           style="width: 120px; padding: 0.5rem; border: 2px solid #e0e0e0; border-radius: 5px;">
                </td>
                <td class="cumulative-amount">${formatCurrency(cumulativeAmount)}</td>
                <td>
                    <button class="save-unpaid-btn" onclick="saveUnpaidAmount(${event.order.id})" style="padding: 0.5rem 1rem; background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: 600;">저장</button>
                </td>
            `;
            tbody.appendChild(row);
        } else if (event.type === 'payment') {
            cumulativeAmount += event.amount;
            
            const row = document.createElement('tr');
            row.style.backgroundColor = '#fff3cd';
            row.innerHTML = `
                <td>${formatDate(event.date)}</td>
                <td colspan="2"><strong>소액검수</strong></td>
                <td>-</td>
                <td>-</td>
                <td>${formatCurrency(event.amount)}</td>
                <td>${formatCurrency(cumulativeAmount)}</td>
                <td>-</td>
            `;
            tbody.appendChild(row);
        }
    });
}

// 미수금액 저장
function saveUnpaidAmount(orderId) {
    const input = document.querySelector(`.unpaid-amount-input[data-order-id="${orderId}"]`);
    const unpaidAmount = parseFloat(input.value);
    
    if (isNaN(unpaidAmount) || unpaidAmount < 0) {
        alert('올바른 금액을 입력해주세요.');
        return;
    }
    
    const orders = getOrders();
    const orderIndex = orders.findIndex(o => o.id === orderId);
    
    if (orderIndex === -1) {
        alert('주문을 찾을 수 없습니다.');
        return;
    }
    
    // 미수금액 저장
    orders[orderIndex].unpaidAmount = unpaidAmount;
    localStorage.setItem('argonOrders', JSON.stringify(orders));
    
    alert('미수금액이 저장되었습니다.');
    
    // 관리자 목록 새로고침
    loadAdminOrders();
}

// 가스 가격 저장 (날짜별)
function saveGasPrices() {
    const priceDate = document.getElementById('priceDate').value;
    
    if (!priceDate) {
        alert('적용 시작일을 입력해주세요.');
        return;
    }
    
    const prices = {
        date: priceDate,
        '고순도 아르곤(47L/ 날씬이)': parseFloat(document.getElementById('priceArgon47').value) || 0,
        '고압 아르곤': parseFloat(document.getElementById('priceArgonHigh').value) || 0,
        '액화 아르곤(130L/뚱뚱이)': parseFloat(document.getElementById('priceArgon130').value) || 0,
        '이산화탄소': parseFloat(document.getElementById('priceCO2').value) || 0,
        '액화질소': parseFloat(document.getElementById('priceNitrogen').value) || 0
    };
    
    // 기존 가격 목록 가져오기
    const priceList = getPriceList();
    
    // 같은 날짜가 있으면 업데이트, 없으면 추가
    const existingIndex = priceList.findIndex(p => p.date === priceDate);
    if (existingIndex !== -1) {
        priceList[existingIndex] = prices;
    } else {
        priceList.push(prices);
    }
    
    // 날짜순으로 정렬
    priceList.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    localStorage.setItem('argonGasPricesList', JSON.stringify(priceList));
    alert('가격이 저장되었습니다.');
    
    // 입력 필드 초기화
    document.getElementById('priceDate').value = '';
    document.getElementById('priceArgon47').value = '';
    document.getElementById('priceArgonHigh').value = '';
    document.getElementById('priceArgon130').value = '';
    document.getElementById('priceCO2').value = '';
    document.getElementById('priceNitrogen').value = '';
    
    // 가격 목록 새로고침
    loadPriceList();
    
    // 관리자 목록 새로고침
    loadAdminOrders();
}

// 가격 목록 가져오기
function getPriceList() {
    const stored = localStorage.getItem('argonGasPricesList');
    return stored ? JSON.parse(stored) : [];
}

// 주문 날짜에 맞는 가격 가져오기
function getGasPricesForDate(orderDate) {
    const priceList = getPriceList();
    
    if (priceList.length === 0) {
        return {};
    }
    
    // 주문 날짜 이전의 가장 최근 가격 찾기
    const orderDateObj = new Date(orderDate);
    let selectedPrice = null;
    
    for (let i = priceList.length - 1; i >= 0; i--) {
        const priceDate = new Date(priceList[i].date);
        if (priceDate <= orderDateObj) {
            selectedPrice = priceList[i];
            break;
        }
    }
    
    // 주문 날짜 이전의 가격이 없으면 첫 번째 가격 사용
    if (!selectedPrice && priceList.length > 0) {
        selectedPrice = priceList[0];
    }
    
    if (!selectedPrice) {
        return {};
    }
    
    // date 필드 제외하고 반환
    const { date, ...prices } = selectedPrice;
    return prices;
}

// 가스 가격 가져오기 (기존 호환성 유지)
function getGasPrices() {
    // 최신 가격 반환 (날짜별 가격이 없을 경우를 대비)
    const priceList = getPriceList();
    if (priceList.length > 0) {
        const latest = priceList[priceList.length - 1];
        const { date, ...prices } = latest;
        return prices;
    }
    return {};
}

// 가격 목록 표시
function loadPriceList() {
    const priceList = getPriceList();
    const tbody = document.getElementById('priceListBody');
    
    if (priceList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="no-orders">저장된 가격이 없습니다.</td></tr>';
        return;
    }
    
    tbody.innerHTML = '';
    
    // 최신순으로 정렬 (표시용)
    const sortedList = [...priceList].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    sortedList.forEach((price, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatDate(price.date)}</td>
            <td>${formatCurrency(price['고순도 아르곤(47L/ 날씬이)'] || 0)}</td>
            <td>${formatCurrency(price['고압 아르곤'] || 0)}</td>
            <td>${formatCurrency(price['액화 아르곤(130L/뚱뚱이)'] || 0)}</td>
            <td>${formatCurrency(price['이산화탄소'] || 0)}</td>
            <td>${formatCurrency(price['액화질소'] || 0)}</td>
            <td>
                <button class="edit-btn" onclick="editPrice('${price.date}')" style="padding: 0.3rem 0.8rem; font-size: 0.85rem;">수정</button>
                <button class="delete-btn" onclick="deletePrice('${price.date}')" style="padding: 0.3rem 0.8rem; font-size: 0.85rem;">삭제</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// 가격 수정
function editPrice(date) {
    const priceList = getPriceList();
    const price = priceList.find(p => p.date === date);
    
    if (!price) {
        alert('가격을 찾을 수 없습니다.');
        return;
    }
    
    // 폼에 데이터 채우기
    document.getElementById('priceDate').value = price.date;
    document.getElementById('priceArgon47').value = price['고순도 아르곤(47L/ 날씬이)'] || '';
    document.getElementById('priceArgonHigh').value = price['고압 아르곤'] || '';
    document.getElementById('priceArgon130').value = price['액화 아르곤(130L/뚱뚱이)'] || '';
    document.getElementById('priceCO2').value = price['이산화탄소'] || '';
    document.getElementById('priceNitrogen').value = price['액화질소'] || '';
    
    // 스크롤
    document.getElementById('priceDate').scrollIntoView({ behavior: 'smooth' });
}

// 가격 삭제
function deletePrice(date) {
    if (!confirm('정말로 이 가격을 삭제하시겠습니까?')) {
        return;
    }
    
    const priceList = getPriceList();
    const updatedList = priceList.filter(p => p.date !== date);
    
    localStorage.setItem('argonGasPricesList', JSON.stringify(updatedList));
    alert('가격이 삭제되었습니다.');
    
    // 가격 목록 새로고침
    loadPriceList();
    
    // 관리자 목록 새로고침
    loadAdminOrders();
}

// 가스 가격 로드 (기존 호환성 유지 - 사용 안 함)
function loadGasPrices() {
    // 가격 목록 표시
    loadPriceList();
}

// 소액검수 추가
function addPayment() {
    const date = document.getElementById('paymentDate').value;
    const amount = parseFloat(document.getElementById('paymentAmount').value);
    
    if (!date || !amount || amount <= 0) {
        alert('날짜와 처리금액을 올바르게 입력해주세요.');
        return;
    }
    
    const payments = getPayments();
    payments.push({
        id: Date.now(),
        date: date,
        amount: amount
    });
    
    localStorage.setItem('argonPayments', JSON.stringify(payments));
    
    alert('소액검수가 추가되었습니다.');
    
    // 입력 필드 초기화
    document.getElementById('paymentDate').value = '';
    document.getElementById('paymentAmount').value = '';
    
    // 관리자 목록 새로고침
    loadAdminOrders();
}

// 결제 내역 가져오기
function getPayments() {
    const stored = localStorage.getItem('argonPayments');
    return stored ? JSON.parse(stored) : [];
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
    }).format(amount);
}

// 엑셀로 내보내기
function exportToExcel() {
    const orders = getOrders();
    const now = new Date();
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    
    // 최근 1년 필터링
    const recentOrders = orders.filter(o => {
        const orderDate = new Date(o.orderDate);
        return orderDate >= oneYearAgo;
    });
    
    // 날짜순으로 정렬
    recentOrders.sort((a, b) => new Date(a.orderDate) - new Date(b.orderDate));
    
    if (recentOrders.length === 0) {
        alert('내보낼 주문이 없습니다.');
        return;
    }
    
    const payments = getPayments();
    payments.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // CSV 형식으로 변환
    let csv = '주문일,가스종류,개수,사용자,총금액,미수금액,누적금액\n';
    
    let cumulativeAmount = 0;
    const allEvents = [];
    
    recentOrders.forEach(order => {
        // 주문 날짜에 맞는 가격 가져오기
        const prices = getGasPricesForDate(order.orderDate);
        const price = prices[order.gasType] || 0;
        const totalAmount = price * order.quantity;
        // 저장된 미수금액이 있으면 사용, 없으면 총 금액과 동일
        const unpaidAmount = order.unpaidAmount !== undefined ? order.unpaidAmount : totalAmount;
        
        allEvents.push({
            type: 'order',
            date: order.orderDate,
            order: order,
            totalAmount: totalAmount,
            unpaidAmount: unpaidAmount
        });
    });
    
    payments.forEach(payment => {
        allEvents.push({
            type: 'payment',
            date: payment.date,
            amount: -payment.amount
        });
    });
    
    allEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    allEvents.forEach(event => {
        if (event.type === 'order') {
            cumulativeAmount += event.unpaidAmount;
            csv += `"${formatDate(event.order.orderDate)}","${event.order.gasType}","${event.order.quantity}","${event.order.user}","${formatCurrency(event.totalAmount)}","${formatCurrency(event.unpaidAmount)}","${formatCurrency(cumulativeAmount)}"\n`;
        } else if (event.type === 'payment') {
            cumulativeAmount += event.amount;
            csv += `"${formatDate(event.date)}","소액검수","-","-","-","${formatCurrency(event.amount)}","${formatCurrency(cumulativeAmount)}"\n`;
        }
    });
    
    // BOM 추가 (한글 깨짐 방지)
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `Ar가스주문_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

