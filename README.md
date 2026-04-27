# 🚀 인계점 - Frontend

본 프로젝트는 RAG 기반 챗봇을 이용한 인수인계 플랫폼, **인계점**의 프론트엔드 리포지토리입니다.<br>
React와 Vite를 기반으로 구축된 SPA(Single Page Application)이며, 직관적인 UI/UX를 통해 업무 스페이스 관리, 자료실, 인수인계서 작성 및 AI 챗봇 기능을 제공합니다.

## 📅 Schedule / Milestones
> **TODO**: 실제 캡스톤 진행 일정에 맞춰 수정해주세요.
- **202X.0X - 202X.0X**: 기획 및 요구사항 정의 (UI/UX 와이어프레임 설계)
- **202X.0X - 202X.0X**: 화면 퍼블리싱 및 공통 컴포넌트 개발
- **202X.0X - 202X.0X**: 백엔드 REST API 연동 및 챗봇 인터페이스 구현
- **202X.0X - 202X.0X**: 프론트엔드 배포 및 QA (통합 테스트)
- **202X.0X**: 최종 배포 및 발표 준비

## 👥 Team & Roles
> **TODO**: 팀원들의 이름, GitHub 아이디, 역할로 채워주세요. (백엔드 리포지토리와 동일하게 맞추는 것을 권장합니다.)
> 
| 👑 팀장 TODO_이름 | 💻 팀원 TODO_이름 | 💻 팀원 TODO_이름 |
|:---:|:---:|:---:|
| <img src="https://github.com/TODO_id.png" width="100"> | <img src="https://github.com/TODO_id.png" width="100"> | <img src="https://github.com/TODO_id.png" width="100"> |
| [@TODO_id](https://github.com/TODO_id) | [@TODO_id](https://github.com/TODO_id) | [@TODO_id](https://github.com/TODO_id) |
| **Backend & Infra** | **Backend API** | **Frontend / QA**<br>- 프론트엔드 아키텍처 설계<br>- UI/UX 개발 및 API 연동 |

## 🛠 Tech Stack

- **Framework / Library:** React 19, Vite
- **Routing:** React Router v7
- **HTTP Client:** Axios (Interceptor 기반 API 통신)
- **PDF Generation:** html2canvas, jspdf (인수인계서 PDF 내보내기)
- **Markdown Rendering:** react-markdown, remark-gfm (챗봇 응답 렌더링)
- **Styling:** CSS / Inline Styles
- **Package Manager:** npm

## 🏛️ System Architecture
```mermaid
graph LR
    Client([Client<br>React SPA / Vercel]) <-->|REST API (JSON/Multipart)| Backend(Spring Boot Backend)
    Backend <-->|JPA/MyBatis| DB[(MySQL)]
    Backend <-->|Upload/Download| S3[(AWS S3)]
    Backend <-->|HTTP Request| Chatbot(Python RAG Chatbot)
```

## 📌 Key Features

1. **마이 프로필 및 참여 정보 관리**
   - 사용자 기본 정보 확인 및 관리 중인 그룹/스페이스 상태 확인
   - 담당자 업무 인계(초대) 발송 기능
2. **협업 공간 및 조직 관리 (Group & Space)**
   - 업무 그룹 및 하위 스페이스 생성, 이름 수정, 삭제 기능
   - 권한에 따른 스페이스 리스트 및 담당자 배정
3. **자료실 파일 탐색기 (Archive)**
   - 스페이스 별 폴더/파일 업로드 및 계층형 폴더 탐색 구조 구현
   - 드래그 앤 드롭을 이용한 파일 이동 
   - 브라우저 내 PDF, 이미지, 텍스트 문서 미리보기 지원
4. **인수인계서 관리 (Handover)**
   - 인수인계서 신규 작성 및 이전 내역 아카이빙
   - 작성된 인수인계서의 PDF 다운로드 지원 (`jspdf` 연동)
5. **RAG 기반 챗봇 화면 (AI Assistant)**
   - 스페이스 내 업로드된 자료를 기반으로 질문/답변하는 채팅 인터페이스
   - 답변 출처(Reference) 클릭 시 해당 파일 및 페이지로 즉시 이동 및 미리보기
   - 마크다운 문법 렌더링 지원

## 🚀 Deployment
현재 프로젝트는 **Vercel**을 통해 배포되고 있으며, GitHub 레포지토리의 변경 사항이 감지되면 자동으로 빌드 및 배포가 진행됩니다.

- **Hosting Platform**: Vercel
- **Routing Setup**: `vercel.json`을 통한 SPA 라우팅(Rewrite) 적용 완료
- **Prod Server URL**: `https://ingyejeom.vercel.app` (추후 커스텀 도메인 연결 시 수정 필요)

## 📂 Project Structure

```text
src/
├── api/          # Axios 인스턴스 및 Interceptor 설정 (api.js)
├── components/   # 재사용 가능한 공통 UI 컴포넌트 (Header, Layout 등)
├── data/         # UI 퍼블리싱용 Mock 데이터 (mockData.js)
├── pages/        # 라우팅되는 각 페이지 컴포넌트
│   ├── Admin.jsx
│   ├── Archive.jsx
│   ├── Auth.jsx
│   ├── CreateGroup.jsx
│   ├── Handover.jsx
│   ├── Home.jsx
│   ├── JoinSpace.jsx
│   ├── Profile.jsx
│   ├── Space.jsx
│   └── SpaceList.jsx
├── App.jsx       # 애플리케이션 최상위 라우터 설정
├── index.css     # 글로벌 CSS 및 공통 폰트 설정
└── main.jsx      # React 엔트리 포인트
```

## ⚙️ Getting Started (Local Development)

### Prerequisites
- Node.js (v18 이상 권장)
- npm

### Installation & Run
```bash
# 1. 패키지 설치
npm install

# 2. 로컬 개발 서버 실행 (기본 포트: http://localhost:5173)
npm run dev

# 3. 배포용 빌드 테스트
npm run build
npm run preview
```

### API Configuration
로컬 개발 시 백엔드 API와 통신하기 위해 `src/api/api.js` 내부의 `baseURL`을 설정해야 합니다.
배포 시에는 배포된 백엔드 URL(`https://ingyejeom.cloud/api`)로 연결되어 있어야 합니다.

## 🤝 Branch Strategy & Conventions

### 📌 브랜치 이름 규칙
`분류/기능-요약` 형식을 사용하며, **소문자와 하이픈(-)** 만 사용합니다. (Kebab Case)
* 예시: `feature/space-list` (O) / `feature/spaceList` (X)

| 브랜치명 | 설명 |
|---|---|
| `main` | 배포 가능한 안정화 상태 (Vercel 자동 배포 연동) |
| `develop` | 다음 버전을 위한 통합 개발 브랜치 |
| `feature/...` | 새로운 기능 및 페이지 개발 |
| `fix/...` | 버그 수정 |
| `refactor/...` | UI 컴포넌트 분리 등 로직 개선 |

### 📌 커밋 메시지 규칙
`[Type] 제목` 형식을 사용하며, 제목은 50자 이내의 **명사형 종결**을 권장합니다.

| 태그(Type) | 의미 (Description) | 사용 예시 |
|---|---|---|
| `[feat]` | 새로운 컴포넌트/기능 추가 | `[feat] 자료실 드래그 앤 드롭 업로드 구현` |
| `[edit]` | 버그 또는 기존 기능 수정 | `[edit] 모바일 환경 챗봇 UI 잘림 현상 수정` |
| `[docs]` | 문서 작업 (README 등) | `[docs] 프론트엔드 리드미 작성` |
| `[style]` | UI 스타일링, CSS 수정 | `[style] 메인 페이지 버튼 색상 변경` |
| `[refactor]` | 코드 리팩토링 | `[refactor] 헤더 컴포넌트 분리 및 재사용` |
| `[chore]` | 빌드, 패키지 매니저 등 | `[chore] jspdf 라이브러리 추가` |

---

## 🔄 협업 워크플로우 (The Loop)

**[1. 최신화] → [2. 브랜치 생성] → [3. 작업/저장] → [4. 업로드] → [5. PR 및 리뷰] → [6. 병합(완료)]**

1. **최신화:** `git pull origin develop`
2. **브랜치 생성:** `git checkout -b feature/작업명`
3. **작업 및 커밋:** `git add .` → `git commit -m "[feat] 핵심 작업 내용"`
4. **업로드:** `git push origin feature/작업명`
5. **PR:** GitHub에서 `develop` 브랜치 타겟으로 PR 생성
6. **청소:** 병합 완료 후 브랜치 삭제 및 최신화