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

export default function Home() {
  return (
    <main className="container w-full flex-1 pb-section-end pt-section-input">
      <section aria-labelledby="home-title" className="mb-15">
        <h1 id="home-title" className="text-h1 text-text">
          레시피 하나면
          <br />
          얼마 아끼는지 나옵니다
        </h1>
        <p className="mt-5 text-b1 text-text-2">
          유튜브 주소를 넣거나 레시피를 직접 적으면
          <br />
          재료를 마트 가격으로 계산해 사 먹을 때와 바로 비교해 줍니다.
        </p>
      </section>

      <section aria-label="이용 방법" className="border-t border-line-strong">
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
    </main>
  );
}
