import { HelpCard } from "@/components/ui/Card";

export function ReportCrimeCTA() {
  return (
    <HelpCard>
      <h3 className="mb-2 text-base font-semibold">Need help now?</h3>
      <ul className="space-y-2 text-sm">
        <li>
          <strong>Emergency:</strong> <a href="tel:111">111</a>
        </li>
        <li>
          <strong>Non-emergency Police:</strong>{" "}
          <a href="https://105.police.govt.nz" target="_blank" rel="noopener noreferrer">
            105.police.govt.nz
          </a>
        </li>
        <li>
          <strong>Crimestoppers</strong> (anonymous):{" "}
          <a href="https://www.crimestoppers-nz.org" target="_blank" rel="noopener noreferrer">
            crimestoppers-nz.org
          </a>{" "}
          · 0800 555 111
        </li>
        <li>
          <strong>Victim Support:</strong>{" "}
          <a href="https://www.victimsupport.org.nz" target="_blank" rel="noopener noreferrer">
            victimsupport.org.nz
          </a>{" "}
          · 0800 842 846
        </li>
        <li>
          <strong>Safe to talk</strong> (sexual harm):{" "}
          <a href="https://www.safetotalk.nz" target="_blank" rel="noopener noreferrer">
            safetotalk.nz
          </a>{" "}
          · 0800 044 334
        </li>
        <li>
          <strong>Need to talk?</strong>{" "}
          <a href="https://www.1737.org.nz" target="_blank" rel="noopener noreferrer">
            1737.org.nz
          </a>{" "}
          · free call or text 1737
        </li>
      </ul>
    </HelpCard>
  );
}
