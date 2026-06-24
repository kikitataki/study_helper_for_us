export function formatSummaryText(rawText) {
  if (!rawText) return "";

  let formatted = rawText;

  formatted = formatted.replace(
    /\*\*(.*?)\*\*/g,
    '<span class="custom-strong">$1</span>',
  );

  formatted = formatted.replace(
    /~~(.*?)~~/g,
    '<span class="custom-del">$1</span>',
  );

  formatted = formatted.replace(
    /^[-\*]\s/gm,
    '<span class="custom-list">•</span> ',
  );

  formatted = formatted.replace(
    /^(\d+\.\s.*)$/gm,
    '<div class="custom-heading">$1</div>',
  );

  return formatted;
}
