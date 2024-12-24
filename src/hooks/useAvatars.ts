"use client";
import { db } from "@/firebase/firebaseClient";
import { AVATAR_GROUP_COLLECTION, AVATAR_GROUP_LOOK_COLLECTION, OWNERSHIP_TYPE } from "@/libs/constants";
import { createUserAvatarId } from "@/libs/utils";
import { AvatarGroup, AvatarLook } from "@/types/heygen";
import { useAuthStore } from "@/zustand/useAuthStore";
import useProfileStore from "@/zustand/useProfileStore";
import { collection, limit, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { useHeyGen } from "./useHeyGen";

export const useAvatars = () => {
  const [personalAvatarGroups, setPersonalAvatarGroups] = useState<AvatarGroup[]>([]);
  const [publicAvatarGroups, setPublicAvatarGroups] = useState<AvatarGroup[]>([]);
  const [isFetchingPublicAvatarGroups, setIsFetchingPublicAvatarGroups] = useState(false);
  const [isFetchingPersonalAvatarGroups, setIsFetchingPersonalAvatarGroups] = useState(false);

  const [selectedAvatarGroup, setSelectedAvatarGroup] = useState<AvatarGroup | null>(null);
  const [selectedAvatarLooks, setSelectedAvatarLooks] = useState<AvatarLook[]>([]);
  const [isFetchingAvatarLooks, setIsFetchingAvatarLooks] = useState(false);

  const uid = useAuthStore((state) => state.uid);
  const profile = useProfileStore((state) => state.profile);
  const invalid_heygen_api_key = useProfileStore((state) => state.invalid_heygen_api_key);

  const { isFetchingAvatarGroupsFromHeygen, fetchAvatarGroupsFromHeygen } = useHeyGen();

  const _profile = useMemo(() => {
    return profile ? {
      heygen_api_key: profile.heygen_api_key,
      heygen_key_updated: profile.heygen_key_updated,
    } : {
      heygen_api_key: "",
      heygen_key_updated: true,
    }
  }, [profile]);

  useEffect(() => {
    if (!uid || !_profile.heygen_api_key || invalid_heygen_api_key != null) return;

    setIsFetchingPersonalAvatarGroups(true);

    const personalAvatarGroupsCollection = query(
      collection(db, AVATAR_GROUP_COLLECTION),
      where('type', '==', OWNERSHIP_TYPE[1]),
      where('owner', '==', uid)
    );
    const unsubscribePersonalAvatarGroups = onSnapshot(
      personalAvatarGroupsCollection,
      (snapshot) => {
        setIsFetchingPersonalAvatarGroups(false);
        const avatarGroupsList = snapshot.docs.map(
          (doc) => doc.data() as AvatarGroup
        );
        if (avatarGroupsList.length == 0 || _profile.heygen_key_updated) {
          fetchAvatarGroupsFromHeygen();
        }
        setPersonalAvatarGroups(avatarGroupsList);
      }
    );

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
      unsubscribePersonalAvatarGroups();
      unsubscribePublicAvatarGroups()
    };
  }, [uid, _profile, invalid_heygen_api_key]);

  useEffect(() => {
    if (!uid || selectedAvatarGroup == null) return;

    setIsFetchingAvatarLooks(true);
    const avatarGroupLooksCollection = query(
      collection(db, AVATAR_GROUP_LOOK_COLLECTION),
      selectedAvatarGroup.type == 'public' ? where('group_id', '==', selectedAvatarGroup.id) : where('user_avatar_id', '==', createUserAvatarId(uid, selectedAvatarGroup.id)),
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
        if(avatarGroupLooksList.length == 0){
          fetchAvatarGroupsFromHeygen(selectedAvatarGroup.id);
        }
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
    isFetchingAvatarGroupsFromHeygen,
    isFetchingAvatarGroups,
    publicAvatarGroups,
    personalAvatarGroups,
    selectedAvatarGroup,
    changeSelectedGroup,
    selectedAvatarLooks,
    isFetchingAvatarLooks,
    fetchAvatarGroupsFromHeygen
  }
}