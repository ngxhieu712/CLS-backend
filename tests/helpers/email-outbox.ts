/**
 * Collects every email the app tries to send during a test run.
 * The nodemailer mock in `tests/setup/mock-external-services.ts` pushes here,
 * so tests can assert on recipients/subjects without a real SMTP server.
 */
export interface SentEmail {
  from?: string;
  to?: string;
  subject?: string;
  html?: string;
}

export const emailOutbox: SentEmail[] = [];

export const clearEmailOutbox = () => {
  emailOutbox.length = 0;
};

export const lastEmailTo = (to: string) =>
  [...emailOutbox].reverse().find((mail) => mail.to === to);
