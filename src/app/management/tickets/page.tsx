import { TicketReview } from "@/components/comms-views";
import { ticketReviewQueue } from "@/lib/comms";

export default async function Page() {
  return <TicketReview {...await ticketReviewQueue()} />;
}
