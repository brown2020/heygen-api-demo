import { db } from "@/firebase/firebaseClient";
import { AVATAR_GROUP_COLLECTION, AVATAR_GROUP_LOOK_COLLECTION, OWNERSHIP_TYPE } from "@/libs/constants";
import { AvatarGroup, AvatarLook } from "@/types/heygen";
import { useAuthStore } from "@/zustand/useAuthStore";
import { collection, limit, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";

export const useAvatars = () => {
  const [
    personalAvatarGroups, 
    // setPersonalAvatarGroups
  ] = useState<AvatarGroup[]>([]);
  const [publicAvatarGroups, setPublicAvatarGroups] = useState<AvatarGroup[]>([]);
  const [isFetchingPublicAvatarGroups, setIsFetchingPublicAvatarGroups] = useState(false);
  const [
    isFetchingPersonalAvatarGroups, 
    // setIsFetchingPersonalAvatarGroups
  ] = useState(false);

  const [selectedAvatarGroup, setSelectedAvatarGroup] = useState<AvatarGroup | null>(null);
  const [selectedAvatarLooks, setSelectedAvatarLooks] = useState<AvatarLook[]>([]);
  const [
    isFetchingAvatarLooks
    , setIsFetchingAvatarLooks
  ] = useState(false);

  const uid = useAuthStore((state) => state.uid);

  useEffect(() => {
    if (!uid) return;
    // const personalAvatarGroupsCollection = query(
    //   collection(db, AVATAR_GROUP_COLLECTION),
    //   where('type', '==', OWNERSHIP_TYPE[1]),
    //   where('owner', '==', uid)
    // );
    // const unsubscribePersonalAvatarGroups = onSnapshot(
    //   personalAvatarGroupsCollection,
    //   (snapshot) => {
    //     const avatarGroupsList = snapshot.docs.map(
    //       (doc) => doc.data() as AvatarGroup
    //     );
    //     setPersonalAvatarGroups(avatarGroupsList);
    //   }
    // );

    setIsFetchingPublicAvatarGroups(true);
    const publicAvatarGroupsCollection = query(
      collection(db, AVATAR_GROUP_COLLECTION),
      where('type', '==', OWNERSHIP_TYPE[0]),
      where('preview_image_url', '!=', null),
      orderBy('created_at', "desc"),
      limit(30)
    );
    const unsubscribePublicAvatarGroups = onSnapshot(
      publicAvatarGroupsCollection,
      (snapshot) => {
        setIsFetchingPublicAvatarGroups(false);
        const avatarGroupsList = snapshot.docs.map(
          (doc) => doc.data() as AvatarGroup
        );
        setPublicAvatarGroups(avatarGroupsList);
      }
    );

    return () => {
      // unsubscribePersonalAvatarGroups();
      unsubscribePublicAvatarGroups()
    };
  }, [uid]);

  useEffect(() => {
    if (!uid || selectedAvatarGroup == null) return;
    
    setIsFetchingAvatarLooks(true);
    const avatarGroupLooksCollection = query(
      collection(db, AVATAR_GROUP_LOOK_COLLECTION),
      where('group_id', '==', selectedAvatarGroup.id),
      orderBy('created_at', "desc"),
      limit(20)
    );
    const unsubscribePublicAvatarGroups = onSnapshot(
      avatarGroupLooksCollection,
      (snapshot) => {
        setIsFetchingAvatarLooks(false);
        const avatarGroupLooksList = snapshot.docs.map(
          (doc) => doc.data() as AvatarLook
        );
        setSelectedAvatarLooks(avatarGroupLooksList);
      }
    );

    return () => {
      unsubscribePublicAvatarGroups()
    };
  }, [uid, selectedAvatarGroup]);

  const isFetchingAvatarGroups = useMemo(() => {
    return isFetchingPersonalAvatarGroups || isFetchingPublicAvatarGroups;
  }, [isFetchingPersonalAvatarGroups, isFetchingPublicAvatarGroups]);

  const changeSelectedGroup = (_avatarGroup: AvatarGroup | null) => {
    setSelectedAvatarGroup(_avatarGroup);
    setSelectedAvatarLooks([]);
  }

  return {
    isFetchingAvatarGroups,
    publicAvatarGroups,
    personalAvatarGroups,
    selectedAvatarGroup,
    changeSelectedGroup,
    selectedAvatarLooks,
    isFetchingAvatarLooks
  }
}