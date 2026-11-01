import { ProfileView } from "@/components/profile-view";
import { myProfile } from "@/lib/profile";

export default async function ProfilePage() {
  const me = await myProfile();
  return <ProfileView me={me} />;
}
