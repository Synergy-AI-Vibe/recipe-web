# 브랜치 컨벤션

## 타입

- `feature` : 새로운 기능 개발
- `fix` : 버그 수정
- `chore` : 빌드, 설정, 패키지 등 기타 작업
- `refact` : 리팩토링
- `docs` : 문서 작업

## 네이밍 규칙

```
type/description
type/issue번호-description
```

- `type`은 위 다섯 가지 중 하나를 사용합니다.
- `description`은 영어 소문자, 단어 사이는 하이픈(`-`)으로 구분합니다 (kebab-case).
- 이슈 번호가 있는 경우 `type/description` 앞이 아닌 뒤에 붙여 `type/이슈번호-description` 형태로 작성합니다.

예시:
```
feature/recipe-search
fix/login-redirect
chore/update-eslint-config
refact/extract-recipe-card
docs/add-branch-convention
feature/23-recipe-bookmark
```
