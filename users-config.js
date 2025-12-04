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
    '김민호': 'rlaalsgh1!',
    '김상현': 'rlatkdgus1!',
    '김영경': 'rladudrud1!',
    '김태협': 'rlaxoguq1!',
    '노승범': 'shtmdqja1!',
    '노재일': 'shwodlf1!',
    '노현철': 'shguscjf1!',
    '문인성': 'ansdlstjd1!',
    '박진수': 'qkrwlstn1!',
    '서지현': 'tjwlgus1!',
    '송경조': 'thdrudwh1!',
    '양승원': 'didtmddnjs1!',
    '옥준혁': 'dhrwnsgur1!',
    '이민정': 'dlalswjd1!',
    '이승호': 'dltmdgh!',
    '이재향': 'dlwogid1!',
    '이지은': 'dlwldms1!',
    '장민석': 'wkdalstjr1!',
    '조윤화': 'whdbsghk1!',
    '지성훈': 'wltjdgns1!',
    '차영환': 'ckdudghks1!',
    '최재원': 'chlwodnjs1!',
    '임하은': 'dlagkdms1!',
    '한지수': 'gkswltn1!',
    '황성연': 'ghkdtjddus1!',
    
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

/**
 * 연구실 멤버 생일 데이터
 * 
 * 형식: { name: '이름', birthday: 'MM-DD', photo: '사진경로' }
 * - birthday: 월-일 형식 (예: '01-15' = 1월 15일)
 * - photo: images/birthdays/ 폴더 내 사진 파일명
 */
const BIRTHDAYS = [
    // 1월
    { name: '서지현', birthday: '01-05', photo: 'images/birthdays/jihyun.jpg' },
    { name: '차영환', birthday: '01-09', photo: 'images/birthdays/youngwhan.jpg' },
    { name: '황성연', birthday: '01-17', photo: 'images/birthdays/sungyeon.jpg' },
    { name: '문인성', birthday: '01-22', photo: 'images/birthdays/inseong.png' },
    
    // 2월
    { name: '지성훈', birthday: '02-09', photo: 'images/birthdays/sunghun.jpg' },
    { name: '김영경', birthday: '02-19', photo: 'images/birthdays/younggyung.jpg' },
    
    // 3월
    { name: '노현철', birthday: '03-01', photo: 'images/birthdays/hyuncheol.jpg' },
    { name: '임하은', birthday: '03-10', photo: 'images/birthdays/haeun.jpg' },
    { name: '송경조', birthday: '03-17', photo: 'images/birthdays/gyeongjo.jpg' },
    
    // 4월
    { name: '박진수', birthday: '04-03', photo: 'images/birthdays/jinsu.jpg' },
    
    // 5월
    { name: '조윤화', birthday: '05-05', photo: 'images/birthdays/yoonwha.jpg' },
    { name: '이재향', birthday: '05-27', photo: 'images/birthdays/jaehyang.jpg' },
    
    // 6월
    { name: '김민호', birthday: '06-21', photo: 'images/birthdays/minho.jpg' },
    
    // 7월
    { name: '양승원', birthday: '07-13', photo: 'images/birthdays/seungwon.jpg' },
    
    // 8월
    
    
    // 9월
    { name: '최재원', birthday: '09-10', photo: 'images/birthdays/jaewon.jpg' },
    { name: '김태협', birthday: '09-18', photo: 'images/birthdays/taehyub.jpg' },
    { name: '이지은', birthday: '09-19', photo: 'images/birthdays/jieun.jpg' },
    { name: '노승범', birthday: '09-24', photo: 'images/birthdays/seungbum.jpg' },
    
    // 10월
    { name: '한지수', birthday: '10-24', photo: 'images/birthdays/jisu.jpg' },
    { name: '김상현', birthday: '10-31', photo: 'images/birthdays/sanghyun.jpg' },
    
    // 11월
    { name: '노재일', birthday: '11-18', photo: 'images/birthdays/jaeil.jpg' },
    { name: '이민정', birthday: '11-20', photo: 'images/birthdays/minjung.jpg' },
    
    // 12월
    { name: '이승호', birthday: '12-16', photo: 'images/birthdays/seungho.jpg' },
    
    // 여러 명 예시 (같은 월에 여러 명 가능)
    // { name: '김민호', birthday: '01-20', photo: 'images/birthdays/minho.jpg' },
];

/**
 * 생일 데이터 추가 방법:
 * 
 * 1. 위의 BIRTHDAYS 배열에 다음 형식으로 추가:
 *    { name: '이름', birthday: 'MM-DD', photo: 'images/birthdays/파일명.jpg' },
 * 
 * 2. 사진 파일은 images/birthdays/ 폴더에 저장
 * 
 * 3. 예시:
 *    { name: '김민호', birthday: '03-15', photo: 'images/birthdays/minho.jpg' },
 */