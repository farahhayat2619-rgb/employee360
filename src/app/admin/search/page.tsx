import { SearchResults } from "@/components/search-results";
import { searchEverything } from "@/lib/search";

export default async function Page(props: PageProps<"/admin/search">) {
  const { q } = (await props.searchParams) as { q?: string };
  return <SearchResults action="/admin/search" {...await searchEverything("admin", typeof q === "string" ? q : "")} />;
}
