# 03. 북마크·계정 API 설계

- 작성자: 김도혁
- 날짜: 2026-10-02

## 1. 개요

북마크 조회·저장·삭제 API와 회원탈퇴 API를 recipe-web에 이식한다.
직접 입력 레시피도 다시 열 수 있도록 `bookmark` 테이블에 원문 컬럼을 추가한다.

- 선행 문서: [01 서버 기반](./01-server-foundation.md)
- 후속 문서: [07 북마크 저장·열기](./07-bookmark-save-open.md)

## 2. 목표 / 비목표

### 목표

- `GET`·`POST /api/bookmarks`, `DELETE /api/bookmarks/[id]`, `POST /api/account/delete` 구현
- `bookmark.raw_text` 컬럼 추가 마이그레이션
- `createBookmark` 클라이언트 함수와 스키마 추가
- 계약 문서의 북마크 목록 형태를 실제 형태로 정정

### 비목표

- 북마크 목록에 금액 표시. 목록은 금액 없이 내려주고, 행을 열 때 계산한다.
- 북마크 순서 변경, 폴더 같은 확장 기능

## 3. 배경 / 현재 상태

- recipe-web 화면은 이미 연결돼 있다:
  - [queries/bookmarks.ts](../../apps/web/src/queries/bookmarks.ts): 목록, 개수, 삭제
  - [queries/auth.ts](../../apps/web/src/queries/auth.ts): 탈퇴
- 하지만 서버가 없어서 동작하지 않는다.
- 클라이언트 스키마 [schemas/bookmarks.ts](../../packages/api/src/schemas/bookmarks.ts)는 MVP 실제 응답(`{ ok, items, count, limit }`, 금액 없음)과 이미 일치한다.
- [frontend-backend-contract.md](./frontend-backend-contract.md)는 목록에 `cost`가 있고 저장 순서로 온다고 적고 있다. 이것이 실제와 다르다.
- MVP DB 제약:
  - `bookmark_youtube_needs_url`: 유튜브는 `source_url` 필수
  - `bookmark_user_url_key`: `(user_id, source_url)` 유니크, `source_url is not null` 조건. 직접 입력은 중복 제한이 없다.
  - `enforce_bookmark_limit` 트리거: 사용자당 5개 초과 시 예외
  - `profiles`·`bookmark`는 `auth.users` 삭제 시 cascade로 함께 삭제
- MVP 원본: `src/app/api/bookmarks/route.ts`, `src/app/api/bookmarks/[id]/route.ts`, `src/app/api/account/delete/route.ts`, `src/lib/data/bookmark.ts`

## 4. 요구사항

1. 북마크는 본인 것만 조회·삭제할 수 있다(RLS).
2. 한 사용자당 최대 5개다. 앱에서 세지 않고 DB 트리거로 막는다(동시 요청 대비).
3. 같은 유튜브 영상은 한 번만 저장한다.
4. 직접 입력 레시피는 원문을 함께 저장해서, 나중에 열 때 다시 분석할 수 있어야 한다.
5. 탈퇴 시 계정과 북마크가 모두 삭제되고 되돌릴 수 없다. 탈퇴 대상은 세션의 사용자 id만 쓴다.

## 5. 상세 설계

### 5.1 마이그레이션

```sql
-- supabase/migrations/2026100200000_bookmark_raw_text.sql
alter table public.bookmark add column raw_text text;

alter table public.bookmark
  add constraint bookmark_manual_needs_text
  check (source_type <> 'manual' or raw_text is not null) not valid;
```

- nullable 추가라 MVP 배포에 영향이 없다([01 문서](./01-server-foundation.md)의 추가 전용 원칙).
- `not valid`로 걸어 기존 직접 입력 행(원문 없음)은 검사하지 않고 새 행만 검사한다.
- 주의: 이 제약은 MVP 배포에서 들어오는 직접 입력 저장을 막는다. 적용 시점은 10. 미결 사항에서 결정한다.

### 5.2 엔드포인트

| 메서드·경로 | 요청 | 성공 응답 | 실패 응답 |
| --- | --- | --- | --- |
| `GET /api/bookmarks` | — | `{ ok: true, items, count, limit }` (최신순) | 500 `{ ok: false, message }` |
| `POST /api/bookmarks` | `{ title, sourceType, sourceUrl, servings, rawText }` | `{ ok: true, bookmark }` | `{ ok: false, reason, message }` |
| `DELETE /api/bookmarks/[id]` | — | `{ ok: true }` | 400 잘못된 id / 500 |
| `POST /api/account/delete` | — | `{ ok: true }` | 401 / 500 |

`POST /api/bookmarks` 실패 `reason`:

