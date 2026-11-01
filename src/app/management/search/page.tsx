import { SearchResults } from "@/components/search-results";
import { searchEverything } from "@/lib/search";

export default async function Page(props: PageProps<"/management/search">) {
  const { q } = (await props.searchParams) as { q?: string };
  return <SearchResults action="/management/search" {...await searchEverything("management", typeof q === "string" ? q : "")} />;
}
