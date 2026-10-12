export class WhatsAppEventDeduplicator {
  private readonly seen = new Set<string>();

  claim(eventId: string): boolean {
    if (!eventId || this.seen.has(eventId)) {
      return false;
    }

    this.seen.add(eventId);
    return true;
  }

  has(eventId: string): boolean {
    return this.seen.has(eventId);
  }
}
