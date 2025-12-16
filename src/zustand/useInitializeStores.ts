import { useEffect } from "react";
import { useAuthStore } from "./useAuthStore";
import useProfileStore from "./useProfileStore";

export const useInitializeStores = () => {
  const uid = useAuthStore((state) => state.uid);

  const fetchProfile = useProfileStore((state) => state.fetchProfile);

  useEffect(() => {
    if (!uid) return;

    fetchProfile();
  }, [fetchProfile, uid]);
};
