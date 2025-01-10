import Settings from "./Settings";
import TopBar from "@/app/_components/TopBar";

export default async function Page({
  params: { rest }
}: {
  params: { rest: string };
}) {
  console.log(rest);

  return (
    <>
      <TopBar
        page="settings"
      />
      <Settings
        tab={rest ? rest[0]! : ''}
      />
    </>
  );
}
