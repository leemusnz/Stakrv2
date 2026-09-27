import Link from "next/link";
import { Shell, panel } from "@/components/mvp/shell";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Shell title="Published terms are fixed">
      <div className={panel}>
        <p>
          To protect participants, published rules cannot be changed. An admin
          can cancel with an explicit refund policy before a corrected challenge
          is created.
        </p>
        <Link href={"/challenge/" + id} className="text-violet-700 underline">
          Return to challenge
        </Link>
      </div>
    </Shell>
  );
}
