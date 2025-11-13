interface Transporter {
  sendMail: (options: unknown) => Promise<{ messageId: string }>;
}

const createTransport = (_config?: unknown): Transporter => ({
  sendMail: async () => ({ messageId: 'mock-message-id' }),
});

export { createTransport };
export default { createTransport };
