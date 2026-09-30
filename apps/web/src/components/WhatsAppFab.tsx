import { WhatsappLogo } from "@phosphor-icons/react/dist/ssr";
import { waLink } from "@/lib/site";

/**
 * Floating WhatsApp button, bottom right on every screen size.
 * Gold and green sound-wave rings radiate outwards and the button "buzzes" every few seconds.
 * Motion is transform/opacity only, and the wrapper clips the rings so they can never widen the page.
 */
export function WhatsAppFab({ label, message }: { label: string; message: string }) {
  return (
    <div className="wa-fab">
      <span className="wa-fab__ring" aria-hidden />
      <span className="wa-fab__ring" aria-hidden />
      <span className="wa-fab__ring" aria-hidden />
      <a href={waLink(message)} target="_blank" rel="noopener noreferrer" className="wa-fab__btn" aria-label={label} title={label}>
        <WhatsappLogo size={34} weight="fill" aria-hidden />
      </a>
    </div>
  );
}
