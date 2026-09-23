# 코드 컨벤션

- 함수는 화살표 함수(arrow function)로 작성하는 것을 기본으로 합니다.
- 소스 코드는 각 워크스페이스 패키지의 `src/` 디렉토리 하위에 작성합니다 (`apps/web/src`, `packages/api/src`, `packages/ui/src`).
- `apps/web` 내부에서 import 시 상대 경로(`../../`) 대신 `@/*` 절대 경로 alias를 사용합니다. (`@/*`는 `apps/web/src/*`에 매핑되어 있습니다.)
- 다른 워크스페이스 패키지의 코드는 상대 경로가 아닌 패키지 이름(`@recipe-web/api`, `@recipe-web/ui`)으로 import합니다.

```ts
// Bad
import { RecipeCard } from "../../components/RecipeCard";
import { apiClient } from "../../../packages/api/src";

// Good
import { RecipeCard } from "@/components/RecipeCard";
import { apiClient } from "@recipe-web/api";
```
