/**
 * 사용자 계정 관리 파일
 * 
 * 이 파일에서 아이디와 비밀번호를 쉽게 관리할 수 있습니다.
 * 새로운 사용자를 추가하려면 아래 객체에 '아이디': '비밀번호' 형식으로 추가하세요.
 * 
 * 주의사항:
 * 1. 깃허브 페이지는 정적 사이트이므로 비밀번호가 소스코드에 노출됩니다.
 * 2. 실제 보안이 중요한 경우, 백엔드 서버와 데이터베이스를 사용해야 합니다.
 * 3. 이 방법은 연구실 내부용 간단한 웹사이트에 적합합니다.
 */

const USERS = {
    // 관리자 계정
    'admin': 'admin123',
    
    // 학생 계정들
    'student1': 'pass1234',
    'student2': 'pass5678',
    'student3': 'pass9012',
    
    // 새로운 사용자 추가 예시:
    // 'username': 'password',
};

/**
 * 사용자 추가 방법:
 * 
 * 1. 위의 USERS 객체에 다음 형식으로 추가:
 *    'new_username': 'new_password',
 * 
 * 2. 예시:
 *    'kimchul': 'kamic2025',
 *    'parkmin': 'secure123',
 * 
 * 3. 파일을 저장하고 깃허브에 푸시하면 즉시 적용됩니다.
 */

/**
 * 사용자 삭제 방법:
 * 
 * 삭제하려는 사용자의 줄을 지우거나 주석 처리하세요:
 * // 'old_username': 'old_password',  // 비활성화됨
 */

/**
 * 비밀번호 변경 방법:
 * 
 * 해당 사용자의 비밀번호 부분만 수정하세요:
 * 'username': 'new_password',  // 기존: 'old_password'
 */

// 이 파일을 script.js에서 사용하려면
// index.html의 <script src="script.js"></script> 앞에
// <script src="users-config.js"></script>를 추가하세요