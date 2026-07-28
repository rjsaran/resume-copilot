import "@/components/coverLetter/cover-letter-print.css";
import { resumeFont } from "@/components/resume/fonts";
import { cn } from "@/lib/utils";
import type { CoverLetterData } from "@/types/coverLetter";

/**
 * The cover letter rendering engine's single entry point. There is only one
 * visual style (unlike the resume renderer, which supports swappable
 * themes) - a cover letter is a plain business letter, not a document that
 * benefits from layout variation.
 */
export function CoverLetter({
  data,
  className,
}: {
  data: CoverLetterData;
  className?: string;
}) {
  const contactItems = [
    data.basics.email,
    data.basics.phone,
    data.basics.location,
    data.basics.linkedin,
    data.basics.portfolio,
  ].filter((item): item is string => Boolean(item && item.trim()));

  return (
    <div
      className={cn(
        "cover-letter-page bg-white text-black",
        resumeFont.className,
        className,
      )}
    >
      <header className="mb-8 flex flex-col gap-1">
        <h1 className="text-[18px] font-bold">{data.basics.name}</h1>
        {contactItems.length > 0 && (
          <div className="flex flex-wrap gap-x-2 text-[10.5px] text-neutral-600">
            {contactItems.map((item, index) => (
              <span key={item}>
                {index > 0 && <span aria-hidden> &middot; </span>}
                {item}
              </span>
            ))}
          </div>
        )}
      </header>

      <div className="mb-6 text-[11px] text-neutral-800">{data.date}</div>

      <div className="mb-6 flex flex-col text-[11px] text-neutral-800">
        {data.recipient.hiringManager && <span>{data.recipient.hiringManager}</span>}
        <span>{data.recipient.company}</span>
        <span>Re: {data.recipient.jobTitle}</span>
      </div>

      <div className="mb-4 text-[11.5px] text-neutral-900">{data.salutation}</div>

      <div className="flex flex-col gap-4">
        {data.paragraphs.map((paragraph, index) => (
          <p key={index} className="text-[11.5px] leading-relaxed text-neutral-800">
            {paragraph}
          </p>
        ))}
      </div>

      <div className="mt-8 flex flex-col text-[11.5px] text-neutral-900">
        <span>{data.closing}</span>
        <span>{data.basics.name}</span>
      </div>
    </div>
  );
}
