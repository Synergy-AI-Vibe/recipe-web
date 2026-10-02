# 03. 북마크·계정 API 설계

- 작성자: 김도혁
- 날짜: 2026-10-02

## 1. 개요

북마크 조회·저장·삭제 API와 회원탈퇴 API를 recipe-web에 구현한다.
직접 입력 레시피도 다시 열 수 있도록 `bookmark` 테이블에 원문 컬럼을 추가한다.

- 선행 문서: [01 서버 기반](./01-server-foundation.md)
- 후속 문서: [07 북마크 저장·열기](./07-bookmark-save-open.md)

## 2. 목표 / 비목표

### 목표

- `GET`·`POST /api/bookmarks`, `DELETE /api/bookmarks/[id]`, `POST /api/account/delete` 구현
- `bookmark.raw_text` 컬럼 추가 마이그레이션
- `createBookmark` 클라이언트 함수와 스키마 추가, 목록 스키마에 `rawText` 추가

### 비목표

- 북마크 목록에 금액 표시. 목록은 금액 없이 내려주고, 행을 열 때 계산한다.
- 북마크 순서 변경, 폴더 같은 확장 기능
- 결과 화면의 저장 버튼 연결([07 문서](./07-bookmark-save-open.md))

## 3. 배경 / 현재 상태

- 화면은 이미 연결돼 있다. 북마크 목록·삭제([queries/bookmarks.ts](../../apps/web/src/queries/bookmarks.ts))와 탈퇴([queries/auth.ts](../../apps/web/src/queries/auth.ts))가 이 API를 부른다. 서버가 없어서 동작하지 않았다.
- 클라이언트 스키마는 MVP 실제 응답(`{ ok, items, count, limit }`, 금액 없음)과 이미 일치한다.
- MVP DB 구조(`supabase/migrations`):
  - `bookmark_youtube_needs_url`: 유튜브는 `source_url` 필수
  - `bookmark_user_url_key`: `(user_id, source_url)` 유니크, `source_url is not null` 조건. 직접 입력은 중복 제한이 없다.
  - `enforce_bookmark_limit` 트리거: 사용자당 5개 초과 시 오류(문구에 "최대 5개" 포함)
  - RLS: 내 북마크 조회·추가·삭제만 허용(`authenticated`, `user_id = auth.uid()`)
  - `profiles`·`bookmark`는 `auth.users` 삭제 시 cascade로 함께 삭제
- MVP 원본: `src/app/api/bookmarks/route.ts`, `src/app/api/bookmarks/[id]/route.ts`, `src/app/api/account/delete/route.ts`, `src/lib/data/bookmark.ts`

MVP와 달라지는 점:

- 로그인하지 않은 요청은 MVP처럼 빈 목록(200)이 아니라 **401**로 돌려준다. 빈 목록과 구분하기 위해서다.
- 저장 요청 본문은 `createBookmarkRequestSchema`로 검증한다(MVP는 `title`·`sourceType`만 확인).
- DB 오류 메시지는 응답에 담지 않고 서버 로그에만 남긴다.

## 4. 요구사항

1. 북마크는 본인 것만 조회·삭제할 수 있다(RLS). 서버는 요청에 실린 사용자 ID가 아니라 **세션에서 확인한 사용자**로 저장한다.
2. 한 사용자당 최대 5개다. 앱에서 세지 않고 DB 트리거로 막는다(동시 요청 대비).
3. 같은 유튜브 영상은 한 번만 저장한다.
4. 직접 입력 레시피는 원문을 함께 저장해서, 나중에 열 때 다시 분석할 수 있어야 한다.
5. 탈퇴 시 계정과 북마크가 모두 삭제되고 되돌릴 수 없다. 탈퇴 대상은 세션의 사용자 ID만 쓴다.

## 5. 상세 설계

### 5.1 마이그레이션 (`20261002100000_bookmark_raw_text.sql`)

```sql
alter table public.bookmark add column raw_text text;

alter table public.bookmark
  add constraint bookmark_raw_text_length
  check (raw_text is null or char_length(raw_text) <= 20000);
```

- nullable 컬럼과 길이 제한만 추가한다. MVP 배포는 `raw_text`를 쓰지 않으므로 영향이 없다([01 문서](./01-server-foundation.md)의 추가 전용 원칙).
- **"직접 입력은 원문 필수" 제약은 DB에 걸지 않는다.** 걸면 MVP 배포의 직접 입력 저장이 막힌다. 대신 이 API가 직접 입력에 원문을 필수로 검증한다.

