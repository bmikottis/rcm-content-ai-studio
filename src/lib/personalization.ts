import { TestContact } from "@/data/mock-contacts";

export function personalizeContent(
  content: string,
  contact: TestContact
): string {
  return content
    .replace(/\{\{first_name\}\}/g, contact.firstName)
    .replace(/\{\{last_name\}\}/g, contact.lastName)
    .replace(/\{\{company\}\}/g, contact.company);
}
