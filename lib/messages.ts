/*
 * Shared by the server (which sends the emails) and the admin Messages page (which previews them): the subject line for
 * each template, and how {placeholders} are filled in.
 */

export const SUBJECTS: Record<string, string> = {
  pending: "Your reference {ref}: Run for Independence",
  confirm: "You're in: {event}, bib {bib}",
  "confirm-virtual": "You're in: {event}, e-bib {bib}",
  reminder3: "Your place is held until {hold}",
  "race-7": "7 days to go: Run for Independence",
  "race-1": "Tomorrow: Run for Independence",
  "virtual-open": "Your run window is open",
};

export const DEFAULT_SUBJECT = "Run for Independence";

export function render(body: string, vars: Record<string, string>) {
  return body.replace(/\{(\w+)\}/g, (m, k: string) => vars[k] ?? m);
}

export const subjectFor = (templateId: string, vars: Record<string, string>) => render(SUBJECTS[templateId] ?? DEFAULT_SUBJECT, vars);

/** What every email ends with, under the template's own text. */
export const emailFooter = (link: string) => `Open your booking: https://${link}\n\nNational Research & Innovation Fund`;