### 5.2 엔드포인트

| 메서드·경로 | 요청 | 성공 응답 | 실패 응답 |
| --- | --- | --- | --- |
| `GET /api/bookmarks` | — | `{ ok: true, items, count, limit }` (최신순) | 401 / 500 |
| `POST /api/bookmarks` | `{ title, sourceType, sourceUrl, servings, rawText }` | `{ ok: true, bookmark }` | 아래 표 |
| `DELETE /api/bookmarks/[id]` | — | `{ ok: true }` | 400 잘못된 ID / 401 / 500 |
| `POST /api/account/delete` | — | `{ ok: true }` | 401 / 500 |

`POST /api/bookmarks` 실패 `reason`:

| reason | HTTP | 원인 |
| --- | --- | --- |
| `unauthorized` | 401 | 세션 없음 |
| `invalid_input` | 400 | 본문 형식 오류, 유튜브 주소 아님, 직접 입력인데 원문 없음 등 |
| `limit` | 409 | 트리거 오류(메시지에 "최대 5개") |
| `duplicate` | 409 | 유니크 위반(`23505`) |
| `error` | 500 | 그 밖의 오류 |

- `limit`·`duplicate`·`unauthorized`는 클라이언트가 오류가 아니라 **결과 값**으로 받는다(화면이 분기해야 한다). `invalid_input`과 500은 오류로 던진다.
- 응답 메시지는 고정된 한국어 문구다. `limit`도 DB 안내 문구를 그대로 쓰지 않는다.

### 5.3 입력 규칙 (`createBookmarkRequestSchema`)

| 항목 | 유튜브 | 직접 입력 |
| --- | --- | --- |
| `title` | 1~200자(앞뒤 공백 제거) | 같음 |
| `servings` | 1~100의 정수 | 같음 |
| `sourceUrl` | 필수, 유튜브 주소 형식 | 없음(null) |
| `rawText` | 없음(null) | 필수, 1~20,000자 |

### 5.4 파일 배치

```
supabase/migrations/20261002100000_bookmark_raw_text.sql
packages/api/src/schemas/bookmarks.ts       # rawText, 요청·응답 스키마, 상수(BOOKMARK_LIMIT 등)
packages/api/src/client/bookmarks.ts        # createBookmark
apps/web/src/server/data/bookmark.ts        # listBookmarks, createBookmark, deleteBookmark
apps/web/src/server/supabase/get-user.ts    # 세션 사용자 확인
apps/web/src/server/api-response.ts         # jsonResponse, logServerError
apps/web/src/app/api/bookmarks/route.ts
apps/web/src/app/api/bookmarks/[id]/route.ts
apps/web/src/app/api/account/delete/route.ts
apps/web/src/test/fake-supabase.ts          # 테스트용 가짜 Supabase
```

- 접속 도구는 사용자 쿠키로 접속하는 `lib/supabase/server`를 쓴다(RLS가 적용된다). 탈퇴만 관리자 클라이언트(`server/supabase/admin`)를 쓴다.
- 사용자 확인은 `getUser()`로 한다. 세션을 서버에서 다시 확인하므로 사용자 식별이 중요한 이 API에 맞다(`proxy`의 세션 갱신은 `getClaims()`).

## 6. 결정사항

| 결정 | 고려한 대안 | 선택 이유 |
| --- | --- | --- |
| 목록에 금액을 넣지 않는다 | 계약 문서 제안처럼 `cost` 포함 | 금액을 보여주려면 북마크마다 analyze를 다시 불러야 한다. 5건이면 약 20초가 걸리고 유튜브 API 할당량도 5배로 든다(MVP 실측). |
| 정렬은 `created_at` 최신순(같으면 `id` 최신순) | 저장 순서(오래된 순) | MVP와 현재 화면이 최신순이다. 같은 시각이어도 순서가 흔들리지 않게 `id`를 보조 기준으로 둔다. |
| 직접 입력도 원문과 함께 저장한다 | 유튜브만 허용하거나, 저장은 하되 열기 비활성 | 직접 입력도 다시 열 수 있어야 북마크의 의미가 있다. |
| 원문 필수는 DB가 아니라 API에서 검증한다 | DB `check` 제약 | 같은 DB를 MVP 배포가 쓴다. DB 제약을 걸면 MVP의 직접 입력 저장이 깨진다. 길이 상한만 DB에도 건다(새 컬럼이라 영향 없음). |
| `limit`·`duplicate`·`unauthorized`는 결과 값으로 준다 | 모두 throw | 화면이 반드시 분기해야 하는 업무 결과다. 공통 오류 알림으로 흘러가면 안 된다. |
| 로그인하지 않은 요청은 401이다 | MVP처럼 빈 목록 | 빈 목록(저장한 게 없음)과 로그인 만료를 구분해야 화면이 안내할 수 있다. |
| 탈퇴 경로는 MVP 그대로(`POST /api/account/delete`) | `DELETE /api/account` | 이미 연결된 클라이언트 함수 `deleteAccount`가 이 경로를 쓴다. |
| 원문 최대 길이 20,000자, 제목 200자, 인분 100 | 제한 없음 | 오입력·악용으로 큰 값이 저장되는 것을 막는다. 분석 입력 제한이 정해지면 맞춘다. |

