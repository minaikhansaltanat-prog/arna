import { RedirectView } from "@/components/RedirectView";

/** "/demo/": straight to the standalone demo in the visitor's language. */
export default function DemoRedirect() {
  return <RedirectView suffix="demo/" />;
}
