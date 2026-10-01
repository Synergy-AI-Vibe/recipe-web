import Link from "next/link";

const steps = [
  {
    title: "레시피를 넣습니다",
    description:
      "유튜브 주소를 붙여 넣거나 레시피를 직접 적어도 됩니다. 인사말과 타임스탬프는 걸러냅니다.",
  },
  {
    title: "재료를 마트 가격으로 계산합니다",
    description:
      "'한 줌 · 적당량'은 g·ml로 바꾸고, 이 요리에 실제로 쓰는 양만큼 값을 매깁니다.",
  },
  {
    title: "사 먹을 때와 비교합니다",
    description: "매장 가격과 나란히 놓아 이번 한 끼에 얼마가 남는지 알려줍니다.",
  },
];

export const HomeGuide = () => (
  <>
    <section aria-label="이용 방법" className="mt-16 border-t border-line-strong">
      <ol>
        {steps.map((step, index) => (
          <li key={step.title} className="flex gap-8 border-b border-line py-5">
            <span className="min-w-4 text-s1 text-accent" aria-hidden="true">
              {index + 1}
            </span>
            <div>
              <h2 className="text-s1 text-text">{step.title}</h2>
              <p className="mt-2 text-b1 text-text-2">{step.description}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
    <section className="mt-9">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-s1">링크가 없다면</h2>
        <Link
          href="/pantry"
          className="inline-flex min-h-11 items-center text-s1 text-accent hover:text-accent-hover"
        >
          재료로 찾기
        </Link>
      </div>
      <p className="mt-3 text-b1 text-text-2">
        냉장고에 있는 재료를 최대 5개까지 고르면
        <br />
        그걸로 만들 수 있는 레시피를 추가로 사야 하는 금액 순으로 보여줍니다.
      </p>
    </section>
  </>
);
