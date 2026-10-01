# 프런트엔드·백엔드 API 계약 초안

이 문서는 프런트엔드 연동 전에 확인할 접점을 정리한다. 재료 추출·가격 산출·카카오 OAuth·세션·북마크 저장은 백엔드가 맡는다. 프런트엔드는 같은 도메인의 `/api/*`를 호출하고, 받은 재료 배열을 화면에 표시한다.

## 문서에서 확정된 접점

| 요청 | 백엔드 동작 | 프런트엔드 사용처 |
| --- | --- | --- |
| `POST /api/analyze` | YouTube URL 또는 텍스트를 분석해 레시피·가격·재료 배열 반환 | 홈 입력·대기·추출 실패, 이후 결과 화면 |
| `GET /api/auth/kakao` | 카카오 인가 페이지로 이동 | 로그인 모달의 버튼 |
| `GET /api/auth/callback` | 코드 교환·세션 발급 후 원래 화면으로 복귀 | 백엔드 콜백 |
| `GET /api/auth/me` | 로그인 여부와 이름 반환 | 공통 헤더·북마크 접근 |
| `POST /api/auth/logout` | 세션 종료, 북마크 유지 | 계정 메뉴 |
| `DELETE /api/account` | 계정과 북마크 삭제 | 탈퇴 확인 화면 |
| `GET /api/bookmarks` | 저장 순서의 목록을 그날 가격으로 재계산해 반환 | 북마크 화면 |
| `POST /api/bookmarks` | 저장; 5개 초과 시 `409`와 `full` | 이후 결과 화면 |
| `DELETE /api/bookmarks/:id` | 해당 항목 즉시 삭제 | 북마크 화면 |

`POST /api/analyze`의 `type: "youtube" | "text"` 요청과 `ok: true | false` 응답 예시는 백엔드 설계 문서 3.1항을 그대로 사용한다. `reason: "no_ingredients"`는 홈의 추출 실패 카드로 표시한다.

## 백엔드와 확인할 응답 형태

아래는 화면에 필요한 **최소 필드의 제안**이며, 백엔드 응답 형식으로 확정된 값이 아니다. 실제 연동 전에 서로 같은 JSON 예시로 검수한다.

```ts
type SessionResponse =
  | { authenticated: false; user: null }
  | { authenticated: true; user: { id: string; name: string } };

type BookmarkListResponse = {
  items: Array<{
    id: string;
    title: string;
    source: string;
    servings: number;
    cost: number; // 조회 시점 재료비, 원 단위 정수
  }>;
};
```

- 목록의 순서는 서버가 저장 순서로 반환한다. 프런트엔드는 `Math.round(cost / servings)`로 1인분 금액을 표시한다.
- 로그인 시작 시 안전한 내부 복귀 경로를 백엔드에 전달하는 방식, 인증 취소·실패 후 복귀 신호, 세션 쿠키의 범위와 만료 규칙을 합의한다. OAuth `state` 검증과 카카오 키 보관은 백엔드 책임이다.
- 북마크 목록·재계산 실패, 삭제 실패의 응답 코드와 오류 본문을 합의한다. 목록 실패는 빈 상태와 구분해 재시도를 제공하고 삭제 실패 시 행을 유지한다.
- 프런트엔드와 백엔드는 같은 도메인의 `/api/*`를 사용한다. 개발·배포 환경에서 이 경로를 백엔드에 연결하는 주소는 연동 단계에서 설정한다.

## 단계별 연결

1. 공통 화면과 이 계약 초안 검수.
2. 홈 입력·검증·분석 요청과 대기·추출 실패 상태 구현.
3. 로그인 모달, 세션 표시, 로그아웃·탈퇴 연결.
4. 북마크 목록·삭제 연결. 결과 화면에서의 저장·행 열기와 오프라인 읽기는 해당 화면 구현 단계에서 연결.
