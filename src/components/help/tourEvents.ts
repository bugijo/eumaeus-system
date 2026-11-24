/** Liga o botão "Rever tutorial" ao tour, sem estado global. */
export const TOUR_EVENT = 'eumaeus:start-tour';
export const startTour = () => window.dispatchEvent(new Event(TOUR_EVENT));
export const tourDoneKey = (userId?: number | string) => `eumaeus-tour-done:${userId ?? 'anon'}`;
