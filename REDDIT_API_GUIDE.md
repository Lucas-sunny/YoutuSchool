# 🤖 Reddit API 키 발급 가이드 (3분 완성)

코다리 부장입니다! 🫡
Reddit(레딧)에서 데이터를 가져오려면 **"나 봇(Bot)이야, 문 좀 열어줘!"** 라고 신고를 해야 합니다.
아주 간단하니 금방 끝납니다!

## 1단계: Reddit 앱 만들기
1.  [Reddit 앱 설정 페이지](https://www.reddit.com/prefs/apps)에 접속합니다. (로그인 필요)
2.  맨 아래에 있는 **"are you a developer? create an app..."** 버튼 클릭. (또는 "create another app...")
3.  다음 내용을 입력합니다:
    *   **name**: `YoutuSchoolCrawler` (원하는 이름 아무거나)
    *   **App type**: **● script** (이거 선택하는 게 제일 중요합니다! ⭐)
    *   **description**: (비워도 됨)
    *   **about url**: (비워도 됨)
    *   **redirect uri**: `http://localhost:8080` (그냥 이렇게 적으면 됩니다)
4.  **"create app"** 버튼 클릭!

## 2단계: 키 복사하기 🔑
앱이 만들어지면 화면에 외계어 같은 영어들이 나옵니다. 딱 2개만 찾으세요!

1.  **Client ID (아이디)**:
    *   앱 이름(`YoutuSchoolCrawler`) **바로 밑에 있는** 이상한 문자열입니다.
    *   예: `OpQ-aBcD1234Ef`
2.  **Client Secret (비밀번호)**:
    *   **`secret`** 옆에 있는 긴 문자열입니다.
    *   예: `XyZ987-aBcDeFgHiJkLmNoPqRsT`

## 3단계: 코다리에게 알려주기
이 두 가지 키를 복사해서 채팅창에 붙여넣어 주시면 됩니다.

```text
Client ID: (여기에 붙여넣기)
Secret: (여기에 붙여넣기)
```


## 🚨 혹시 에러가 뜨나요?
만약 **"Responsible Builder Policy"** 어쩌구 하는 빨간 에러가 뜬다면?
범인은 **"이메일 인증"** 입니다! 📧

1.  **[계정 설정(클릭)](https://www.reddit.com/settings/account)** 으로 들어갑니다.
2.  **Email address** 옆에 **Verified** 뱃지가 있는지 확인하세요.
3.  없으면 인증 메일 다시 보내서 인증 완료하고 다시 시도하세요!

(인증해도 안 되면 **RSS 방식**으로 우회할 거니까 걱정 마시고 알려주세요!)

