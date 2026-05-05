import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicShare } from "@/domain/reading-service";

export default async function SharePage({ params }: { params: Promise<{ share_id: string }> }) {
  const { share_id } = await params;
  let share: ReturnType<typeof getPublicShare>;
  try {
    share = getPublicShare(share_id);
  } catch {
    notFound();
  }
  const payload = share.card_payload;

  return (
    <main className="min-h-screen bg-[#f7f4ec] px-4 py-6 text-[#171814]">
      <article className="mx-auto grid max-w-2xl gap-4 rounded-lg border border-[#2f3b2f]/15 bg-white p-5 shadow-sm">
        <div>
          <p className="text-sm font-medium text-[#7a2f24]">易问六爻公开学习卡</p>
          <h1 className="mt-1 text-2xl font-semibold">{payload.base_chart}</h1>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <ShareMetric label="场景" value={payload.scenario} />
          <ShareMetric label="变卦" value={payload.changed_chart} />
          <ShareMetric label="起卦日期" value={payload.cast_time} />
          <ShareMetric label="日月" value={`${payload.day_ganzhi}日 · ${payload.month_branch}月建`} />
        </div>
        <section className="rounded-md border border-[#2f3b2f]/12 bg-[#fffdf7] p-3">
          <p className="font-medium">学习提示</p>
          <ul className="mt-2 grid gap-2 text-sm leading-6 text-[#314239]">
            {payload.key_points.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </section>
        <p className="rounded-md border border-[#2f6b4f]/18 bg-[#edf3ea] p-3 text-sm leading-6 text-[#314239]">
          {payload.safety_notice}
        </p>
        <Link
          href="/"
          className="inline-flex h-10 items-center justify-center rounded-md bg-[#245f46] px-4 text-sm font-semibold text-white transition hover:bg-[#1c4c38]"
        >
          返回起卦工具
        </Link>
      </article>
    </main>
  );
}

function ShareMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[#2f3b2f]/12 bg-[#fffdf7] p-3">
      <p className="text-sm text-[#6a675c]">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}
