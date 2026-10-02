import { RedirectView } from "@/components/RedirectView";
import { ROOT_VIEW } from "@/lib/site";

/** "/" opens the landing page, or the standalone demo when the site is built with NEXT_PUBLIC_ROOT_VIEW=demo (the VPS). */
export default function RootRedirect() {
  return <RedirectView suffix={ROOT_VIEW === "demo" ? "demo/" : ""} />;
}
