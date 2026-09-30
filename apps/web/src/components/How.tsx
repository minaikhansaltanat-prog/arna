import type { Dictionary } from "@arna/i18n";
import { SECTIONS } from "@/lib/site";
import { HowSteps } from "./HowSteps";
import { Reveal } from "./Reveal";

export function How({ dict }: { dict: Dictionary["how"] }) {
  return (
    <section id={SECTIONS.how} className="section">
      <div className="wrap">
        <Reveal>
          <h2 className="section-title max-w-[20ch]">{dict.title}</h2>
        </Reveal>
        <HowSteps steps={dict.steps} />
      </div>
    </section>
  );
}