| reason | HTTP | 원인 |
| --- | --- | --- |
| `unauthorized` | 401 | 세션 없음 |
| `limit` | 409 | 트리거 예외("최대 5개") |
| `duplicate` | 409 | 유니크 위반(23505) |
| `error` | 500 | 그 밖의 오류 |

### 5.3 스키마 변경 (`packages/api`)

- `bookmarkSchema`에 `rawText: z.string().nullable()`을 추가한다. 목록 응답에도 포함해야 07 문서의 "다시 열기"에 쓸 수 있다.
- `createBookmarkRequestSchema`, `createBookmarkResponseSchema`를 추가한다. 실패 응답은 `reason`을 가진 판별 유니온으로 둔다.
- `createBookmark(client, input)`: 409·401도 throw하지 않고 `{ ok: false, reason }`으로 돌려준다. 화면이 분기해야 하는 정상 결과이기 때문이다. 그 밖의 오류는 `normalizeApiError`로 throw한다.

### 5.4 서버 파일

```
apps/web/src/server/data/bookmark.ts          # listBookmarks, createBookmark, deleteBookmark
apps/web/src/server/supabase/admin.ts         # 탈퇴 시 auth.admin.deleteUser
apps/web/src/app/api/bookmarks/route.ts
apps/web/src/app/api/bookmarks/[id]/route.ts
apps/web/src/app/api/account/delete/route.ts
```

## 6. 결정사항

| 결정 | 고려한 대안 | 선택 이유 |
| --- | --- | --- |
| 목록에 금액을 넣지 않는다 | 계약 문서 제안처럼 `cost` 포함 | 금액을 보여주려면 북마크마다 analyze를 다시 불러야 한다. 5건이면 약 20초가 걸리고 유튜브 API 할당량도 5배로 든다(MVP 실측). |
| 정렬은 `created_at` 최신순 | 저장 순서(오래된 순) | MVP와 현재 화면이 최신순이다. 계약 문서를 정정한다. |
| 직접 입력도 원문과 함께 저장한다 | 유튜브만 허용하거나, 저장은 하되 열기 비활성 | 직접 입력도 다시 열 수 있어야 북마크의 의미가 있다. 원문 길이 제한은 analyze 입력 제한을 따른다. |
| `limit`·`duplicate`·`unauthorized`는 반환값으로 준다 | 모두 throw | 화면이 반드시 분기해야 하는 업무 결과다. 공통 오류 알림으로 흘러가면 안 된다. |
| 탈퇴 API 경로는 MVP 그대로(`POST /api/account/delete`) | `DELETE /api/account` | 이미 연결된 클라이언트 함수 `deleteAccount`가 이 경로를 쓴다. |

## 7. 예외·오류 처리

- 직접 입력 중복은 DB가 막지 않는다. 같은 원문을 두 번 저장할 수 있다. 화면에서 이미 저장된 상태(07 문서)로 막는 것으로 충분하다고 본다.
- 삭제 대상이 남의 북마크이거나 이미 없으면 RLS 때문에 0행이 삭제된다. 이때도 `{ ok: true }`를 준다(멱등).
- 탈퇴 중 `deleteUser`가 실패하면 500을 주고 세션은 유지한다.

## 8. 영향 범위

- [schemas/bookmarks.ts](../../packages/api/src/schemas/bookmarks.ts), [client/bookmarks.ts](../../packages/api/src/client/bookmarks.ts): `rawText`, `createBookmark`
- [frontend-backend-contract.md](./frontend-backend-contract.md): 북마크 목록 형태·정렬 정정, `cost` 제안 삭제, POST 실패 reason 표 추가
- [client/auth.ts](../../packages/api/src/client/auth.ts): `getBookmarkCount`가 목록 API를 재사용하는 구조는 유지

## 9. 테스트 / 완료 기준

- 클라이언트 테스트(MSW): 목록 파싱, 저장 성공, 401·409(limit·duplicate)·500 분기, 삭제
- 수동 시나리오:
  - 5개 저장 후 6번째 → `limit`
  - 같은 영상 재저장 → `duplicate`
  - 직접 입력 저장 → `raw_text` 저장 확인
  - 탈퇴 → 북마크 삭제 확인
- MVP 배포에서 유튜브 북마크 저장이 계속 되는지 확인한다(추가 전용 원칙 검증).
- `pnpm lint`, 테스트, `tsc --noEmit` 통과

## 10. 미결 사항

- `bookmark_manual_needs_text` 제약의 적용 시점. MVP 배포를 내리기 전까지는 제약 없이 컬럼만 추가하는 방안도 있다.
- 직접 입력 원문의 최대 길이. analyze 입력 제한과 같은 값으로 정해야 한다.
