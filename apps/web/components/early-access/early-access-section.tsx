import { EarlyAccessForm } from "@/components/early-access/early-access-form";
import { earlyAccessCopy } from "@/components/early-access/early-access-copy";
import { Reveal } from "@/components/landing/reveal";
import { PerforationRule } from "@/components/studio/perforation-rule";

/**
 * Homepage waitlist strip. Sits above the end slate so the page still closes
 * on the product, not on a form.
 */
export function EarlyAccessSection() {
  return (
    <section className="relative border-b border-[var(--bay-border)]">
      <PerforationRule className="absolute inset-x-0 top-0" />
      <div className="mx-auto grid max-w-[1120px] gap-10 px-6 py-[120px] md:grid-cols-12 md:gap-12">
        <div className="md:col-span-5">
          <Reveal>
            <p className="text-mono-xs uppercase text-[var(--bay-phosphor)]">
              {earlyAccessCopy.eyebrow}
            </p>
            <h2 className="text-display-lg mt-3">{earlyAccessCopy.title}</h2>
          </Reveal>
        </div>

        <div className="md:col-span-6 md:col-start-7">
          <Reveal index={1}>
            <p className="max-w-[46ch] text-[0.9375rem] leading-relaxed text-fd-muted-foreground">
              {earlyAccessCopy.lead}
            </p>
          </Reveal>

          <Reveal index={2}>
            <ul className="mt-6 flex flex-col gap-2.5 border-t border-[var(--bay-border)] pt-6">
              {earlyAccessCopy.bullets.map((bullet) => (
                <li
                  key={bullet}
                  className="flex gap-3 text-[0.9375rem] leading-relaxed text-fd-foreground"
                >
                  <span
                    aria-hidden
                    className="mt-[0.6em] size-1 shrink-0 rounded-full bg-[var(--bay-phosphor)]"
                  />
                  {bullet}
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal index={3}>
            <EarlyAccessForm source="home-section" className="mt-8 max-w-lg" />
            <p className="mt-3 max-w-[46ch] text-xs leading-relaxed text-fd-muted-foreground">
              {earlyAccessCopy.assurance}
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
