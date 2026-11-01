import { SearchResults } from "@/components/search-results";
import { searchEverything } from "@/lib/search";

export default async function Page(props: PageProps<"/employee/search">) {
  const { q } = (await props.searchParams) as { q?: string };
  return <SearchResults action="/employee/search" {...await searchEverything("employee", typeof q === "string" ? q : "")} />;
}