## 7. 예외·오류 처리

- 직접 입력 중복은 DB가 막지 않는다. 같은 원문을 두 번 저장할 수 있다. 화면에서 이미 저장된 상태([07 문서](./07-bookmark-save-open.md))로 막는 것으로 충분하다고 본다.
- 삭제 대상이 남의 북마크이거나 이미 없으면 RLS 때문에 0행이 삭제된다. 이때도 `{ ok: true }`를 준다(멱등).
- 탈퇴 중 `deleteUser`가 실패하면 500을 주고 로그인 상태는 유지한다. 계정 삭제 뒤 로그인 상태 정리(`signOut`)가 실패해도 탈퇴는 성공으로 본다.
- Supabase 설정(주소·키)이 잘못되면 각 API는 안전한 JSON 500을 돌려주고, `proxy`는 요청을 막지 않는다.
- 세션 갱신으로 받은 캐시 방지 헤더가 있으면 응답에 붙인다.

## 8. 영향 범위

- [schemas/bookmarks.ts](../../packages/api/src/schemas/bookmarks.ts), [client/bookmarks.ts](../../packages/api/src/client/bookmarks.ts): `rawText`, `createBookmark`
- `proxy`의 세션 갱신([01 문서](./01-server-foundation.md)): 접속 도구 생성이 실패해도 요청을 통과시키도록 오류 처리 범위를 넓혔다.
- 계약 문서(`frontend-backend-contract.md`)의 북마크 목록 형태(금액 포함, 저장 순서)와 저장 실패 `reason` 표는 해당 문서가 `docs/features/`로 이동하는 결과 페이지 작업(#17) 이후에 정정한다.

## 9. 테스트 / 완료 기준

확인한 것:

- 클라이언트 테스트(MSW): 목록(원문 없는 예전 응답 포함), 저장 성공, 401·409가 값으로 돌아오는지, 400·500은 오류로 던지는지, 형식 오류, 요청 스키마(유튜브/직접 입력 규칙, 길이 제한)
- 데이터 접근 테스트: 목록 변환·정렬, 유튜브/직접 입력 저장 내용, 한도 초과·중복·기타 오류 분류, DB 메시지 비노출, 삭제
- 라우트 테스트: 로그인 안 함 401, 세션 사용자로 저장(요청의 사용자 ID 무시), 잘못된 요청 8종 400, 한도·중복·오류 응답, 잘못된 ID 6종 400, 탈퇴가 세션 사용자만 삭제, 삭제 실패 시 로그인 유지, 캐시 방지 헤더
- 실제 서버(`next start`) 요청: 로그인하지 않은 요청이 401, 잘못된 ID가 400, 응답 0.01~0.1초. 설정이 잘못된 환경에서도 사이트가 열리고 API가 JSON 500을 돌려준다.
- `pnpm lint`, 타입 검사, 테스트, 빌드 통과

직접 확인이 필요한 것(로그인과 DB가 필요하다):

- 5개 저장 후 6번째 저장 → `limit`, 같은 영상 재저장 → `duplicate`
- 직접 입력 저장 → `raw_text` 저장
- 탈퇴 → 북마크 삭제, 로그인 상태 정리
- MVP 배포에서 유튜브 북마크 저장이 계속 되는지(추가 전용 원칙 검증)

## 10. 미결 사항

- 원문·제목 최대 길이가 적절한지. 분석 입력 제한이 정해지면 맞춘다.
- Supabase 연동으로 마이그레이션이 어떤 시점에 적용되는지. 적용 전에는 `raw_text` 컬럼이 없어 저장이 실패한다.
